'use client';

import { useState, useEffect, useCallback } from 'react';
import useWindowSize from '../hooks/useWindowSize';
import { usePiperTTS } from '../hooks/usePiperTTS';
import Celebration from './Celebration';
import TextInput from './TextInput';
import QuestionDisplay from './QuestionDisplay';
import GameLayout from './GameLayout';

const WORD_LIST = [
  'MAPLE', 'RIVER', 'FINN', 'IVYR', 'WILLOW', 'SAGE', 'MUMMY', 'DADDY', 'GRANDMA', 'GRANDAD', 'ALEX', 'MORGAN', 'QUINN',
  'EDEN', 'FERN', 'GREY', 'IVY', 'JAY', 'KELLY', 'LOGAN', 'NOVA', 'OLIVE', 'PARKER', 'SCOUT',
  'HOLIDAY', 'BIRTHDAY', 'SUNSHINE', 'RAINBOW', 'BUTTERFLY',
  'ELEPHANT', 'MOUNTAIN', 'ADVENTURE', 'TREASURE', 'GARDEN',
  'OCEAN', 'PLANET', 'ROCKET', 'CASTLE', 'DRAGON',
  'UNICORN', 'WIZARD', 'FOREST', 'WATERFALL', 'CHAMPION',
  'EAT', 'DRINK', 'MORE', 'DONE', 'STOP', 'GO', 'HELP', 'OPEN', 'WALK', 'RUN', 'PLAY', 'JUMP', 'BABY', 'COW', 'FISH', 'DUCK', 'CAT', 'DOG', 'MILK', 'COOKIE', 'WATER', 'JUICE', 'APPLE', 'BANANA', 'CEREAL', 'BOOK', 'BALL', 'BUBBLES', 'TREE', 'SUN', 'SHOES', 'HOT', 'IN', 'ON', 'UP', 'DOWN', 'PLEASE', 'ME', 'YOU', 'HI', 'BYE', 'YES', 'NO', 'BIG', 'LITTLE', 'CAR', 'BED',
];

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
  const { width, height } = useWindowSize();
  const { speak, isReady: ttsReady, setMode } = usePiperTTS();

  const getRandomWord = useCallback(() => {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  }, []);

  const initializeGame = useCallback(() => {
    const word = getRandomWord();
    setCurrentWord(word);
    setLetterStates(
      word.split('').map(char => ({
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
            }, 6000);
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

  return (
    <GameLayout onModeChange={setMode}>
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
