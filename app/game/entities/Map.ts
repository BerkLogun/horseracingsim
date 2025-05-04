import { Entity, MapBounds, MapEntity, Obstacle } from '../types';

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
  draw(ctx: CanvasRenderingContext2D, canvasSize: number): void {
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
    ctx.fillStyle = '#555';
    for (const obstacle of this.obstacles) {
      ctx.fillRect(
        obstacle.position.x * canvasSize,
        obstacle.position.y * canvasSize,
        obstacle.size.x * canvasSize,
        obstacle.size.y * canvasSize
      );
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
} 