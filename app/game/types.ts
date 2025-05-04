// Basic vector type for positions and velocities
export interface Vector2D {
  x: number;
  y: number;
}

// Base entity interface with common properties
export interface Entity {
  position: Vector2D;
  size: number;
  draw: (ctx: CanvasRenderingContext2D, canvasSize: number, isWinner?: boolean) => void;
  checkCollision: (other: Entity) => boolean;
}

// Horse entity type
export interface HorseEntity extends Entity {
  id: string;
  velocity: Vector2D;
  color: string;
  speed: number;
  collisionEffect: number;
  trailPositions: Vector2D[];
  update: (deltaTime: number, entities: Entity[], mapBounds: MapBounds) => void;
  normalizeVelocity: () => void; // Make it required now
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

// Add SpatialGridCell interface
export interface SpatialGridCell {
  entities: Entity[];
  obstacles: Obstacle[];
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
  getCollisionInfo: (entity: Entity) => { collided: boolean; normal: Vector2D; penetration: number };
  updateEntityPositions?: (entities: Entity[]) => void;
  getPotentialCollisions?: (entity: Entity) => { entities: Entity[], obstacles: Obstacle[] };
  spatialGrid?: SpatialGridCell[][];
  gridCellSize?: number;
  gridCols?: number;
  gridRows?: number;
}

// Obstacle type
export interface Obstacle {
  position: Vector2D;
  size: Vector2D;
} 