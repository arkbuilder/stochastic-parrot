/**
 * Cinematic Logic Correctness Tests
 *
 * Validates that every cinematic beat is logically coherent:
 *   R2  — Ships should sit near the waterline
 *   R3  — All characters & props within canvas bounds (240×400)
 *   R4  — No duplicate character IDs in a single beat
 *   R5  — Every beat has a positive duration
 *   R6  — Beat IDs are globally unique
 *   R7  — Characters on a ship must be at or above the ship's y position
 *   R10 — Spatial grounding proximity (characters near ground, not on water)
 */

import { describe, it, expect } from 'vitest';
import { ISLAND_CINEMATICS } from '../../../src/cinematics/island-cinematics';
import { GAME_OVER_CINEMATIC } from '../../../src/cinematics/game-over-cinematics';
import type { CinematicBeat, CharacterId } from '../../../src/cinematics/types';
import {
  checkBeatGrounding,
  getGroundSurfaces,
  checkGrounding,
  HUMANOID_IDS,
  MAX_GROUND_GAP,
} from '../../../src/cinematics/cinematic-prover';

// ── Constants ────────────────────────────────────────────────

const HORIZON_Y = 160;
const CANVAS_W = 240;
const CANVAS_H = 400;

/** Character IDs that are human and require visual grounding below horizon. */
const HUMAN_CHARS: CharacterId[] = ['nemo', 'null'];

/** Character IDs that are ships / sea creatures and don't need grounding. */
const EXEMPT_CHARS: CharacterId[] = ['ship_loci', 'ship_overfit', 'kraken', 'space_kraken', 'bit'];

/** Prop kinds that provide visual grounding for characters. */
const GROUNDING_PROPS = ['island_silhouette', 'wreckage', 'splash'];

/** Character IDs that provide grounding (being on a ship). */
const GROUNDING_CHARS: CharacterId[] = ['ship_loci', 'ship_overfit'];

/**
 * Beat IDs explicitly allowed to have nemo on water (intentional atmosphere).
 * e.g. "Dark Night of the Soul" — alone on water is the point.
 */
const INTENTIONAL_WATER_BEATS = new Set<string>([
  'go_14_dark_night',
]);

// ── Collect every beat in the game ───────────────────────────

interface LabelledBeat {
  label: string; // e.g. "island_01.intro > i01_i_1"
  beat: CinematicBeat;
}

function collectAllBeats(): LabelledBeat[] {
  const all: LabelledBeat[] = [];

  // Island cinematics (base + DLC — ISLAND_CINEMATICS spreads DLC in)
  for (const [islandId, cine] of Object.entries(ISLAND_CINEMATICS)) {
    for (const beat of cine.intro.beats) {
      all.push({ label: `${islandId}.intro > ${beat.id}`, beat });
    }
    for (const beat of cine.outro.beats) {
      all.push({ label: `${islandId}.outro > ${beat.id}`, beat });
    }
  }

  // Game-over cinematic
  for (const beat of GAME_OVER_CINEMATIC.beats) {
    all.push({ label: `game_over > ${beat.id}`, beat });
  }

  return all;
}

const ALL_BEATS = collectAllBeats();

// ── Helpers ──────────────────────────────────────────────────

function beatHasGroundingProp(beat: CinematicBeat): boolean {
  return (beat.props ?? []).some((p) => GROUNDING_PROPS.includes(p.kind));
}

function beatHasGroundingCharacter(beat: CinematicBeat): boolean {
  return (beat.characters ?? []).some((c) =>
    (GROUNDING_CHARS as string[]).includes(c.id),
  );
}

function humanCharsBelowHorizon(beat: CinematicBeat): string[] {
  return (beat.characters ?? [])
    .filter((c) => (HUMAN_CHARS as string[]).includes(c.id) && c.y > HORIZON_Y)
    .map((c) => c.id);
}

// ── Tests ────────────────────────────────────────────────────

describe('Cinematic logic correctness', () => {
  // Sanity: we collected a meaningful number of beats
  it('collects at least 60 beats across all cinematics', () => {
    expect(ALL_BEATS.length).toBeGreaterThanOrEqual(60);
  });

  // ── R10: Spatial grounding proximity (replaces R1) ────────
  // R1 only checked for PRESENCE of a grounding prop.
  // R10 verifies the character is NEAR the ground surface (within MAX_GROUND_GAP px).
  describe('R10 — grounding proximity (no standing on water)', () => {
    for (const { label, beat } of ALL_BEATS) {
      const humans = (beat.characters ?? [])
        .filter((c) => (HUMANOID_IDS as readonly string[]).includes(c.id) && c.y > HORIZON_Y);
      if (humans.length === 0) continue;
      if (INTENTIONAL_WATER_BEATS.has(beat.id)) continue;

      it(`${label}: ${humans.map((c) => c.id).join(', ')} within ${MAX_GROUND_GAP}px of ground`, () => {
        const violations = checkBeatGrounding(beat, INTENTIONAL_WATER_BEATS);
        expect(violations, violations.map((v) => v.message).join('\n')).toHaveLength(0);
      });
    }
  });

  // ── R2: Ships sit near waterline (y 160–230) ─────────────
  describe('R2 — ships near the waterline', () => {
    const SHIP_IDS: CharacterId[] = ['ship_loci', 'ship_overfit'];
    for (const { label, beat } of ALL_BEATS) {
      const ships = (beat.characters ?? []).filter((c) =>
        (SHIP_IDS as string[]).includes(c.id),
      );
      for (const ship of ships) {
        it(`${label}: ${ship.id} y=${ship.y} within 160–230`, () => {
          expect(ship.y).toBeGreaterThanOrEqual(160);
          expect(ship.y).toBeLessThanOrEqual(230);
        });
      }
    }
  });

  // ── R3: All placements within canvas bounds ───────────────
  describe('R3 — characters & props within 240×400 canvas', () => {
    for (const { label, beat } of ALL_BEATS) {
      for (const c of beat.characters ?? []) {
        it(`${label}: char ${c.id} in bounds (${c.x},${c.y})`, () => {
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.x).toBeLessThanOrEqual(CANVAS_W);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeLessThanOrEqual(CANVAS_H);
        });
      }
      for (const p of beat.props ?? []) {
        it(`${label}: prop ${p.kind} in bounds (${p.x},${p.y})`, () => {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(CANVAS_W);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(CANVAS_H);
        });
      }
    }
  });

  // ── R4: No duplicate character IDs per beat ───────────────
  describe('R4 — unique character IDs per beat', () => {
    for (const { label, beat } of ALL_BEATS) {
      const chars = beat.characters ?? [];
      if (chars.length <= 1) continue;
      it(`${label}: no duplicate char IDs`, () => {
        const ids = chars.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
      });
    }
  });

  // ── R5: Positive duration ─────────────────────────────────
  describe('R5 — positive duration', () => {
    for (const { label, beat } of ALL_BEATS) {
      it(`${label}: durationS > 0`, () => {
        expect(beat.durationS).toBeGreaterThan(0);
      });
    }
  });

  // ── R6: Globally unique beat IDs ──────────────────────────
  describe('R6 — globally unique beat IDs', () => {
    it('no duplicate beat IDs across all cinematics', () => {
      const ids = ALL_BEATS.map((b) => b.beat.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dupes, `Duplicate beat IDs: ${dupes.join(', ')}`).toEqual([]);
    });
  });

  // ── R7: Characters on a ship above ship y ─────────────────
  describe('R7 — characters above ship deck level', () => {
    const SHIP_IDS: CharacterId[] = ['ship_loci', 'ship_overfit'];
    for (const { label, beat } of ALL_BEATS) {
      const ships = (beat.characters ?? []).filter((c) =>
        (SHIP_IDS as string[]).includes(c.id),
      );
      const nonShips = (beat.characters ?? []).filter(
        (c) => !(SHIP_IDS as string[]).includes(c.id) && !(EXEMPT_CHARS as string[]).includes(c.id),
      );
      for (const ship of ships) {
        for (const ch of nonShips) {
          // Human on the same ship should be at or above ship y
          // (lower y = higher on screen, but characters are drawn at their y,
          //  so a character with y much GREATER than the ship is BELOW the ship — fine
          //  if there's island grounding. The concern is floating ABOVE the ship.)
          // Character y < ship y means they're drawn ABOVE the ship on screen
          // which only makes sense if the difference is small (on-deck offset).
          // We check they're not floating ridiculously above (> 40 px gap).
          if (ch.y < ship.y) {
            it(`${label}: ${ch.id} y=${ch.y} not floating far above ${ship.id} y=${ship.y}`, () => {
              const gap = ship.y - ch.y;
              expect(gap).toBeLessThanOrEqual(40);
            });
          }
        }
      }
    }
  });

  // ── Prover self-tests ─────────────────────────────────────
  describe('Prover — getGroundSurfaces & checkGrounding', () => {
    it('island at (120,268,1.5) grounds nemo at (120,280)', () => {
      const beat: CinematicBeat = {
        id: 'test_grounded', durationS: 3, sky: 'dawn',
        characters: [{ id: 'nemo', x: 120, y: 280 }],
        props: [{ kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 }],
      };
      const surfaces = getGroundSurfaces(beat);
      expect(surfaces).toHaveLength(1);
      const { grounded, gap } = checkGrounding(beat.characters![0]!, surfaces);
      expect(grounded).toBe(true);
      expect(gap).toBeLessThanOrEqual(MAX_GROUND_GAP);
    });

    it('island at (120,120,1.4) does NOT ground nemo at (120,280)', () => {
      const beat: CinematicBeat = {
        id: 'test_water', durationS: 3, sky: 'dawn',
        characters: [{ id: 'nemo', x: 120, y: 280 }],
        props: [{ kind: 'island_silhouette', x: 120, y: 120, scale: 1.4 }],
      };
      const surfaces = getGroundSurfaces(beat);
      const { grounded, gap } = checkGrounding(beat.characters![0]!, surfaces);
      expect(grounded).toBe(false);
      expect(gap).toBeGreaterThan(MAX_GROUND_GAP);
    });

    it('ship deck grounds nemo standing on it', () => {
      const beat: CinematicBeat = {
        id: 'test_ship', durationS: 3, sky: 'dawn',
        characters: [
          { id: 'ship_loci', x: 60, y: 210, scale: 0.6 },
          { id: 'nemo', x: 60, y: 205, scale: 1 },
        ],
      };
      const surfaces = getGroundSurfaces(beat);
      expect(surfaces.length).toBeGreaterThanOrEqual(1);
      const { grounded } = checkGrounding(beat.characters![1]!, surfaces);
      expect(grounded).toBe(true);
    });

    it('character outside horizontal range is not grounded', () => {
      const beat: CinematicBeat = {
        id: 'test_horiz', durationS: 3, sky: 'dawn',
        characters: [{ id: 'nemo', x: 10, y: 280 }],
        props: [{ kind: 'island_silhouette', x: 200, y: 268, scale: 1 }],
      };
      const surfaces = getGroundSurfaces(beat);
      const { grounded } = checkGrounding(beat.characters![0]!, surfaces);
      expect(grounded).toBe(false);
    });

    it('checkBeatGrounding skips beats in allowedWaterBeats', () => {
      const beat: CinematicBeat = {
        id: 'on_water_ok', durationS: 3, sky: 'dark_sea',
        characters: [{ id: 'nemo', x: 120, y: 290 }],
      };
      const violations = checkBeatGrounding(beat, new Set(['on_water_ok']));
      expect(violations).toHaveLength(0);
    });

    it('checkBeatGrounding flags ungrounded humanoids', () => {
      const beat: CinematicBeat = {
        id: 'not_allowed', durationS: 3, sky: 'dawn',
        characters: [{ id: 'nemo', x: 120, y: 280 }],
      };
      const violations = checkBeatGrounding(beat);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]!.rule).toBe('R10-grounding');
    });

    it('checkBeatGrounding skips non-humanoid characters', () => {
      const beat: CinematicBeat = {
        id: 'bit_flies', durationS: 3, sky: 'dawn',
        characters: [{ id: 'bit', x: 120, y: 280 }],
      };
      const violations = checkBeatGrounding(beat);
      expect(violations).toHaveLength(0);
    });

    it('checkBeatGrounding skips humanoids above horizon', () => {
      const beat: CinematicBeat = {
        id: 'above_sky', durationS: 3, sky: 'dawn',
        characters: [{ id: 'nemo', x: 120, y: 100 }],
      };
      const violations = checkBeatGrounding(beat);
      expect(violations).toHaveLength(0);
    });
  });
});
