import { saveMap, getAllMaps } from './mapStorage';

// Default map obstacles for our race track
const DEFAULT_TRACK_OBSTACLES = [
  // Center large obstacle
  { position: { x: 0.4, y: 0.4 }, size: { x: 0.2, y: 0.2 } },
  // Top wall
  { position: { x: 0.3, y: 0.2 }, size: { x: 0.4, y: 0.05 } },
  // Bottom wall
  { position: { x: 0.3, y: 0.75 }, size: { x: 0.4, y: 0.05 } },
  // Left wall
  { position: { x: 0.2, y: 0.3 }, size: { x: 0.05, y: 0.4 } },
  // Right wall
  { position: { x: 0.75, y: 0.3 }, size: { x: 0.05, y: 0.4 } }
];

// Spiral race track obstacles
const SPIRAL_TRACK_OBSTACLES = [
  // Outer walls
  { position: { x: 0.1, y: 0.1 }, size: { x: 0.8, y: 0.05 } },
  { position: { x: 0.1, y: 0.1 }, size: { x: 0.05, y: 0.8 } },
  { position: { x: 0.1, y: 0.85 }, size: { x: 0.8, y: 0.05 } },
  { position: { x: 0.85, y: 0.1 }, size: { x: 0.05, y: 0.8 } },
  
  // Spiral components
  { position: { x: 0.2, y: 0.2 }, size: { x: 0.6, y: 0.05 } },
  { position: { x: 0.2, y: 0.2 }, size: { x: 0.05, y: 0.6 } },
  { position: { x: 0.2, y: 0.75 }, size: { x: 0.5, y: 0.05 } },
  { position: { x: 0.7, y: 0.2 }, size: { x: 0.05, y: 0.5 } },
  
  { position: { x: 0.3, y: 0.3 }, size: { x: 0.4, y: 0.05 } },
  { position: { x: 0.3, y: 0.3 }, size: { x: 0.05, y: 0.4 } },
  { position: { x: 0.3, y: 0.65 }, size: { x: 0.3, y: 0.05 } },
  { position: { x: 0.6, y: 0.3 }, size: { x: 0.05, y: 0.3 } },
  
  { position: { x: 0.4, y: 0.4 }, size: { x: 0.15, y: 0.05 } },
  { position: { x: 0.4, y: 0.4 }, size: { x: 0.05, y: 0.15 } },
];

// Maze race track obstacles
const MAZE_TRACK_OBSTACLES = [
  // Outer walls
  { position: { x: 0.1, y: 0.1 }, size: { x: 0.8, y: 0.05 } },
  { position: { x: 0.1, y: 0.1 }, size: { x: 0.05, y: 0.8 } },
  { position: { x: 0.1, y: 0.85 }, size: { x: 0.8, y: 0.05 } },
  { position: { x: 0.85, y: 0.1 }, size: { x: 0.05, y: 0.8 } },
  
  // Maze components
  { position: { x: 0.25, y: 0.25 }, size: { x: 0.05, y: 0.3 } },
  { position: { x: 0.25, y: 0.25 }, size: { x: 0.3, y: 0.05 } },
  { position: { x: 0.4, y: 0.25 }, size: { x: 0.05, y: 0.2 } },
  { position: { x: 0.55, y: 0.25 }, size: { x: 0.05, y: 0.3 } },
  { position: { x: 0.55, y: 0.25 }, size: { x: 0.2, y: 0.05 } },
  { position: { x: 0.25, y: 0.4 }, size: { x: 0.15, y: 0.05 } },
  { position: { x: 0.7, y: 0.4 }, size: { x: 0.05, y: 0.3 } },
  { position: { x: 0.4, y: 0.55 }, size: { x: 0.3, y: 0.05 } },
  { position: { x: 0.4, y: 0.55 }, size: { x: 0.05, y: 0.2 } },
  { position: { x: 0.55, y: 0.7 }, size: { x: 0.2, y: 0.05 } },
  { position: { x: 0.25, y: 0.7 }, size: { x: 0.15, y: 0.05 } },
];

export const initializeDefaultMaps = () => {
  const existingMaps = getAllMaps();
  
  // Only add default maps if there are no maps yet
  if (existingMaps.length === 0) {
    console.log('Initializing default maps...');
    
    // Default Track
    saveMap({
      name: 'Default Track',
      obstacles: DEFAULT_TRACK_OBSTACLES,
      horseSpawn: { x: 0.15, y: 0.85 },
      coinSpawn: { x: 0.85, y: 0.15 }
    });
    
    // Spiral Track
    saveMap({
      name: 'Spiral Track',
      obstacles: SPIRAL_TRACK_OBSTACLES,
      horseSpawn: { x: 0.15, y: 0.75 },
      coinSpawn: { x: 0.5, y: 0.5 }
    });
    
    // Maze Track
    saveMap({
      name: 'Maze Track',
      obstacles: MAZE_TRACK_OBSTACLES,
      horseSpawn: { x: 0.15, y: 0.15 },
      coinSpawn: { x: 0.85, y: 0.85 }
    });
    
    console.log('Default maps created successfully');
  } else {
    console.log('Maps already exist, skipping default map creation');
  }
}; 