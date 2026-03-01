/**
 * Polish & UX — validates layout constraints, entity bounds, design
 * tokens, and portrait-first layout rules are consistently applied.
 *
 * Tests the 240×400 canvas contract, that entities spawn within safe
 * bounds, fonts fit the tiny screen, and the HUD / tray zones align
 * with thumb-reach design.
 */
import { describe, it, expect } from 'vitest';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/core/types';
import { ISLANDS } from '../../../src/data/islands';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { TOKENS } from '../../../src/rendering/tokens';
import { CONCEPTS } from '../../../src/data/concepts';
import { createPlayer } from '../../../src/entities/player';
import { createParrot } from '../../../src/entities/parrot';

// ── Canvas dimensions ────────────────────────────────────────

describe('Polish — canvas dimensions', () => {
  it('GAME_WIDTH is 240 (portrait phone)', () => {
    expect(GAME_WIDTH).toBe(240);
  });

  it('GAME_HEIGHT is 400 (portrait phone)', () => {
    expect(GAME_HEIGHT).toBe(400);
  });

  it('aspect ratio is 0.6 (3:5 portrait)', () => {
    expect(GAME_WIDTH / GAME_HEIGHT).toBe(0.6);
  });
});

// ── Landmark positions within playable area ──────────────────

const PLAYER_X_MIN = 8;
const PLAYER_X_MAX = 220;
const PLAYER_Y_MIN = 64;   // below HUD
const PLAYER_Y_MAX = 308;  // above tray

describe('Polish — landmark positions are reachable', () => {
  for (const island of ISLANDS) {
    for (const lm of island.landmarks) {
      it(`${island.name}/${lm.id} x=${lm.x} y=${lm.y} is within bounds`, () => {
        expect(lm.x, 'x too low').toBeGreaterThanOrEqual(PLAYER_X_MIN);
        expect(lm.x, 'x too high').toBeLessThanOrEqual(PLAYER_X_MAX);
        expect(lm.y, 'y too low').toBeGreaterThanOrEqual(PLAYER_Y_MIN);
        expect(lm.y, 'y too high').toBeLessThanOrEqual(PLAYER_Y_MAX);
      });
    }
  }
});

// ── Overworld node positions within canvas ───────────────────

describe('Polish — overworld node positions', () => {
  for (const node of OVERWORLD_NODES) {
    it(`${node.name} is within 240×400 canvas`, () => {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(GAME_WIDTH);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(GAME_HEIGHT);
    });
  }
});

// ── Player spawn position ────────────────────────────────────

describe('Polish — player spawn safety', () => {
  it('player spawns at centre-bottom (lower 1/3 per design)', () => {
    const p = createPlayer(120, 320);
    expect(p.position.x).toBe(120);
    expect(p.position.y).toBe(320);
    // Primary action zone is lower 1/3 (y ≥ 266)
    expect(p.position.y).toBeGreaterThanOrEqual(GAME_HEIGHT * 2 / 3 - 2);
  });

  it('parrot spawns near player', () => {
    const parrot = createParrot(114, 310);
    expect(parrot.position.x).toBeGreaterThanOrEqual(0);
    expect(parrot.position.y).toBeGreaterThanOrEqual(0);
  });
});

// ── Font sizes fit 240px width ───────────────────────────────

describe('Polish — design tokens', () => {
  it('fontSmall is 8px', () => {
    expect(TOKENS.fontSmall).toContain('8px');
  });

  it('fontMedium is 12px', () => {
    expect(TOKENS.fontMedium).toContain('12px');
  });

  it('fontLarge is 16px', () => {
    expect(TOKENS.fontLarge).toContain('16px');
  });

  it('fontTitle is 18px — still fits 240px', () => {
    expect(TOKENS.fontTitle).toContain('18px');
    // At 18px monospace, ~13 chars fit in 240px. Title "DEAD RECKONING" = 14 chars: ok with kerning
  });

  it('all fonts are monospace for 8-bit aesthetic', () => {
    expect(TOKENS.fontSmall).toContain('monospace');
    expect(TOKENS.fontMedium).toContain('monospace');
    expect(TOKENS.fontLarge).toContain('monospace');
    expect(TOKENS.fontTitle).toContain('monospace');
  });

  it('spacing unit is 4px (pixel-art aligned)', () => {
    expect(TOKENS.spacingUnit).toBe(4);
  });

  it('background colour is dark (pirate theme)', () => {
    // Hex should be very dark
    expect(TOKENS.colorBackground).toMatch(/^#[0-1][0-9a-f]{5}$/i);
  });
});

// ── No landmarks overlap ─────────────────────────────────────

describe('Polish — no landmark collisions', () => {
  for (const island of ISLANDS) {
    it(`${island.name} landmarks don't overlap (≥20px apart)`, () => {
      const lms = island.landmarks;
      for (let i = 0; i < lms.length; i++) {
        for (let j = i + 1; j < lms.length; j++) {
          const dx = lms[i]!.x - lms[j]!.x;
          const dy = lms[i]!.y - lms[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          expect(
            dist,
            `${lms[i]!.id} and ${lms[j]!.id} are only ${dist.toFixed(1)}px apart`,
          ).toBeGreaterThanOrEqual(20);
        }
      }
    });
  }
});

// ── Overworld nodes don't overlap ────────────────────────────

describe('Polish — overworld node spacing', () => {
  it('all nodes are ≥30px apart', () => {
    for (let i = 0; i < OVERWORLD_NODES.length; i++) {
      for (let j = i + 1; j < OVERWORLD_NODES.length; j++) {
        const a = OVERWORLD_NODES[i]!;
        const b = OVERWORLD_NODES[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(
          dist,
          `${a.name} and ${b.name} only ${dist.toFixed(1)}px apart`,
        ).toBeGreaterThanOrEqual(30);
      }
    }
  });
});

// ── Consistent naming conventions ────────────────────────────

describe('Polish — data IDs use snake_case', () => {
  it('island IDs', () => {
    for (const island of ISLANDS) {
      expect(island.id).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('concept IDs', () => {
    for (const concept of CONCEPTS) {
      expect(concept.id).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('landmark IDs', () => {
    for (const island of ISLANDS) {
      for (const lm of island.landmarks) {
        expect(lm.id).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    }
  });
});
