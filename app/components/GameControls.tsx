'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../utils/store';

interface GameControlsProps {
  onRestart: () => void;
}

export default function GameControls({ onRestart }: GameControlsProps) {
  const { status, startCountdown, countdown } = useGameStore();
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  
  const isGameEnded = status === 'ended';
  const isGameWaiting = status === 'waiting';
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
  
  const handleGameAction = () => {
    // Don't do anything if countdown is active
    if (isCountdownActive) return;
    
    // If game is waiting, start countdown
    if (isGameWaiting) {
      startCountdown();
      console.log('Starting countdown');
      return;
    }
    
    // If ended or already running, do full restart with countdown
    onRestart();
    console.log('Restarting game with countdown');
  };
  
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={handleGameAction}
        disabled={isCountdownActive}
        className={`
          ${isGameEnded || isGameWaiting 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-yellow-600 hover:bg-yellow-700'
          } 
          text-white font-semibold py-2 px-4 rounded-lg transition-colors
          ${isCountdownActive ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isGameEnded 
          ? 'Restart Race' 
          : isGameWaiting 
            ? (isCountdownActive ? `Countdown: ${countdownValue}` : 'Start Race')
            : 'Reset Race'}
      </button>
      
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Settings
      </button>
      
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Map Editor
      </button>
    </div>
  );
} 