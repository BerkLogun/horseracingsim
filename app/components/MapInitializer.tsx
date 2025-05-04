'use client';

import { useEffect, useState } from 'react';
import { initializeDefaultMaps } from '../utils/defaultMaps';

export default function MapInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run once
    if (initialized) return;
    
    const initialize = () => {
      try {
        // Make sure this runs in the browser where localStorage is available
        if (typeof window !== 'undefined') {
          console.log('Initializing default maps...');
          initializeDefaultMaps();
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing maps:', error);
      }
    };

    // Use setTimeout to delay map initialization and avoid blocking rendering
    const timer = setTimeout(() => {
      initialize();
    }, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [initialized]);
  
  // This component doesn't render anything
  return null;
} 