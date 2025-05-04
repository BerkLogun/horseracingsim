import { Entity, HorseEntity, MapBounds, Vector2D } from '../types';

export class Horse implements HorseEntity {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  color: string;

  constructor(id: string, position: Vector2D, velocity: Vector2D, size: number, color: string) {
    this.id = id;
    this.position = position;
    this.velocity = velocity;
    this.size = size;
    this.color = color;
  }

  // Update horse position based on velocity and handle collisions
  update(deltaTime: number, entities: Entity[], mapBounds: MapBounds): void {
    // Calculate new position based on velocity and delta time
    const newPosition = {
      x: this.position.x + this.velocity.x * deltaTime,
      y: this.position.y + this.velocity.y * deltaTime,
    };

    // Check for map boundary collisions
    if (newPosition.x - this.size < mapBounds.left) {
      newPosition.x = mapBounds.left + this.size;
      this.velocity.x = -this.velocity.x; // Bounce
    } else if (newPosition.x + this.size > mapBounds.right) {
      newPosition.x = mapBounds.right - this.size;
      this.velocity.x = -this.velocity.x; // Bounce
    }

    if (newPosition.y - this.size < mapBounds.top) {
      newPosition.y = mapBounds.top + this.size;
      this.velocity.y = -this.velocity.y; // Bounce
    } else if (newPosition.y + this.size > mapBounds.bottom) {
      newPosition.y = mapBounds.bottom - this.size;
      this.velocity.y = -this.velocity.y; // Bounce
    }

    // Check for collisions with other entities
    for (const entity of entities) {
      if (entity === this) continue; // Skip self

      if (this.checkCollision(entity)) {
        // Simple bounce-off implementation for other horses
        if ('velocity' in entity) {
          // Exchange velocities (simplified physics)
          const otherHorse = entity as HorseEntity;
          const tempVelocityX = this.velocity.x;
          const tempVelocityY = this.velocity.y;
          
          this.velocity.x = otherHorse.velocity.x;
          this.velocity.y = otherHorse.velocity.y;
          
          otherHorse.velocity.x = tempVelocityX;
          otherHorse.velocity.y = tempVelocityY;
        }
      }
    }

    // Update position
    this.position = newPosition;
  }

  // Draw the horse on the canvas
  draw(ctx: CanvasRenderingContext2D, canvasSize: number): void {
    ctx.fillStyle = this.color;
    
    // Calculate pixel position on canvas
    const pixelX = this.position.x * canvasSize;
    const pixelY = this.position.y * canvasSize;
    const pixelSize = this.size * canvasSize;
    
    // Draw a circle representing the horse
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, pixelSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw direction indicator (a small line showing velocity direction)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pixelX, pixelY);
    ctx.lineTo(
      pixelX + (this.velocity.x * pixelSize * 1.5),
      pixelY + (this.velocity.y * pixelSize * 1.5)
    );
    ctx.stroke();
  }

  // Check for collision with another entity
  checkCollision(other: Entity): boolean {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (this.size + other.size);
  }
} 