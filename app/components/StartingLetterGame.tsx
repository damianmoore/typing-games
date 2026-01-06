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
    { emoji: '🐜', name: 'ANT' },
    { emoji: '🦡', name: 'BADGER' },
    { emoji: '🐝', name: 'BEE' },
    { emoji: '🐦', name: 'BIRD' },
    { emoji: '🦬', name: 'BISON' },
    { emoji: '🦋', name: 'BUTTERFLY' },
    { emoji: '🐪', name: 'CAMEL' },
    { emoji: '🐱', name: 'CAT' },
    { emoji: '🐤', name: 'CHICK' },
    { emoji: '🐔', name: 'CHICKEN' },
    { emoji: '🐮', name: 'COW' },
    { emoji: '🦀', name: 'CRAB' },
    { emoji: '🐊', name: 'CROCODILE' },
    { emoji: '🦌', name: 'DEER' },
    { emoji: '🦖', name: 'DINOSAUR' },
    { emoji: '🐶', name: 'DOG' },
    { emoji: '🐬', name: 'DOLPHIN' },
    { emoji: '🦆', name: 'DUCK' },
    { emoji: '🦅', name: 'EAGLE' },
    { emoji: '🐘', name: 'ELEPHANT' },
    { emoji: '🐠', name: 'FISH' },
    { emoji: '🦩', name: 'FLAMINGO' },
    { emoji: '🦊', name: 'FOX' },
    { emoji: '🐸', name: 'FROG' },
    { emoji: '🦒', name: 'GIRAFFE' },
    { emoji: '🐐', name: 'GOAT' },
    { emoji: '🦍', name: 'GORILLA' },
    { emoji: '🐹', name: 'HAMSTER' },
    { emoji: '🦔', name: 'HEDGEHOG' },
    { emoji: '🦛', name: 'HIPPO' },
    { emoji: '🐴', name: 'HORSE' },
    { emoji: '🦎', name: 'IGUANA' },
    { emoji: '🪼', name: 'JELLYFISH' },
    { emoji: '🦘', name: 'KANGAROO' },
    { emoji: '🐨', name: 'KOALA' },
    { emoji: '🐞', name: 'LADYBIRD' },
    { emoji: '🐆', name: 'LEOPARD' },
    { emoji: '🦁', name: 'LION' },
    { emoji: '🦎', name: 'LIZARD' },
    { emoji: '🦙', name: 'LLAMA' },
    { emoji: '🐵', name: 'MONKEY' },
    { emoji: '🐭', name: 'MOUSE' },
    { emoji: '🐙', name: 'OCTOPUS' },
    { emoji: '🦦', name: 'OTTER' },
    { emoji: '🦉', name: 'OWL' },
    { emoji: '🐼', name: 'PANDA' },
    { emoji: '🦜', name: 'PARROT' },
    { emoji: '🦚', name: 'PEACOCK' },
    { emoji: '🐧', name: 'PENGUIN' },
    { emoji: '🐷', name: 'PIG' },
    { emoji: '🐩', name: 'POODLE' },
    { emoji: '🐡', name: 'PUFFERFISH' },
    { emoji: '🐰', name: 'RABBIT' },
    { emoji: '🦝', name: 'RACCOON' },
    { emoji: '🐏', name: 'RAM' },
    { emoji: '🐀', name: 'RAT' },
    { emoji: '🦏', name: 'RHINO' },
    { emoji: '🐓', name: 'ROOSTER' },
    { emoji: '🦂', name: 'SCORPION' },
    { emoji: '🦈', name: 'SHARK' },
    { emoji: '🐑', name: 'SHEEP' },
    { emoji: '🦐', name: 'SHRIMP' },
    { emoji: '🦨', name: 'SKUNK' },
    { emoji: '🦥', name: 'SLOTH' },
    { emoji: '🐌', name: 'SNAIL' },
    { emoji: '🐍', name: 'SNAKE' },
    { emoji: '🐿️', name: 'SQUIRREL' },
    { emoji: '🦢', name: 'SWAN' },
    { emoji: '🐯', name: 'TIGER' },
    { emoji: '🦃', name: 'TURKEY' },
    { emoji: '🐢', name: 'TURTLE' },
    { emoji: '🦄', name: 'UNICORN' },
    { emoji: '🐳', name: 'WHALE' },
    { emoji: '🐺', name: 'WOLF' },
    { emoji: '🪱', name: 'WORM' },
    { emoji: '🐃', name: 'YAK' },
    { emoji: '🦓', name: 'ZEBRA' },
  ],
  foods: [
    { emoji: '🍎', name: 'APPLE' },
    { emoji: '🍆', name: 'AUBERGINE' },
    { emoji: '🥯', name: 'BAGEL' },
    { emoji: '🫐', name: 'BLUEBERRY' },
    { emoji: '🍞', name: 'BREAD' },
    { emoji: '🥦', name: 'BROCCOLI' },
    { emoji: '🍔', name: 'BURGER' },
    { emoji: '🌯', name: 'BURRITO' },
    { emoji: '🧈', name: 'BUTTER' },
    { emoji: '🎂', name: 'CAKE' },
    { emoji: '🥕', name: 'CARROT' },
    { emoji: '🧀', name: 'CHEESE' },
    { emoji: '🍒', name: 'CHERRY' },
    { emoji: '🌶️', name: 'CHILLI' },
    { emoji: '🍫', name: 'CHOCOLATE' },
    { emoji: '🥥', name: 'COCONUT' },
    { emoji: '🍪', name: 'COOKIE' },
    { emoji: '🥐', name: 'CROISSANT' },
    { emoji: '🥒', name: 'CUCUMBER' },
    { emoji: '🍩', name: 'DONUT' },
    { emoji: '🧄', name: 'GARLIC' },
    { emoji: '🍇', name: 'GRAPES' },
    { emoji: '🌭', name: 'HOTDOG' },
    { emoji: '🍦', name: 'ICECREAM' },
    { emoji: '🧃', name: 'JUICE' },
    { emoji: '🥝', name: 'KIWI' },
    { emoji: '🍋', name: 'LEMON' },
    { emoji: '🥬', name: 'LETTUCE' },
    { emoji: '🥭', name: 'MANGO' },
    { emoji: '🍈', name: 'MELON' },
    { emoji: '🥛', name: 'MILK' },
    { emoji: '🍄', name: 'MUSHROOM' },
    { emoji: '🍜', name: 'NOODLES' },
    { emoji: '🥜', name: 'NUT' },
    { emoji: '🫒', name: 'OLIVE' },
    { emoji: '🧅', name: 'ONION' },
    { emoji: '🍊', name: 'ORANGE' },
    { emoji: '🥞', name: 'PANCAKE' },
    { emoji: '🍑', name: 'PEACH' },
    { emoji: '🍐', name: 'PEAR' },
    { emoji: '🫛', name: 'PEAS' },
    { emoji: '🫑', name: 'PEPPER' },
    { emoji: '🥧', name: 'PIE' },
    { emoji: '🍍', name: 'PINEAPPLE' },
    { emoji: '🍕', name: 'PIZZA' },
    { emoji: '🍿', name: 'POPCORN' },
    { emoji: '🥔', name: 'POTATO' },
    { emoji: '🥨', name: 'PRETZEL' },
    { emoji: '🍚', name: 'RICE' },
    { emoji: '🥪', name: 'SANDWICH' },
    { emoji: '🍲', name: 'SOUP' },
    { emoji: '🍝', name: 'SPAGHETTI' },
    { emoji: '🍓', name: 'STRAWBERRY' },
    { emoji: '🌽', name: 'SWEETCORN' },
    { emoji: '🌮', name: 'TACO' },
    { emoji: '🧇', name: 'WAFFLE' },
    { emoji: '🍉', name: 'WATERMELON' },
  ],
  transport: [
    { emoji: '✈️', name: 'AEROPLANE' },
    { emoji: '🚑', name: 'AMBULANCE' },
    { emoji: '🚧', name: 'BARRIER' },
    { emoji: '🚲', name: 'BICYCLE' },
    { emoji: '🚌', name: 'BUS' },
    { emoji: '🚠', name: 'CABLE CAR' },
    { emoji: '🛶', name: 'CANOE' },
    { emoji: '🚗', name: 'CAR' },
    { emoji: '🚴', name: 'CYCLIST' },
    { emoji: '🚜', name: 'DIGGER' },
    { emoji: '⛴️', name: 'FERRY' },
    { emoji: '🚒', name: 'FIRE ENGINE' },
    { emoji: '🚁', name: 'HELICOPTER' },
    { emoji: '🛬', name: 'JET' },
    { emoji: '🚛', name: 'LORRY' },
    { emoji: '🏍️', name: 'MOTOR BIKE' },
    { emoji: '🪂', name: 'PARACHUTE' },
    { emoji: '🚓', name: 'POLICE CAR' },
    { emoji: '🏎️', name: 'RACE CAR' },
    { emoji: '🚀', name: 'ROCKET' },
    { emoji: '⛵', name: 'SAILBOAT' },
    { emoji: '🛵', name: 'SCOOTER' },
    { emoji: '🛳️', name: 'SHIP' },
    { emoji: '🛷', name: 'SLEDGE' },
    { emoji: '🚤', name: 'SPEEDBOAT' },
    { emoji: '🚕', name: 'TAXI' },
    { emoji: '🚜', name: 'TRACTOR' },
    { emoji: '🚈', name: 'TRAIN' },
    { emoji: '🚋', name: 'TRAM' },
    { emoji: '🚚', name: 'TRUCK' },
    { emoji: '🛸', name: 'UFO' },
    { emoji: '🚐', name: 'VAN' },
    { emoji: '🛞', name: 'WHEEL' },
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
    transport: true,
  });
  const { width, height } = useWindowSize();
  const { speak, isReady: ttsReady, mode, setMode } = usePiperTTS();

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

  const getRandomItem = useCallback((previousStartingLetter?: string) => {
    const availableItems = getAvailableItems();
    if (availableItems.length === 0) {
      return EMOJI_SETS.animals[0];
    }
    // Filter out items with the same starting letter to avoid repetition
    const filteredItems = previousStartingLetter && availableItems.length > 1
      ? availableItems.filter(item => item.name[0] !== previousStartingLetter)
      : availableItems;
    // Fall back to all items if filtering removed everything
    const itemsToChooseFrom = filteredItems.length > 0 ? filteredItems : availableItems;
    return itemsToChooseFrom[Math.floor(Math.random() * itemsToChooseFrom.length)];
  }, [getAvailableItems]);

  const initializeGame = useCallback((previousStartingLetter?: string) => {
    const item = getRandomItem(previousStartingLetter);
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
        initializeGame(currentItem.name[0]);
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

          setTimeout(() => {
            initializeGame(currentItem.name[0]);
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
          value={mode}
          onChange={(e) => {
            const newMode = e.target.value as 'browser' | 'piper' | 'supertonic';
            localStorage.setItem('ttsMode', newMode);
            setMode(newMode);
          }}
          className="select select-bordered w-full"
        >
          <option value="browser">Browser Voice (Fast)</option>
          <option value="piper">Piper Voice (Quality)</option>
          <option value="supertonic">Supertonic 2 (Best Quality)</option>
        </select>
      </div>

      {/* Word Groups */}
      <div>
        <h4 className="font-semibold mb-2">Word Groups</h4>
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
