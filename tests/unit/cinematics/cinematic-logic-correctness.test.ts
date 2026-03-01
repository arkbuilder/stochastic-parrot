/**
 * Cinematic Logic Correctness Tests
 *
 * Validates that every cinematic beat is logically coherent:
 *   R1 — Human characters below the horizon must have visual grounding
 *   R2 — Ships should sit near the waterline
 *   R3 — All characters & props within canvas bounds (240×400)
 *   R4 — No duplicate character IDs in a single beat
 *   R5 — Every beat has a positive duration
 *   R6 — Beat IDs are globally unique
 *   R7 — Characters on a ship must be at or above the ship's y position
 *   R8 — Kraken/space_kraken need no grounding (sea creatures)
 *   R9 — Bit alone (parrot can fly) needs no grounding
 */

import { describe, it, expect } from 'vitest';
import { ISLAND_CINEMATICS } from '../../../src/cinematics/island-cinematics';
import { GAME_OVER_CINEMATIC } from '../../../src/cinematics/game-over-cinematics';
import type { CinematicBeat, CharacterId } from '../../../src/cinematics/types';

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

  // ── R1: Human characters below horizon need grounding ────
  describe('R1 — human characters below horizon have visual grounding', () => {
    for (const { label, beat } of ALL_BEATS) {
      const humans = humanCharsBelowHorizon(beat);
      if (humans.length === 0) continue; // no humans below horizon → skip
      if (INTENTIONAL_WATER_BEATS.has(beat.id)) continue; // allowed exception

      it(`${label}: ${humans.join(', ')} grounded`, () => {
        const grounded = beatHasGroundingProp(beat) || beatHasGroundingCharacter(beat);
        expect(
          grounded,
          `Beat "${beat.id}" has ${humans.join(', ')} at y > ${HORIZON_Y} ` +
          `with no grounding prop (${GROUNDING_PROPS.join('/')}) ` +
          `or grounding character (${GROUNDING_CHARS.join('/')}).`,
        ).toBe(true);
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
});
