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
    const animationDuration = 1200; // 1.2 second animation
    
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
  const scale = 1 + Math.sin(animationProgress * Math.PI) * 0.5; // Horse grows in a sine wave pattern
  const translateX = -150 * animationProgress; // Move to the left
  const rotation = animationProgress * 720; // Spin 2 full rotations
  
  // Check if it's a time-up no winner situation
  const isTimeUp = typeof winner === 'string' && winner.startsWith('Time up');
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-black/60 text-white">
      {isTimeUp ? (
        <div className="bg-red-900/80 p-8 rounded-xl shadow-2xl text-center">
          <div className="text-5xl mb-4">⏱️</div>
          <h2 className="text-3xl font-bold mb-2">TIME&apos;S UP!</h2>
          <p className="text-xl opacity-80">No horse reached the goal</p>
        </div>
      ) : (
        <div className="relative flex flex-col items-center justify-center gap-4 p-8 bg-black/70 rounded-xl shadow-2xl text-center">
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full opacity-70"
                style={{
                  backgroundColor: ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF69B4'][i % 5],
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `confetti ${1 + Math.random() * 2}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          
          {/* Trophy */}
          <div className="text-6xl mb-2">🏆</div>
          
          {/* Animated horse */}
          <div 
            className="relative transition-transform my-4" 
            style={{
              transform: `translateX(${translateX}px) scale(${scale}) rotate(${rotation}deg)`,
              width: `${winningHorse.size * canvasSize * 2}px`,
              height: `${winningHorse.size * canvasSize * 2}px`,
            }}
          >
            <div 
              className="absolute inset-0 rounded-full shadow-lg" 
              style={{ backgroundColor: winningHorse.color }}
            />
          </div>
          
          {/* Winner text */}
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-2 tracking-wider">WINNER!</h2>
            <div className="text-2xl bg-gradient-to-r from-yellow-300 to-amber-500 text-transparent bg-clip-text font-bold">
              {winningHorse.id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 