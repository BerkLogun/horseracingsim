'use client';

import React, { useRef, useEffect, useState } from 'react';
import Canvas from './Canvas';
import WinnerAnnouncement from './WinnerAnnouncement';
import { useGameStore } from '../utils/store';

export default function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { status, setCanvasSize, countdown } = useGameStore();
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  
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
  
  // Maintain square aspect ratio and update canvas size in the store
  useEffect(() => {
    const resizeCanvas = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      
      // Calculate the size of the square (min of container width and height)
      const size = Math.min(container.offsetWidth, window.innerHeight * 0.7);
      
      // Update the size in the store
      setCanvasSize(size);
    };
    
    // Initialize and handle resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [setCanvasSize]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full relative flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg"
    >
      <div className="relative overflow-hidden bg-white dark:bg-neutral-700 rounded-lg shadow-md">
        <Canvas />
        {!isCountdownActive && (status !== 'running' && status !== 'ended') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-800 px-6 py-4 rounded-lg shadow-lg text-center">
              <p className="text-xl font-bold">Ready to Race!</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">Click Start to begin</p>
            </div>
          </div>
        )}
        {status === 'ended' && <WinnerAnnouncement />}
      </div>
    </div>
  );
} 