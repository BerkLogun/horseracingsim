import { create } from 'zustand';
import { HorseEntity, CoinEntity, MapEntity, Vector2D } from '../game/types';
import { Horse } from '../game/entities/Horse';
import { Coin } from '../game/entities/Coin';
import { GameMap } from '../game/entities/Map';
import { Countdown } from '../game/entities/Countdown';
import { getMapById, getDefaultMapId, MapData } from './mapStorage';

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

// Game settings
const GAME_SETTINGS = {
  DEFAULT_HORSE_COUNT: 4,
  HORSE_SIZE: 0.02, // 2% of canvas size
  HORSE_SPEED: 0.2, // Increased speed for better visibility
  COIN_SIZE: 0.025, // 2.5% of canvas size
  GAME_DURATION: 60, // Game duration in seconds
  COUNTDOWN_SIZE: 0.05, // 5% of canvas size for the countdown (increased)
  COUNTDOWN_INITIAL: 10 // Start countdown from 10
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
        // If no default map is set, try the old custom_map from localStorage for backward compatibility
        const savedMap = localStorage.getItem('custom_map');
        if (savedMap) {
          const parsedData = JSON.parse(savedMap);
          console.log('Found legacy custom map with', parsedData.obstacles?.length || 0, 'obstacles');
          
          if (parsedData.obstacles && Array.isArray(parsedData.obstacles)) {
            console.log('Using legacy custom map obstacles');
            mapObstacles = parsedData.obstacles;
          }
          
          if (parsedData.horseSpawn) {
            console.log('Using legacy custom horse spawn position:', parsedData.horseSpawn);
            customHorseStartArea = {
              center: parsedData.horseSpawn,
              radius: HORSE_START_AREA.radius
            };
          }
          
          if (parsedData.coinSpawn) {
            console.log('Using legacy custom coin position:', parsedData.coinSpawn);
            customCoinPosition = parsedData.coinSpawn;
          }
        }
      }
    } catch (error) {
      console.error('Error loading map:', error);
    }

    // Create the map with the obstacles (either custom or default)
    const map = new GameMap(1, 1, mapObstacles);
    
    // Create horses with positions in a small group, each with different directions
    const horses: HorseEntity[] = [];
    
    // Use the horse spawn area (either custom or default)
    const horseStartArea = customHorseStartArea;
    
    for (let i = 0; i < horseCount; i++) {
      // Add some variation to horse speeds (±20% of base speed)
      const speedVariation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
      const horseSpeed = GAME_SETTINGS.HORSE_SPEED * speedVariation;
      
      // Calculate different angles for each horse, both for position and velocity
      const positionAngle = Math.random() * Math.PI * 2;
      const positionRadius = Math.random() * horseStartArea.radius;
      
      // Position horses in a small grouped area around the configured spawn point
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
      
      console.log(`Creating Horse ${i+1} with speed ${horseSpeed.toFixed(2)}, angle: ${(velocityAngle * 180 / Math.PI).toFixed(0)}°, velocity:`, velocity);
      
      horses.push(
        new Horse(
          `Horse ${i + 1}`,
          position,
          velocity,
          GAME_SETTINGS.HORSE_SIZE,
          getRandomColor()
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
      
      // Apply the autonomous movement physics update
      updatedHorse.update(clampedDeltaTime, horses, map.bounds);
      
      return updatedHorse;
    });
    
    // Now process collisions and win condition
    for (let i = 0; i < updatedHorses.length; i++) {
      const horse = updatedHorses[i];
      
      // Check for collision with coin (win condition)
      if (coin && !coin.collected && horse.checkCollision(coin)) {
        coin.collected = true;
        // Set winner and change status to ended to stop the game
        set({ status: 'ended', winner: horse.id });
        return; // End the update immediately when we have a winner
      }
      
      // Check for collision with map obstacles using the new collision info method
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
        }
      } else if (map.checkCollision(horse)) {
        // Fallback to old collision handling if getCollisionInfo is not available
        horse.velocity.x = -horse.velocity.x;
        horse.velocity.y = -horse.velocity.y;
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
        
        horses.push(
          new Horse(
            `Horse ${i + 1}`,
            position,
            velocity,
            GAME_SETTINGS.HORSE_SIZE,
            getRandomColor()
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
        currentMapId: mapData.id
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
      currentMapId: mapData.id
    });
  },
})); 