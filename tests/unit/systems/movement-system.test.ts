import { describe, expect, it } from 'vitest';
import { updateMovementSystem } from '../../../src/systems/movement-system';
import { createPlayer } from '../../../src/entities/player';
import { createParrot } from '../../../src/entities/parrot';
import type { InputAction } from '../../../src/input/types';

function makeAction(type: string, extra: Record<string, unknown> = {}): InputAction {
  return { type, ...extra } as unknown as InputAction;
}

describe('updateMovementSystem', () => {
  describe('tap movement', () => {
    it('sets target to tap position (clamped)', () => {
      const player = createPlayer(100, 200);
      const parrot = createParrot(94, 190);
      const tap = makeAction('primary', { x: 150, y: 250 });
      updateMovementSystem(player, parrot, [tap], 0.016);
      expect(player.state.targetX).toBe(150);
      expect(player.state.targetY).toBe(250);
    });

    it('clamps target to playable bounds', () => {
      const player = createPlayer(100, 200);
      const parrot = createParrot(94, 190);
      const tapOutside = makeAction('primary', { x: 0, y: 0 });
      updateMovementSystem(player, parrot, [tapOutside], 0.016);
      expect(player.state.targetX).toBe(8);
      expect(player.state.targetY).toBe(64);
    });

    it('ignores taps below y=320 (UI area)', () => {
      const player = createPlayer(100, 200);
      const parrot = createParrot(94, 190);
      const uiTap = makeAction('primary', { x: 120, y: 350 });
      updateMovementSystem(player, parrot, [uiTap], 0.016);
      // Target should not change
      expect(player.state.targetX).toBe(100);
      expect(player.state.targetY).toBe(200);
    });
  });

  describe('keyboard/move action', () => {
    it('offsets target by dx/dy * 22 (clamped)', () => {
      const player = createPlayer(100, 200);
      const parrot = createParrot(94, 190);
      const move = makeAction('move', { dx: 1, dy: 0 });
      updateMovementSystem(player, parrot, [move], 0.016);
      expect(player.state.targetX).toBe(122);
      expect(player.state.targetY).toBe(200);
    });

    it('clamps move to bounds', () => {
      const player = createPlayer(215, 300);
      const parrot = createParrot(209, 290);
      const move = makeAction('move', { dx: 1, dy: 1 });
      updateMovementSystem(player, parrot, [move], 0.016);
      expect(player.state.targetX).toBeLessThanOrEqual(220);
      expect(player.state.targetY).toBeLessThanOrEqual(308);
    });
  });

  describe('player position interpolation', () => {
    it('moves toward target when distance > 1.5', () => {
      const player = createPlayer(100, 200);
      player.state.targetX = 200;
      player.state.targetY = 200;
      const parrot = createParrot(94, 190);
      updateMovementSystem(player, parrot, [], 0.5);
      expect(player.position.x).toBeGreaterThan(100);
    });

    it('stays in bounds during movement', () => {
      const player = createPlayer(8, 64);
      player.state.targetX = 8;
      player.state.targetY = 64;
      const parrot = createParrot(2, 54);
      updateMovementSystem(player, parrot, [], 1.0);
      expect(player.position.x).toBeGreaterThanOrEqual(8);
      expect(player.position.y).toBeGreaterThanOrEqual(64);
    });

    it('increments animation time when moving', () => {
      const player = createPlayer(100, 200);
      player.state.targetX = 200;
      player.state.targetY = 200;
      const parrot = createParrot(94, 190);
      const prevAnim = player.state.animationTime;
      updateMovementSystem(player, parrot, [], 0.1);
      expect(player.state.animationTime).toBeGreaterThan(prevAnim);
    });
  });

  describe('parrot following', () => {
    it('parrot follows player position', () => {
      const player = createPlayer(100, 200);
      const parrot = createParrot(50, 50);
      // Parrot in idle mode should track player
      updateMovementSystem(player, parrot, [], 1.0);
      // Parrot should have moved toward player
      expect(parrot.position.x).toBeGreaterThan(50);
      expect(parrot.position.y).toBeGreaterThan(50);
    });

    it('parrot sets mode to idle when close to target', () => {
      const player = createPlayer(100, 200);
      const parrot = createParrot(93, 189); // very close to (94, 190)
      parrot.state.mode = 'assist';
      updateMovementSystem(player, parrot, [], 0.5);
      // After getting close, mode should be idle
      expect(parrot.state.mode).toBe('idle');
    });

    it('increments parrot animation time', () => {
      const player = createPlayer(100, 200);
      const parrot = createParrot(50, 50);
      updateMovementSystem(player, parrot, [], 0.1);
      expect(parrot.state.animationTime).toBeGreaterThan(0);
    });
  });
});
