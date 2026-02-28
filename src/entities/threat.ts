import type { Entity } from './types';

export interface ThreatState {
  fogDepth: number;
  fogSpeed: number;
  healthRatio: number;
  shakeFrames: number;
}

export interface ThreatEntity extends Entity {
  type: 'threat';
  state: ThreatState;
}

export function createFogThreat(): ThreatEntity {
  return {
    id: 'threat_fog',
    type: 'threat',
    position: { x: 0, y: 0 },
    bounds: { w: 240, h: 400 },
    visible: true,
    interactive: false,
    state: {
      fogDepth: 0,
      fogSpeed: 0.035,
      healthRatio: 1,
      shakeFrames: 0,
    },
  };
}
