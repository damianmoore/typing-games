'use client';

import { useState, useEffect, useCallback } from 'react';
import useWindowSize from '../hooks/useWindowSize';
import { usePiperTTS } from '../hooks/usePiperTTS';
import Celebration from './Celebration';
import TextInput from './TextInput';
import QuestionDisplay from './QuestionDisplay';
import GameLayout from './GameLayout';
import GameHeader from './GameHeader';

const WORD_GROUPS = {
  everyday: [
    'EAT', 'DRINK', 'MORE', 'DONE', 'STOP', 'GO', 'HELP', 'OPEN', 'WALK', 'RUN',
    'PLAY', 'JUMP', 'MILK', 'COOKIE', 'WATER', 'JUICE', 'CEREAL', 'BOOK', 'BALL',
    'BUBBLES', 'SHOES', 'HOT', 'IN', 'ON', 'UP', 'DOWN', 'PLEASE', 'ME', 'YOU',
    'HI', 'BYE', 'YES', 'NO', 'BIG', 'LITTLE', 'BED', 'TREE', 'SUN',
  ],
  animals: [
    'BABY', 'COW', 'FISH', 'DUCK', 'CAT', 'DOG',
  ],
  fun: [
    'HOLIDAY', 'BIRTHDAY', 'SUNSHINE', 'RAINBOW', 'BUTTERFLY', 'ELEPHANT',
    'MOUNTAIN', 'ADVENTURE', 'TREASURE', 'GARDEN', 'OCEAN', 'PLANET', 'ROCKET',
    'CASTLE', 'DRAGON', 'UNICORN', 'WIZARD', 'FOREST', 'WATERFALL', 'CHAMPION',
  ],
};

type WordGroupKey = keyof typeof WORD_GROUPS;

interface LetterState {
  expectedChar: string;
  typedChar: string;
  status: 'empty' | 'correct' | 'incorrect';
}

export default function TypingGame() {
  const [currentWord, setCurrentWord] = useState('');
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [enabledGroups, setEnabledGroups] = useState<Record<WordGroupKey, boolean>>({
    everyday: true,
    animals: true,
    fun: true,
  });
  const [customWords, setCustomWords] = useState<string>('');
  const [customWordsEnabled, setCustomWordsEnabled] = useState<boolean>(true);
  const { width, height } = useWindowSize();
  const { speak, isReady: ttsReady, setMode } = usePiperTTS();

  // Load enabled groups and custom words from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('typingGameEnabledGroups');
    if (saved) {
      setEnabledGroups(JSON.parse(saved));
    }

    const savedCustomWords = localStorage.getItem('typingGameCustomWords');
    if (savedCustomWords) {
      setCustomWords(savedCustomWords);
    }

    const savedCustomWordsEnabled = localStorage.getItem('typingGameCustomWordsEnabled');
    if (savedCustomWordsEnabled !== null) {
      setCustomWordsEnabled(JSON.parse(savedCustomWordsEnabled));
    }
  }, []);

  // Save enabled groups to localStorage
  const toggleGroup = useCallback((groupKey: WordGroupKey) => {
    setEnabledGroups(prev => {
      const newGroups = { ...prev, [groupKey]: !prev[groupKey] };
      localStorage.setItem('typingGameEnabledGroups', JSON.stringify(newGroups));
      return newGroups;
    });
  }, []);

  // Handle custom words change
  const handleCustomWordsChange = useCallback((value: string) => {
    setCustomWords(value);
    localStorage.setItem('typingGameCustomWords', value);
  }, []);

  // Toggle custom words enabled
  const toggleCustomWords = useCallback(() => {
    setCustomWordsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('typingGameCustomWordsEnabled', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const getAvailableWords = useCallback(() => {
    const allWords = Object.entries(WORD_GROUPS)
      .filter(([key]) => enabledGroups[key as WordGroupKey])
      .flatMap(([, words]) => words);

    // Parse and add custom words if enabled
    if (customWordsEnabled && customWords.trim()) {
      const parsedCustomWords = customWords
        .split(/[,\n]/)
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length > 0);
      allWords.push(...parsedCustomWords);
    }

    return allWords;
  }, [enabledGroups, customWords, customWordsEnabled]);

  const getRandomWord = useCallback(() => {
    const availableWords = getAvailableWords();
    if (availableWords.length === 0) {
      return WORD_GROUPS.everyday[0];
    }
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }, [getAvailableWords]);

  const initializeGame = useCallback(() => {
    const word = getRandomWord();
    setCurrentWord(word);
    setLetterStates(
      word.split('').map((char: string) => ({
        expectedChar: char,
        typedChar: '',
        status: 'empty'
      }))
    );
    setCurrentIndex(0);
    setShowConfetti(false);
  }, [getRandomWord]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Text-to-speech effect - reads out the word whenever it changes
  useEffect(() => {
    if (!currentWord || !ttsReady) return;

    const speakWord = async () => {
      try {
        await speak(currentWord);
      } catch (err) {
        console.error('Failed to speak word:', err);
      }
    };

    // 1 second delay before saying the initial word
    const timeoutId = setTimeout(speakWord, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentWord, ttsReady, speak]);

  // Text-to-speech effect - reads out the current letter being waited for
  useEffect(() => {
    if (!currentWord || currentIndex >= currentWord.length || !ttsReady) return;

    const currentLetter = currentWord[currentIndex];

    const speakLetter = async () => {
      try {
        await speak(currentLetter);
      } catch (err) {
        console.error('Failed to speak letter:', err);
      }
    };

    // Delay to speak letter after the word is spoken
    const timeoutId = setTimeout(speakLetter, currentIndex === 0 ? 3000 : 1500);
    return () => clearTimeout(timeoutId);
  }, [currentWord, currentIndex, ttsReady, speak]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard events when typing in input/textarea elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle space key to move to next word
      if (e.key === ' ') {
        e.preventDefault();
        initializeGame();
        return;
      }

      // Ignore special keys except Backspace
      if (e.key.length > 1 && e.key !== 'Backspace') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setLetterStates(prev => {
            const newStates = [...prev];
            newStates[currentIndex - 1] = {
              ...newStates[currentIndex - 1],
              typedChar: '',
              status: 'empty'
            };
            return newStates;
          });
        }
        return;
      }

      // Handle letter input
      if (currentIndex < currentWord.length) {
        const typedChar = e.key.toUpperCase();
        const expectedChar = currentWord[currentIndex];
        const isCorrect = typedChar === expectedChar;

        setLetterStates(prev => {
          const newStates = [...prev];
          newStates[currentIndex] = {
            expectedChar: expectedChar,
            typedChar: typedChar,
            status: isCorrect ? 'correct' : 'incorrect'
          };
          return newStates;
        });

        // Check if word is completed correctly
        if (currentIndex === currentWord.length - 1) {
          // Check all letters including the one just typed
          const allCorrect = letterStates.slice(0, currentIndex).every(
            state => state.status === 'correct'
          ) && isCorrect;

          if (allCorrect) {
            setShowConfetti(true);

            // Speak the word again to celebrate completion
            if (ttsReady) {
              setTimeout(async () => {
                try {
                  await speak(currentWord);
                } catch (err) {
                  console.error('Failed to speak celebration:', err);
                }
              }, 500);
            }

            setTimeout(() => {
              initializeGame();
            }, 4000);
          }
        }

        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentWord, letterStates, initializeGame]);

  // Calculate font size based on window size and word length
  const calculateFontSize = () => {
    if (!width || !height) return '8rem';

    const wordLength = currentWord.length;
    const availableWidth = width * 0.9; // 90% of viewport width
    const availableHeight = height * 0.3; // 30% of viewport height for the letters

    const widthBasedSize = availableWidth / (wordLength * 0.6); // 0.6 is approx char width ratio
    const heightBasedSize = availableHeight;

    const fontSize = Math.min(widthBasedSize, heightBasedSize, 200) * 0.8; // Max 200px, scaled to 80%

    return `${Math.max(fontSize, 48)}px`; // Min 48px (80% of 60)
  };

  const settingsContent = (
    <div className="space-y-6">
      {/* Voice Selection */}
      <div>
        <h4 className="font-semibold mb-2">Voice</h4>
        <select
          value={localStorage.getItem('ttsMode') || 'browser'}
          onChange={(e) => {
            const newMode = e.target.value as 'browser' | 'piper';
            localStorage.setItem('ttsMode', newMode);
            setMode(newMode as any);
          }}
          className="select select-bordered w-full"
        >
          <option value="browser">Browser Voice (Fast)</option>
          <option value="piper">Piper Voice (Quality)</option>
        </select>
      </div>

      {/* Word Groups */}
      <div>
        <h4 className="font-semibold mb-2">Word Groups</h4>
        <div className="space-y-2">
          {(Object.keys(WORD_GROUPS) as WordGroupKey[]).map((groupKey) => (
            <div key={groupKey} className="flex items-center justify-between">
              <span className="label-text capitalize">{groupKey}</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={enabledGroups[groupKey]}
                onChange={() => toggleGroup(groupKey)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Words */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Custom Words</h4>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={customWordsEnabled}
            onChange={toggleCustomWords}
          />
        </div>
        <p className="text-sm text-base-content/70 mb-2">
          Enter custom words separated by commas or line breaks
        </p>
        <textarea
          value={customWords}
          onChange={(e) => handleCustomWordsChange(e.target.value)}
          placeholder="APPLE, BANANA, ORANGE&#10;GRAPE&#10;MELON"
          className="textarea textarea-bordered w-full h-32"
          disabled={!customWordsEnabled}
        />
      </div>
    </div>
  );

  return (
    <GameLayout onModeChange={setMode}>
      <GameHeader showBackButton={true} settingsContent={settingsContent} />

      <Celebration show={showConfetti} />

      <QuestionDisplay
        content={currentWord}
        fontSize={`${Math.min(parseFloat(calculateFontSize()) * 0.6, 120)}px`}
      />

      <TextInput
        letterStates={letterStates}
        currentIndex={currentIndex}
        fontSize={calculateFontSize()}
      />
    </GameLayout>
  );
}
