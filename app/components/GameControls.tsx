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

  const getActionButtonText = () => {
    if (status === 'waiting') {
      return isCountdownActive ? `Starting in ${countdownValue}...` : 'Start Race';
    } else if (status === 'running') {
      return 'Reset';
    } else {
      return 'New Race';
    }
  };

  const getActionButtonIcon = () => {
    if (status === 'waiting') {
      return isCountdownActive ? '🔄' : '🚩';
    } else if (status === 'running') {
      return '🔄';
    } else {
      return '🎲';
    }
  };
  
  const getActionButtonClass = () => {
    if (status === 'waiting') {
      return isCountdownActive 
        ? 'bg-blue-400 hover:bg-blue-500 opacity-70' 
        : 'bg-green-500 hover:bg-green-600';
    } else if (status === 'running') {
      return 'bg-yellow-500 hover:bg-yellow-600';
    } else {
      return 'bg-purple-500 hover:bg-purple-600';
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <button
        className={`btn flex items-center gap-2 ${getActionButtonClass()} text-white min-w-[120px] ${isCountdownActive ? 'animate-pulse' : ''}`}
        disabled={isCountdownActive}
        onClick={() => {
          if (status === 'ended') {
            restartGame();
          } else {
            startCountdown();
          }
        }}
      >
        <span>{getActionButtonIcon()}</span>
        <span>{getActionButtonText()}</span>
      </button>
      
      <button
        className="btn btn-secondary flex items-center gap-2"
        onClick={handleModeToggle}
      >
        <span>{mode === 'game' ? '🖌️' : '🏇'}</span>
        <span>{mode === 'game' ? 'Map Creator' : 'Race Mode'}</span>
      </button>
    </div>
  );
} 