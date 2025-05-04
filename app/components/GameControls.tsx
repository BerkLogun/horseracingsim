'use client';

import React from 'react';

interface GameControlsProps {
  onRestart: () => void;
}

export default function GameControls({ onRestart }: GameControlsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={onRestart}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Start Race
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