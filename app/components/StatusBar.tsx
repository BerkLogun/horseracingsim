'use client';

import React from 'react';
import { useGameStore } from '../utils/store';

export default function StatusBar() {
  const { status, winner, gameTime } = useGameStore();
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'waiting':
        return 'Ready to Race';
      case 'running':
        return 'Race in Progress';
      case 'ended':
        if (typeof winner === 'string' && winner.startsWith('Time up')) {
          return 'Time Up! No Winner';
        }
        return winner ? `Winner: ${winner}` : 'Race Ended';
      default:
        return 'Horse Racing Simulation';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'waiting':
        return '🔄';
      case 'running':
        return '🏃';
      case 'ended':
        return winner && !winner.startsWith('Time up') ? '🏆' : '⏱️';
      default:
        return '🏇';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'running':
        return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'ended':
        return winner && !winner.startsWith('Time up')
          ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  // Add pulse animation to running status
  const getAnimationClass = () => {
    return status === 'running' ? 'animate-pulse' : '';
  };

  return (
    <div className={`rounded-lg font-semibold border ${getStatusColor()} ${getAnimationClass()}`}>
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="status icon">
            {getStatusIcon()}
          </span>
          <h2 className="text-lg font-bold">{getStatusText()}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm uppercase tracking-wider opacity-80">Time</span>
          <div className="text-lg font-mono bg-white/40 dark:bg-black/40 px-3 py-1 rounded">
            {formatTime(gameTime)}
          </div>
        </div>
      </div>
    </div>
  );
} 