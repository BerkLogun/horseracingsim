'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../utils/store';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>(0);
  
  // Get game state from Zustand store
  const { 
    status, 
    canvasSize, 
    horses, 
    coin, 
    map, 
    initializeGame, 
    updateGameEntities 
  } = useGameStore();
  
  // Initialize game when component mounts
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  // Set up canvas context and draw all game elements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (status === 'running' || status === 'ended') {
      // Draw map
      if (map) {
        map.draw(ctx, canvasSize);
      }
      
      // Draw coin
      if (coin && !coin.collected) {
        coin.draw(ctx, canvasSize);
      }
      
      // Draw horses
      for (const horse of horses) {
        horse.draw(ctx, canvasSize);
      }
    }
  }, [status, canvasSize, horses, coin, map]);
  
  // Implement game loop
  useEffect(() => {
    if (status !== 'running') return;
    
    let lastTime = 0;
    
    const gameLoop = (timestamp: number) => {
      // Calculate delta time (time since last frame)
      const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0;
      lastTime = timestamp;
      
      // Update game entities
      updateGameEntities(deltaTime);
      
      // Request next frame
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup function to cancel animation frame on unmount or status change
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [status, updateGameEntities]);
  
  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="block"
    />
  );
} 