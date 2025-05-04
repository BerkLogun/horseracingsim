'use client';

import React, { useState, useEffect } from 'react';
import GameContainer from './GameContainer';
import StatusBar from './StatusBar';
import GameControls from './GameControls';
import MapCreator from './MapCreator';
import MapSelector from './MapSelector';
import { useGameStore } from '../utils/store';
import { MapData, getMapById, getDefaultMapId } from '../utils/mapStorage';

export default function App() {
  const [mode, setMode] = useState<'game' | 'mapCreator'>('game');
  const { loadMap, map } = useGameStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Handle initial map loading
  useEffect(() => {
    // Don't initialize multiple times
    if (isInitialized || map) return;
    
    const defaultMapId = getDefaultMapId();
    if (defaultMapId) {
      const mapData = getMapById(defaultMapId);
      if (mapData) {
        console.log('Loading default map on app start:', mapData.name);
        loadMap(mapData);
        setIsInitialized(true);
      }
    }
  }, [loadMap, isInitialized, map]);
  
  const handleModeChange = (newMode: 'game' | 'mapCreator') => {
    setMode(newMode);
  };
  
  const handleSelectMap = (mapData: MapData) => {
    console.log(`Selected map: ${mapData.name}`);
    loadMap(mapData);
    setIsInitialized(true);
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto gap-4">
      <StatusBar />
      <div className="w-full flex justify-between items-center">
        <GameControls onModeChange={handleModeChange} />
        {mode === 'game' && <MapSelector onSelectMap={handleSelectMap} />}
      </div>
      
      {mode === 'game' ? (
        <GameContainer />
      ) : (
        <MapCreator />
      )}
    </div>
  );
} 