export type EntityType = 'player' | 'parrot' | 'landmark' | 'concept-card' | 'threat';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Bounds {
  w: number;
  h: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector2;
  bounds: Bounds;
  visible: boolean;
  interactive: boolean;
  state: object;
}

export interface SpriteRef {
  key: string;
  animationTime: number;
}
