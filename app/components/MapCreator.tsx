'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../utils/store';
import { Vector2D } from '../game/types';
import { saveMap, getAllMaps, deleteMap, MapData } from '../utils/mapStorage';

interface Tool {
  name: 'draw' | 'erase' | 'free' | 'fill' | 'horseSpawn' | 'coinSpawn';
  size: number;
}

interface DrawingPoint {
  x: number;
  y: number;
  timestamp: number;
}

export default function MapCreator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>({ name: 'draw', size: 0.03 });
  const [obstacles, setObstacles] = useState<Array<{ position: Vector2D; size: Vector2D }>>([]);
  const [pendingObstacle, setPendingObstacle] = useState<{ start: Vector2D | null; current: Vector2D | null }>({
    start: null,
    current: null,
  });
  const [mapName, setMapName] = useState<string>('custom_map');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drawingPoints, setDrawingPoints] = useState<DrawingPoint[]>([]);
  const [lastBatchTime, setLastBatchTime] = useState<number>(0);
  const pointBatchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // New state for spawn points
  const [horseSpawnPoint, setHorseSpawnPoint] = useState<Vector2D | null>(null);
  const [coinSpawnPoint, setCoinSpawnPoint] = useState<Vector2D | null>(null);

  const { 
    canvasSize, 
    map,
    setMapObstacles,
    saveCustomMap,
    setHorseStartPosition,
    setCoinPosition
  } = useGameStore();

  const [maps, setMaps] = useState<MapData[]>([]);

  // Initialize obstacles from current map when component mounts
  useEffect(() => {
    if (map) {
      console.log("Map loaded in MapCreator:", map);
      console.log("Initializing obstacles from map:", map.obstacles.length);
      setObstacles([...map.obstacles]);
      
      // Initialize spawn points if available from the game store
      const gameStore = useGameStore.getState();
      if (gameStore.horseStartArea) {
        console.log("Setting initial horse spawn from store:", gameStore.horseStartArea.center);
        setHorseSpawnPoint(gameStore.horseStartArea.center);
      }
      
      if (gameStore.coinPosition) {
        console.log("Setting initial coin position from store:", gameStore.coinPosition);
        setCoinSpawnPoint(gameStore.coinPosition);
      }
    }
  }, [map]);
  
  // Additional useEffect to debug obstacles
  useEffect(() => {
    console.log(`Current obstacle count: ${obstacles.length}`);
  }, [obstacles]);

  // Load saved maps
  useEffect(() => {
    setMaps(getAllMaps());
  }, []);
  
  // Batch drawing points into rectangles
  const batchDrawingPoints = (force: boolean = false) => {
    const currentTime = Date.now();
    // Only batch if there are enough points or if forced
    if (drawingPoints.length < 2 && !force) return;
    
    // Don't batch too frequently unless forced
    if (!force && currentTime - lastBatchTime < 100) return;
    
    // Group nearby points
    const processedPoints: { [key: string]: DrawingPoint[] } = {};
    
    drawingPoints.forEach(point => {
      // Round coordinates to create grid cells
      const gridSize = tool.size * 0.8; // Slightly smaller than brush for overlap
      const gridX = Math.floor(point.x / gridSize);
      const gridY = Math.floor(point.y / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!processedPoints[key]) {
        processedPoints[key] = [];
      }
      processedPoints[key].push(point);
    });
    
    // Create rectangles from grouped points
    const keys = Object.keys(processedPoints);
    if (keys.length === 0) return;
    
    // Convert groups into obstacles
    const newObstacles = keys.map(key => {
      const gridSize = tool.size * 0.8;
      
      // Get grid coordinates
      const [gridX, gridY] = key.split(',').map(Number);
      
      // Create a rectangle at this grid cell
      return {
        position: {
          x: gridX * gridSize,
          y: gridY * gridSize
        },
        size: {
          x: gridSize,
          y: gridSize
        }
      };
    });
    
    // Add new obstacles to the list
    setObstacles(prev => [...prev, ...newObstacles]);
    
    // Clear the points that have been processed
    setDrawingPoints([]);
    setLastBatchTime(currentTime);
  };
  
  // Set up automatic batching on component mount and cleanup
  useEffect(() => {
    // Set up periodic batching of drawing points
    pointBatchIntervalRef.current = setInterval(() => {
      if (isDrawing && tool.name === 'free' && drawingPoints.length > 0) {
        batchDrawingPoints();
      }
    }, 100);
    
    return () => {
      if (pointBatchIntervalRef.current) {
        clearInterval(pointBatchIntervalRef.current);
      }
    };
  }, [isDrawing, tool.name, drawingPoints]);
  
  // Flood fill algorithm
  const floodFill = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    
    console.log("Starting flood fill at", x, y);
    
    // Size of each cell in our grid (smaller for better resolution)
    const gridSize = 0.01;
    
    // Create a grid to represent the map
    const gridWidth = Math.ceil(1 / gridSize);
    const gridHeight = Math.ceil(1 / gridSize);
    const grid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(false));
    
    // Mark all obstacle positions as filled in our grid
    obstacles.forEach(obstacle => {
      const startX = Math.floor(obstacle.position.x / gridSize);
      const startY = Math.floor(obstacle.position.y / gridSize);
      const endX = Math.ceil((obstacle.position.x + obstacle.size.x) / gridSize);
      const endY = Math.ceil((obstacle.position.y + obstacle.size.y) / gridSize);
      
      for (let gx = startX; gx < endX; gx++) {
        for (let gy = startY; gy < endY; gy++) {
          if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
            grid[gy][gx] = true;
          }
        }
      }
    });
    
    // Check if the clicked position is already part of an obstacle
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);
    
    if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight || grid[gridY][gridX]) {
      console.log("Fill location is already an obstacle or out of bounds");
      return; // Already filled or out of bounds
    }
    
    // Define the map boundaries to constrain the fill
    const mapLeft = Math.floor(map.bounds.left / gridSize);
    const mapRight = Math.ceil(map.bounds.right / gridSize);
    const mapTop = Math.floor(map.bounds.top / gridSize);
    const mapBottom = Math.ceil(map.bounds.bottom / gridSize);
    
    console.log("Map bounds:", mapLeft, mapRight, mapTop, mapBottom);
    
    // Make sure the fill starts inside the map boundaries
    if (gridX < mapLeft || gridX >= mapRight || gridY < mapTop || gridY >= mapBottom) {
      console.log("Fill location is outside map boundaries");
      return;
    }
    
    // Implement a simple flood fill using a queue
    const queue: [number, number][] = [[gridX, gridY]];
    const filled: [number, number][] = [];
    
    // Directions for exploring adjacent cells
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    // Create a visited grid to avoid re-checking cells
    const visited = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(false));
    visited[gridY][gridX] = true;
    
    console.log("Starting flood fill loop");
    
    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      
      // Only add to filled list if it's not already an obstacle
      if (!grid[cy][cx]) {
        filled.push([cx, cy]);
        
        // Add adjacent cells to the queue
        for (const [dx, dy] of directions) {
          const nx = cx + dx;
          const ny = cy + dy;
          
          // Check that we're within bounds and not visited
          if (nx >= mapLeft && nx < mapRight && ny >= mapTop && ny < mapBottom && 
              nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && 
              !grid[ny][nx] && !visited[ny][nx]) {
            queue.push([nx, ny]);
            visited[ny][nx] = true; // Mark as visited to avoid re-adding
          }
        }
      }
    }
    
    console.log(`Flood fill completed with ${filled.length} cells filled`);
    
    // For performance reasons, merge small filled squares into larger chunks
    // Group filled cells into larger rectangles when possible
    const mergedObstacles: Array<{ position: Vector2D; size: Vector2D }> = [];
    
    // If we have too many filled cells, create larger chunks to improve performance
    if (filled.length > 500) {
      // Create larger cells (e.g., 5x5 grid cells = 1 obstacle)
      const chunkSize = 5;
      const chunkedGrid: Record<string, boolean> = {};
      
      filled.forEach(([gx, gy]) => {
        const chunkX = Math.floor(gx / chunkSize);
        const chunkY = Math.floor(gy / chunkSize);
        chunkedGrid[`${chunkX},${chunkY}`] = true;
      });
      
      // Convert chunks to obstacles
      Object.keys(chunkedGrid).forEach(key => {
        const [chunkX, chunkY] = key.split(',').map(Number);
        mergedObstacles.push({
          position: {
            x: chunkX * chunkSize * gridSize,
            y: chunkY * chunkSize * gridSize
          },
          size: {
            x: chunkSize * gridSize,
            y: chunkSize * gridSize
          }
        });
      });
    } else {
      // For smaller fills, just create one obstacle per filled cell
      filled.forEach(([gx, gy]) => {
        mergedObstacles.push({
          position: { x: gx * gridSize, y: gy * gridSize },
          size: { x: gridSize, y: gridSize }
        });
      });
    }
    
    // Add the new obstacles
    if (mergedObstacles.length > 0) {
      setObstacles(prev => [...prev, ...mergedObstacles]);
    }
  };
  
  // Apply current spawn points to the game state
  const applySpawnPoints = () => {
    if (horseSpawnPoint) {
      console.log("Applying horse spawn point:", horseSpawnPoint);
      setHorseStartPosition(horseSpawnPoint);
    }
    
    if (coinSpawnPoint) {
      console.log("Applying coin spawn point:", coinSpawnPoint);
      setCoinPosition(coinSpawnPoint);
    }
  };

  // Draw the map editor state
  const drawMapEditor = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw map boundaries
    if (map) {
      // Draw map background (light gray)
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(
        map.bounds.left * canvasSize,
        map.bounds.top * canvasSize,
        (map.bounds.right - map.bounds.left) * canvasSize,
        (map.bounds.bottom - map.bounds.top) * canvasSize
      );
      
      // Draw map boundaries
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        map.bounds.left * canvasSize,
        map.bounds.top * canvasSize,
        (map.bounds.right - map.bounds.left) * canvasSize,
        (map.bounds.bottom - map.bounds.top) * canvasSize
      );
    }
    
    // Draw existing obstacles
    for (const obstacle of obstacles) {
      ctx.fillStyle = 'rgba(70, 70, 70, 0.7)';
      ctx.fillRect(
        obstacle.position.x * canvasSize, 
        obstacle.position.y * canvasSize, 
        obstacle.size.x * canvasSize, 
        obstacle.size.y * canvasSize
      );
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        obstacle.position.x * canvasSize, 
        obstacle.position.y * canvasSize, 
        obstacle.size.x * canvasSize, 
        obstacle.size.y * canvasSize
      );
    }
    
    // Draw pending obstacle if we're drawing
    if (pendingObstacle.start && pendingObstacle.current) {
      const startX = Math.min(pendingObstacle.start.x, pendingObstacle.current.x);
      const startY = Math.min(pendingObstacle.start.y, pendingObstacle.current.y);
      const width = Math.abs(pendingObstacle.current.x - pendingObstacle.start.x);
      const height = Math.abs(pendingObstacle.current.y - pendingObstacle.start.y);
      
      ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
      ctx.fillRect(
        startX * canvasSize, 
        startY * canvasSize, 
        width * canvasSize, 
        height * canvasSize
      );
      
      ctx.strokeStyle = '#0000ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        startX * canvasSize, 
        startY * canvasSize, 
        width * canvasSize, 
        height * canvasSize
      );
    }
    
    // Draw free drawing preview points
    drawFreeDrawingPreview(ctx);
    
    // Draw spawn points
    drawSpawnPoints(ctx);
    
    // Draw tool cursor
    if (tool.name === 'erase' || tool.name === 'free' || tool.name === 'fill') {
      const mousePos = { x: 0, y: 0 };
      
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
      }, { once: true });
      
      let cursorColor = 'blue';
      if (tool.name === 'erase') cursorColor = 'red';
      if (tool.name === 'fill') cursorColor = 'green';
      
      ctx.strokeStyle = cursorColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        mousePos.x, 
        mousePos.y, 
        tool.name === 'fill' ? 5 : tool.size * canvasSize / 2, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();
    }
  };
  
  // Draw the pending free drawing points
  const drawFreeDrawingPreview = (ctx: CanvasRenderingContext2D) => {
    if (tool.name !== 'free' || drawingPoints.length === 0) return;
    
    ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
    
    // Draw each active drawing point as a circle to show the current drawing progress
    drawingPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(
        point.x * canvasSize,
        point.y * canvasSize,
        (tool.size / 2) * canvasSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  };
  
  // Draw spawn points
  const drawSpawnPoints = (ctx: CanvasRenderingContext2D) => {
    // Draw horse spawn point
    if (horseSpawnPoint) {
      ctx.fillStyle = 'rgba(30, 144, 255, 0.6)'; // Dodger blue
      ctx.strokeStyle = 'rgba(0, 0, 139, 1)'; // Dark blue
      ctx.lineWidth = 2;
      
      // Draw a horse icon or just a circle with H
      ctx.beginPath();
      ctx.arc(
        horseSpawnPoint.x * canvasSize,
        horseSpawnPoint.y * canvasSize,
        0.03 * canvasSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      
      // Draw an "H" in the center
      ctx.fillStyle = 'white';
      ctx.font = `bold ${0.025 * canvasSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'H', 
        horseSpawnPoint.x * canvasSize, 
        horseSpawnPoint.y * canvasSize
      );
    }
    
    // Draw coin spawn point
    if (coinSpawnPoint) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.6)'; // Gold
      ctx.strokeStyle = 'rgba(184, 134, 11, 1)'; // Dark goldenrod
      ctx.lineWidth = 2;
      
      // Draw a coin icon or just a circle with C
      ctx.beginPath();
      ctx.arc(
        coinSpawnPoint.x * canvasSize,
        coinSpawnPoint.y * canvasSize,
        0.03 * canvasSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      
      // Draw a "$" in the center
      ctx.fillStyle = 'white';
      ctx.font = `bold ${0.025 * canvasSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '$', 
        coinSpawnPoint.x * canvasSize, 
        coinSpawnPoint.y * canvasSize
      );
    }
  };
  
  // Draw the editor whenever state changes
  useEffect(() => {
    drawMapEditor();
  }, [canvasSize, obstacles, pendingObstacle, tool, drawingPoints, horseSpawnPoint, coinSpawnPoint]);
  
  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasSize;
    const y = (e.clientY - rect.top) / canvasSize;
    
    setIsDrawing(true);
    
    if (tool.name === 'draw') {
      // Start drawing a new obstacle
      setPendingObstacle({
        start: { x, y },
        current: { x, y }
      });
    } else if (tool.name === 'erase') {
      // Erase mode: remove any obstacle that intersects with the eraser
      const eraserRadius = tool.size / 2;
      const newObstacles = obstacles.filter(obstacle => {
        // Check if the eraser circle intersects with the obstacle rectangle
        const closestX = Math.max(
          obstacle.position.x,
          Math.min(x, obstacle.position.x + obstacle.size.x)
        );
        
        const closestY = Math.max(
          obstacle.position.y,
          Math.min(y, obstacle.position.y + obstacle.size.y)
        );
        
        const distanceX = x - closestX;
        const distanceY = y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        
        // Keep obstacles that don't intersect with the eraser
        return distanceSquared > eraserRadius * eraserRadius;
      });
      
      setObstacles(newObstacles);
    } else if (tool.name === 'free') {
      // Clear any existing drawing points when starting a new drawing
      setDrawingPoints([]);
      
      // Add the first point
      setDrawingPoints([{ x, y, timestamp: Date.now() }]);
    } else if (tool.name === 'fill') {
      // Trigger flood fill at the clicked position
      floodFill(x, y);
    } else if (tool.name === 'horseSpawn') {
      // Set horse spawn position
      setHorseSpawnPoint({ x, y });
    } else if (tool.name === 'coinSpawn') {
      // Set coin spawn position
      setCoinSpawnPoint({ x, y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasSize;
    const y = (e.clientY - rect.top) / canvasSize;
    
    if (tool.name === 'draw' && pendingObstacle.start) {
      // Update current point while drawing
      setPendingObstacle({
        ...pendingObstacle,
        current: { x, y }
      });
    } else if (tool.name === 'erase') {
      // Continue erasing as mouse moves
      const eraserRadius = tool.size / 2;
      const newObstacles = obstacles.filter(obstacle => {
        const closestX = Math.max(
          obstacle.position.x,
          Math.min(x, obstacle.position.x + obstacle.size.x)
        );
        
        const closestY = Math.max(
          obstacle.position.y,
          Math.min(y, obstacle.position.y + obstacle.size.y)
        );
        
        const distanceX = x - closestX;
        const distanceY = y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        
        return distanceSquared > eraserRadius * eraserRadius;
      });
      
      setObstacles(newObstacles);
    } else if (tool.name === 'free') {
      // Only record points if they're a minimum distance from the last point
      // to avoid excessive sampling
      const lastPoint = drawingPoints[drawingPoints.length - 1];
      if (lastPoint) {
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const distSquared = dx * dx + dy * dy;
        
        // Only add point if it's far enough from the last point (adjust threshold as needed)
        if (distSquared > 0.0001) {
          setDrawingPoints(prev => [...prev, { x, y, timestamp: Date.now() }]);
        }
      } else {
        setDrawingPoints([{ x, y, timestamp: Date.now() }]);
      }
    } else if (tool.name === 'horseSpawn') {
      // Update horse spawn position while dragging
      setHorseSpawnPoint({ x, y });
    } else if (tool.name === 'coinSpawn') {
      // Update coin spawn position while dragging
      setCoinSpawnPoint({ x, y });
    }
  };
  
  const handleMouseUp = () => {
    if (isDrawing) {
      if (tool.name === 'free') {
        // Final processing of drawing points
        batchDrawingPoints(true);
      } else if (tool.name === 'draw' && pendingObstacle.start && pendingObstacle.current) {
        // Add the newly drawn obstacle
        const startX = Math.min(pendingObstacle.start.x, pendingObstacle.current.x);
        const startY = Math.min(pendingObstacle.start.y, pendingObstacle.current.y);
        const width = Math.abs(pendingObstacle.current.x - pendingObstacle.start.x);
        const height = Math.abs(pendingObstacle.current.y - pendingObstacle.start.y);
        
        // Only add if it has some size
        if (width > 0.01 && height > 0.01) {
          setObstacles([
            ...obstacles,
            {
              position: { x: startX, y: startY },
              size: { x: width, y: height }
            }
          ]);
        }
        
        // Reset pending obstacle
        setPendingObstacle({ start: null, current: null });
      }
    }
    
    setIsDrawing(false);
  };
  
  const handleMouseLeave = () => {
    if (isDrawing) {
      if (tool.name === 'free') {
        // Process any remaining points when mouse leaves
        batchDrawingPoints(true);
      } else if (tool.name === 'draw' && pendingObstacle.start && pendingObstacle.current) {
        // Add the drawn obstacle if mouse leaves canvas
        const startX = Math.min(pendingObstacle.start.x, pendingObstacle.current.x);
        const startY = Math.min(pendingObstacle.start.y, pendingObstacle.current.y);
        const width = Math.abs(pendingObstacle.current.x - pendingObstacle.start.x);
        const height = Math.abs(pendingObstacle.current.y - pendingObstacle.start.y);
        
        if (width > 0.01 && height > 0.01) {
          setObstacles([
            ...obstacles,
            {
              position: { x: startX, y: startY },
              size: { x: width, y: height }
            }
          ]);
        }
        
        setPendingObstacle({ start: null, current: null });
      }
      
      setIsDrawing(false);
    }
  };
  
  // Apply the current obstacles to the game map
  const handleApplyMap = () => {
    console.log(`Applying ${obstacles.length} obstacles to the game map`);
    
    // First apply obstacles to the map
    setMapObstacles(obstacles);
    
    // Then apply spawn points
    applySpawnPoints();
    
    // Save the map to our maps storage
    if (!mapName.trim()) {
      alert('Please provide a map name before saving');
      return;
    }
    
    saveMap({
      name: mapName,
      obstacles,
      horseSpawn: horseSpawnPoint,
      coinSpawn: coinSpawnPoint
    });
    
    // Update the maps list
    setMaps(getAllMaps());
    
    // Display confirmation message
    alert(`Map "${mapName}" applied with ${obstacles.length} obstacles, and custom spawn points.`);
  };
  
  // Save the current map
  const handleSaveMap = () => {
    if (!mapName.trim()) {
      alert('Please provide a map name before saving');
      return;
    }
    
    console.log("Saving map with", obstacles.length, "obstacles");
    
    // Save to our maps storage
    saveMap({
      name: mapName,
      obstacles,
      horseSpawn: horseSpawnPoint,
      coinSpawn: coinSpawnPoint
    });
    
    // Update the maps list
    setMaps(getAllMaps());
    
    // Save to localStorage for backward compatibility
    saveCustomMap(obstacles, horseSpawnPoint, coinSpawnPoint);
    
    alert(`Map "${mapName}" saved successfully!`);
  };
  
  // Load a saved map
  const handleLoadMap = (mapId: string) => {
    const selectedMap = maps.find(map => map.id === mapId);
    if (!selectedMap) return;
    
    console.log(`Loading map "${selectedMap.name}" with ${selectedMap.obstacles.length} obstacles`);
    
    // Set map name
    setMapName(selectedMap.name);
    
    // Set obstacles
    setObstacles(selectedMap.obstacles);
    
    // Set spawn points
    if (selectedMap.horseSpawn) {
      setHorseSpawnPoint(selectedMap.horseSpawn);
    }
    
    if (selectedMap.coinSpawn) {
      setCoinSpawnPoint(selectedMap.coinSpawn);
    }
  };
  
  // Delete a map
  const handleDeleteMap = (mapId: string) => {
    if (window.confirm('Are you sure you want to delete this map?')) {
      deleteMap(mapId);
      setMaps(getAllMaps());
    }
  };
  
  // Export map to a JSON file
  const handleExportMap = () => {
    try {
      // Create a JSON blob with all map data
      const mapData = {
        name: mapName,
        obstacles,
        horseSpawn: horseSpawnPoint,
        coinSpawn: coinSpawnPoint,
        timestamp: new Date().toISOString()
      };
      
      console.log("Exporting map:", mapData);
      
      const json = JSON.stringify(mapData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mapName.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Map exported to file');
    } catch (error) {
      console.error('Failed to export map:', error);
    }
  };
  
  // Import map from a JSON file
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const mapData = JSON.parse(content);
        
        console.log("Imported map data:", mapData);
        
        if (mapData) {
          // Handle older format where obstacles were directly the array
          if (Array.isArray(mapData)) {
            console.log("Found old format map with direct obstacles array");
            setObstacles(mapData);
            return;
          }
          
          // Handle obstacles
          if (mapData.obstacles && Array.isArray(mapData.obstacles)) {
            console.log("Setting", mapData.obstacles.length, "obstacles from imported file");
            setObstacles(mapData.obstacles);
          }
          
          // Handle horse spawn point
          if (mapData.horseSpawn) {
            console.log("Setting horse spawn from imported file:", mapData.horseSpawn);
            setHorseSpawnPoint(mapData.horseSpawn);
          }
          
          // Handle coin spawn point
          if (mapData.coinSpawn) {
            console.log("Setting coin spawn from imported file:", mapData.coinSpawn);
            setCoinSpawnPoint(mapData.coinSpawn);
          }
          
          // Handle map name
          if (mapData.name) {
            setMapName(mapData.name);
          }
          
          console.log('Map imported successfully');
        } else {
          console.error('Invalid map file format');
        }
      } catch (error) {
        console.error('Failed to parse map file:', error);
      }
    };
    
    reader.readAsText(file);
    
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Clear all map data
  const handleClearMap = () => {
    setObstacles([]);
    setHorseSpawnPoint(null);
    setCoinSpawnPoint(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-lg">Map Creator</div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded ${tool.name === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool({ ...tool, name: 'draw' })}
            title="Draw rectangle obstacles"
          >
            Rectangle
          </button>
          <button
            className={`px-3 py-1 rounded ${tool.name === 'free' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool({ name: 'free', size: 0.02 })}
            title="Free draw obstacles"
          >
            Free Draw
          </button>
          <button
            className={`px-3 py-1 rounded ${tool.name === 'fill' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool({ name: 'fill', size: 0.01 })}
            title="Fill enclosed spaces"
          >
            Fill
          </button>
          <button
            className={`px-3 py-1 rounded ${tool.name === 'erase' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool({ ...tool, name: 'erase' })}
            title="Erase obstacles"
          >
            Erase
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm">Brush Size:</label>
          <input
            type="range"
            min="0.005"
            max="0.05"
            step="0.005"
            value={tool.size}
            onChange={(e) => setTool({ ...tool, size: parseFloat(e.target.value) })}
            className="w-32"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${tool.name === 'horseSpawn' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool({ name: 'horseSpawn', size: 0.03 })}
            title="Set horse spawn point"
          >
            Horse Spawn
          </button>
          <button
            className={`px-3 py-1 rounded ${tool.name === 'coinSpawn' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTool({ name: 'coinSpawn', size: 0.03 })}
            title="Set coin spawn point"
          >
            Coin Spawn
          </button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border border-gray-300"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Map naming section */}
      <div className="flex items-center gap-2 mt-2">
        <label className="text-sm">Map Name:</label>
        <input
          type="text"
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
          className="border px-2 py-1 rounded flex-grow"
          placeholder="Enter map name"
        />
      </div>
      
      {/* Map actions section */}
      <div className="flex justify-between mt-2">
        <div className="flex gap-2 items-center">
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={handleApplyMap}
              title="Apply map changes to the game"
            >
              Apply Map
            </button>
            <button
              className="px-3 py-1 bg-green-500 text-white rounded"
              onClick={handleSaveMap}
              title="Save map to storage"
            >
              Save Map
            </button>
          </div>
        </div>
        <button
          className="px-3 py-1 bg-red-500 text-white rounded"
          onClick={handleClearMap}
          title="Clear the entire map"
        >
          Clear All
        </button>
      </div>
      
      {/* Saved maps list */}
      {maps.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Saved Maps</h3>
          <div className="max-h-40 overflow-y-auto border rounded">
            {maps.map(map => (
              <div key={map.id} className="flex justify-between items-center p-2 hover:bg-gray-100 border-b">
                <div className="flex-grow">
                  <span className="font-medium">{map.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({map.obstacles.length} obstacles)
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                    onClick={() => handleLoadMap(map.id)}
                  >
                    Load
                  </button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                    onClick={() => handleDeleteMap(map.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* File import/export section */}
      <div className="flex items-center justify-between mt-4 p-2 bg-gray-100 rounded">
        <div className="text-sm">Import/Export Maps</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-indigo-500 text-white rounded"
            onClick={handleExportMap}
            title="Export map to a file"
          >
            Export to File
          </button>
          <button
            className="px-3 py-1 bg-purple-500 text-white rounded"
            onClick={handleImportClick}
            title="Import map from a file"
          >
            Import from File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileImport}
          />
        </div>
      </div>
    </div>
  );
} 