import type { Entity } from './types';

export interface LandmarkState {
  conceptId: string;
  placedConceptId: string | null;
  glow: number;
  lockTimer: number;
}

export interface LandmarkEntity extends Entity {
  type: 'landmark';
  state: LandmarkState;
}

export function createLandmark(id: string, conceptId: string, x: number, y: number): LandmarkEntity {
  return {
    id,
    type: 'landmark',
    position: { x, y },
    bounds: { w: 20, h: 20 },
    visible: true,
    interactive: true,
    state: {
      conceptId,
      placedConceptId: null,
      glow: 0,
      lockTimer: 0,
    },
  };
}
