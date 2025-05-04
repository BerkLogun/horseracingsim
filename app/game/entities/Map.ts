import { Entity, MapBounds, MapEntity, Obstacle, SpatialGridCell, Vector2D } from '../types';

export class GameMap implements MapEntity {
  dimensions: {
    width: number;
    height: number;
  };
  
  bounds: MapBounds;
  obstacles: Obstacle[];
  spatialGrid: SpatialGridCell[][] = [];
  gridCellSize: number;
  gridCols: number;
  gridRows: number;
  
  constructor(width: number, height: number, obstacles: Obstacle[]) {
    this.dimensions = {
      width,
      height
    };
    
    // Restore original map bounds with 10% margins
    this.bounds = {
      left: 0.1, // 10% margin from the edge
      right: 0.9, // 90% of the width
      top: 0.1, // 10% margin from the edge
      bottom: 0.9, // 90% of the height
    };
    
    this.obstacles = obstacles;
    
    // Initialize spatial grid for efficient collision detection
    this.gridCellSize = 0.1; // Each cell is 10% of the map width/height
    this.gridCols = Math.ceil(1 / this.gridCellSize);
    this.gridRows = Math.ceil(1 / this.gridCellSize);
    
    this.initSpatialGrid();
  }
  
  // Initialize the spatial grid
  private initSpatialGrid(): void {
    // Create 2D grid
    this.spatialGrid = Array(this.gridRows).fill(null).map(() => 
      Array(this.gridCols).fill(null).map(() => ({
        entities: [],
        obstacles: []
      }))
    );
    
    // Add obstacles to the grid
    for (const obstacle of this.obstacles) {
      this.addObstacleToGrid(obstacle);
    }
  }
  
  // Add an obstacle to the appropriate grid cells
  private addObstacleToGrid(obstacle: Obstacle): void {
    // Handle obstacles as they were originally defined (position is top-left corner)
    const obstacleLeft = obstacle.position.x;
    const obstacleRight = obstacle.position.x + obstacle.size.x;
    const obstacleTop = obstacle.position.y;
    const obstacleBottom = obstacle.position.y + obstacle.size.y;
    
    const startCol = Math.floor(obstacleLeft / this.gridCellSize);
    const endCol = Math.floor(obstacleRight / this.gridCellSize);
    const startRow = Math.floor(obstacleTop / this.gridCellSize);
    const endRow = Math.floor(obstacleBottom / this.gridCellSize);
    
    for (let row = Math.max(0, startRow); row <= Math.min(this.gridRows - 1, endRow); row++) {
      for (let col = Math.max(0, startCol); col <= Math.min(this.gridCols - 1, endCol); col++) {
        this.spatialGrid[row][col].obstacles.push(obstacle);
      }
    }
  }
  
  // Update entity positions in the grid
  updateEntityPositions(entities: Entity[]): void {
    // Clear all entities from the grid
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        this.spatialGrid[row][col].entities = [];
      }
    }
    
    // Add entities to the grid based on their current positions
    for (const entity of entities) {
      const col = Math.floor(entity.position.x / this.gridCellSize);
      const row = Math.floor(entity.position.y / this.gridCellSize);
      
      if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
        this.spatialGrid[row][col].entities.push(entity);
      }
    }
  }
  
  // Get potential collisions for an entity
  getPotentialCollisions(entity: Entity): { entities: Entity[], obstacles: Obstacle[] } {
    const col = Math.floor(entity.position.x / this.gridCellSize);
    const row = Math.floor(entity.position.y / this.gridCellSize);
    
    const potentialEntities: Entity[] = [];
    const potentialObstacles: Obstacle[] = [];
    
    // Check surrounding cells (3x3 grid centered on entity's cell)
    for (let r = Math.max(0, row - 1); r <= Math.min(this.gridRows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.gridCols - 1, col + 1); c++) {
        if (r < 0 || r >= this.gridRows || c < 0 || c >= this.gridCols) continue;
        
        // Add entities and obstacles from this cell
        potentialEntities.push(...this.spatialGrid[r][c].entities.filter(e => e !== entity));
        potentialObstacles.push(...this.spatialGrid[r][c].obstacles);
      }
    }
    
    return {
      entities: potentialEntities,
      obstacles: potentialObstacles
    };
  }
  
  // Draw the map on the canvas
  draw(ctx: CanvasRenderingContext2D, canvasSize: number): void {
    // Draw map background (light gray)
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Draw map boundaries with a thicker, darker line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeRect(
      this.bounds.left * canvasSize,
      this.bounds.top * canvasSize,
      (this.bounds.right - this.bounds.left) * canvasSize,
      (this.bounds.bottom - this.bounds.top) * canvasSize
    );
    
    // Draw the obstacles
    for (const obstacle of this.obstacles) {
      const pixelX = obstacle.position.x * canvasSize;
      const pixelY = obstacle.position.y * canvasSize;
      const pixelWidth = obstacle.size.x * canvasSize;
      const pixelHeight = obstacle.size.y * canvasSize;
      
      // Fill obstacle with semi-transparent dark color
      ctx.fillStyle = 'rgba(70, 70, 70, 0.7)';
      ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
      
      // Add border to obstacle for better visibility
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(pixelX, pixelY, pixelWidth, pixelHeight);
    }
    
    // Uncomment to visualize the grid (for debugging)
    /*
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        ctx.strokeRect(
          col * this.gridCellSize * canvasSize,
          row * this.gridCellSize * canvasSize,
          this.gridCellSize * canvasSize,
          this.gridCellSize * canvasSize
        );
      }
    }
    */
  }
  
  // Check if an entity is colliding with any obstacle
  checkCollision(entity: Entity): boolean {
    // Get potential obstacles from the spatial grid
    const { obstacles } = this.getPotentialCollisions(entity);
    
    // Check collision with each potential obstacle
    for (const obstacle of obstacles) {
      if (this.checkObstacleCollision(entity, obstacle)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Check collision between an entity and an obstacle
  private checkObstacleCollision(entity: Entity, obstacle: Obstacle): boolean {
    const entityLeft = entity.position.x - entity.size;
    const entityRight = entity.position.x + entity.size;
    const entityTop = entity.position.y - entity.size;
    const entityBottom = entity.position.y + entity.size;
    
    // Treat obstacle position as top-left corner instead of center point
    const obstacleLeft = obstacle.position.x;
    const obstacleRight = obstacle.position.x + obstacle.size.x;
    const obstacleTop = obstacle.position.y;
    const obstacleBottom = obstacle.position.y + obstacle.size.y;
    
    return (
      entityRight > obstacleLeft &&
      entityLeft < obstacleRight &&
      entityBottom > obstacleTop &&
      entityTop < obstacleBottom
    );
  }
  
  // Get detailed collision information
  getCollisionInfo(entity: Entity): { collided: boolean; normal: Vector2D; penetration: number } {
    // Get potential obstacles from the spatial grid
    const { obstacles } = this.getPotentialCollisions(entity);
    
    // Check against each obstacle
    for (const obstacle of obstacles) {
      const entityRadius = entity.size;
      
      // Calculate AABB bounds for the obstacle (positions are top-left based)
      const obstacleLeft = obstacle.position.x;
      const obstacleRight = obstacle.position.x + obstacle.size.x;
      const obstacleTop = obstacle.position.y;
      const obstacleBottom = obstacle.position.y + obstacle.size.y;
      
      // Find the closest point on the AABB to the circle
      const closestX = Math.max(obstacleLeft, Math.min(entity.position.x, obstacleRight));
      const closestY = Math.max(obstacleTop, Math.min(entity.position.y, obstacleBottom));
      
      // Calculate the distance between the closest point and the circle center
      const distanceX = entity.position.x - closestX;
      const distanceY = entity.position.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // If the distance is less than the radius, there's a collision
      if (distanceSquared < entityRadius * entityRadius) {
        const distance = Math.sqrt(distanceSquared);
        
        // Calculate the normal (direction to move the entity)
        let nx = 0;
        let ny = 0;
        
        if (distance > 0) {
          nx = distanceX / distance;
          ny = distanceY / distance;
        } else {
          // If the center of the circle is exactly at the edge of the AABB
          // Use the direction from the obstacle center to the entity
          const obstacleCenter = {
            x: obstacle.position.x + obstacle.size.x / 2,
            y: obstacle.position.y + obstacle.size.y / 2
          };
          const cx = entity.position.x - obstacleCenter.x;
          const cy = entity.position.y - obstacleCenter.y;
          const mag = Math.sqrt(cx * cx + cy * cy);
          
          nx = cx / mag;
          ny = cy / mag;
        }
        
        // Calculate penetration depth
        const penetration = entityRadius - distance;
        
        return {
          collided: true,
          normal: { x: nx, y: ny },
          penetration
        };
      }
    }
    
    // No collision found
    return {
      collided: false,
      normal: { x: 0, y: 0 },
      penetration: 0
    };
  }
} 