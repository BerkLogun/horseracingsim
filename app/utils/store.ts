import { create } from 'zustand';
import { HorseEntity, CoinEntity, MapEntity, Vector2D } from '../game/types';
import { Horse } from '../game/entities/Horse';
import { Coin } from '../game/entities/Coin';
import { GameMap } from '../game/entities/Map';

// Generate a random color for horses
const getRandomColor = () => {
  const colors = [
    '#E63946', // Red
    '#457B9D', // Blue
    '#2A9D8F', // Teal
    '#F4A261', // Orange
    '#8338EC', // Purple
    '#2B9348', // Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate a random position within the map bounds
const getRandomPosition = (mapBounds: { left: number; right: number; top: number; bottom: number }, size: number): Vector2D => {
  return {
    x: Math.random() * (mapBounds.right - mapBounds.left - size * 2) + mapBounds.left + size,
    y: Math.random() * (mapBounds.bottom - mapBounds.top - size * 2) + mapBounds.top + size,
  };
};

// Generate a random velocity with constant magnitude
const getRandomVelocity = (speed: number): Vector2D => {
  const angle = Math.random() * Math.PI * 2; // Random angle in radians
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
};

interface GameState {
  status: 'waiting' | 'running' | 'ended';
  winner: string | null;
  canvasSize: number;
  horses: HorseEntity[];
  coin: CoinEntity | null;
  map: MapEntity | null;
  
  // Actions
  setStatus: (status: 'waiting' | 'running' | 'ended') => void;
  setWinner: (horse: string | null) => void;
  setCanvasSize: (size: number) => void;
  initializeGame: (horseCount?: number) => void;
  updateGameEntities: (deltaTime: number) => void;
  restartGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'waiting',
  winner: null,
  canvasSize: 0,
  horses: [],
  coin: null,
  map: null,
  
  // Actions
  setStatus: (status) => set({ status }),
  setWinner: (horse) => set({ status: 'ended', winner: horse }),
  setCanvasSize: (size) => set({ canvasSize: size }),
  
  initializeGame: (horseCount = 4) => {
    // Create the map
    const map = new GameMap(1, 1, [
      // Add some obstacles (can be customized later)
      {
        position: { x: 0.3, y: 0.3 },
        size: { x: 0.1, y: 0.1 }
      },
      {
        position: { x: 0.6, y: 0.6 },
        size: { x: 0.1, y: 0.1 }
      }
    ]);
    
    // Create horses with random positions and velocities
    const horses: HorseEntity[] = [];
    const horseSize = 0.02; // 2% of canvas size
    const speed = 0.1; // Constant speed for all horses
    
    for (let i = 0; i < horseCount; i++) {
      horses.push(
        new Horse(
          `Horse ${i + 1}`,
          getRandomPosition(map.bounds, horseSize),
          getRandomVelocity(speed),
          horseSize,
          getRandomColor()
        )
      );
    }
    
    // Create a coin at a random position
    const coin = new Coin(
      getRandomPosition(map.bounds, 0.025),
      0.025 // 2.5% of canvas size
    );
    
    set({
      horses,
      coin,
      map,
      winner: null,
    });
  },
  
  updateGameEntities: (deltaTime) => {
    const { horses, coin, map, status } = get();
    
    // Don't update if game is not running
    if (status !== 'running' || !map || !coin) return;
    
    // Update each horse
    horses.forEach(horse => {
      horse.update(deltaTime, horses, map.bounds);
      
      // Check for collision with coin
      if (coin && !coin.collected && horse.checkCollision(coin)) {
        coin.collected = true;
        set({ winner: horse.id });
      }
      
      // Check for collision with map obstacles
      if (map.checkCollision(horse)) {
        // Simplified bounce - just reverse velocity
        horse.velocity.x = -horse.velocity.x;
        horse.velocity.y = -horse.velocity.y;
      }
    });
  },
  
  restartGame: () => {
    const state = get();
    state.initializeGame();
    set({ status: 'running', winner: null });
  },
})); 