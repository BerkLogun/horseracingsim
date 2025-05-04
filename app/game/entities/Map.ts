import { Entity, MapBounds, MapEntity, Obstacle, Vector2D } from '../types';

export class GameMap implements MapEntity {
  dimensions: {
    width: number;
    height: number;
  };
  bounds: MapBounds;
  obstacles: Obstacle[];

  constructor(width: number, height: number, obstacles: Obstacle[] = []) {
    this.dimensions = {
      width,
      height,
    };
    
    // Map bounds are typically the edges of the playable area
    this.bounds = {
      left: 0.1, // 10% margin from the edge
      right: 0.9, // 90% of the width
      top: 0.1, // 10% margin from the edge
      bottom: 0.9, // 90% of the height
    };
    
    this.obstacles = obstacles;
  }

  // Draw the map and its obstacles on the canvas
  draw(ctx: CanvasRenderingContext2D, canvasSize: number, isWinner?: boolean): void {
    // Draw map boundaries
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeRect(
      this.bounds.left * canvasSize,
      this.bounds.top * canvasSize,
      (this.bounds.right - this.bounds.left) * canvasSize,
      (this.bounds.bottom - this.bounds.top) * canvasSize
    );
    
    // Draw obstacles
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    for (const obstacle of this.obstacles) {
      const pixelX = obstacle.position.x * canvasSize;
      const pixelY = obstacle.position.y * canvasSize;
      const pixelWidth = obstacle.size.x * canvasSize;
      const pixelHeight = obstacle.size.y * canvasSize;
      
      ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
    }
  }

  // Check for collision between an entity and the map's obstacles
  checkCollision(entity: Entity): boolean {
    // Check for collisions with obstacles
    for (const obstacle of this.obstacles) {
      // Simplified rectangle-circle collision detection
      
      // Find the closest point on the rectangle to the circle
      const closestX = Math.max(
        obstacle.position.x,
        Math.min(entity.position.x, obstacle.position.x + obstacle.size.x)
      );
      
      const closestY = Math.max(
        obstacle.position.y,
        Math.min(entity.position.y, obstacle.position.y + obstacle.size.y)
      );
      
      // Calculate the distance between the circle's center and the closest point
      const distanceX = entity.position.x - closestX;
      const distanceY = entity.position.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check collision (if distance <= radius, there's a collision)
      if (distanceSquared <= entity.size * entity.size) {
        return true;
      }
    }
    
    return false;
  }
  
  // Get collision normal and penetration depth for realistic bouncing
  getCollisionInfo(entity: Entity): { collided: boolean; normal: Vector2D; penetration: number } {
    const result = {
      collided: false,
      normal: { x: 0, y: 0 },
      penetration: 0
    };
    
    // Check for collisions with each obstacle
    for (const obstacle of this.obstacles) {
      // Find the closest point on the rectangle to the circle
      const closestX = Math.max(
        obstacle.position.x,
        Math.min(entity.position.x, obstacle.position.x + obstacle.size.x)
      );
      
      const closestY = Math.max(
        obstacle.position.y,
        Math.min(entity.position.y, obstacle.position.y + obstacle.size.y)
      );
      
      // Calculate the distance between the circle's center and the closest point
      const distanceX = entity.position.x - closestX;
      const distanceY = entity.position.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      const distance = Math.sqrt(distanceSquared);
      
      // Check collision (if distance <= radius, there's a collision)
      if (distance <= entity.size) {
        result.collided = true;
        
        // Calculate normal vector (direction from closest point to circle center)
        if (distance > 0) {
          result.normal.x = distanceX / distance;
          result.normal.y = distanceY / distance;
        } else {
          // Circle is exactly on the edge, default to a horizontal normal
          result.normal.x = 1;
          result.normal.y = 0;
        }
        
        // Calculate penetration depth
        result.penetration = entity.size - distance;
        
        return result; // Return on first collision found
      }
    }
    
    return result;
  }
} 