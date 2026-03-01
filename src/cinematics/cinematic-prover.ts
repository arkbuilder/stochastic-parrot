/**
 * Cinematic Prover — spatial validation for cinematic beat layouts.
 *
 * Pure functions that detect layout problems at test time:
 *   - Characters standing on water (below horizon without ground)
 *   - Characters spatially misaligned from grounding surfaces
 *   - Objects out of canvas bounds
 *
 * Import these in test files to assert spatial invariants
 * across all cinematic data.
 *
 * See tests/unit/cinematics/cinematic-logic-correctness.test.ts
 * for the integration that runs the prover against every beat.
 */

import type { CinematicBeat, CharacterId, CharacterPlacement } from './types';

// ── Spatial constants ────────────────────────────────────────

/** Y coordinate where the ocean begins. Sky above, water below. */
export const HORIZON_Y = 160;

/** Game canvas width (virtual pixels). */
export const CANVAS_W = 240;

/** Game canvas height (virtual pixels). */
export const CANVAS_H = 400;

/**
 * Max vertical distance (px) a humanoid can be below the nearest
 * ground surface before flagged as "standing on water".
 */
export const MAX_GROUND_GAP = 50;

/**
 * Horizontal tolerance (px) beyond a ground surface edge.
 * Allows slight artistic offset without triggering a violation.
 */
export const HORIZONTAL_TOLERANCE = 40;

// ── Character classification ─────────────────────────────────

/** Human characters that physically need ground to stand on. */
export const HUMANOID_IDS: readonly CharacterId[] = ['nemo', 'null'];

/** Ship characters — float at waterline, provide deck grounding. */
export const SHIP_IDS: readonly CharacterId[] = ['ship_loci', 'ship_overfit'];

/** Sea creatures — exempt from grounding checks. */
export const AQUATIC_IDS: readonly CharacterId[] = ['kraken', 'space_kraken'];

/** Flying characters — exempt from grounding checks. */
export const FLYING_IDS: readonly CharacterId[] = ['bit'];

export function isHumanoid(id: CharacterId): boolean {
  return (HUMANOID_IDS as readonly string[]).includes(id);
}

export function isShip(id: CharacterId): boolean {
  return (SHIP_IDS as readonly string[]).includes(id);
}

// ── Ground surface model ─────────────────────────────────────

/**
 * A rectangular zone where a character can stand.
 * Derived from prop geometry or ship deck position.
 */
export interface GroundSurface {
  /** Left edge x (virtual pixels). */
  xMin: number;
  /** Right edge x (virtual pixels). */
  xMax: number;
  /** Bottom of the surface where feet meet ground (y increases downward). */
  yLevel: number;
  /** Human-readable source for error messages. */
  source: string;
}

/**
 * Extract ground surfaces from a beat's props and ship characters.
 *
 * Geometry per source (all in local coords scaled by prop.scale):
 *   - island_silhouette: hill base at y+10·s, ±30·s wide
 *   - wreckage: hull bottom y+8·s, ±10·s wide
 *   - splash: water impact y+2·s, ±15·s wide
 *   - ship deck: y+7·s, ±15·s wide
 */
export function getGroundSurfaces(beat: CinematicBeat): GroundSurface[] {
  const surfaces: GroundSurface[] = [];

  for (const p of beat.props ?? []) {
    const s = p.scale ?? 1;
    switch (p.kind) {
      case 'island_silhouette':
        surfaces.push({
          xMin: p.x - 30 * s,
          xMax: p.x + 30 * s,
          yLevel: p.y + 10 * s,
          source: `island@(${p.x},${p.y},s=${s})`,
        });
        break;
      case 'wreckage':
        surfaces.push({
          xMin: p.x - 10 * s,
          xMax: p.x + 10 * s,
          yLevel: p.y + 8 * s,
          source: `wreckage@(${p.x},${p.y},s=${s})`,
        });
        break;
      case 'splash':
        surfaces.push({
          xMin: p.x - 15 * s,
          xMax: p.x + 15 * s,
          yLevel: p.y + 2 * s,
          source: `splash@(${p.x},${p.y},s=${s})`,
        });
        break;
    }
  }

  for (const c of beat.characters ?? []) {
    if (isShip(c.id)) {
      const s = c.scale ?? 1;
      surfaces.push({
        xMin: c.x - 15 * s,
        xMax: c.x + 15 * s,
        yLevel: c.y + 7 * s,
        source: `${c.id}@(${c.x},${c.y},s=${s})`,
      });
    }
  }

  return surfaces;
}

/**
 * Check if a character position is within grounding range of any surface.
 *
 * A positive gap means the character is below the surface (in water).
 * A negative gap means the character is above the surface (on higher ground).
 * Grounded when gap ≤ MAX_GROUND_GAP.
 */
export function checkGrounding(
  char: CharacterPlacement,
  surfaces: GroundSurface[],
): { grounded: boolean; gap: number; surface: string } {
  let bestGap = Infinity;
  let bestSurface = 'none';

  for (const s of surfaces) {
    if (char.x < s.xMin - HORIZONTAL_TOLERANCE) continue;
    if (char.x > s.xMax + HORIZONTAL_TOLERANCE) continue;

    const gap = char.y - s.yLevel;
    if (Math.abs(gap) < Math.abs(bestGap)) {
      bestGap = gap;
      bestSurface = s.source;
    }
  }

  return {
    grounded: bestGap <= MAX_GROUND_GAP,
    gap: bestGap,
    surface: bestSurface,
  };
}

// ── Violation reporting ──────────────────────────────────────

export interface ProverViolation {
  rule: string;
  beatId: string;
  message: string;
}

/**
 * Check a beat for grounding violations.
 *
 * Flags every humanoid below the horizon that is more than
 * MAX_GROUND_GAP pixels below the nearest ground surface.
 */
export function checkBeatGrounding(
  beat: CinematicBeat,
  allowedWaterBeats?: ReadonlySet<string>,
): ProverViolation[] {
  const violations: ProverViolation[] = [];
  const surfaces = getGroundSurfaces(beat);

  for (const c of beat.characters ?? []) {
    if (!isHumanoid(c.id)) continue;
    if (c.y <= HORIZON_Y) continue;
    if (allowedWaterBeats?.has(beat.id)) continue;

    const { grounded, gap, surface } = checkGrounding(c, surfaces);
    if (!grounded) {
      const detail = gap === Infinity
        ? 'no ground surfaces in beat'
        : `${Math.round(gap)}px below ${surface} (max ${MAX_GROUND_GAP}px)`;
      violations.push({
        rule: 'R10-grounding',
        beatId: beat.id,
        message: `${c.id} at (${c.x},${c.y}) standing on water — ${detail}`,
      });
    }
  }

  return violations;
}
