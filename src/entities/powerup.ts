import type { Entity } from './types';

export type PowerupKind = 'speed' | 'shield';

export interface PowerupState {
  kind: PowerupKind;
  collected: boolean;
  bobPhase: number;
  animationTime: number;
  duration: number; // seconds the effect lasts
}

export type PowerupEntity = Entity & { type: 'powerup'; state: PowerupState };

export function createPowerup(
  id: string,
  kind: PowerupKind,
  x: number,
  y: number,
): PowerupEntity {
  return {
    id,
    type: 'powerup',
    position: { x, y },
    bounds: { w: 12, h: 12 },
    visible: true,
    interactive: false,
    state: {
      kind,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
      animationTime: 0,
      duration: kind === 'speed' ? 5 : 8,
    },
  };
}
