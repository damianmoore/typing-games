/**
 * Supertonic TTS - Browser-based text-to-speech using ONNX Runtime
 * Based on https://github.com/supertone-inc/supertonic
 */

// @ts-expect-error - onnxruntime-web types don't resolve properly with package.json exports
import * as ort from 'onnxruntime-web';

export const AVAILABLE_LANGS = ['en', 'ko', 'es', 'pt', 'fr'] as const;
export type SupertonicLang = typeof AVAILABLE_LANGS[number];

export interface SupertonicConfig {
  sample_rate: number;
  hop_length: number;
  latent_dim: number;
  base_chunk_size: number;
  chunk_compress: number;
}

interface RawConfig {
  ae: {
    sample_rate: number;
    base_chunk_size: number;
    ldim: number;
    encoder: {
      spec_processor: {
        hop_length: number;
      };
    };
  };
  ttl: {
    chunk_compress_factor: number;
  };
}

export interface VoiceStyle {
  ttl: ort.Tensor;
  dp: ort.Tensor;
}

interface TextProcessor {
  indexer: number[];  // Array where index = char code, value = token id (-1 for unsupported)
  process: (text: string, lang: SupertonicLang) => number[];
}

export interface SupertonicTTS {
  synthesize: (text: string, options?: SynthesizeOptions) => Promise<Blob>;
  isReady: boolean;
}

export interface SynthesizeOptions {
  lang?: SupertonicLang;
  voiceStyle?: VoiceStyle;
  totalStep?: number;
  speed?: number;
  temperature?: number;
}

// Unicode normalization and text processing
function normalizeText(text: string): string {
  // NFKD normalization
  let normalized = text.normalize('NFKD');

  // Remove emojis
  normalized = normalized.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // Replace typographic variants
  normalized = normalized
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/@/g, ' at ')
    .replace(/&/g, ' and ');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

// Expand short words phonetically for better pronunciation
// This handles common patterns without needing an exhaustive list
function expandShortWord(word: string): string {
  const trimmed = word.trim();

  // Single letter words
  if (trimmed === 'i') return 'eye';
  if (trimmed === 'a') return 'ay';

  // Only process very short words (2-3 chars)
  if (trimmed.length < 2 || trimmed.length > 3) return word;

  // Special case: Words with 'oo' sound spelled with single 'o' (do, to, who)
  // Must come BEFORE the generic 'o' ending rule
  if (trimmed === 'do' || trimmed === 'to' || trimmed === 'who') {
    return trimmed + 'o';
  }

  // Words ending in 'e' - double the 'e' (me->mee, be->bee, he->hee, we->wee, she->shee)
  if (trimmed.endsWith('e') && !trimmed.endsWith('ee')) {
    return trimmed + 'e';
  }

  // Words ending in 'o' - add 'h' (go->goh, no->noh, so->soh)
  if (trimmed.endsWith('o') && !trimmed.endsWith('oo')) {
    return trimmed + 'h';
  }

  return word;
}

function createTextProcessor(indexer: number[]): TextProcessor {
  return {
    indexer,
    process: (text: string, _lang: SupertonicLang): number[] => {
      const normalized = normalizeText(text);
      // Lowercase the text - the model treats uppercase differently
      let lowercased = normalized.toLowerCase();

      // Expand short words that are hard to pronounce
      // Only apply if the entire text is a single short word
      lowercased = expandShortWord(lowercased);

      // Add period if text doesn't end with punctuation
      const withPunctuation = /[.!?;:,'")\]}]$/.test(lowercased)
        ? lowercased
        : lowercased + '.';

      // For opensource-en model, don't use language tags - just process the text directly
      // The model only supports English and doesn't need language markers
      const indices: number[] = [];
      for (const char of withPunctuation) {
        const charCode = char.charCodeAt(0);
        // Look up token id by character code
        if (charCode < indexer.length) {
          const idx = indexer[charCode];
          // Only include valid tokens (skip -1 which means unsupported character)
          if (idx !== undefined && idx >= 0) {
            indices.push(idx);
          }
        }
      }
      return indices;
    }
  };
}

function intArrayToTensor(arr: number[], shape: number[]): ort.Tensor {
  return new ort.Tensor('int64', new BigInt64Array(arr.map(x => BigInt(x))), shape);
}

// Generate random noise using Box-Muller transform
// Returns tensor with shape [batch, expandedLatentDim, latent_len]
// expandedLatentDim = latentDim * chunkCompress (e.g., 24 * 6 = 144)
function sampleNoisyLatent(
  duration: number,
  sampleRate: number,
  baseChunkSize: number,
  chunkCompress: number,
  latentDim: number
): { tensor: ort.Tensor; latentLen: number } {
  // Calculate wav length and latent dimensions
  const wavLen = Math.floor(duration * sampleRate);
  const chunkSize = baseChunkSize * chunkCompress;
  const latentLen = Math.max(1, Math.ceil(wavLen / chunkSize));
  // Expanded latent dimension = base latent dim * chunk compress factor
  const expandedLatentDim = latentDim * chunkCompress;

  const noise = new Float32Array(expandedLatentDim * latentLen);

  // Box-Muller transform for Gaussian noise
  for (let i = 0; i < noise.length; i += 2) {
    const u1 = Math.random() || 0.0001; // Avoid log(0)
    const u2 = Math.random();
    const r = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;
    noise[i] = r * Math.cos(theta);
    if (i + 1 < noise.length) {
      noise[i + 1] = r * Math.sin(theta);
    }
  }

  // Shape: [batch, expandedLatentDim, latent_len]
  return {
    tensor: new ort.Tensor('float32', noise, [1, expandedLatentDim, latentLen]),
    latentLen
  };
}

// Create length mask - 3D tensor [batch, 1, seq_len]
function lengthToMask(lengths: number[], maxLen: number): ort.Tensor {
  const batchSize = lengths.length;
  const mask = new Float32Array(batchSize * maxLen);

  for (let b = 0; b < batchSize; b++) {
    for (let i = 0; i < lengths[b]; i++) {
      mask[b * maxLen + i] = 1;
    }
  }

  // Model expects 3D mask: [batch, 1, seq_len]
  return new ort.Tensor('float32', mask, [batchSize, 1, maxLen]);
}

// Write WAV file from audio data
export function writeWavFile(audioData: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataLength = audioData.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    // Clamp to [-1, 1] and convert to 16-bit integer
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const intSample = Math.round(sample * 32767);
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Chunk text for long-form synthesis
function chunkText(text: string, maxLen: number = 300): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    if (para.length <= maxLen) {
      chunks.push(para);
    } else {
      // Split by sentences
      const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
      let current = '';

      for (const sentence of sentences) {
        if (current.length + sentence.length <= maxLen) {
          current += sentence;
        } else {
          if (current) chunks.push(current.trim());
          current = sentence;
        }
      }
      if (current) chunks.push(current.trim());
    }
  }

  return chunks.filter(c => c.length > 0);
}

export class SupertonicEngine {
  private config: SupertonicConfig;
  private textProcessor: TextProcessor;
  private dpSession: ort.InferenceSession;
  private textEncSession: ort.InferenceSession;
  private vectorEstSession: ort.InferenceSession;
  private vocoderSession: ort.InferenceSession;
  private defaultStyle: VoiceStyle | null = null;

  constructor(
    config: SupertonicConfig,
    textProcessor: TextProcessor,
    dpSession: ort.InferenceSession,
    textEncSession: ort.InferenceSession,
    vectorEstSession: ort.InferenceSession,
    vocoderSession: ort.InferenceSession
  ) {
    this.config = config;
    this.textProcessor = textProcessor;
    this.dpSession = dpSession;
    this.textEncSession = textEncSession;
    this.vectorEstSession = vectorEstSession;
    this.vocoderSession = vocoderSession;
  }

  setDefaultStyle(style: VoiceStyle) {
    this.defaultStyle = style;
  }

  async synthesize(text: string, options: SynthesizeOptions = {}): Promise<Blob> {
    const {
      lang = 'en',
      voiceStyle = this.defaultStyle,
      totalStep = 5,
      speed = 1.05,
    } = options;

    if (!voiceStyle) {
      throw new Error('No voice style loaded');
    }

    // Chunk long text
    const chunks = chunkText(text);
    const audioChunks: Float32Array[] = [];

    for (const chunk of chunks) {
      const audio = await this._inferSingle(chunk, lang, voiceStyle, totalStep, speed);
      audioChunks.push(audio);

      // Add silence between chunks
      if (chunks.length > 1) {
        const silenceSamples = Math.floor(this.config.sample_rate * 0.3);
        audioChunks.push(new Float32Array(silenceSamples));
      }
    }

    // Concatenate all audio
    const totalLength = audioChunks.reduce((sum, arr) => sum + arr.length, 0);
    const combinedAudio = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    return writeWavFile(combinedAudio, this.config.sample_rate);
  }

  private async _inferSingle(
    text: string,
    lang: SupertonicLang,
    style: VoiceStyle,
    totalStep: number,
    speed: number
  ): Promise<Float32Array> {
    const { sample_rate, latent_dim, base_chunk_size, chunk_compress } = this.config;

    // Process text to indices
    const indices = this.textProcessor.process(text, lang);
    if (indices.length === 0) {
      throw new Error('Text processing returned empty indices');
    }

    const textLen = indices.length;
    // text_ids shape: [batch, text_length]
    const textIds = intArrayToTensor(indices, [1, textLen]);
    // text_mask shape: [batch, 1, text_length]
    const textMask = lengthToMask([textLen], textLen);

    console.log('Text indices length:', textLen);
    console.log('Style dp shape:', style.dp.dims);
    console.log('Style ttl shape:', style.ttl.dims);

    // Duration prediction
    const dpResult = await this.dpSession.run({
      text_ids: textIds,
      style_dp: style.dp,
      text_mask: textMask
    });

    // Output is "duration" - sum to get total duration in seconds
    const durations = dpResult.duration.data as Float32Array;
    const totalDuration = Array.from(durations).reduce((a, b) => a + b, 0);
    // Minimum 0.4 seconds to ensure short words are properly vocalized
    const scaledDuration = Math.max(0.4, totalDuration / speed);
    console.log('Predicted duration:', scaledDuration);

    // Text encoding
    const encResult = await this.textEncSession.run({
      text_ids: textIds,
      style_ttl: style.ttl,
      text_mask: textMask
    });

    const textEmb = encResult.text_emb;
    console.log('Text embedding shape:', textEmb.dims);

    // Generate noisy latent with shape [batch, latent_dim, latent_len]
    const { tensor: noisyLatent, latentLen } = sampleNoisyLatent(
      scaledDuration,
      sample_rate,
      base_chunk_size,
      chunk_compress,
      latent_dim
    );
    console.log('Noisy latent shape:', noisyLatent.dims, 'latentLen:', latentLen);

    // Latent mask shape: [batch, 1, latent_len]
    const latentMask = lengthToMask([latentLen], latentLen);

    // Diffusion denoising loop
    let currentLatent = noisyLatent;
    // total_step and current_step shape: [batch] = [1]
    const totalStepTensor = new ort.Tensor('float32', new Float32Array([totalStep]), [1]);

    for (let step = 0; step < totalStep; step++) {
      const currentStepTensor = new ort.Tensor('float32', new Float32Array([step]), [1]);

      const estResult = await this.vectorEstSession.run({
        noisy_latent: currentLatent,
        text_emb: textEmb,
        style_ttl: style.ttl,
        latent_mask: latentMask,
        text_mask: textMask,
        current_step: currentStepTensor,
        total_step: totalStepTensor
      });

      currentLatent = estResult.denoised_latent;
    }

    // Vocoder
    const vocResult = await this.vocoderSession.run({
      latent: currentLatent
    });

    const wav = vocResult.wav_tts.data as Float32Array;
    console.log('Generated audio length:', wav.length);

    // Trim to exact duration
    const trimmedLength = Math.min(wav.length, Math.floor(sample_rate * scaledDuration));
    return wav.slice(0, trimmedLength);
  }
}

export interface LoadProgress {
  stage: string;
  progress: number;
}

export async function loadSupertonic(
  basePath: string = '/supertonic',
  onProgress?: (progress: LoadProgress) => void
): Promise<SupertonicEngine> {
  const stages = ['config', 'duration_predictor', 'text_encoder', 'vector_estimator', 'vocoder'];
  let currentStage = 0;

  const reportProgress = (stage: string) => {
    if (onProgress) {
      onProgress({ stage, progress: (currentStage / stages.length) * 100 });
    }
    currentStage++;
  };

  // Load configuration
  reportProgress('config');
  const configResponse = await fetch(`${basePath}/onnx/tts.json`);
  const rawConfig: RawConfig = await configResponse.json();

  // Extract relevant config values
  const config: SupertonicConfig = {
    sample_rate: rawConfig.ae.sample_rate,
    hop_length: rawConfig.ae.encoder.spec_processor.hop_length,
    latent_dim: rawConfig.ae.ldim,
    base_chunk_size: rawConfig.ae.base_chunk_size,
    chunk_compress: rawConfig.ttl.chunk_compress_factor,
  };

  // Load unicode indexer
  const indexerResponse = await fetch(`${basePath}/onnx/unicode_indexer.json`);
  const indexer = await indexerResponse.json();
  const textProcessor = createTextProcessor(indexer);

  // Configure ONNX Runtime WASM for browser environment
  // Use CDN for reliable WASM file serving (matching installed version)
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/';

  // Disable multi-threading to avoid SharedArrayBuffer issues
  ort.env.wasm.numThreads = 1;

  // Disable WASM proxy to avoid web worker issues
  ort.env.wasm.proxy = false;

  // Use WASM only for maximum compatibility
  const sessionOptions: ort.InferenceSession.SessionOptions = {
    executionProviders: ['wasm'],
  };

  console.log('Loading Supertonic ONNX models...');

  // Helper to fetch model as ArrayBuffer
  const fetchModel = async (name: string): Promise<ArrayBuffer> => {
    const response = await fetch(`${basePath}/onnx/${name}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch model ${name}: ${response.statusText}`);
    }
    return response.arrayBuffer();
  };

  // Load models as ArrayBuffers first, then create sessions
  reportProgress('duration_predictor');
  const dpBuffer = await fetchModel('duration_predictor.onnx');
  const dpSession = await ort.InferenceSession.create(dpBuffer, sessionOptions);

  reportProgress('text_encoder');
  const textEncBuffer = await fetchModel('text_encoder.onnx');
  const textEncSession = await ort.InferenceSession.create(textEncBuffer, sessionOptions);

  reportProgress('vector_estimator');
  const vectorEstBuffer = await fetchModel('vector_estimator.onnx');
  const vectorEstSession = await ort.InferenceSession.create(vectorEstBuffer, sessionOptions);

  reportProgress('vocoder');
  const vocoderBuffer = await fetchModel('vocoder.onnx');
  const vocoderSession = await ort.InferenceSession.create(vocoderBuffer, sessionOptions);

  return new SupertonicEngine(
    config,
    textProcessor,
    dpSession,
    textEncSession,
    vectorEstSession,
    vocoderSession
  );
}

export async function loadVoiceStyle(stylePath: string): Promise<VoiceStyle> {
  const response = await fetch(stylePath);
  const styleData = await response.json();

  // Voice style JSON has style_ttl and style_dp with nested data arrays
  const ttlRaw = styleData.style_ttl.data;
  const dpRaw = styleData.style_dp.data;

  // Flatten nested arrays and convert to Float32Array
  const ttlData = new Float32Array(ttlRaw.flat(Infinity));
  const dpData = new Float32Array(dpRaw.flat(Infinity));

  // Derive shape from the data structure [batch, seq, dim]
  const ttlShape = [ttlRaw.length, ttlRaw[0]?.length || 1, ttlRaw[0]?.[0]?.length || 1];
  const dpShape = [dpRaw.length, dpRaw[0]?.length || 1, dpRaw[0]?.[0]?.length || 1];

  return {
    ttl: new ort.Tensor('float32', ttlData, ttlShape),
    dp: new ort.Tensor('float32', dpData, dpShape)
  };
}

export const VOICE_STYLES = {
  M1: 'M1.json',
  M2: 'M2.json',
  M3: 'M3.json',
  M4: 'M4.json',
  M5: 'M5.json',
  F1: 'F1.json',
  F2: 'F2.json',
  F3: 'F3.json',
  F4: 'F4.json',
  F5: 'F5.json',
} as const;

export type VoiceStyleName = keyof typeof VOICE_STYLES;
