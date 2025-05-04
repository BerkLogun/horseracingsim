'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../utils/store';

export default function WinnerAnnouncement() {
  const { winner, status, horses, canvasSize } = useGameStore();
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = React.useState(0);
  
  // Find the winning horse object based on the winner ID
  const winningHorse = React.useMemo(() => {
    if (!winner || status !== 'ended') return null;
    return horses.find(horse => horse.id === winner);
  }, [winner, status, horses]);
  
  // Animation effect
  useEffect(() => {
    if (status !== 'ended' || !winningHorse) {
      setAnimationProgress(0);
      return;
    }
    
    let startTime: number | null = null;
    const animationDuration = 1000; // 1 second animation
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [status, winningHorse]);
  
  if (status !== 'ended' || !winningHorse) {
    return null;
  }
  
  // Calculate animation values
  const scale = 1 + animationProgress * 0.5; // Horse grows to 1.5x size
  const translateX = -150 * animationProgress; // Move to the left
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
      <div className="relative flex items-center justify-center gap-4 p-6 bg-gray-800/80 rounded-xl">
        {/* Animated horse */}
        <div 
          className="relative transition-transform" 
          style={{
            transform: `translateX(${translateX}px) scale(${scale})`,
            width: `${winningHorse.size * canvasSize * 2}px`,
            height: `${winningHorse.size * canvasSize * 2}px`,
          }}
        >
          <div 
            className="absolute inset-0 rounded-full" 
            style={{ backgroundColor: winningHorse.color }}
          />
        </div>
        
        {/* Winner text */}
        <div className="text-center ml-4">
          <h2 className="text-3xl font-bold mb-2">WINNER!</h2>
          <p className="text-xl">{winningHorse.id}</p>
        </div>
      </div>
    </div>
  );
} 