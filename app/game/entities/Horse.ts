import { Entity, HorseEntity, MapBounds, Vector2D } from '../types';

export class Horse implements HorseEntity {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  color: string;
  speed: number; // Track the horse's constant speed

  constructor(id: string, position: Vector2D, velocity: Vector2D, size: number, color: string) {
    this.id = id;
    this.position = position;
    this.velocity = velocity;
    this.size = size;
    this.color = color;
    
    // Calculate and store the initial speed (magnitude of velocity)
    this.speed = this.calculateSpeed();
  }

  // Helper method to calculate the current speed (magnitude of velocity)
  private calculateSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
  }

  // Helper method to normalize velocity to maintain constant speed
  normalizeVelocity(): void {
    const currentSpeed = this.calculateSpeed();
    if (currentSpeed === 0) return; // Avoid division by zero
    
    // Calculate the scaling factor to maintain the original speed
    const scale = this.speed / currentSpeed;
    
    // Apply the scaling to maintain constant speed
    this.velocity.x *= scale;
    this.velocity.y *= scale;
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
      // Position correction
      newPosition.x = mapBounds.left + this.size;
      // Reflect velocity with proper physics
      this.velocity.x = -this.velocity.x;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
    } else if (newPosition.x + this.size > mapBounds.right) {
      // Position correction
      newPosition.x = mapBounds.right - this.size;
      // Reflect velocity with proper physics
      this.velocity.x = -this.velocity.x;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
    }

    if (newPosition.y - this.size < mapBounds.top) {
      // Position correction
      newPosition.y = mapBounds.top + this.size;
      // Reflect velocity with proper physics
      this.velocity.y = -this.velocity.y;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
    } else if (newPosition.y + this.size > mapBounds.bottom) {
      // Position correction
      newPosition.y = mapBounds.bottom - this.size;
      // Reflect velocity with proper physics
      this.velocity.y = -this.velocity.y;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
    }

    // Check for collisions with other entities
    for (const entity of entities) {
      if (entity === this) continue; // Skip self

      if (this.checkCollision(entity)) {
        // Handle collision with other horses
        if ('velocity' in entity) {
          const otherHorse = entity as HorseEntity;
          
          // Calculate the collision normal (vector pointing from other horse to this horse)
          const dx = this.position.x - otherHorse.position.x;
          const dy = this.position.y - otherHorse.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Normalize the collision normal
          const nx = dx / distance;
          const ny = dy / distance;
          
          // Calculate the relative velocity
          const dvx = this.velocity.x - otherHorse.velocity.x;
          const dvy = this.velocity.y - otherHorse.velocity.y;
          
          // Calculate the impulse (dot product of relative velocity and normal)
          const impulse = dvx * nx + dvy * ny;
          
          // Only apply impulse if horses are moving toward each other
          if (impulse < 0) {
            // Apply impulse to both horses' velocities (realistic momentum exchange)
            const impulseX = nx * impulse;
            const impulseY = ny * impulse;
            
            this.velocity.x -= impulseX;
            this.velocity.y -= impulseY;
            
            otherHorse.velocity.x += impulseX;
            otherHorse.velocity.y += impulseY;
            
            // Ensure both horses maintain their constant speeds
            this.normalizeVelocity();
            otherHorse.normalizeVelocity();
            
            // Separate the horses to prevent sticking
            const overlap = this.size + otherHorse.size - distance;
            if (overlap > 0) {
              // Move this horse away by half the overlap
              newPosition.x += (nx * overlap * 0.5);
              newPosition.y += (ny * overlap * 0.5);
            }
          }
        }
      }
    }

    // Update position
    this.position = newPosition;
  }

  // Draw the horse on the canvas
  draw(ctx: CanvasRenderingContext2D, canvasSize: number, isWinner: boolean = false): void {
    const pixelX = this.position.x * canvasSize;
    const pixelY = this.position.y * canvasSize;
    const pixelSize = this.size * canvasSize;
    
    // If this is the winner, draw a special effect
    if (isWinner) {
      // Add a glow effect
      ctx.shadowColor = this.color;
      ctx.shadowBlur = pixelSize * 0.5;
      
      // Draw a gold crown above the horse
      const crownHeight = pixelSize * 0.7;
      const crownWidth = pixelSize * 1.2;
      
      // Crown base
      ctx.fillStyle = '#FFD700'; // Gold color
      ctx.beginPath();
      ctx.moveTo(pixelX - crownWidth/2, pixelY - pixelSize - crownHeight);
      ctx.lineTo(pixelX + crownWidth/2, pixelY - pixelSize - crownHeight);
      ctx.lineTo(pixelX + crownWidth/2, pixelY - pixelSize);
      ctx.lineTo(pixelX - crownWidth/2, pixelY - pixelSize);
      ctx.closePath();
      ctx.fill();
      
      // Crown points
      const points = 3;
      for (let i = 0; i < points; i++) {
        ctx.beginPath();
        const pointX = pixelX - crownWidth/2 + (crownWidth / (points - 1)) * i;
        ctx.moveTo(pointX, pixelY - pixelSize - crownHeight);
        ctx.lineTo(pointX + crownWidth/points/2, pixelY - pixelSize - crownHeight * 1.5);
        ctx.lineTo(pointX + crownWidth/points, pixelY - pixelSize - crownHeight);
        ctx.closePath();
        ctx.fill();
      }
      
      // Reset shadow for the rest of the drawing
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    
    // Draw the horse body (a circle)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, pixelSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw direction indicator only if not the winner
    if (!isWinner) {
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
  }

  // Check for collision with another entity
  checkCollision(other: Entity): boolean {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (this.size + other.size);
  }
} 