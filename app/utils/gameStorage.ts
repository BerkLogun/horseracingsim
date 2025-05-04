// Structure for persisted game statistics
export interface GameStats {
  wins: Record<string, number>; // Maps horse names/colors to win counts
  gamesPlayed: number;
  lastPlayed: string; // ISO date string
  currentMapId: string | null;
}

// Key for game stats in localStorage
const GAME_STATS_KEY = 'horse_racing_stats';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize empty stats
const defaultStats: GameStats = {
  wins: {},
  gamesPlayed: 0,
  lastPlayed: new Date().toISOString(),
  currentMapId: null
};

// Get saved game stats
export const getGameStats = (): GameStats => {
  if (!isBrowser) return { ...defaultStats };
  
  try {
    const statsJson = localStorage.getItem(GAME_STATS_KEY);
    if (statsJson) {
      return JSON.parse(statsJson);
    }
    return { ...defaultStats };
  } catch (error) {
    console.error('Failed to load game stats:', error);
    return { ...defaultStats };
  }
};

// Save game stats
export const saveGameStats = (stats: GameStats): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
    console.log('Game stats saved successfully');
  } catch (error) {
    console.error('Failed to save game stats:', error);
  }
};

// Record a win for a specific horse
export const recordWin = (horseName: string): void => {
  if (!isBrowser) return;
  
  try {
    const stats = getGameStats();
    
    // Increment wins for this horse
    stats.wins[horseName] = (stats.wins[horseName] || 0) + 1;
    
    // Increment games played
    stats.gamesPlayed += 1;
    
    // Update last played time
    stats.lastPlayed = new Date().toISOString();
    
    // Save updated stats
    saveGameStats(stats);
    
    console.log(`Win recorded for ${horseName}`);
  } catch (error) {
    console.error('Failed to record win:', error);
  }
};

// Record game played (without a winner, e.g. timeout)
export const recordGamePlayed = (mapId: string | null): void => {
  if (!isBrowser) return;
  
  try {
    const stats = getGameStats();
    
    // Increment games played
    stats.gamesPlayed += 1;
    
    // Update last played time
    stats.lastPlayed = new Date().toISOString();
    
    // Update current map ID
    stats.currentMapId = mapId;
    
    // Save updated stats
    saveGameStats(stats);
    
    console.log(`Game played recorded with map ID: ${mapId}`);
  } catch (error) {
    console.error('Failed to record game played:', error);
  }
};

// Get the number of wins for a specific horse
export const getHorseWins = (horseName: string): number => {
  const stats = getGameStats();
  return stats.wins[horseName] || 0;
};

// Reset all game stats
export const resetGameStats = (): void => {
  if (!isBrowser) return;
  
  try {
    saveGameStats({ ...defaultStats });
    console.log('Game stats reset successfully');
  } catch (error) {
    console.error('Failed to reset game stats:', error);
  }
}; 