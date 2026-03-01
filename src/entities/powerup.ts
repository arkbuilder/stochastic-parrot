import type { Entity } from './types';

export type PowerupKind = 'speed' | 'shield' | 'freeze' | 'reveal';

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
  const durations: Record<PowerupKind, number> = {
    speed: 5,
    shield: 8,
    freeze: 3,
    reveal: 5,
  };

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
      duration: durations[kind],
    },
  };
}
