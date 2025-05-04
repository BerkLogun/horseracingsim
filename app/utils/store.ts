import { create } from 'zustand';
import { HorseEntity, CoinEntity, MapEntity, Vector2D } from '../game/types';
import { Horse } from '../game/entities/Horse';
import { Coin } from '../game/entities/Coin';
import { GameMap } from '../game/entities/Map';
import { Countdown } from '../game/entities/Countdown';
import { getMapById, getDefaultMapId, MapData } from './mapStorage';

// Map color codes to readable names
const colorNames: {[key: string]: string} = {
  '#E63946': 'Red',
  '#457B9D': 'Blue',
  '#2A9D8F': 'Teal',
  '#F4A261': 'Orange',
  '#8338EC': 'Purple',
  '#2B9348': 'Green',
  '#FFD700': 'Gold',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#FF4500': 'OrangeRed',
  '#9370DB': 'MediumPurple',
  '#32CD32': 'LimeGreen',
};

// Get a unique color that hasn't been used yet
const getUniqueColor = (usedColors: string[] = []) => {
  const colors = [
    '#E63946', // Red
    '#457B9D', // Blue
    '#2A9D8F', // Teal
    '#F4A261', // Orange
    '#8338EC', // Purple
    '#2B9348', // Green
    '#FFD700', // Gold
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF4500', // OrangeRed
    '#9370DB', // MediumPurple
    '#32CD32', // LimeGreen
  ];
  
  // Filter out already used colors
  const availableColors = colors.filter(color => !usedColors.includes(color));
  
  // If we've used all colors, return a random one
  if (availableColors.length === 0) {
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Return a random color from the available colors
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

// Game settings
const GAME_SETTINGS = {
  DEFAULT_HORSE_COUNT: 4,
  HORSE_SIZE: 0.02, // 2% of canvas size
  HORSE_SPEED: 0.2, // Increased speed for better visibility
  COIN_SIZE: 0.025, // 2.5% of canvas size
  GAME_DURATION: 60, // Game duration in seconds
  COUNTDOWN_SIZE: 0.05, // 5% of canvas size for the countdown (increased)
  COUNTDOWN_INITIAL: 5 // Start countdown from 10
};

// Starting area for horses - bottom left corner region
const HORSE_START_AREA = {
  center: { x: 0.15, y: 0.85 },
  radius: 0.05 // Small area for grouping horses
};

// Coin position - top right of the map (opposite to horse start)
const COIN_POSITION = { x: 0.85, y: 0.15 };

// Define map obstacles for our default race track
const DEFAULT_MAP_OBSTACLES = [
  // Center large obstacle
  {
    position: { x: 0.4, y: 0.4 },
    size: { x: 0.2, y: 0.2 }
  },
  // Top wall
  {
    position: { x: 0.3, y: 0.2 },
    size: { x: 0.4, y: 0.05 }
  },
  // Bottom wall
  {
    position: { x: 0.3, y: 0.75 },
    size: { x: 0.4, y: 0.05 }
  },
  // Left wall
  {
    position: { x: 0.2, y: 0.3 },
    size: { x: 0.05, y: 0.4 }
  },
  // Right wall
  {
    position: { x: 0.75, y: 0.3 },
    size: { x: 0.05, y: 0.4 }
  }
];

interface GameState {
  status: 'waiting' | 'running' | 'ended';
  winner: string | null;
  canvasSize: number;
  horses: HorseEntity[];
  coin: CoinEntity | null;
  map: MapEntity | null;
  gameTime: number; // Time elapsed in seconds
  countdown: Countdown | null;
  horseStartArea: { center: Vector2D; radius: number };
  coinPosition: Vector2D;
  currentMapId: string | null;
  
  // Actions
  setStatus: (status: 'waiting' | 'running' | 'ended') => void;
  setWinner: (horse: string | null) => void;
  setCanvasSize: (size: number) => void;
  initializeGame: (horseCount?: number) => void;
  updateGameEntities: (deltaTime: number) => void;
  restartGame: () => void;
  updateGameTime: (deltaTime: number) => void;
  startCountdown: () => void;
  
  // Map editor actions
  setMapObstacles: (obstacles: Array<{ position: Vector2D; size: Vector2D }>) => void;
  saveCustomMap: (
    obstacles: Array<{ position: Vector2D; size: Vector2D }>, 
    horseSpawn?: Vector2D | null, 
    coinSpawn?: Vector2D | null
  ) => void;
  loadCustomMap: () => { 
    obstacles: Array<{ position: Vector2D; size: Vector2D }>;
    horseSpawn?: Vector2D;
    coinSpawn?: Vector2D;
  } | null;
  setHorseStartPosition: (position: Vector2D) => void;
  setCoinPosition: (position: Vector2D) => void;
  loadMap: (mapData: MapData) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'waiting',
  winner: null,
  canvasSize: 0,
  horses: [],
  coin: null,
  map: null,
  gameTime: 0,
  countdown: null,
  horseStartArea: HORSE_START_AREA,
  coinPosition: COIN_POSITION,
  currentMapId: null,
  
  // Actions
  setStatus: (status) => set({ status }),
  setWinner: (horse) => set({ status: 'ended', winner: horse }),
  setCanvasSize: (size) => set({ canvasSize: size }),
  
  startCountdown: () => {
    const { map } = get();
    if (!map) return;
    
    // Create a countdown in the center of the map
    const countdownPosition = {
      x: (map.bounds.left + map.bounds.right) / 2,
      y: (map.bounds.top + map.bounds.bottom) / 2
    };
    
    const countdown = new Countdown(
      countdownPosition,
      GAME_SETTINGS.COUNTDOWN_SIZE,
      GAME_SETTINGS.COUNTDOWN_INITIAL
    );
    
    // Explicitly log and set the velocity to make sure it's moving
    countdown.velocity = { x: 0.3, y: 0.1 };
    console.log("Created new countdown with position:", countdownPosition, "and velocity:", countdown.velocity);
    
    // Set the game to waiting during countdown
    set({ 
      countdown,
      status: 'waiting'
    });
    
    // Start a timer to change game status to running after countdown completes
    setTimeout(() => {
      // Only change status if we're still in waiting state
      if (get().status === 'waiting') {
        set({ status: 'running' });
      }
    }, GAME_SETTINGS.COUNTDOWN_INITIAL * 1000 + 100); // Add a small buffer
  },
  
  initializeGame: (horseCount = GAME_SETTINGS.DEFAULT_HORSE_COUNT) => {
    // First check if there's a default map
    let mapObstacles = DEFAULT_MAP_OBSTACLES;
    let customHorseStartArea = get().horseStartArea;
    let customCoinPosition = get().coinPosition;
    let currentMapId = null;
    
    try {
      // Try to load the default map first
      const defaultMapId = getDefaultMapId();
      if (defaultMapId) {
        const mapData = getMapById(defaultMapId);
        if (mapData) {
          console.log('Using default map:', mapData.name);
          mapObstacles = mapData.obstacles;
          currentMapId = mapData.id;
          
          if (mapData.horseSpawn) {
            console.log('Using custom horse spawn position:', mapData.horseSpawn);
            customHorseStartArea = {
              center: mapData.horseSpawn,
              radius: HORSE_START_AREA.radius
            };
          }
          
          if (mapData.coinSpawn) {
            console.log('Using custom coin position:', mapData.coinSpawn);
            customCoinPosition = mapData.coinSpawn;
          }
        }
      } else {
        console.log('No default map found, using built-in map obstacles');
      }
    } catch (error) {
      console.error('Error loading default map, using built-in map obstacles:', error);
    }
    
    // Create a map with the specified obstacles
    const map = new GameMap(1, 1, mapObstacles);
    
    const horses: HorseEntity[] = [];
    const horseSpeed = GAME_SETTINGS.HORSE_SPEED;
    const horseStartArea = customHorseStartArea;
    
    const usedColors: string[] = [];
    
    // Create the specified number of horses
    for (let i = 0; i < horseCount; i++) {
      // Calculate different angles for each horse's initial position in the starting area
      const positionAngle = (i * Math.PI * 2) / horseCount;
      const positionRadius = Math.min(0.8 * horseStartArea.radius, 0.01 + (Math.random() * 0.01));
      
      const position = {
        x: horseStartArea.center.x + Math.cos(positionAngle) * positionRadius,
        y: horseStartArea.center.y + Math.sin(positionAngle) * positionRadius
      };
      
      // Calculate different angles for each horse's movement direction
      const velocityAngle = (i * Math.PI * 2) / horseCount;
      const velocity = {
        x: Math.cos(velocityAngle) * horseSpeed,
        y: Math.sin(velocityAngle) * horseSpeed
      };
      
      // Get a unique color for this horse
      const horseColor = getUniqueColor(usedColors);
      usedColors.push(horseColor);
      
      // Get the readable name for this color
      const horseName = colorNames[horseColor] || horseColor;
      
      console.log(`Creating Horse ${horseName} with speed ${horseSpeed.toFixed(2)}, angle: ${(velocityAngle * 180 / Math.PI).toFixed(0)}°, velocity:`, velocity);
      
      horses.push(
        new Horse(
          horseName,
          position,
          velocity,
          GAME_SETTINGS.HORSE_SIZE,
          horseColor
        )
      );
    }
    
    // Create a coin at the configured position
    const coinPosition = customCoinPosition;
    const coin = new Coin(
      coinPosition,
      GAME_SETTINGS.COIN_SIZE
    );
    
    set({
      horses,
      coin,
      map,
      winner: null,
      gameTime: 0,
      countdown: null,
      currentMapId
    });
  },
  
  updateGameEntities: (deltaTime) => {
    const { horses, coin, map, status, gameTime, countdown } = get();
    
    // Don't update if there's no map
    if (!map) return;
    
    // Update countdown if active
    if (countdown && countdown.active) {
      // Log for debugging
      
      countdown.update(deltaTime, map.bounds);
      
      // Create a new Countdown object to ensure state updates are detected
      const updatedCountdown = new Countdown(
        { ...countdown.position },
        countdown.size,
        countdown.countdownValue
      );
      
      // Copy over the other properties
      updatedCountdown.velocity = { ...countdown.velocity };
      updatedCountdown.active = countdown.active;
      updatedCountdown.timePerNumber = countdown.timePerNumber;
      updatedCountdown.elapsedTime = countdown.elapsedTime;
      updatedCountdown.pixelated = countdown.pixelated;
      
      // When countdown reaches 0, set game to running
      if (countdown.countdownValue <= 0) {
        updatedCountdown.active = false;
        set({ status: 'running', countdown: updatedCountdown });
      } else {
        // If countdown is still active, don't update other entities
        set({ countdown: updatedCountdown }); // Update countdown state with new instance
        return;
      }
    }
    
    // Don't update game entities if game is not running or there's no coin
    if (status !== 'running' || !coin) return;
    
    // Clamp deltaTime to avoid huge jumps
    const clampedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Update game time
    get().updateGameTime(clampedDeltaTime);
    
    // Check if time is up (no winner after GAME_DURATION seconds)
    if (gameTime >= GAME_SETTINGS.GAME_DURATION && status === 'running') {
      set({ status: 'ended', winner: 'Time up! No winner.' });
      return;
    }
    
    // Make a deep copy of horses to work with
    const updatedHorses = horses.map(horse => {
      // Create a new Horse with the same properties
      const updatedHorse = new Horse(
        horse.id,
        { ...horse.position },
        { ...horse.velocity },
        horse.size,
        horse.color
      );
      
      if (updatedHorse.trailPositions) {
        updatedHorse.trailPositions = [...horse.trailPositions];
      }
      
      if (typeof horse.collisionEffect === 'number') {
        updatedHorse.collisionEffect = horse.collisionEffect;
      }
      
      return updatedHorse;
    });
    
    // Update spatial grid with current entity positions
    // Only if the map has the spatial grid functionality
    if (map.updateEntityPositions) {
      // We pass the existing horses instead of updated horses to maintain 
      // correct references for collision detection this frame
      map.updateEntityPositions([...horses, coin]);
    }
    
    // Now update each horse's position and handle horse-to-horse collisions
    for (const horse of updatedHorses) {
      // Using updated horses for collision since they have the new positions
      horse.update(clampedDeltaTime, updatedHorses, map.bounds);
      
      // Check for collision with coin (win condition)
      if (coin && !coin.collected && horse.checkCollision(coin)) {
        coin.collected = true;
        // Set winner and change status to ended to stop the game
        set({ status: 'ended', winner: horse.id });
        return; // End the update immediately when we have a winner
      }
    }
    
    // Process collisions with map obstacles after all horse-to-horse interactions
    for (const horse of updatedHorses) {
      // Check for collision with map obstacles using the collision info method
      if (map.getCollisionInfo) {
        const collisionInfo = map.getCollisionInfo(horse);
        
        if (collisionInfo.collided) {
          // Get the collision normal and penetration depth
          const { normal, penetration } = collisionInfo;
          
          // Move the horse out of the obstacle
          horse.position.x += normal.x * penetration;
          horse.position.y += normal.y * penetration;
          
          // Calculate the dot product of velocity and normal
          const dotProduct = horse.velocity.x * normal.x + horse.velocity.y * normal.y;
          
          // Update the velocity to bounce off the obstacle (reflection formula)
          horse.velocity.x -= 2 * dotProduct * normal.x;
          horse.velocity.y -= 2 * dotProduct * normal.y;
          
          // Ensure velocity magnitude remains constant
          horse.normalizeVelocity();
          
          // Set collision effect for visual feedback
          if (typeof horse.collisionEffect === 'number') {
            horse.collisionEffect = 0.3; // Effect lasts for 0.3 seconds
          }
        }
      } else if (map.checkCollision(horse)) {
        // Fallback to old collision handling if getCollisionInfo is not available
        horse.velocity.x = -horse.velocity.x;
        horse.velocity.y = -horse.velocity.y;
        horse.normalizeVelocity();
      }
    }
    
    // Update the state with the new positions and velocities
    set({ horses: updatedHorses });
  },
  
  updateGameTime: (deltaTime) => {
    const { gameTime } = get();
    set({ gameTime: gameTime + deltaTime });
  },
  
  restartGame: () => {
    // When restarting, we want to preserve the current map and spawn points
    const { currentMapId } = get();
    
    // Reset winner state to null to clear any winner effects
    // Also reset the game time to 0
    set({ 
      winner: null,
      gameTime: 0
    });
    
    // If we have a current map ID, load it first
    if (currentMapId) {
      const mapData = getMapById(currentMapId);
      if (mapData) {
        console.log(`Restarting with map "${mapData.name}"`);
        
        // Use loadMap to apply the current map correctly
        get().loadMap(mapData);
        
        // Then start the countdown
        get().startCountdown();
        return;
      }
    }
    
    // Fallback to default behavior if no map ID or map not found
    console.log('Restarting with default or previously loaded map');
    get().initializeGame();
    get().startCountdown();
  },
  
  // Map editor actions
  setMapObstacles: (obstacles) => {
    const { map } = get();
    if (!map) return;
    
    // Create a new map with the same dimensions but updated obstacles
    const updatedMap = new GameMap(
      map.dimensions.width,
      map.dimensions.height,
      obstacles
    );
    
    console.log(`Applying ${obstacles.length} obstacles to map`);
    set({ map: updatedMap });
  },
  
  setHorseStartPosition: (position) => {
    // Update horse spawn position while keeping the radius the same
    const updatedHorseStartArea = {
      center: position,
      radius: get().horseStartArea.radius
    };
    
    console.log("Setting horse start position to:", position);
    set({ horseStartArea: updatedHorseStartArea });
  },
  
  setCoinPosition: (position) => {
    // Update coin position
    console.log("Setting coin position to:", position);
    set({ coinPosition: position });
  },
  
  saveCustomMap: (obstacles, horseSpawn, coinSpawn) => {
    try {
      const mapData = {
        obstacles,
        horseSpawn: horseSpawn || get().horseStartArea.center,
        coinSpawn: coinSpawn || get().coinPosition,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('custom_map', JSON.stringify(mapData));
      console.log('Map saved successfully with', obstacles.length, 'obstacles');
    } catch (error) {
      console.error('Failed to save map:', error);
    }
  },
  
  loadCustomMap: () => {
    try {
      const savedMap = localStorage.getItem('custom_map');
      if (savedMap) {
        const parsedData = JSON.parse(savedMap);
        console.log('Loaded map with', parsedData.obstacles?.length || 0, 'obstacles');
        return parsedData;
      }
      console.log('No saved map found');
      return null;
    } catch (error) {
      console.error('Failed to load map:', error);
      return null;
    }
  },
  
  // Load a specific map from our map storage
  loadMap: (mapData: MapData) => {
    if (!mapData || !mapData.obstacles) {
      console.error('Invalid map data:', mapData);
      return;
    }
    
    console.log(`Loading map "${mapData.name}" with ${mapData.obstacles.length} obstacles`);
    console.log('Horse spawn point:', mapData.horseSpawn);
    console.log('Coin spawn point:', mapData.coinSpawn);
    
    // Get the current map or create a new one if it doesn't exist
    const map = get().map;
    if (!map) {
      console.log('No map exists yet, initializing new map with custom data');
      // Initialize the game with default values but custom map data
      const horses: HorseEntity[] = [];
      
      // Use the horse spawn area from the map data or default
      const horseStartArea = mapData.horseSpawn ? {
        center: mapData.horseSpawn,
        radius: HORSE_START_AREA.radius
      } : HORSE_START_AREA;
      
      // Generate horses
      const usedColors: string[] = [];

      for (let i = 0; i < GAME_SETTINGS.DEFAULT_HORSE_COUNT; i++) {
        const speedVariation = 0.8 + (Math.random() * 0.4);
        const horseSpeed = GAME_SETTINGS.HORSE_SPEED * speedVariation;
        
        const positionAngle = Math.random() * Math.PI * 2;
        const positionRadius = Math.random() * horseStartArea.radius;
        
        const position = {
          x: horseStartArea.center.x + Math.cos(positionAngle) * positionRadius,
          y: horseStartArea.center.y + Math.sin(positionAngle) * positionRadius
        };
        
        const velocityAngle = (i * Math.PI * 2) / GAME_SETTINGS.DEFAULT_HORSE_COUNT;
        const velocity = {
          x: Math.cos(velocityAngle) * horseSpeed,
          y: Math.sin(velocityAngle) * horseSpeed
        };
        
        // Get a unique color for this horse
        const horseColor = getUniqueColor(usedColors);
        usedColors.push(horseColor);
        
        // Get the readable name for this color
        const horseName = colorNames[horseColor] || horseColor;
        
        horses.push(
          new Horse(
            horseName,
            position,
            velocity,
            GAME_SETTINGS.HORSE_SIZE,
            horseColor
          )
        );
      }
      
      // Create a coin at the configured position
      const coinPosition = mapData.coinSpawn || COIN_POSITION;
      const coin = new Coin(
        coinPosition,
        GAME_SETTINGS.COIN_SIZE
      );
      
      // Create a map with the loaded obstacles
      const newMap = new GameMap(1, 1, mapData.obstacles);
      
      // Update the game state
      set({ 
        map: newMap, 
        horses,
        coin,
        horseStartArea,
        coinPosition,
        currentMapId: mapData.id,
        winner: null,  // Reset winner state when loading a map
        status: 'waiting',  // Ensure game state is waiting
        gameTime: 0  // Reset game time
      });
      
      return;
    }
    
    // Update the map with the new obstacles if map exists
    const updatedMap = new GameMap(
      map.dimensions.width,
      map.dimensions.height,
      mapData.obstacles
    );
    
    // Update horse spawn area if provided
    let horseStartArea = get().horseStartArea;
    
    // We need to check explicitly for horseSpawn existence, not just truthy value
    // This is because we want to apply null/undefined values as well
    if (Object.prototype.hasOwnProperty.call(mapData, 'horseSpawn')) {
      if (mapData.horseSpawn) {
        console.log('Using custom horse spawn position from map:', mapData.horseSpawn);
        horseStartArea = {
          center: mapData.horseSpawn,
          radius: HORSE_START_AREA.radius
        };
      } else {
        console.log('Using default horse spawn position (spawn point was explicitly null/undefined)');
        horseStartArea = HORSE_START_AREA;
      }
    }
    
    // Update coin position if provided
    let coinPosition = get().coinPosition;
    
    // Similarly check explicitly for coinSpawn existence
    if (Object.prototype.hasOwnProperty.call(mapData, 'coinSpawn')) {
      if (mapData.coinSpawn) {
        console.log('Using custom coin position from map:', mapData.coinSpawn);
        coinPosition = mapData.coinSpawn;
      } else {
        console.log('Using default coin position (spawn point was explicitly null/undefined)');
        coinPosition = COIN_POSITION;
      }
    }
    
    // Get current horses to update their positions
    const horses = get().horses.map(horse => {
      // Create a copy of the horse
      const updatedHorse = new Horse(
        horse.id,
        { ...horse.position },
        { ...horse.velocity },
        horse.size,
        horse.color
      );
      
      // Reset horse position to the new spawn area
      const positionAngle = Math.random() * Math.PI * 2;
      const positionRadius = Math.random() * horseStartArea.radius;
      
      updatedHorse.position = {
        x: horseStartArea.center.x + Math.cos(positionAngle) * positionRadius,
        y: horseStartArea.center.y + Math.sin(positionAngle) * positionRadius
      };
      
      return updatedHorse;
    });
    
    // Update the coin if it exists
    let coin = get().coin;
    if (coin) {
      // Create a new coin at the updated position
      coin = new Coin(
        coinPosition,
        GAME_SETTINGS.COIN_SIZE
      );
    }
    
    // Update the game state
    set({ 
      map: updatedMap, 
      horseStartArea, 
      coinPosition,
      horses,
      coin,
      currentMapId: mapData.id,
      winner: null,  // Reset winner state when loading a map
      status: 'waiting',  // Ensure game state is waiting
      gameTime: 0  // Reset game time
    });
  },
})); 