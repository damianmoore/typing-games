'use client';

import { useState, useEffect, useCallback } from 'react';
import useWindowSize from '../hooks/useWindowSize';
import { usePiperTTS } from '../hooks/usePiperTTS';
import Celebration from './Celebration';
import TextInput from './TextInput';
import QuestionDisplay from './QuestionDisplay';
import GameLayout from './GameLayout';
import GameHeader from './GameHeader';

const EMOJI_LIST = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'];

interface LetterState {
  expectedChar: string;
  typedChar: string;
  status: 'empty' | 'correct' | 'incorrect';
}

export default function CountingGame() {
  const [currentCount, setCurrentCount] = useState(0);
  const [currentEmoji, setCurrentEmoji] = useState('');
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showError, setShowError] = useState(false);
  const { width, height } = useWindowSize();
  const { speak, isReady: ttsReady, setMode } = usePiperTTS();

  const getRandomEmoji = useCallback(() => {
    return EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)];
  }, []);

  const getRandomCount = useCallback(() => {
    return Math.floor(Math.random() * 9) + 1; // 1-9
  }, []);

  const initializeGame = useCallback(() => {
    const count = getRandomCount();
    const emoji = getRandomEmoji();
    setCurrentCount(count);
    setCurrentEmoji(emoji);
    setLetterStates([
      {
        expectedChar: count.toString(),
        typedChar: '',
        status: 'empty'
      }
    ]);
    setCurrentIndex(0);
    setShowConfetti(false);
    setShowError(false);
  }, [getRandomCount, getRandomEmoji]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Text-to-speech effect - reads out the count when the game initializes
  useEffect(() => {
    if (!currentCount || !ttsReady) return;

    const speakCount = async () => {
      try {
        await speak(currentCount.toString());
      } catch (err) {
        console.error('Failed to speak count:', err);
      }
    };

    // 1 second delay before saying the count
    const timeoutId = setTimeout(speakCount, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentCount, ttsReady, speak]);

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
          expectedChar: currentCount.toString(),
          typedChar: '',
          status: 'empty'
        }]);
        setCurrentIndex(0);
        setShowError(false);
        return;
      }

      // Handle number input (only if nothing has been entered yet)
      if (currentIndex === 0 && /^[0-9]$/.test(e.key)) {
        const typedChar = e.key;
        const expectedChar = currentCount.toString();
        const isCorrect = typedChar === expectedChar;

        setLetterStates([{
          expectedChar: expectedChar,
          typedChar: typedChar,
          status: isCorrect ? 'correct' : 'incorrect'
        }]);

        if (isCorrect) {
          // Correct answer!
          setShowConfetti(true);

          // Speak the count again to celebrate
          if (ttsReady) {
            setTimeout(async () => {
              try {
                await speak(currentCount.toString());
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
          setShowError(true);
          setTimeout(() => {
            setLetterStates([{
              expectedChar: currentCount.toString(),
              typedChar: '',
              status: 'empty'
            }]);
            setShowError(false);
            setCurrentIndex(0); // Reset to allow re-entry
          }, 1000);
          setCurrentIndex(1); // Temporarily set to 1 to prevent multiple entries during error display
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentCount, initializeGame, speak, ttsReady]);

  // Calculate font size for the emojis
  const calculateEmojiFontSize = () => {
    if (!width || !height) return '4rem';

    const availableWidth = width * 0.9;
    const availableHeight = height * 0.4;

    const emojiSize = Math.min(availableWidth / currentCount, availableHeight / 2, 150) * 0.5; // 50% of original size

    return `${Math.max(emojiSize, 24)}px`;
  };

  // Calculate font size for the input number
  const calculateInputFontSize = () => {
    if (!width || !height) return '8rem';

    const availableHeight = height * 0.2;
    const fontSize = Math.min(availableHeight, 200);

    return `${Math.max(fontSize, 60)}px`;
  };

  // Generate emoji display
  const emojiDisplay = Array(currentCount).fill(currentEmoji).join(' ');

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
    </div>
  );

  return (
    <GameLayout onModeChange={setMode}>
      <GameHeader showBackButton={true} settingsContent={settingsContent} />

      <Celebration show={showConfetti} />

      <QuestionDisplay
        content={emojiDisplay}
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
