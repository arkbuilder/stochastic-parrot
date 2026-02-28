import type { ConceptCard } from '../entities/concept-card';
import type { LandmarkEntity } from '../entities/landmark';
import type { InputAction } from '../input/types';
import { distance } from '../utils/math';

export interface EncodeRuntimeState {
  heldCardId: string | null;
}

export interface EncodeEvent {
  type: 'card_drag_started' | 'card_dragged' | 'concept_placed' | 'placement_failed';
  conceptId?: string;
  landmarkId?: string;
}

const SNAP_RADIUS = 32;

export function updateEncodeSystem(
  cards: ConceptCard[],
  landmarks: LandmarkEntity[],
  actions: InputAction[],
  runtime: EncodeRuntimeState,
): EncodeEvent[] {
  const events: EncodeEvent[] = [];

  for (const action of actions) {
    if (action.type === 'primary') {
      if (!runtime.heldCardId) {
        const pickedCard = cards.find(
          (card) =>
            card.state.unlocked &&
            !card.state.placed &&
            pointInRect(action.x, action.y, card.position.x, card.position.y, card.bounds.w, card.bounds.h),
        );

        if (pickedCard) {
          runtime.heldCardId = pickedCard.id;
          pickedCard.state.dragging = true;
          events.push({ type: 'card_drag_started', conceptId: pickedCard.state.conceptId });
          continue;
        }
      }

      if (runtime.heldCardId) {
        const heldCard = cards.find((card) => card.id === runtime.heldCardId);
        if (heldCard) {
          heldCard.position.x = action.x - heldCard.bounds.w / 2;
          heldCard.position.y = action.y - heldCard.bounds.h / 2;
        }
      }
    }

    if (action.type === 'drag' && runtime.heldCardId) {
      const heldCard = cards.find((card) => card.id === runtime.heldCardId);
      if (!heldCard) {
        continue;
      }

      heldCard.position.x = action.x - heldCard.bounds.w / 2;
      heldCard.position.y = action.y - heldCard.bounds.h / 2;
      events.push({ type: 'card_dragged', conceptId: heldCard.state.conceptId });
    }

    if (action.type === 'primary_end' && runtime.heldCardId) {
      const heldCard = cards.find((card) => card.id === runtime.heldCardId);
      if (!heldCard) {
        runtime.heldCardId = null;
        continue;
      }

      const target = findSnapLandmark(heldCard, landmarks);
      if (target && target.state.conceptId === heldCard.state.conceptId && !target.state.placedConceptId) {
        target.state.placedConceptId = heldCard.state.conceptId;
        target.state.lockTimer = 0.5;
        heldCard.state.placed = true;
        heldCard.state.dragging = false;
        heldCard.position.x = target.position.x - heldCard.bounds.w / 2;
        heldCard.position.y = target.position.y + 10;
        events.push({ type: 'concept_placed', conceptId: heldCard.state.conceptId, landmarkId: target.id });
      } else {
        heldCard.state.dragging = false;
        heldCard.position.x = heldCard.state.trayX;
        heldCard.position.y = heldCard.state.trayY;
        events.push({ type: 'placement_failed', conceptId: heldCard.state.conceptId });
      }

      runtime.heldCardId = null;
    }
  }

  return events;
}

function findSnapLandmark(card: ConceptCard, landmarks: LandmarkEntity[]): LandmarkEntity | undefined {
  const cardCenter = {
    x: card.position.x + card.bounds.w / 2,
    y: card.position.y + card.bounds.h / 2,
  };

  return landmarks.find((landmark) => distance(cardCenter, landmark.position) <= SNAP_RADIUS);
}

function pointInRect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}
