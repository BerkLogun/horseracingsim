import { Entity, MapBounds, Vector2D } from '../types';

export class Countdown implements Entity {
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  countdownValue: number;
  active: boolean;
  timePerNumber: number;
  elapsedTime: number;
  pixelated: boolean;

  constructor(position: Vector2D, size: number, initialCount: number = 10) {
    this.position = position;
    this.velocity = { x: 0.3, y: 0.3 }; // Increased velocity for more noticeable movement
    this.size = size;
    this.countdownValue = initialCount;
    this.active = true;
    this.timePerNumber = 1; // 1 second per number
    this.elapsedTime = 0;
    this.pixelated = true;
  }

  update(deltaTime: number, mapBounds: MapBounds): void {
    if (!this.active) return;

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Bounce off map boundaries
    if (this.position.x - this.size < mapBounds.left) {
      this.position.x = mapBounds.left + this.size;
      this.velocity.x = Math.abs(this.velocity.x);
    } else if (this.position.x + this.size > mapBounds.right) {
      this.position.x = mapBounds.right - this.size;
      this.velocity.x = -Math.abs(this.velocity.x);
    }

    if (this.position.y - this.size < mapBounds.top) {
      this.position.y = mapBounds.top + this.size;
      this.velocity.y = Math.abs(this.velocity.y);
    } else if (this.position.y + this.size > mapBounds.bottom) {
      this.position.y = mapBounds.bottom - this.size;
      this.velocity.y = -Math.abs(this.velocity.y);
    }

    // Update countdown
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.timePerNumber) {
      this.countdownValue--;
      this.elapsedTime = 0;

      // When countdown reaches 0, deactivate
      if (this.countdownValue <= 0) {
        this.active = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvasSize: number, _isWinner?: boolean): void {
    if (!this.active) return;

    const pixelX = this.position.x * canvasSize;
    const pixelY = this.position.y * canvasSize;
    const pixelSize = this.size * canvasSize;

    // Create the pixelated effect by drawing with low resolution
    const pixelRatio = this.pixelated ? 8 : 1; // Higher value = more pixelated
    const rectWidth = pixelSize * 3;  // Make rectangle wider
    const rectHeight = pixelSize * 2; // Make rectangle taller

    // Draw red pixelated background rectangle
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; // Brighter red with some transparency
    
    if (this.pixelated) {
      // Draw pixelated rectangle
      const pixelSize = pixelRatio;
      const rectPixelWidth = Math.floor(rectWidth / pixelSize);
      const rectPixelHeight = Math.floor(rectHeight / pixelSize);
      
      for (let x = 0; x < rectPixelWidth; x++) {
        for (let y = 0; y < rectPixelHeight; y++) {
          ctx.fillRect(
            pixelX - rectWidth/2 + (x * pixelSize),
            pixelY - rectHeight/2 + (y * pixelSize),
            pixelSize,
            pixelSize
          );
        }
      }
    } else {
      // Normal rectangle
      ctx.fillRect(
        pixelX - rectWidth/2,
        pixelY - rectHeight/2,
        rectWidth,
        rectHeight
      );
    }

    // Draw the countdown number
    ctx.fillStyle = 'white';
    ctx.font = `bold ${pixelSize * 1.5}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw pixelated text
    if (this.pixelated) {
      // Create an offscreen canvas for the pixelated text
      const offscreenCanvas = document.createElement('canvas');
      const textSize = pixelSize * 2; // Larger text
      offscreenCanvas.width = textSize * 3;
      offscreenCanvas.height = textSize * 2;
      
      const offCtx = offscreenCanvas.getContext('2d');
      if (offCtx) {
        // Draw text on offscreen canvas
        offCtx.fillStyle = 'white';
        offCtx.font = `bold ${textSize}px 'Courier New', monospace`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(this.countdownValue.toString(), offscreenCanvas.width / 2, offscreenCanvas.height / 2);
        
        // Draw pixelated version on main canvas
        ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for pixelated effect
        ctx.drawImage(
          offscreenCanvas, 
          pixelX - rectWidth/2,
          pixelY - rectHeight/2,
          rectWidth,
          rectHeight
        );
        ctx.imageSmoothingEnabled = true; // Re-enable for other elements
      } else {
        // Fallback if offscreen canvas is not available
        ctx.fillText(this.countdownValue.toString(), pixelX, pixelY);
      }
    } else {
      // Normal text
      ctx.fillText(this.countdownValue.toString(), pixelX, pixelY);
    }
  }

  checkCollision(_other: Entity): boolean {
    // We don't want this to collide with horses or coins, only map borders
    // which are handled in the update method
    return false;
  }
} 