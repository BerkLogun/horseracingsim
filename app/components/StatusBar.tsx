'use client';

import React from 'react';
import { useGameStore } from '../utils/store';

export default function StatusBar() {
  const { status, winner } = useGameStore();
  
  const getStatusText = () => {
    switch (status) {
      case 'waiting':
        return 'Ready to Race';
      case 'running':
        return 'Race in Progress';
      case 'ended':
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
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`w-full p-3 rounded-lg font-semibold text-center ${getStatusColor()}`}>
      <h2 className="text-lg">{getStatusText()}</h2>
    </div>
  );
} 