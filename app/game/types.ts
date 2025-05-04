// Basic vector type for positions and velocities
export interface Vector2D {
  x: number;
  y: number;
}

// Base entity interface with common properties
export interface Entity {
  position: Vector2D;
  size: number;
  draw: (ctx: CanvasRenderingContext2D, canvasSize: number) => void;
  checkCollision: (other: Entity) => boolean;
}

// Horse entity type
export interface HorseEntity extends Entity {
  id: string;
  velocity: Vector2D;
  color: string;
  update: (deltaTime: number, entities: Entity[], mapBounds: MapBounds) => void;
}

// Coin entity type
export interface CoinEntity extends Entity {
  collected: boolean;
}

// Map bounds type
export interface MapBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Map entity type
export interface MapEntity {
  dimensions: {
    width: number;
    height: number;
  };
  bounds: MapBounds;
  obstacles: Obstacle[];
  draw: (ctx: CanvasRenderingContext2D, canvasSize: number) => void;
  checkCollision: (entity: Entity) => boolean;
}

// Obstacle type
export interface Obstacle {
  position: Vector2D;
  size: Vector2D;
} 