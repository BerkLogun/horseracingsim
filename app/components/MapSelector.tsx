'use client';

import React, { useEffect, useState } from 'react';
import { getAllMaps, getDefaultMapId, setDefaultMap, MapData } from '../utils/mapStorage';

interface MapSelectorProps {
  onSelectMap: (mapData: MapData) => void;
}

export default function MapSelector({ onSelectMap }: MapSelectorProps) {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Load maps on component mount
  useEffect(() => {
    // Only load maps once
    if (hasInitialized) return;
    
    const loadMaps = () => {
      try {
        const allMaps = getAllMaps();
        setMaps(allMaps);
        
        // If we don't have any maps, don't try to select one
        if (allMaps.length === 0) {
          return;
        }
        
        // Get the default map ID
        const defaultMapId = getDefaultMapId();
        if (defaultMapId && allMaps.some(map => map.id === defaultMapId)) {
          setSelectedMapId(defaultMapId);
          
          // Find and apply the default map
          const defaultMap = allMaps.find(map => map.id === defaultMapId);
          if (defaultMap) {
            onSelectMap(defaultMap);
          }
        } else if (allMaps.length > 0) {
          // If no default map is set, use the first map
          setSelectedMapId(allMaps[0].id);
          onSelectMap(allMaps[0]);
        }
        
        // Mark as initialized
        setHasInitialized(true);
      } catch (error) {
        console.error('Error loading maps:', error);
      }
    };
    
    loadMaps();
  }, [onSelectMap, hasInitialized]);
  
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mapId = e.target.value;
    if (mapId === selectedMapId) return; // Don't reselect the same map
    
    setSelectedMapId(mapId);
    
    // Find the selected map
    const selectedMap = maps.find(map => map.id === mapId);
    if (selectedMap) {
      // Set as default map
      setDefaultMap(mapId);
      
      // Apply the selected map
      onSelectMap(selectedMap);
    }
  };
  
  // If no maps are available, show a message
  if (maps.length === 0) {
    return (
      <div className="flex items-center text-sm text-gray-600">
        No custom maps available. Create one in Map Creator.
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="map-select" className="text-sm font-medium whitespace-nowrap">
        Select Map:
      </label>
      <select
        id="map-select"
        className="px-2 py-1 border rounded text-sm bg-white"
        value={selectedMapId || ''}
        onChange={handleMapChange}
      >
        {maps.map(map => (
          <option key={map.id} value={map.id}>
            {map.name}
          </option>
        ))}
      </select>
    </div>
  );
} 