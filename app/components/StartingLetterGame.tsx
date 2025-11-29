'use client';

import { useState, useEffect, useCallback } from 'react';
import useWindowSize from '../hooks/useWindowSize';
import { usePiperTTS } from '../hooks/usePiperTTS';
import Celebration from './Celebration';
import TextInput from './TextInput';
import QuestionDisplay from './QuestionDisplay';
import GameLayout from './GameLayout';
import GameHeader from './GameHeader';

const EMOJI_SETS = {
  animals: [
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
  ],
  foods: [
    { emoji: '🍎', name: 'APPLE' },
    { emoji: '🍌', name: 'BANANA' },
    { emoji: '🍊', name: 'ORANGE' },
    { emoji: '🍇', name: 'GRAPES' },
    { emoji: '🍓', name: 'STRAWBERRY' },
    { emoji: '🍉', name: 'WATERMELON' },
    { emoji: '🍑', name: 'PEACH' },
    { emoji: '🍒', name: 'CHERRY' },
    { emoji: '🥝', name: 'KIWI' },
    { emoji: '🍍', name: 'PINEAPPLE' },
    { emoji: '🥭', name: 'MANGO' },
    { emoji: '🍕', name: 'PIZZA' },
    { emoji: '🍔', name: 'BURGER' },
    { emoji: '🌭', name: 'HOTDOG' },
    { emoji: '🥪', name: 'SANDWICH' },
    { emoji: '🌮', name: 'TACO' },
    { emoji: '🍝', name: 'SPAGHETTI' },
    { emoji: '🍜', name: 'NOODLES' },
    { emoji: '🍚', name: 'RICE' },
    { emoji: '🍞', name: 'BREAD' },
    { emoji: '🧀', name: 'CHEESE' },
    { emoji: '🥚', name: 'EGG' },
    { emoji: '🥛', name: 'MILK' },
    { emoji: '🍪', name: 'COOKIE' },
    { emoji: '🎂', name: 'CAKE' },
    { emoji: '🍩', name: 'DONUT' },
    { emoji: '🍦', name: 'ICECREAM' },
    { emoji: '🍫', name: 'CHOCOLATE' },
  ],
  vehicles: [
    { emoji: '🚗', name: 'CAR' },
    { emoji: '🚕', name: 'TAXI' },
    { emoji: '🚙', name: 'VAN' },
    { emoji: '🚌', name: 'BUS' },
    { emoji: '🚎', name: 'TROLLEYBUS' },
    { emoji: '🚐', name: 'MINIBUS' },
    { emoji: '🚑', name: 'AMBULANCE' },
    { emoji: '🚒', name: 'FIRETRUCK' },
    { emoji: '🚓', name: 'POLICE' },
    { emoji: '🚔', name: 'POLICE' },
    { emoji: '🚚', name: 'TRUCK' },
    { emoji: '🚛', name: 'LORRY' },
    { emoji: '🚜', name: 'TRACTOR' },
    { emoji: '🏎️', name: 'RACECAR' },
    { emoji: '🏍️', name: 'MOTORCYCLE' },
    { emoji: '🛵', name: 'SCOOTER' },
    { emoji: '🚲', name: 'BICYCLE' },
    { emoji: '🛴', name: 'SCOOTER' },
    { emoji: '✈️', name: 'AIRPLANE' },
    { emoji: '🚁', name: 'HELICOPTER' },
    { emoji: '🚂', name: 'TRAIN' },
    { emoji: '🚆', name: 'TRAIN' },
    { emoji: '🚇', name: 'METRO' },
    { emoji: '🚈', name: 'TRAIN' },
    { emoji: '🚊', name: 'TRAM' },
    { emoji: '🚝', name: 'MONORAIL' },
    { emoji: '🚞', name: 'RAILWAY' },
    { emoji: '🚋', name: 'TRAM' },
    { emoji: '🚃', name: 'TRAIN' },
    { emoji: '🚟', name: 'RAILWAY' },
    { emoji: '🚠', name: 'CABLE' },
    { emoji: '🚡', name: 'AERIAL' },
    { emoji: '🛶', name: 'CANOE' },
    { emoji: '⛵', name: 'SAILBOAT' },
    { emoji: '🚤', name: 'SPEEDBOAT' },
    { emoji: '🛥️', name: 'MOTORBOAT' },
    { emoji: '🛳️', name: 'SHIP' },
    { emoji: '⛴️', name: 'FERRY' },
    { emoji: '🚢', name: 'SHIP' },
    { emoji: '🚀', name: 'ROCKET' },
  ],
};

type EmojiSetKey = keyof typeof EMOJI_SETS;

interface LetterState {
  expectedChar: string;
  typedChar: string;
  status: 'empty' | 'correct' | 'incorrect';
}

export default function StartingLetterGame() {
  const [currentItem, setCurrentItem] = useState({ emoji: '', name: '' });
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [enabledSets, setEnabledSets] = useState<Record<EmojiSetKey, boolean>>({
    animals: true,
    foods: true,
    vehicles: true,
  });
  const { width, height } = useWindowSize();
  const { speak, isReady: ttsReady, setMode } = usePiperTTS();

  // Load enabled sets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('startingLetterEnabledSets');
    if (saved) {
      setEnabledSets(JSON.parse(saved));
    }
  }, []);

  // Save enabled sets to localStorage
  const toggleSet = useCallback((setKey: EmojiSetKey) => {
    setEnabledSets(prev => {
      const newSets = { ...prev, [setKey]: !prev[setKey] };
      localStorage.setItem('startingLetterEnabledSets', JSON.stringify(newSets));
      return newSets;
    });
  }, []);

  const getAvailableItems = useCallback(() => {
    const allItems = Object.entries(EMOJI_SETS)
      .filter(([key]) => enabledSets[key as EmojiSetKey])
      .flatMap(([, items]) => items);
    return allItems;
  }, [enabledSets]);

  const getRandomItem = useCallback(() => {
    const availableItems = getAvailableItems();
    if (availableItems.length === 0) {
      return EMOJI_SETS.animals[0];
    }
    return availableItems[Math.floor(Math.random() * availableItems.length)];
  }, [getAvailableItems]);

  const initializeGame = useCallback(() => {
    const item = getRandomItem();
    setCurrentItem(item);
    setLetterStates([
      {
        expectedChar: item.name[0],
        typedChar: '',
        status: 'empty'
      }
    ]);
    setCurrentIndex(0);
    setShowConfetti(false);
  }, [getRandomItem]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Text-to-speech effect - reads out the item name when the game initializes
  useEffect(() => {
    if (!currentItem.name || !ttsReady) return;

    const speakItem = async () => {
      try {
        await speak(currentItem.name);
      } catch (err) {
        console.error('Failed to speak item name:', err);
      }
    };

    // 1 second delay before saying the item name
    const timeoutId = setTimeout(speakItem, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentItem, ttsReady, speak]);

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
          expectedChar: currentItem.name[0],
          typedChar: '',
          status: 'empty'
        }]);
        setCurrentIndex(0);
        return;
      }

      // Handle letter input (only if nothing has been entered yet)
      if (currentIndex === 0 && /^[a-zA-Z]$/.test(e.key)) {
        const typedChar = e.key.toUpperCase();
        const expectedChar = currentItem.name[0];
        const isCorrect = typedChar === expectedChar;

        setLetterStates([{
          expectedChar: expectedChar,
          typedChar: typedChar,
          status: isCorrect ? 'correct' : 'incorrect'
        }]);

        if (isCorrect) {
          // Correct answer!
          setShowConfetti(true);

          // Speak the item name again to celebrate
          if (ttsReady) {
            setTimeout(async () => {
              try {
                await speak(currentItem.name);
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
              expectedChar: currentItem.name[0],
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
  }, [currentIndex, currentItem, initializeGame, speak, ttsReady]);

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

      {/* Emoji Sets */}
      <div>
        <h4 className="font-semibold mb-2">Emoji Sets</h4>
        <div className="space-y-2">
          {(Object.keys(EMOJI_SETS) as EmojiSetKey[]).map((setKey) => (
            <div key={setKey} className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={enabledSets[setKey]}
                  onChange={() => toggleSet(setKey)}
                />
                <span className="label-text capitalize">{setKey}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <GameLayout onModeChange={setMode}>
      <GameHeader showBackButton={true} settingsContent={settingsContent} />

      <Celebration show={showConfetti} />

      <QuestionDisplay
        content={currentItem.emoji}
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
