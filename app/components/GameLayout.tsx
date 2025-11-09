'use client';

import { ReactNode } from 'react';
import TTSModeSelector from './TTSModeSelector';
import { TTSMode } from '../hooks/usePiperTTS';

interface GameLayoutProps {
  children: ReactNode;
  onModeChange: (mode: TTSMode) => void;
}

export default function GameLayout({ children, onModeChange }: GameLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <TTSModeSelector onModeChange={onModeChange} />
      {children}
    </div>
  );
}
