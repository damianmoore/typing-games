'use client';

import { useState, useEffect, useCallback } from 'react';
import useWindowSize from '../hooks/useWindowSize';
import { usePiperTTS } from '../hooks/usePiperTTS';
import Celebration from './Celebration';
import TextInput from './TextInput';
import QuestionDisplay from './QuestionDisplay';
import GameLayout from './GameLayout';
import Link from 'next/link';

const ANIMALS = [
  { emoji: '🐶', name: 'DOG' },
  { emoji: '🐱', name: 'CAT' },
  { emoji: '🐭', name: 'MOUSE' },
  { emoji: '🐹', name: 'HAMSTER' },
  { emoji: '🐰', name: 'RABBIT' },
  { emoji: '🦊', name: 'FOX' },
  { emoji: '🐻', name: 'IVYR' },
  { emoji: '🐼', name: 'PANDA' },
  { emoji: '🐨', name: 'KOALA' },
  { emoji: '🐯', name: 'TIGER' },
  { emoji: '🦁', name: 'LION' },
  { emoji: '🐮', name: 'COW' },
  { emoji: '🐷', name: 'PIG' },
  { emoji: '🐸', name: 'FROG' },
  { emoji: '🐵', name: 'MONKEY' },
  { emoji: '🐔', name: 'CHICKEN' },
  { emoji: '🐧', name: 'PENGUIN' },
  { emoji: '🐦', name: 'BIRD' },
  { emoji: '🐤', name: 'CHICK' },
  { emoji: '🦆', name: 'DUCK' },
  { emoji: '🦅', name: 'EAGLE' },
  { emoji: '🦉', name: 'OWL' },
  { emoji: '🐺', name: 'WOLF' },
  { emoji: '🐴', name: 'HORSE' },
  { emoji: '🦄', name: 'UNICORN' },
  { emoji: '🐝', name: 'BEE' },
  { emoji: '🦋', name: 'BUTTERFLY' },
  { emoji: '🐌', name: 'SNAIL' },
  { emoji: '🐞', name: 'LADYBUG' },
  { emoji: '🐢', name: 'TURTLE' },
  { emoji: '🐍', name: 'SNAKE' },
  { emoji: '🦎', name: 'LIZARD' },
  { emoji: '🦖', name: 'DINOSAUR' },
  { emoji: '🐙', name: 'OCTOPUS' },
  { emoji: '🦐', name: 'SHRIMP' },
  { emoji: '🦀', name: 'CRAB' },
  { emoji: '🐡', name: 'PUFFERFISH' },
  { emoji: '🐠', name: 'FISH' },
  { emoji: '🐟', name: 'FISH' },
  { emoji: '🐬', name: 'DOLPHIN' },
  { emoji: '🐳', name: 'WHALE' },
  { emoji: '🐋', name: 'WHALE' },
  { emoji: '🦈', name: 'SHARK' },
  { emoji: '🐊', name: 'CROCODILE' },
  { emoji: '🐅', name: 'TIGER' },
  { emoji: '🐆', name: 'LEOPARD' },
  { emoji: '🦓', name: 'ZEBRA' },
  { emoji: '🦍', name: 'GORILLA' },
  { emoji: '🐘', name: 'ELEPHANT' },
  { emoji: '🦛', name: 'HIPPO' },
  { emoji: '🦏', name: 'RHINO' },
  { emoji: '🐪', name: 'CAMEL' },
  { emoji: '🐫', name: 'CAMEL' },
  { emoji: '🦒', name: 'GIRAFFE' },
  { emoji: '🦘', name: 'KANGAROO' },
  { emoji: '🐄', name: 'COW' },
  { emoji: '🐎', name: 'HORSE' },
  { emoji: '🐖', name: 'PIG' },
  { emoji: '🐏', name: 'RAM' },
  { emoji: '🐑', name: 'SHEEP' },
  { emoji: '🦙', name: 'LLAMA' },
  { emoji: '🐐', name: 'GOAT' },
  { emoji: '🦌', name: 'DEER' },
  { emoji: '🐕', name: 'DOG' },
  { emoji: '🐩', name: 'POODLE' },
  { emoji: '🐈', name: 'CAT' },
  { emoji: '🐓', name: 'ROOSTER' },
  { emoji: '🦃', name: 'TURKEY' },
  { emoji: '🦚', name: 'PEACOCK' },
  { emoji: '🦜', name: 'PARROT' },
  { emoji: '🦢', name: 'SWAN' },
  { emoji: '🦩', name: 'FLAMINGO' },
  { emoji: '🐇', name: 'RABBIT' },
  { emoji: '🦝', name: 'RACCOON' },
  { emoji: '🦨', name: 'SKUNK' },
  { emoji: '🦡', name: 'BADGER' },
  { emoji: '🦦', name: 'OTTER' },
  { emoji: '🦥', name: 'SLOTH' },
  { emoji: '🐁', name: 'MOUSE' },
  { emoji: '🐀', name: 'RAT' },
  { emoji: '🐿️', name: 'SQUIRREL' },
  { emoji: '🦔', name: 'HEDGEHOG' },
];

interface LetterState {
  expectedChar: string;
  typedChar: string;
  status: 'empty' | 'correct' | 'incorrect';
}

export default function StartingLetterGame() {
  const [currentAnimal, setCurrentAnimal] = useState({ emoji: '', name: '' });
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const { speak, isReady: ttsReady, setMode } = usePiperTTS();

  const getRandomAnimal = useCallback(() => {
    return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  }, []);

  const initializeGame = useCallback(() => {
    const animal = getRandomAnimal();
    setCurrentAnimal(animal);
    setLetterStates([
      {
        expectedChar: animal.name[0],
        typedChar: '',
        status: 'empty'
      }
    ]);
    setCurrentIndex(0);
    setShowConfetti(false);
  }, [getRandomAnimal]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Text-to-speech effect - reads out the animal name when the game initializes
  useEffect(() => {
    if (!currentAnimal.name || !ttsReady) return;

    const speakAnimal = async () => {
      try {
        await speak(currentAnimal.name);
      } catch (err) {
        console.error('Failed to speak animal name:', err);
      }
    };

    // 1 second delay before saying the animal name
    const timeoutId = setTimeout(speakAnimal, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentAnimal, ttsReady, speak]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle space key to move to next challenge
      if (e.key === ' ') {
        e.preventDefault();
        initializeGame();
        return;
      }

      // Ignore special keys except Backspace
      if (e.key.length > 1 && e.key !== 'Backspace') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        setLetterStates([{
          expectedChar: currentAnimal.name[0],
          typedChar: '',
          status: 'empty'
        }]);
        setCurrentIndex(0);
        return;
      }

      // Handle letter input (only if nothing has been entered yet)
      if (currentIndex === 0 && /^[a-zA-Z]$/.test(e.key)) {
        const typedChar = e.key.toUpperCase();
        const expectedChar = currentAnimal.name[0];
        const isCorrect = typedChar === expectedChar;

        setLetterStates([{
          expectedChar: expectedChar,
          typedChar: typedChar,
          status: isCorrect ? 'correct' : 'incorrect'
        }]);

        if (isCorrect) {
          // Correct answer!
          setShowConfetti(true);

          // Speak the animal name again to celebrate
          if (ttsReady) {
            setTimeout(async () => {
              try {
                await speak(currentAnimal.name);
              } catch (err) {
                console.error('Failed to speak celebration:', err);
              }
            }, 500);
          }

          setTimeout(() => {
            initializeGame();
          }, 4000);
        } else {
          // Wrong answer - show red and clear after 1 second
          setTimeout(() => {
            setLetterStates([{
              expectedChar: currentAnimal.name[0],
              typedChar: '',
              status: 'empty'
            }]);
            setCurrentIndex(0); // Reset to allow re-entry
          }, 1000);
          setCurrentIndex(1); // Temporarily set to 1 to prevent multiple entries during error display
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentAnimal, initializeGame, speak, ttsReady]);

  // Calculate font size for the emoji
  const calculateEmojiFontSize = () => {
    if (!width || !height) return '8rem';

    const availableHeight = height * 0.4;
    const fontSize = Math.min(availableHeight, 300) * 0.8;

    return `${Math.max(fontSize, 80)}px`;
  };

  // Calculate font size for the input letter
  const calculateInputFontSize = () => {
    if (!width || !height) return '8rem';

    const availableHeight = height * 0.2;
    const fontSize = Math.min(availableHeight, 200);

    return `${Math.max(fontSize, 60)}px`;
  };

  return (
    <GameLayout onModeChange={setMode}>
      <Link href="/" className="absolute top-4 left-4 btn btn-ghost btn-sm">
        ← Back
      </Link>

      <Celebration show={showConfetti} />

      <QuestionDisplay
        content={currentAnimal.emoji}
        fontSize={calculateEmojiFontSize()}
      />

      <TextInput
        letterStates={letterStates}
        currentIndex={currentIndex}
        fontSize={calculateInputFontSize()}
      />
    </GameLayout>
  );
}
