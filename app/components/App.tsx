'use client';

import React, { useState, useEffect } from 'react';
import GameContainer from './GameContainer';
import StatusBar from './StatusBar';
import GameControls from './GameControls';
import MapCreator from './MapCreator';
import MapSelector from './MapSelector';
import StatsDisplay from './StatsDisplay';
import { useGameStore } from '../utils/store';
import { MapData, getMapById, getDefaultMapId } from '../utils/mapStorage';

export default function App() {
  const [mode, setMode] = useState<'game' | 'mapCreator'>('game');
  const { loadMap, map, loadGameStats } = useGameStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load game stats first thing when app starts
  useEffect(() => {
    loadGameStats();
    console.log('Loading initial game stats');
  }, [loadGameStats]);
  
  // Handle initial map loading
  useEffect(() => {
    // Don't initialize multiple times
    if (isInitialized || map) return;
    
    // Load game stats first to potentially get the last used map
    loadGameStats();
    
    const defaultMapId = getDefaultMapId();
    if (defaultMapId) {
      const mapData = getMapById(defaultMapId);
      if (mapData) {
        console.log('Loading default map on app start:', mapData.name);
        loadMap(mapData);
        setIsInitialized(true);
      }
    }
  }, [loadMap, isInitialized, map, loadGameStats]);
  
  const handleModeChange = (newMode: 'game' | 'mapCreator') => {
    setMode(newMode);
  };
  
  const handleSelectMap = (mapData: MapData) => {
    console.log(`Selected map: ${mapData.name}`);
    loadMap(mapData);
    setIsInitialized(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Main card containing game controls and status */}
      <div className="card">
        <StatusBar />
        
        <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <GameControls onModeChange={handleModeChange} />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <StatsDisplay />
            {mode === 'game' && <MapSelector onSelectMap={handleSelectMap} />}
          </div>
        </div>
      </div>
      
      {/* Game or Map Creator */}
      <div className="card p-0 overflow-hidden">
        {mode === 'game' ? (
          <GameContainer />
        ) : (
          <MapCreator />
        )}
      </div>
    </div>
  );
} 