import type { Entity } from './types';

export interface ParrotState {
  mode: 'idle' | 'assist';
  targetX: number;
  targetY: number;
  speed: number;
  animationTime: number;
}

export interface ParrotEntity extends Entity {
  type: 'parrot';
  state: ParrotState;
}

export function createParrot(x: number, y: number): ParrotEntity {
  return {
    id: 'parrot_bit',
    type: 'parrot',
    position: { x, y },
    bounds: { w: 8, h: 8 },
    visible: true,
    interactive: false,
    state: {
      mode: 'idle',
      targetX: x,
      targetY: y,
      speed: 78,
      animationTime: 0,
    },
  };
}
