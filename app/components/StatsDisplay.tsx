'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../utils/store';
import { resetGameStats } from '../utils/gameStorage';

export default function StatsDisplay() {
  const { gameStats, loadGameStats } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Ensure stats are loaded when the component mounts
  useEffect(() => {
    loadGameStats();
  }, [loadGameStats]);
  
  // Also reload stats when status changes or when this component opens
  useEffect(() => {
    if (isOpen) {
      loadGameStats();
    }
  }, [isOpen, loadGameStats]);
  
  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset all game statistics?')) {
      resetGameStats();
      // Reload stats in store
      loadGameStats();
    }
  };
  
  // Sort horses by win count (descending)
  const sortedHorses = Object.entries(gameStats.wins)
    .sort(([, winsA], [, winsB]) => winsB - winsA);
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center gap-1"
        title="View race statistics"
      >
        <span>📊</span>
        <span>Stats</span>
        {gameStats.gamesPlayed > 0 && (
          <span className="bg-white text-blue-800 text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
            {gameStats.gamesPlayed}
          </span>
        )}
      </button>
    );
  }
  
  return (
    <div className="absolute top-0 right-0 m-4 card bg-white dark:bg-neutral-800 z-50 w-full max-w-xs border border-neutral-200 dark:border-neutral-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span>Game Statistics</span>
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Close stats"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-700 p-2 rounded-md">
          <span className="text-sm font-medium">Games Played</span>
          <span className="text-lg font-bold">{gameStats.gamesPlayed}</span>
        </div>
      </div>
      
      {sortedHorses.length > 0 ? (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-1">
            <span className="text-sm">🏆</span>
            <span>Horse Wins</span>
          </h4>
          <ul className="space-y-1 mb-3">
            {sortedHorses.map(([horseName, wins], index) => (
              <li key={horseName} className={`flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
                <div className="flex items-center gap-2">
                  {index === 0 && <span className="text-lg">👑</span>}
                  <span 
                    className="w-3 h-3 rounded-full inline-block" 
                    style={{ backgroundColor: horseName }} 
                  />
                  <span className="font-medium">{horseName}</span>
                </div>
                <span className="font-bold">{wins}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="py-4 text-center text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-md">
          <p className="text-sm">No horse has won a race yet</p>
          <p className="mt-1 text-xs">Complete a race to see stats</p>
        </div>
      )}
      
      <div className="mt-4 text-right">
        <button
          onClick={handleResetStats}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs transition-colors"
        >
          Reset Statistics
        </button>
      </div>
    </div>
  );
} 