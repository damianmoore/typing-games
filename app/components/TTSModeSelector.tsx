'use client';

import { useState, useEffect } from 'react';

interface TTSModeSelectorProps {
  onModeChange: (mode: 'browser' | 'piper') => void;
}

export default function TTSModeSelector({ onModeChange }: TTSModeSelectorProps) {
  const [mode, setMode] = useState<'browser' | 'piper'>('browser');

  useEffect(() => {
    // Check for saved preference
    const savedMode = localStorage.getItem('ttsMode') as 'browser' | 'piper' | null;
    if (savedMode) {
      setMode(savedMode);
      onModeChange(savedMode);
    }
  }, [onModeChange]);

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as 'browser' | 'piper';
    setMode(newMode);
    localStorage.setItem('ttsMode', newMode);
    onModeChange(newMode);
  };

  return (
    <div className="fixed top-4 right-16 z-50">
      <select
        value={mode}
        onChange={handleModeChange}
        className="select select-bordered select-sm w-56"
        aria-label="Select TTS mode"
      >
        <option value="browser">Browser Voice (Fast)</option>
        <option value="piper">Piper Voice (Quality)</option>
      </select>
    </div>
  );
}
