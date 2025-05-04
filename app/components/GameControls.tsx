'use client';

import React from 'react';
import { useGameStore } from '../utils/store';

interface GameControlsProps {
  onRestart: () => void;
}

export default function GameControls({ onRestart }: GameControlsProps) {
  const { status, setStatus } = useGameStore();
  
  const isGameEnded = status === 'ended';
  const isGameWaiting = status === 'waiting';
  
  const handleGameAction = () => {
    // If game is waiting, just set status to running
    if (isGameWaiting) {
      setStatus('running');
      console.log('Starting game from waiting state');
      return;
    }
    
    // If ended or already running, do full restart
    onRestart();
    console.log('Restarting game');
  };
  
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={handleGameAction}
        className={`
          ${isGameEnded || isGameWaiting 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-yellow-600 hover:bg-yellow-700'
          } 
          text-white font-semibold py-2 px-4 rounded-lg transition-colors
        `}
      >
        {isGameEnded 
          ? 'Restart Race' 
          : isGameWaiting 
            ? 'Start Race' 
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