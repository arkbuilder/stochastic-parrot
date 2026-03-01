import { describe, expect, it } from 'vitest';
import { updateAnimationSystem } from '../../../src/systems/animation-system';
import { createPlayer } from '../../../src/entities/player';
import { createParrot } from '../../../src/entities/parrot';
import { createLandmark } from '../../../src/entities/landmark';
import { createConceptCard } from '../../../src/entities/concept-card';

describe('updateAnimationSystem', () => {
  it('increments player animation time', () => {
    const player = createPlayer(100, 200);
    const parrot = createParrot(94, 190);
    updateAnimationSystem(player, parrot, [], [], 0.1);
    expect(player.state.animationTime).toBeCloseTo(0.1);
  });

  it('increments parrot animation time', () => {
    const player = createPlayer(100, 200);
    const parrot = createParrot(94, 190);
    updateAnimationSystem(player, parrot, [], [], 0.1);
    expect(parrot.state.animationTime).toBeCloseTo(0.1);
  });

  it('increases landmark glow and decays lockTimer', () => {
    const lm = createLandmark('lm_1', 'c1', 60, 120);
    lm.state.glow = 0;
    lm.state.lockTimer = 1.0;
    const player = createPlayer(100, 200);
    const parrot = createParrot(94, 190);
    updateAnimationSystem(player, parrot, [lm], [], 0.5);
    expect(lm.state.glow).toBeGreaterThan(0);
    expect(lm.state.lockTimer).toBeLessThan(1.0);
  });

  it('lockTimer does not go below zero', () => {
    const lm = createLandmark('lm_1', 'c1', 60, 120);
    lm.state.lockTimer = 0.01;
    const player = createPlayer(100, 200);
    const parrot = createParrot(94, 190);
    updateAnimationSystem(player, parrot, [lm], [], 1.0);
    expect(lm.state.lockTimer).toBe(0);
  });

  it('bobs unplaced, non-dragging cards', () => {
    const card = createConceptCard('c1', 'x', 'X', '?', 50, 350);
    const player = createPlayer(100, 200);
    const parrot = createParrot(94, 190);
    const initialY = card.position.y;
    updateAnimationSystem(player, parrot, [], [card], 0.5);
    // The Y should have been altered by the sine bob
    expect(card.position.y).not.toBe(initialY);
  });

  it('does not bob cards that are being dragged', () => {
    const card = createConceptCard('c1', 'x', 'X', '?', 50, 350);
    card.state.dragging = true;
    const dragY = card.position.y;
    const player = createPlayer(100, 200);
    const parrot = createParrot(94, 190);
    updateAnimationSystem(player, parrot, [], [card], 0.5);
    expect(card.position.y).toBe(dragY);
  });

  it('does not bob placed cards', () => {
    const card = createConceptCard('c1', 'x', 'X', '?', 50, 350);
    card.state.placed = true;
    card.position.y = 120;
    const posY = card.position.y;
    const player = createPlayer(100, 200);
    const parrot = createParrot(94, 190);
    updateAnimationSystem(player, parrot, [], [card], 0.5);
    expect(card.position.y).toBe(posY);
  });
});
