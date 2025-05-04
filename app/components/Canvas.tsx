'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../utils/store';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Get game state from Zustand store
  const { 
    status, 
    canvasSize, 
    horses, 
    coin, 
    map, 
    initializeGame, 
    updateGameEntities,
    setStatus
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
      const winner = useGameStore.getState().winner;
      for (const horse of horses) {
        // Pass true for isWinner parameter if this horse is the winner
        const isWinner = status === 'ended' && winner === horse.id;
        horse.draw(ctx, canvasSize, isWinner);
      }
    }
  }, [status, canvasSize, horses, coin, map]);
  
  // Implement game loop
  useEffect(() => {
    // Only run animation loop when game is in running state
    if (status !== 'running') {
      // Make sure animation is canceled when game is not running
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = 0;
      }
      return;
    }
    
    // Debug output - this should appear in console when game starts running
    console.log('Starting game loop, horse count:', horses.length);
    horses.forEach((horse, i) => {
      console.log(`Horse ${i+1} velocity:`, horse.velocity.x, horse.velocity.y);
    });
    
    const gameLoop = (timestamp: number) => {
      // Calculate delta time (time since last frame)
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;
      
      // Update game entities
      updateGameEntities(deltaTime);
      
      // Check if the game has ended after the update
      const currentGameStatus = useGameStore.getState().status;
      
      // Only continue the animation loop if the game is still running
      if (currentGameStatus === 'running') {
        // Request next frame
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
      } else {
        // Game has ended, cancel the animation
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = 0;
        }
        
        // Force a re-render to immediately show the end game state
        // This ensures we see the winner state without waiting for React
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Redraw everything in the ended state
            const { horses, coin, map, winner } = useGameStore.getState();
            
            // Draw map
            if (map) {
              map.draw(ctx, canvasSize);
            }
            
            // Draw coin if not collected
            if (coin && !coin.collected) {
              coin.draw(ctx, canvasSize);
            }
            
            // Draw horses with winner effect
            for (const horse of horses) {
              const isWinner = winner === horse.id;
              horse.draw(ctx, canvasSize, isWinner);
            }
          }
        }
      }
    };
    
    // Make sure lastTimeRef is reset when starting a new game
    lastTimeRef.current = 0;
    
    // Start the game loop
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup function to cancel animation frame on unmount or status change
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = 0;
        lastTimeRef.current = 0;
      }
    };
  }, [status, updateGameEntities, horses]);
  
  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="block"
      onClick={() => {
        // Clicking the canvas starts the game if it's in waiting state
        if (status === 'waiting') {
          setStatus('running');
        }
      }}
    />
  );
} 