import type { Entity } from './types';

export interface ConceptCardState {
  conceptId: string;
  label: string;
  iconGlyph: string;
  dragging: boolean;
  placed: boolean;
  unlocked: boolean;
  trayX: number;
  trayY: number;
  appearedAtMs: number;
}

export interface ConceptCard extends Entity {
  type: 'concept-card';
  state: ConceptCardState;
}

export function createConceptCard(
  id: string,
  conceptId: string,
  label: string,
  iconGlyph: string,
  trayX: number,
  trayY: number,
): ConceptCard {
  return {
    id,
    type: 'concept-card',
    position: { x: trayX, y: trayY },
    bounds: { w: 48, h: 32 },
    visible: true,
    interactive: true,
    state: {
      conceptId,
      label,
      iconGlyph,
      dragging: false,
      placed: false,
      unlocked: false,
      trayX,
      trayY,
      appearedAtMs: 0,
    },
  };
}
