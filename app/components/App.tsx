'use client';

import React from 'react';
import GameContainer from './GameContainer';
import StatusBar from './StatusBar';
import GameControls from './GameControls';
import { useGameStore } from '../utils/store';

export default function App() {
  const { restartGame } = useGameStore();
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto gap-4">
      <StatusBar />
      <GameContainer />
      <GameControls onRestart={restartGame} />
    </div>
  );
} 