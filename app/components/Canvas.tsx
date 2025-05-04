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
    countdown,
    initializeGame, 
    updateGameEntities,
    setStatus
  } = useGameStore();
  
  // Initialize game when component mounts only if there's no map already
  useEffect(() => {
    // Only initialize the game if there's no map yet
    if (!map) {
      console.log('No map found, initializing game with default map');
      initializeGame();
    } else {
      console.log('Map already exists, skipping initialization');
    }
  }, [initializeGame, map]);
  
  // Set up canvas context and draw all game elements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw map, coin, and horses regardless of status
    if (map) {
      map.draw(ctx, canvasSize);
    }
    
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
    
    // Draw countdown if active
    if (countdown && countdown.active) {
      countdown.draw(ctx, canvasSize);
    }
  }, [status, canvasSize, horses, coin, map, countdown]);
  
  // Implement game loop
  useEffect(() => {
    // Run animation loop for both running state and countdown
    if (status !== 'running' && !(status === 'waiting' && countdown?.active)) {
      // Make sure animation is canceled when game is not running or counting down
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = 0;
      }
      return;
    }
    
    // Debug output only when starting running state or countdown
    if (status === 'running') {
      console.log('Starting game loop, horse count:', horses.length);
      horses.forEach((horse, i) => {
        console.log(`Horse ${i+1} velocity:`, horse.velocity.x, horse.velocity.y);
      });
    } else if (countdown?.active) {
      // console.log('Starting countdown animation, position:', countdown.position);
    }
    
    const gameLoop = (timestamp: number) => {
      // Calculate delta time (time since last frame)
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;
      
      // Update game entities (includes countdown)
      updateGameEntities(deltaTime);
      
      // Check if the game has ended after the update
      const currentGameStatus = useGameStore.getState().status;
      const currentCountdown = useGameStore.getState().countdown;
      
      // Continue animation if running or countdown is active
      if (currentGameStatus === 'running' || (currentGameStatus === 'waiting' && currentCountdown?.active)) {
        // Request next frame
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
      } else {
        // Game has ended or countdown finished, cancel the animation
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
  }, [status, updateGameEntities, horses, countdown]);
  
  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="block"
      onClick={() => {
        // Clicking the canvas starts the game if it's in waiting state and no countdown is active
        if (status === 'waiting' && (!countdown || !countdown.active)) {
          setStatus('running');
        }
      }}
    />
  );
} 