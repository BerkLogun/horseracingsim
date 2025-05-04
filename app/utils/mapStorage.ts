import { Vector2D } from '../game/types';

export interface MapData {
  id: string;
  name: string;
  obstacles: Array<{ position: Vector2D; size: Vector2D }>;
  horseSpawn?: Vector2D | null;
  coinSpawn?: Vector2D | null;
  timestamp: string;
}

// Key for the map list in localStorage
const MAPS_LIST_KEY = 'horse_racing_maps';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get all saved maps
export const getAllMaps = (): MapData[] => {
  if (!isBrowser) return [];
  
  try {
    const mapsJson = localStorage.getItem(MAPS_LIST_KEY);
    if (mapsJson) {
      return JSON.parse(mapsJson);
    }
    return [];
  } catch (error) {
    console.error('Failed to load maps list:', error);
    return [];
  }
};

// Save a map
export const saveMap = (mapData: Omit<MapData, 'id' | 'timestamp'>): MapData => {
  if (!isBrowser) {
    throw new Error('Cannot save map: localStorage is not available in this environment');
  }
  
  try {
    const maps = getAllMaps();
    
    // Generate a unique ID
    const id = `map_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Ensure horseSpawn and coinSpawn are explicitly included in the map data
    // even if they are null or undefined
    const newMap: MapData = {
      ...mapData,
      id,
      timestamp: new Date().toISOString(),
      horseSpawn: mapData.horseSpawn !== undefined ? mapData.horseSpawn : null,
      coinSpawn: mapData.coinSpawn !== undefined ? mapData.coinSpawn : null
    };
    
    console.log('Saving map with spawn points:', {
      horse: newMap.horseSpawn,
      coin: newMap.coinSpawn
    });
    
    // Check if a map with this name already exists
    const existingMapIndex = maps.findIndex(m => m.name === mapData.name);
    
    if (existingMapIndex >= 0) {
      // Update existing map
      maps[existingMapIndex] = {
        ...newMap,
        id: maps[existingMapIndex].id // Keep the same ID
      };
    } else {
      // Add new map
      maps.push(newMap);
    }
    
    // Save updated maps list
    localStorage.setItem(MAPS_LIST_KEY, JSON.stringify(maps));
    
    console.log(`Map "${mapData.name}" saved successfully`);
    return newMap;
  } catch (error) {
    console.error('Failed to save map:', error);
    throw error;
  }
};

// Delete a map
export const deleteMap = (mapId: string): boolean => {
  if (!isBrowser) return false;
  
  try {
    const maps = getAllMaps();
    const updatedMaps = maps.filter(map => map.id !== mapId);
    
    if (updatedMaps.length === maps.length) {
      console.warn(`Map with ID ${mapId} not found`);
      return false;
    }
    
    localStorage.setItem(MAPS_LIST_KEY, JSON.stringify(updatedMaps));
    console.log(`Map with ID ${mapId} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Failed to delete map:', error);
    return false;
  }
};

// Get a map by ID
export const getMapById = (mapId: string): MapData | null => {
  if (!isBrowser) return null;
  
  try {
    const maps = getAllMaps();
    const map = maps.find(map => map.id === mapId);
    return map || null;
  } catch (error) {
    console.error('Failed to get map:', error);
    return null;
  }
};

// Set the default map (the one that will be loaded automatically when the game starts)
export const setDefaultMap = (mapId: string): boolean => {
  if (!isBrowser) return false;
  
  try {
    localStorage.setItem('default_map_id', mapId);
    return true;
  } catch (error) {
    console.error('Failed to set default map:', error);
    return false;
  }
};

// Get the default map ID
export const getDefaultMapId = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem('default_map_id');
}; 