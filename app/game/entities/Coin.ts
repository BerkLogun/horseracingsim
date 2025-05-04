import { CoinEntity, Entity, Vector2D } from '../types';

export class Coin implements CoinEntity {
  position: Vector2D;
  size: number;
  collected: boolean;

  constructor(position: Vector2D, size: number) {
    this.position = position;
    this.size = size;
    this.collected = false;
  }

  // Draw the coin on the canvas
  draw(ctx: CanvasRenderingContext2D, canvasSize: number, isWinner?: boolean): void {
    if (this.collected) return; // Don't draw if already collected
    
    // Calculate pixel position and size on canvas
    const pixelX = this.position.x * canvasSize;
    const pixelY = this.position.y * canvasSize;
    const pixelSize = this.size * canvasSize;
    
    // Add a golden glow
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = pixelSize * 0.3;
    
    // Draw the coin as a filled circle
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, pixelSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw dollar sign in the middle
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${pixelSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', pixelX, pixelY);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // Check for collision with another entity
  checkCollision(other: Entity): boolean {
    // If already collected, no collisions happen
    if (this.collected) return false;
    
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (this.size + other.size);
  }
} 