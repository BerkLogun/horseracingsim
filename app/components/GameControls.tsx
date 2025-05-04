'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../utils/store';

interface GameControlsProps {
  onModeChange: (mode: 'game' | 'mapCreator') => void;
}

export default function GameControls({ onModeChange }: GameControlsProps) {
  const { status, startCountdown, restartGame, countdown } = useGameStore();
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [mode, setMode] = useState<'game' | 'mapCreator'>('game');
  
  const isCountdownActive = Boolean(countdown?.active);
  
  // Update local state when countdown changes to force re-render
  useEffect(() => {
    if (countdown?.active) {
      setCountdownValue(countdown.countdownValue);
      
      // Set up interval to check for countdown updates
      const intervalId = setInterval(() => {
        const currentCountdown = useGameStore.getState().countdown;
        if (currentCountdown?.active) {
          setCountdownValue(currentCountdown.countdownValue);
        } else {
          setCountdownValue(null);
          clearInterval(intervalId);
        }
      }, 100);
      
      return () => clearInterval(intervalId);
    } else {
      setCountdownValue(null);
    }
  }, [countdown?.active]);

  const handleModeToggle = () => {
    const newMode = mode === 'game' ? 'mapCreator' : 'game';
    setMode(newMode);
    onModeChange(newMode);
  };

  return (
    <div className="w-full flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded ${status === 'ended' ? 'bg-green-500' : 'bg-blue-500'} text-white font-semibold transition duration-200`}
          disabled={isCountdownActive}
          onClick={() => {
            if (status === 'ended') {
              restartGame();
            } else {
              startCountdown();
            }
          }}
        >
          {status === 'waiting' ? 
            (isCountdownActive ? `Counting: ${countdownValue}` : 'Start Race') : 
            status === 'ended' ? 'New Race' : 'Reset'}
        </button>
      </div>
      
      <button
        className="px-4 py-2 rounded bg-purple-500 text-white font-semibold transition duration-200"
        onClick={handleModeToggle}
      >
        {mode === 'game' ? 'Map Creator' : 'Race Mode'}
      </button>
    </div>
  );
} 