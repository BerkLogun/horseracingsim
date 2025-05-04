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

  const getStatusColor = () => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-800';
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return winner && !winner.startsWith('Time up')
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`w-full p-3 rounded-lg font-semibold ${getStatusColor()}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg">{getStatusText()}</h2>
        <div className="text-lg font-mono">
          {formatTime(gameTime)}
        </div>
      </div>
    </div>
  );
} 