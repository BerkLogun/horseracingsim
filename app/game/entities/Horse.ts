import { Entity, HorseEntity, MapBounds, Vector2D } from '../types';

export class Horse implements HorseEntity {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  color: string;
  speed: number; // Track the horse's constant speed
  collisionEffect: number; // New property for collision animation
  trailPositions: Vector2D[]; // New property for movement trail

  constructor(id: string, position: Vector2D, velocity: Vector2D, size: number, color: string) {
    this.id = id;
    this.position = position;
    this.velocity = velocity;
    this.size = size;
    this.color = color;
    
    // Calculate and store the initial speed (magnitude of velocity)
    this.speed = this.calculateSpeed();
    // Initialize collision effect timer
    this.collisionEffect = 0;
    // Initialize trail array
    this.trailPositions = [];
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
    // Update collision effect timer
    if (this.collisionEffect > 0) {
      this.collisionEffect -= deltaTime;
      if (this.collisionEffect < 0) this.collisionEffect = 0;
    }
    
    // Store current position for trail if we're moving
    if (this.calculateSpeed() > 0) {
      // Only store position every few frames to avoid too many points
      if (Math.random() < 0.1) {
        this.trailPositions.push({...this.position});
        // Limit trail length
        if (this.trailPositions.length > 10) {
          this.trailPositions.shift();
        }
      }
    }
    
    // Calculate new position based on velocity and delta time
    const newPosition = {
      x: this.position.x + this.velocity.x * deltaTime,
      y: this.position.y + this.velocity.y * deltaTime,
    };

    // Check for map boundary collisions
    let wallCollision = false;
    
    if (newPosition.x - this.size < mapBounds.left) {
      // Position correction
      newPosition.x = mapBounds.left + this.size;
      // Reflect velocity with proper physics
      this.velocity.x = -this.velocity.x;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
      wallCollision = true;
    } else if (newPosition.x + this.size > mapBounds.right) {
      // Position correction
      newPosition.x = mapBounds.right - this.size;
      // Reflect velocity with proper physics
      this.velocity.x = -this.velocity.x;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
      wallCollision = true;
    }

    if (newPosition.y - this.size < mapBounds.top) {
      // Position correction
      newPosition.y = mapBounds.top + this.size;
      // Reflect velocity with proper physics
      this.velocity.y = -this.velocity.y;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
      wallCollision = true;
    } else if (newPosition.y + this.size > mapBounds.bottom) {
      // Position correction
      newPosition.y = mapBounds.bottom - this.size;
      // Reflect velocity with proper physics
      this.velocity.y = -this.velocity.y;
      // Ensure velocity magnitude stays constant
      this.normalizeVelocity();
      wallCollision = true;
    }
    
    // Set collision effect if wall collision occurred
    if (wallCollision) {
      this.collisionEffect = 0.3; // Effect lasts for 0.3 seconds
    }

    // Check for collisions with other entities
    // We only need to check horses here since map obstacles are handled separately
    const otherHorses = entities.filter(entity => 
      entity !== this && 'velocity' in entity
    ) as HorseEntity[];
    
    // Handle collisions with other horses
    for (const otherHorse of otherHorses) {
      // Skip if distances are too far - quick broad phase check
      const dx = this.position.x - otherHorse.position.x;
      const dy = this.position.y - otherHorse.position.y;
      const distanceSquared = dx * dx + dy * dy;
      const minDistance = this.size + otherHorse.size;
      
      // Only detailed collision check if potentially colliding
      if (distanceSquared < minDistance * minDistance) {
        const distance = Math.sqrt(distanceSquared);
        
        // Check if actually colliding
        if (distance < minDistance) {
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
            
            // Set collision effect for both horses
            this.collisionEffect = 0.3; // Effect lasts for 0.3 seconds
            otherHorse.collisionEffect = 0.3;
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
    
    // Draw trail if exists
    if (this.trailPositions.length > 0) {
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < this.trailPositions.length; i++) {
        const trailPos = this.trailPositions[i];
        const trailX = trailPos.x * canvasSize;
        const trailY = trailPos.y * canvasSize;
        const trailSize = pixelSize * (0.3 + 0.7 * (i / this.trailPositions.length));
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }
    
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
      
      // Draw pulsing circles around winner
      const time = Date.now() / 1000;
      const pulseCount = 3;
      for (let i = 0; i < pulseCount; i++) {
        const pulse = ((time * 2 + i / pulseCount) % 1);
        const pulseSize = pixelSize * (1.5 + pulse);
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7 - 0.7 * pulse;
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      
      // Reset shadow for the rest of the drawing
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    
    // Draw collision animation if active
    if (this.collisionEffect > 0) {
      // Draw impact lines radiating outward
      const lineCount = 8;
      const maxLength = pixelSize * 1.5;
      
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const length = maxLength * this.collisionEffect;
        
        ctx.beginPath();
        ctx.moveTo(pixelX, pixelY);
        ctx.lineTo(
          pixelX + Math.cos(angle) * length,
          pixelY + Math.sin(angle) * length
        );
        ctx.stroke();
      }
      
      // Add a flash effect that fades with the collision effect
      ctx.fillStyle = `rgba(255, 255, 255, ${this.collisionEffect * 0.3})`;
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, pixelSize * 1.2, 0, Math.PI * 2);
      ctx.fill();
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