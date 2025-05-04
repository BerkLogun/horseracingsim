'use client';

import React, { useRef, useEffect } from 'react';
import Canvas from './Canvas';
import WinnerAnnouncement from './WinnerAnnouncement';
import { useGameStore } from '../utils/store';

export default function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { status, setCanvasSize } = useGameStore();
  
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
      className="w-full relative flex items-center justify-center"
    >
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <Canvas />
        {status === 'waiting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <p className="text-xl font-bold">Click Start to begin the race</p>
          </div>
        )}
        {status === 'ended' && <WinnerAnnouncement />}
      </div>
    </div>
  );
} 