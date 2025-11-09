'use client';

interface LetterState {
  expectedChar: string;
  typedChar: string;
  status: 'empty' | 'correct' | 'incorrect';
}

interface TextInputProps {
  letterStates: LetterState[];
  currentIndex: number;
  fontSize: string;
}

export default function TextInput({ letterStates, currentIndex, fontSize }: TextInputProps) {
  return (
    <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
      {letterStates.map((letter, index) => (
        <div
          key={index}
          className="flex flex-col items-center relative"
        >
          {/* Typed letter displayed on top */}
          <div
            className={`font-bold transition-all duration-300 mb-2 ${
              letter.status === 'empty' ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              fontSize: fontSize,
              lineHeight: '1.2',
              minHeight: `${parseFloat(fontSize) * 1.2}px`,
              color: letter.status === 'incorrect' ? '#ff0000' : letter.status === 'correct' ? '#00aa00' : 'inherit',
            }}
          >
            {letter.typedChar || '\u00A0'}
          </div>
          {/* Fixed underscore line */}
          <div
            className={`transition-all duration-300 ${
              index === currentIndex ? 'animate-pulse bg-primary' : 'bg-base-300'
            }`}
            style={{
              width: `${parseFloat(fontSize) * 1.0}px`,
              height: '8px',
              borderRadius: '4px'
            }}
          />
        </div>
      ))}
    </div>
  );
}
