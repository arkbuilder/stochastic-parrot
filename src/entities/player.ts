import type { Entity } from './types';

export interface PlayerState {
  speed: number;
  targetX: number;
  targetY: number;
  placing: boolean;
  animationTime: number;
}

export interface PlayerEntity extends Entity {
  type: 'player';
  state: PlayerState;
}

export function createPlayer(x: number, y: number): PlayerEntity {
  return {
    id: 'player_nemo',
    type: 'player',
    position: { x, y },
    bounds: { w: 16, h: 16 },
    visible: true,
    interactive: false,
    state: {
      speed: 64,
      targetX: x,
      targetY: y,
      placing: false,
      animationTime: 0,
    },
  };
}
