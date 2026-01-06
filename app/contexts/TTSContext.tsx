'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTTSEngine, TTSEngine, TTSMode } from '../hooks/useTTSEngine';

export type { TTSMode };

const TTSContext = createContext<TTSEngine | null>(null);

export function TTSProvider({ children }: { children: ReactNode }) {
  const tts = useTTSEngine();

  return (
    <TTSContext.Provider value={tts}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS(): TTSEngine {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
}
