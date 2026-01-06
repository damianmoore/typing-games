'use client';

import { ReactNode } from 'react';
import { TTSMode } from '../contexts/TTSContext';

interface GameLayoutProps {
  children: ReactNode;
  onModeChange: (mode: TTSMode) => void;
}

export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {children}
    </div>
  );
}
