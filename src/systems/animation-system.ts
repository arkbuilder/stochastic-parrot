import type { ConceptCard } from '../entities/concept-card';
import type { LandmarkEntity } from '../entities/landmark';
import type { ParrotEntity } from '../entities/parrot';
import type { PlayerEntity } from '../entities/player';

export function updateAnimationSystem(
  player: PlayerEntity,
  parrot: ParrotEntity,
  landmarks: LandmarkEntity[],
  cards: ConceptCard[],
  dt: number,
): void {
  player.state.animationTime += dt;
  parrot.state.animationTime += dt;

  for (const landmark of landmarks) {
    landmark.state.glow += dt * 2;
    landmark.state.lockTimer = Math.max(0, landmark.state.lockTimer - dt);
  }

  for (const card of cards) {
    if (card.state.dragging) {
      continue;
    }

    if (!card.state.placed) {
      card.position.y = card.state.trayY + Math.sin(player.state.animationTime * 6 + card.position.x) * 0.4;
    }
  }
}
