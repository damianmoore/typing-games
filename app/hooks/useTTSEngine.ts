'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SupertonicEngine, VoiceStyle } from '../lib/supertonic';

export type TTSMode = 'browser' | 'piper' | 'supertonic';

export interface TTSEngine {
  speak: (text: string) => Promise<void>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  mode: TTSMode;
  setMode: (mode: TTSMode) => void;
  loadingStage?: string;
}

export function useTTSEngine(): TTSEngine {
  const [browserReady, setBrowserReady] = useState(false);
  const [piperReady, setPiperReady] = useState(false);
  const [supertonicReady, setSupertonicReady] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setModeState] = useState<TTSMode>('browser');
  const [loadingStage, setLoadingStage] = useState<string | undefined>();
  const piperModuleRef = useRef<any>(null);
  const piperVoiceIdRef = useRef<string>('en_GB-southern_english_female-low');
  const browserVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const supertonicRef = useRef<SupertonicEngine | null>(null);
  const supertonicStyleRef = useRef<VoiceStyle | null>(null);

  // Compute isReady based on current mode AND audio being unlocked
  const modeReady = mode === 'browser' ? browserReady :
                    mode === 'piper' ? piperReady :
                    mode === 'supertonic' ? supertonicReady : false;
  const isReady = modeReady && audioUnlocked;

  // Unlock audio on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined' || audioUnlocked) return;

    const unlockAudio = () => {
      // Create and play a silent audio context to unlock audio
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);

      // Also play a silent HTML audio to unlock that path
      const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      silentAudio.play().catch(() => {});

      setAudioUnlocked(true);
      console.log('Audio unlocked via user interaction');

      // Remove listeners after unlocking
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [audioUnlocked]);

  // Load mode from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('ttsMode') as TTSMode | null;
    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  // Initialize browser speech synthesis
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadBrowserVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Find British English voice
        const britishVoice = voices.find(v => v.lang.startsWith('en-GB')) ||
                            voices.find(v => v.lang.startsWith('en'));
        browserVoiceRef.current = britishVoice || voices[0];
        console.log('Browser voice loaded:', browserVoiceRef.current?.name);
      }
    };

    loadBrowserVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadBrowserVoices;
    }

    // Browser TTS is always ready
    setBrowserReady(true);

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Initialize Piper TTS only when needed
  useEffect(() => {
    if (typeof window === 'undefined' || mode !== 'piper' || piperModuleRef.current) return;

    let mounted = true;

    const initPiper = async () => {
      try {
        setIsLoading(true);

        // Dynamic import only on client side
        const tts = await import('@diffusionstudio/vits-web');

        if (!mounted) return;

        piperModuleRef.current = tts;

        // Check available voices
        const availableVoices = await tts.voices();
        console.log('Available Piper voices:', availableVoices);

        // Try to find southern_english_female voice, fallback to any en_GB voice
        const voiceKeys = Object.keys(availableVoices);
        const preferredVoice = voiceKeys.find(key => key.includes('southern_english_female')) ||
                              voiceKeys.find(key => key.startsWith('en_GB')) ||
                              voiceKeys.find(key => key.startsWith('en_'));

        if (preferredVoice) {
          piperVoiceIdRef.current = preferredVoice;
          console.log('Using Piper voice:', preferredVoice);
        }

        if (!mounted) return;

        setPiperReady(true);
        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to initialize Piper TTS:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize TTS');
        setIsLoading(false);
      }
    };

    initPiper();

    return () => {
      mounted = false;
    };
  }, [mode]);

  // Initialize Supertonic TTS only when needed
  useEffect(() => {
    if (typeof window === 'undefined' || mode !== 'supertonic' || supertonicRef.current) return;

    let mounted = true;

    const initSupertonic = async () => {
      try {
        setIsLoading(true);
        setLoadingStage('Loading Supertonic...');

        // Dynamic import only on client side
        const { loadSupertonic, loadVoiceStyle } = await import('../lib/supertonic');

        if (!mounted) return;

        // Load the engine with progress tracking
        const engine = await loadSupertonic('/supertonic', (progress) => {
          if (mounted) {
            setLoadingStage(`Loading ${progress.stage}...`);
          }
        });

        if (!mounted) return;

        supertonicRef.current = engine;

        // Load default voice style (F1 - female voice)
        setLoadingStage('Loading voice style...');
        const style = await loadVoiceStyle('/supertonic/voice_styles/F1.json');

        if (!mounted) return;

        supertonicStyleRef.current = style;
        engine.setDefaultStyle(style);

        console.log('Supertonic TTS initialized');
        setSupertonicReady(true);
        setLoadingStage(undefined);
        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to initialize Supertonic TTS:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Supertonic');
        setLoadingStage(undefined);
        setIsLoading(false);
      }
    };

    initSupertonic();

    return () => {
      mounted = false;
    };
  }, [mode]);

  const setMode = useCallback((newMode: TTSMode) => {
    setModeState(newMode);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!isReady) {
      console.warn('TTS not ready yet');
      return;
    }

    // Lowercase text for all TTS engines for consistent pronunciation
    const normalizedText = text.toLowerCase();

    try {
      if (mode === 'browser') {
        // Use browser speechSynthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(normalizedText);
          utterance.rate = 0.8;
          utterance.pitch = 1;
          utterance.volume = 1;
          if (browserVoiceRef.current) {
            utterance.voice = browserVoiceRef.current;
          }

          // Cancel any ongoing speech
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      } else if (mode === 'piper') {
        // Use Piper TTS
        if (!piperModuleRef.current) {
          console.warn('Piper TTS not loaded yet');
          return;
        }

        const wav = await piperModuleRef.current.predict({
          text: normalizedText,
          voiceId: piperVoiceIdRef.current,
        });

        // Create audio from WAV blob
        const audio = new Audio();
        audio.src = URL.createObjectURL(wav);

        // Play and cleanup
        await audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
        };
      } else if (mode === 'supertonic') {
        // Use Supertonic TTS
        if (!supertonicRef.current) {
          console.warn('Supertonic TTS not loaded yet');
          return;
        }

        const wav = await supertonicRef.current.synthesize(normalizedText, {
          lang: 'en',
          speed: 1.0,
          totalStep: 16,
        });

        // Create audio from WAV blob
        const audio = new Audio();
        audio.src = URL.createObjectURL(wav);

        // Play and cleanup
        await audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
        };
      }
    } catch (err) {
      console.error('Failed to synthesize speech:', err);
      throw err;
    }
  }, [isReady, mode]);

  return {
    speak,
    isReady,
    isLoading,
    error,
    mode,
    setMode,
    loadingStage,
  };
}
