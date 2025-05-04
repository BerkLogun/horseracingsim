'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../utils/store';
import { Entity } from '../game/types';

// Interface for dirty rectangle tracking
interface DirtyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}


export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [startAnimation, setStartAnimation] = useState<{ active: boolean, progress: number } | null>(null);
  const [endAnimation, setEndAnimation] = useState<{ active: boolean, progress: number } | null>(null);
  
  // Track previous positions of entities for dirty rectangle determination
  const entityPositionsRef = useRef<Map<string, { x: number, y: number, size: number }>>(new Map());
  const dirtyRectsRef = useRef<DirtyRect[]>([]);
  
  // Used to track if we need a full redraw
  const needsFullRedrawRef = useRef(true);
  
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
  
  // Create a stable unique key for each entity to track its position changes
  const getEntityKey = (entity: Entity | null, prefix: string) => {
    if (!entity) return '';
    // Use a property guaranteed to be unique or generate a random ID
    return prefix + (Math.random().toString(36).substring(2, 9));
  };
  
  // Initialize game when component mounts only if there's no map already
  useEffect(() => {
    // Only initialize the game if there's no map yet
    if (!map) {
      console.log('No map found, initializing game with default map');
      initializeGame();
    } else {
      console.log('Map already exists, skipping initialization');
    }
    
    // Initial load always needs a full redraw
    needsFullRedrawRef.current = true;
  }, [initializeGame, map]);

  // Handle game status changes to trigger animations
  useEffect(() => {
    if (status === 'running' && !startAnimation) {
      // Start the begin game animation
      setStartAnimation({ active: true, progress: 0 });
      
      // Animation will last 1 second
      const timer = setTimeout(() => {
        setStartAnimation(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (status === 'ended' && !endAnimation) {
      // Start the end game animation
      setEndAnimation({ active: true, progress: 0 });
      
      // Animation will last 2 seconds
      const timer = setTimeout(() => {
        setEndAnimation(prev => prev ? { ...prev, active: false } : null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // Reset the end animation when game status changes to waiting or countdown starts
    if (status === 'waiting' || countdown?.active) {
      setEndAnimation(null);
    }
    
    // Status changes require full redraw
    needsFullRedrawRef.current = true;
  }, [status, startAnimation, endAnimation, countdown]);
  
  // Update animation progress
  useEffect(() => {
    if (!startAnimation?.active && !endAnimation?.active) return;
    
    let frameId: number | null = null;
    
    const updateAnimation = () => {
      if (startAnimation?.active) {
        setStartAnimation(prev => {
          if (!prev) return null;
          const newProgress = Math.min(1, prev.progress + 0.05);
          return { active: newProgress < 1, progress: newProgress };
        });
      }
      
      if (endAnimation?.active) {
        setEndAnimation(prev => {
          if (!prev) return null;
          const newProgress = Math.min(1, prev.progress + 0.03);
          return { active: newProgress < 1, progress: newProgress };
        });
      }
      
      frameId = requestAnimationFrame(updateAnimation);
    };
    
    frameId = requestAnimationFrame(updateAnimation);
    
    // Animations require full redraw
    needsFullRedrawRef.current = true;
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [startAnimation, endAnimation]);
  
  // Calculate dirty rectangles for efficient rendering
  const updateDirtyRects = () => {
    const dirtyRects: DirtyRect[] = [];
    const currentPositions = new Map<string, { x: number, y: number, size: number }>();
    const buffer = 0.01; // Buffer to ensure we capture the entire entity and any visual effects
    
    // Track horse positions and create dirty rects for moved horses
    horses.forEach(horse => {
      const key = getEntityKey(horse, 'horse-');
      const oldPos = entityPositionsRef.current.get(key);
      const pixelSize = horse.size * canvasSize;
      const pixelX = horse.position.x * canvasSize;
      const pixelY = horse.position.y * canvasSize;
      
      // Add buffer for effects like trails and collision animations
      const effectBuffer = horse.collisionEffect > 0 ? pixelSize * 3 : pixelSize * 1.5;
      
      // Current position with buffer
      currentPositions.set(key, {
        x: horse.position.x,
        y: horse.position.y,
        size: horse.size + buffer
      });
      
      if (oldPos) {
        // Create dirty rect for old position
        const oldPixelX = oldPos.x * canvasSize;
        const oldPixelY = oldPos.y * canvasSize;
        const oldPixelSize = oldPos.size * canvasSize;
        
        dirtyRects.push({
          x: oldPixelX - oldPixelSize - effectBuffer,
          y: oldPixelY - oldPixelSize - effectBuffer,
          width: oldPixelSize * 2 + effectBuffer * 2,
          height: oldPixelSize * 2 + effectBuffer * 2
        });
      }
      
      // Create dirty rect for new position
      dirtyRects.push({
        x: pixelX - pixelSize - effectBuffer,
        y: pixelY - pixelSize - effectBuffer,
        width: pixelSize * 2 + effectBuffer * 2,
        height: pixelSize * 2 + effectBuffer * 2
      });
    });
    
    // Track coin position
    if (coin) {
      const key = getEntityKey(coin, 'coin-');
      const oldPos = entityPositionsRef.current.get(key);
      const pixelSize = coin.size * canvasSize;
      const pixelX = coin.position.x * canvasSize;
      const pixelY = coin.position.y * canvasSize;
      
      currentPositions.set(key, {
        x: coin.position.x,
        y: coin.position.y,
        size: coin.size + buffer
      });
      
      if (oldPos && !coin.collected) {
        // Create dirty rect for old position
        const oldPixelX = oldPos.x * canvasSize;
        const oldPixelY = oldPos.y * canvasSize;
        const oldPixelSize = oldPos.size * canvasSize;
        
        dirtyRects.push({
          x: oldPixelX - oldPixelSize,
          y: oldPixelY - oldPixelSize,
          width: oldPixelSize * 2,
          height: oldPixelSize * 2
        });
      }
      
      // Create dirty rect for new position if not collected
      if (!coin.collected) {
        dirtyRects.push({
          x: pixelX - pixelSize,
          y: pixelY - pixelSize,
          width: pixelSize * 2,
          height: pixelSize * 2
        });
      }
    }
    
    // Track countdown position
    if (countdown && countdown.active) {
      const key = 'countdown';
      const oldPos = entityPositionsRef.current.get(key);
      const pixelSize = countdown.size * canvasSize;
      const pixelX = countdown.position.x * canvasSize;
      const pixelY = countdown.position.y * canvasSize;
      
      currentPositions.set(key, {
        x: countdown.position.x,
        y: countdown.position.y,
        size: countdown.size + buffer
      });
      
      if (oldPos) {
        // Create dirty rect for old position
        const oldPixelX = oldPos.x * canvasSize;
        const oldPixelY = oldPos.y * canvasSize;
        const oldPixelSize = oldPos.size * canvasSize;
        
        dirtyRects.push({
          x: oldPixelX - oldPixelSize,
          y: oldPixelY - oldPixelSize,
          width: oldPixelSize * 2,
          height: oldPixelSize * 2
        });
      }
      
      // Create dirty rect for new position
      dirtyRects.push({
        x: pixelX - pixelSize,
        y: pixelY - pixelSize,
        width: pixelSize * 2,
        height: pixelSize * 2
      });
    }
    
    // Update reference for the next frame
    entityPositionsRef.current = currentPositions;
    
    // Merge overlapping dirty rectangles to reduce draw calls
    return mergeOverlappingRects(dirtyRects);
  };
  
  // Helper function to merge overlapping rectangles
  const mergeOverlappingRects = (rects: DirtyRect[]): DirtyRect[] => {
    if (rects.length <= 1) return rects;
    
    let merged = true;
    
    while (merged) {
      merged = false;
      
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const r1 = rects[i];
          const r2 = rects[j];
          
          // Check if rectangles overlap
          if (
            r1.x <= r2.x + r2.width &&
            r1.x + r1.width >= r2.x &&
            r1.y <= r2.y + r2.height &&
            r1.y + r1.height >= r2.y
          ) {
            // Merge rectangles
            const newRect = {
              x: Math.min(r1.x, r2.x),
              y: Math.min(r1.y, r2.y),
              width: Math.max(r1.x + r1.width, r2.x + r2.width) - Math.min(r1.x, r2.x),
              height: Math.max(r1.y + r1.height, r2.y + r2.height) - Math.min(r1.y, r2.y)
            };
            
            // Replace r1 with the merged rectangle
            rects[i] = newRect;
            
            // Remove r2
            rects.splice(j, 1);
            
            merged = true;
            break;
          }
        }
        
        if (merged) break;
      }
    }
    
    return rects;
  };
  
  // Set up canvas context and draw all game elements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Determine if we need a full redraw or can use dirty rectangles
    const dirtyRects = needsFullRedrawRef.current ? null : updateDirtyRects();
    
    // If we have animations, special effects, or status changes, do a full redraw
    const needsFullRedraw = needsFullRedrawRef.current || 
                           startAnimation || 
                           endAnimation || 
                           status === 'ended' ||
                           !dirtyRects ||
                           dirtyRects.length > 10; // Too many dirty rects might be less efficient than a full redraw
    
    if (needsFullRedraw) {
      // Full redraw - clear everything
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw map
      if (map) {
        map.draw(ctx, canvasSize);
      }
      
      // Reset the full redraw flag
      needsFullRedrawRef.current = false;
    } else {
      // Partial redraw - only clear and redraw dirty rectangles
      for (const rect of dirtyRects) {
        // Clear the dirty rectangle
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
        
        // Set clipping region to the dirty rectangle for efficiency
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip();
        
        // Redraw map only within the clipping region
        if (map) {
          map.draw(ctx, canvasSize);
        }
        
        // Restore context to remove clipping
        ctx.restore();
      }
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
    
    // Draw countdown if active
    if (countdown && countdown.active) {
      countdown.draw(ctx, canvasSize);
    }
    
    // Draw start animation
    if (startAnimation) {
      drawStartAnimation(ctx, canvas.width, canvas.height, startAnimation.progress);
    }
    
    // Draw end animation
    if (endAnimation) {
      drawEndAnimation(ctx, canvas.width, canvas.height, endAnimation.progress, winner ? winner : null);
    }
    
    // Store the current dirty rects for the next frame
    dirtyRectsRef.current = dirtyRects || [];
    
  }, [status, canvasSize, horses, coin, map, countdown, startAnimation, endAnimation]);
  
  // Draw start animation
  const drawStartAnimation = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number
  ) => {
    // Save context
    ctx.save();
    
    // Overlay with fading transparency
    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * (1 - progress)})`;
    ctx.fillRect(0, 0, width, height);
    
    // Draw "GO!" text that zooms out
    const textSize = Math.min(width, height) * (0.3 + progress * 0.4);
    ctx.font = `bold ${textSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Pulsing color
    const r = Math.round(255 * Math.sin(progress * Math.PI));
    const g = Math.round(200 * Math.sin(progress * Math.PI));
    const b = 0;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    
    // Apply opacity that fades out
    ctx.globalAlpha = 1 - progress;
    
    // Draw the text
    ctx.fillText('GO!', width / 2, height / 2);
    
    // Restore context
    ctx.restore();
  };
  
  // Draw end animation
  const drawEndAnimation = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
    winnerId: string | null
  ) => {
    // Save context
    ctx.save();
    
    // Find winner horse
    const winner = horses.find(h => h.id === winnerId);
    
    // White flash that fades out
    const flashAlpha = Math.max(0, 0.7 - progress * 1.5);
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Draw confetti particles if we're past the initial flash
    if (progress > 0.2) {
      const confettiCount = 100;
      const confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
      
      for (let i = 0; i < confettiCount; i++) {
        const x = width * (0.1 + Math.random() * 0.8);
        const fallProgress = ((progress - 0.2) * 2 + i / confettiCount) % 1;
        const y = height * fallProgress;
        const size = Math.random() * 10 + 5;
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 1 - fallProgress;
        
        // Rotate for more natural look
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(fallProgress * Math.PI * 4);
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    
    // Draw winner text
    if (progress > 0.3) {
      const textAppearProgress = Math.min(1, (progress - 0.3) * 3);
      const textSize = Math.min(width, height) * 0.08;
      ctx.font = `bold ${textSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Scale and fade in
      ctx.globalAlpha = textAppearProgress;
      ctx.scale(0.5 + textAppearProgress * 0.5, 0.5 + textAppearProgress * 0.5);
      
      // Gold color for winner text
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      
      const text = winner ? `${winner.id.toUpperCase()} HORSE WINS!` : 'RACE COMPLETE!';
      
      // Draw shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Draw at the bottom center with scaling factored in
      ctx.fillText(text, (width / 2) / (0.5 + textAppearProgress * 0.5), (height * 0.85) / (0.5 + textAppearProgress * 0.5));
      ctx.strokeText(text, (width / 2) / (0.5 + textAppearProgress * 0.5), (height * 0.85) / (0.5 + textAppearProgress * 0.5));
    }
    
    // Restore context
    ctx.restore();
  };
  
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
    
    // Explicitly reset end animation when a new game or countdown starts
    if (endAnimation) {
      setEndAnimation(null);
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
    
    // When game state changes, we need a full redraw
    needsFullRedrawRef.current = true;
    
    // Cleanup function to cancel animation frame on unmount or status change
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = 0;
        lastTimeRef.current = 0;
      }
    };
  }, [status, updateGameEntities, horses, countdown, endAnimation]);
  
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