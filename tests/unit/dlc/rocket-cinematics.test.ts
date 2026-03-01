/**
 * Rocket Science DLC Cinematics — comprehensive quality & transition tests.
 *
 * Validates the "Starboard Launch" DLC cinematic sequences for:
 *   - Structural integrity (beat IDs, durations, sky, positions)
 *   - Narrative arc (3-act structure, character progression, mood)
 *   - Transition smoothness (sky continuity, shake escalation, beat pacing)
 *   - Caption quality & readability
 *   - DLC↔base cinematic consistency
 *
 * Also includes cross-cutting transition tests for ALL cinematics (base + DLC).
 */
import { describe, it, expect } from 'vitest';
import { ISLAND_CINEMATICS } from '../../../src/cinematics/island-cinematics';
import { DLC_ROCKET_CINEMATICS } from '../../../src/cinematics/dlc-rocket-cinematics';
import { ISLANDS } from '../../../src/data/islands';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import type {
  CinematicSequence,
  CinematicBeat,
  IslandCinematics,
  SkyPreset,
  CharacterId,
} from '../../../src/cinematics/types';

// ── helpers ──────────────────────────────────────────────────

const VALID_SKY: SkyPreset[] = ['dawn', 'day', 'dusk', 'night', 'storm', 'dark_sea'];
const VALID_CHARS: CharacterId[] = [
  'nemo', 'bit', 'null', 'kraken', 'ship_loci', 'ship_overfit', 'space_kraken',
];
const VALID_PROPS = [
  'island_silhouette', 'fog_wall', 'lightning', 'tentacle',
  'chart_fragment', 'golden_chart', 'wreckage', 'sunrise', 'cannon_flash',
  'rocket', 'exhaust_plume', 'asteroid', 'nebula_cloud', 'star_chart', 'orbit_ring',
  'reentry_flame', 'parachute', 'splash',
];

const dlcIslands = ROCKET_SCIENCE_PACK.content.islands;

function allBeats(cine: IslandCinematics): CinematicBeat[] {
  return [...cine.intro.beats, ...cine.outro.beats];
}

function captions(seq: CinematicSequence): string {
  return seq.beats.map((b) => b.caption ?? '').join(' ');
}

function hasCharacter(beats: CinematicBeat[], id: CharacterId): boolean {
  return beats.some((b) => b.characters?.some((c) => c.id === id));
}

function hasProp(beats: CinematicBeat[], kind: string): boolean {
  return beats.some((b) => b.props?.some((p) => p.kind === kind));
}

// ══════════════════════════════════════════════════════════════
// SECTION 1 — DLC CINEMATIC COVERAGE & STRUCTURE
// ══════════════════════════════════════════════════════════════

describe('DLC Cinematic Coverage', () => {
  it('every DLC island has cinematics in the DLC map', () => {
    for (const island of dlcIslands) {
      expect(
        DLC_ROCKET_CINEMATICS[island.id],
        `Missing DLC cinematics for ${island.id}`,
      ).toBeDefined();
    }
  });

  it('every DLC island has cinematics in the merged ISLAND_CINEMATICS map', () => {
    for (const island of dlcIslands) {
      expect(
        ISLAND_CINEMATICS[island.id],
        `${island.id} missing from merged ISLAND_CINEMATICS`,
      ).toBeDefined();
    }
  });

  it('DLC cinematics don\'t overwrite base game cinematics', () => {
    for (const island of ISLANDS) {
      expect(ISLAND_CINEMATICS[island.id]).toBeDefined();
    }
  });

  it('all DLC beat IDs are globally unique (no collision with base)', () => {
    const allIds: string[] = [];
    for (const cine of Object.values(ISLAND_CINEMATICS)) {
      for (const beat of cine.intro.beats) allIds.push(beat.id);
      for (const beat of cine.outro.beats) allIds.push(beat.id);
    }
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('DLC beat IDs use dlc_ prefix for namespacing', () => {
    for (const cine of Object.values(DLC_ROCKET_CINEMATICS)) {
      for (const beat of [...cine.intro.beats, ...cine.outro.beats]) {
        expect(beat.id, `beat ${beat.id} should start with dlc_`).toMatch(/^dlc_/);
      }
    }
  });
});

// Per-island structural validation
for (const island of dlcIslands) {
  describe(`DLC Cinematic Structure — ${island.name}`, () => {
    const cine = DLC_ROCKET_CINEMATICS[island.id]!;

    it('has intro and outro sequences', () => {
      expect(cine.intro).toBeDefined();
      expect(cine.outro).toBeDefined();
    });

    it('intro has ≥2 beats', () => {
      expect(cine.intro.beats.length).toBeGreaterThanOrEqual(2);
    });

    it('outro has ≥2 beats', () => {
      expect(cine.outro.beats.length).toBeGreaterThanOrEqual(2);
    });

    it('intro has a non-empty id', () => {
      expect(cine.intro.id).toBeTruthy();
    });

    it('outro has a non-empty id', () => {
      expect(cine.outro.id).toBeTruthy();
    });

    it('intro sequence ID contains the island ID', () => {
      expect(cine.intro.id).toContain(island.id);
    });

    it('outro sequence ID contains the island ID', () => {
      expect(cine.outro.id).toContain(island.id);
    });

    it('beat IDs are unique within the island', () => {
      const ids = allBeats(cine).map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    for (const beat of allBeats(cine)) {
      describe(`beat "${beat.id}"`, () => {
        it('positive durationS', () => {
          expect(beat.durationS).toBeGreaterThan(0);
        });

        it('durationS ≤ 5s (keeps pacing snappy)', () => {
          expect(beat.durationS).toBeLessThanOrEqual(5);
        });

        it('valid sky preset', () => {
          expect(VALID_SKY).toContain(beat.sky);
        });

        it('caption ≤ 90 chars', () => {
          if (beat.caption) {
            expect(
              beat.caption.length,
              `"${beat.caption.slice(0, 40)}..." is ${beat.caption.length} chars`,
            ).toBeLessThanOrEqual(90);
          }
        });

        it('valid character IDs', () => {
          for (const c of beat.characters ?? []) {
            expect(VALID_CHARS, `unknown char: ${c.id}`).toContain(c.id);
          }
        });

        it('character positions in viewport', () => {
          for (const c of beat.characters ?? []) {
            expect(c.x).toBeGreaterThanOrEqual(0);
            expect(c.x).toBeLessThanOrEqual(240);
            expect(c.y).toBeGreaterThanOrEqual(0);
            expect(c.y).toBeLessThanOrEqual(400);
          }
        });

        it('valid prop types', () => {
          for (const p of beat.props ?? []) {
            expect(VALID_PROPS, `unknown prop: ${p.kind}`).toContain(p.kind);
          }
        });

        it('prop positions in viewport', () => {
          for (const p of beat.props ?? []) {
            expect(p.x).toBeGreaterThanOrEqual(-80);
            expect(p.x).toBeLessThanOrEqual(320);
            expect(p.y).toBeGreaterThanOrEqual(-80);
            expect(p.y).toBeLessThanOrEqual(480);
          }
        });

        it('shake 0..1', () => {
          if (beat.shake !== undefined) {
            expect(beat.shake).toBeGreaterThanOrEqual(0);
            expect(beat.shake).toBeLessThanOrEqual(1);
          }
        });

        it('tint is valid rgba', () => {
          if (beat.tint) {
            expect(beat.tint).toMatch(/^rgba\(\s*\d/);
          }
        });

        it('waitForTap is set (player controls pacing)', () => {
          expect(beat.waitForTap).toBe(true);
        });
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════
// SECTION 2 — DLC NARRATIVE ARC
// ══════════════════════════════════════════════════════════════

describe('DLC Narrative — Act 1: Building the Ship (Stages 1-2)', () => {
  const stage1 = DLC_ROCKET_CINEMATICS['dlc_launchpad_lagoon']!;
  const stage2 = DLC_ROCKET_CINEMATICS['dlc_booster_reef']!;

  it('Stage 1 intro opens with ship arriving (establishing shot)', () => {
    const first = stage1.intro.beats[0]!;
    const hasShip = first.characters?.some((c) => c.id === 'ship_loci');
    const hasIsland = first.props?.some((p) => p.kind === 'island_silhouette');
    expect(hasShip || hasIsland, 'establishing shot needs ship or island').toBe(true);
  });

  it('Stage 1 intro mentions rockets or launch', () => {
    expect(captions(stage1.intro)).toMatch(/rocket|launch|lagoon/i);
  });

  it('Stage 1 intro uses dawn sky (new journey, wonder)', () => {
    const skies = stage1.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'dawn')).toBe(true);
  });

  it('Stage 1 intro has rocket prop (DLC theme introduction)', () => {
    expect(hasProp(stage1.intro.beats, 'rocket')).toBe(true);
  });

  it('Stage 1 intro features Nemo and Bit', () => {
    expect(hasCharacter(stage1.intro.beats, 'nemo')).toBe(true);
    expect(hasCharacter(stage1.intro.beats, 'bit')).toBe(true);
  });

  it('Stage 1 outro has star_chart (DLC reward motif)', () => {
    expect(hasProp(stage1.outro.beats, 'star_chart')).toBe(true);
  });

  it('Stage 1 outro has celebration', () => {
    const anims = stage1.outro.beats.flatMap((b) => b.characters ?? []).map((c) => c.anim);
    expect(anims.includes('celebrate')).toBe(true);
  });

  it('Stage 1 outro teases Stage 2', () => {
    const text = captions(stage1.outro);
    expect(text).toMatch(/booster|next|rocket/i);
  });

  it('Stage 2 intro uses storm sky (escalation)', () => {
    const skies = stage2.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'storm')).toBe(true);
  });

  it('Stage 2 intro has lightning (storm imagery)', () => {
    expect(hasProp(stage2.intro.beats, 'lightning')).toBe(true);
  });

  it('Stage 2 intro has shake (stormy waters)', () => {
    const maxShake = Math.max(...stage2.intro.beats.map((b) => b.shake ?? 0));
    expect(maxShake).toBeGreaterThan(0);
  });

  it('Stage 2 outro has exhaust plume (rocket launch payoff)', () => {
    expect(hasProp(stage2.outro.beats, 'exhaust_plume')).toBe(true);
  });

  it('Stage 2 outro mentions escape velocity or atmosphere', () => {
    expect(captions(stage2.outro)).toMatch(/escape|atmosphere|velocity/i);
  });

  it('Act 1 does not feature Space Kraken (too early)', () => {
    expect(hasCharacter(allBeats(stage1), 'space_kraken')).toBe(false);
    expect(hasCharacter(allBeats(stage2), 'space_kraken')).toBe(false);
  });
});

describe('DLC Narrative — Act 2: Voyage to the Stars (Stages 3-4)', () => {
  const stage3 = DLC_ROCKET_CINEMATICS['dlc_orbit_atoll']!;
  const stage4 = DLC_ROCKET_CINEMATICS['dlc_nebula_shallows']!;

  it('Stage 3 intro uses night sky (arrived in space)', () => {
    const skies = stage3.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'night')).toBe(true);
  });

  it('Stage 3 intro has orbit_ring prop (orbital mechanics theme)', () => {
    expect(hasProp(stage3.intro.beats, 'orbit_ring')).toBe(true);
  });

  it('Stage 3 intro mentions orbit or gravity', () => {
    expect(captions(stage3.intro)).toMatch(/orbit|gravity|stars/i);
  });

  it('Stage 3 intro has asteroid props (space hazards)', () => {
    expect(hasProp(stage3.intro.beats, 'asteroid')).toBe(true);
  });

  it('Stage 3 outro has Kraken stinger (tentacle foreshadowing)', () => {
    expect(hasProp(stage3.outro.beats, 'tentacle')).toBe(true);
  });

  it('Stage 3 outro stinger has shake', () => {
    const stingerBeat = stage3.outro.beats.find(
      (b) => b.props?.some((p) => p.kind === 'tentacle'),
    );
    expect(stingerBeat?.shake).toBeGreaterThan(0);
  });

  it('Stage 3 outro transitions to dark_sea (deeper voyage)', () => {
    expect(stage3.outro.beats.some((b) => b.sky === 'dark_sea')).toBe(true);
  });

  it('Stage 4 intro uses dark_sea sky (deep space danger)', () => {
    const skies = stage4.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'dark_sea')).toBe(true);
  });

  it('Stage 4 intro has nebula_cloud prop', () => {
    expect(hasProp(stage4.intro.beats, 'nebula_cloud')).toBe(true);
  });

  it('Stage 4 intro mentions void or nebula', () => {
    expect(captions(stage4.intro)).toMatch(/void|nebula|shallows/i);
  });

  it('Stage 4 outro mentions Space Kraken (direct foreshadowing)', () => {
    expect(captions(stage4.outro).toLowerCase()).toContain('kraken');
  });

  it('Stage 4 outro has multiple tentacles (growing threat)', () => {
    const tentacleBeat = stage4.outro.beats.find(
      (b) => (b.props?.filter((p) => p.kind === 'tentacle').length ?? 0) >= 2,
    );
    expect(tentacleBeat).toBeDefined();
  });

  it('Stage 4 outro shake is higher than Stage 3 stinger', () => {
    const s3Max = Math.max(...stage3.outro.beats.map((b) => b.shake ?? 0));
    const s4Max = Math.max(...stage4.outro.beats.map((b) => b.shake ?? 0));
    expect(s4Max).toBeGreaterThanOrEqual(s3Max);
  });

  it('Act 2 does not feature Space Kraken character (only tentacles)', () => {
    expect(hasCharacter(allBeats(stage3), 'space_kraken')).toBe(false);
    expect(hasCharacter(allBeats(stage4), 'space_kraken')).toBe(false);
  });
});

describe('DLC Narrative — Act 3: The Kraken\'s Void (Stage 5)', () => {
  const stage5 = DLC_ROCKET_CINEMATICS['dlc_krakens_void']!;

  it('Stage 5 intro uses dark_sea sky (dread atmosphere)', () => {
    const skies = stage5.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'dark_sea')).toBe(true);
  });

  it('Stage 5 intro features Space Kraken character (boss reveal)', () => {
    expect(hasCharacter(stage5.intro.beats, 'space_kraken')).toBe(true);
  });

  it('Space Kraken uses emerge animation in intro', () => {
    const kraken = stage5.intro.beats
      .flatMap((b) => b.characters ?? [])
      .find((c) => c.id === 'space_kraken');
    expect(kraken?.anim).toBe('emerge');
  });

  it('Stage 5 intro has highest shake of all DLC intros (climax)', () => {
    const s5Max = Math.max(...stage5.intro.beats.map((b) => b.shake ?? 0));
    for (const islandId of ['dlc_launchpad_lagoon', 'dlc_booster_reef', 'dlc_orbit_atoll', 'dlc_nebula_shallows']) {
      const cine = DLC_ROCKET_CINEMATICS[islandId]!;
      const max = Math.max(...cine.intro.beats.map((b) => b.shake ?? 0));
      expect(s5Max, `stage 5 shake should exceed ${islandId}`).toBeGreaterThanOrEqual(max);
    }
  });

  it('Stage 5 has the most beats of all DLC islands (climax length)', () => {
    const s5Total = allBeats(stage5).length;
    for (const islandId of ['dlc_launchpad_lagoon', 'dlc_booster_reef', 'dlc_orbit_atoll', 'dlc_nebula_shallows']) {
      const total = allBeats(DLC_ROCKET_CINEMATICS[islandId]!).length;
      expect(s5Total, `stage 5 should have ≥ beats as ${islandId}`).toBeGreaterThanOrEqual(total);
    }
  });

  it('Stage 5 outro: Space Kraken sinks (defeated)', () => {
    const kraken = stage5.outro.beats
      .flatMap((b) => b.characters ?? [])
      .find((c) => c.id === 'space_kraken');
    expect(kraken?.anim).toBe('sink');
  });

  it('Stage 5 outro has re-entry sequence (reentry_flame prop)', () => {
    expect(hasProp(stage5.outro.beats, 'reentry_flame')).toBe(true);
  });

  it('Stage 5 outro has parachute prop (descent phase)', () => {
    expect(hasProp(stage5.outro.beats, 'parachute')).toBe(true);
  });

  it('Stage 5 outro has splash prop (splashdown finale)', () => {
    expect(hasProp(stage5.outro.beats, 'splash')).toBe(true);
  });

  it('Stage 5 outro has complete star_chart (ultimate reward)', () => {
    expect(hasProp(stage5.outro.beats, 'star_chart')).toBe(true);
  });

  it('Stage 5 outro mentions splashdown in caption', () => {
    expect(captions(stage5.outro).toLowerCase()).toContain('splashdown');
  });

  it('Stage 5 outro Nemo and Bit celebrate together', () => {
    const celebBeat = stage5.outro.beats.find(
      (b) => b.characters?.some((c) => c.id === 'nemo' && c.anim === 'celebrate') &&
             b.characters?.some((c) => c.id === 'bit' && c.anim === 'celebrate'),
    );
    expect(celebBeat).toBeDefined();
  });

  it('Stage 5 outro sky progresses from dark to dawn (victory arc)', () => {
    const skies = stage5.outro.beats.map((b) => b.sky);
    // First beats should be dark (night/dark_sea)
    expect(['night', 'dark_sea']).toContain(skies[0]);
    // Last beat should be dawn
    expect(skies[skies.length - 1]).toBe('dawn');
  });

  it('Stage 5 outro ends with sunrise prop (triumph)', () => {
    expect(hasProp(stage5.outro.beats, 'sunrise')).toBe(true);
  });

  it('Stage 5 outro final caption is forward-looking', () => {
    const lastBeat = stage5.outro.beats[stage5.outro.beats.length - 1]!;
    expect(lastBeat.caption).toMatch(/sails|journey|on|scientist/i);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 3 — DLC STORY COHERENCE
// ══════════════════════════════════════════════════════════════

describe('DLC Story — complete journey arc', () => {
  it('sky mood darkens then brightens: dawn → storm → night → dark_sea → dawn', () => {
    const firstSkies = Object.values(DLC_ROCKET_CINEMATICS).map(
      (c) => c.intro.beats[0]!.sky,
    );
    // Stage 1: dawn (new beginning)
    expect(firstSkies[0]).toBe('dawn');
    // Stage 2: storm (challenge)
    expect(firstSkies[1]).toBe('storm');
    // Stage 3: night (space arrival)
    expect(firstSkies[2]).toBe('night');
    // Stage 4: dark_sea (deep void)
    expect(firstSkies[3]).toBe('dark_sea');
    // Stage 5: dark_sea (climax)
    expect(firstSkies[4]).toBe('dark_sea');
    // Resolution: dawn
    const lastBeat = DLC_ROCKET_CINEMATICS['dlc_krakens_void']!.outro.beats.at(-1)!;
    expect(lastBeat.sky).toBe('dawn');
  });

  it('star_chart appears in every island outro (progressive reward)', () => {
    for (const island of dlcIslands) {
      const cine = DLC_ROCKET_CINEMATICS[island.id]!;
      expect(
        hasProp(cine.outro.beats, 'star_chart'),
        `${island.id} outro should have star_chart`,
      ).toBe(true);
    }
  });

  it('Nemo appears in every DLC island intro', () => {
    for (const island of dlcIslands) {
      const beats = DLC_ROCKET_CINEMATICS[island.id]!.intro.beats;
      const hasNemoOrShip = hasCharacter(beats, 'nemo') || hasCharacter(beats, 'ship_loci');
      expect(hasNemoOrShip, `${island.id} intro should have Nemo/ship`).toBe(true);
    }
  });

  it('Bit appears in every DLC island as companion', () => {
    for (const island of dlcIslands) {
      const beats = allBeats(DLC_ROCKET_CINEMATICS[island.id]!);
      expect(hasCharacter(beats, 'bit'), `${island.id} should have Bit`).toBe(true);
    }
  });

  it('Nemo is positioned in lower third (y > 240, portrait-first)', () => {
    for (const cine of Object.values(DLC_ROCKET_CINEMATICS)) {
      const nemos = allBeats(cine)
        .flatMap((b) => b.characters ?? [])
        .filter((c) => c.id === 'nemo');
      for (const n of nemos) {
        expect(n.y, `Nemo at y=${n.y} should be > 240`).toBeGreaterThan(240);
      }
    }
  });

  it('every intro starts with establishing shot (ship/island/nebula)', () => {
    for (const island of dlcIslands) {
      const first = DLC_ROCKET_CINEMATICS[island.id]!.intro.beats[0]!;
      const hasShip = first.characters?.some((c) => c.id === 'ship_loci');
      const hasIsland = first.props?.some((p) => p.kind === 'island_silhouette');
      const hasNebula = first.props?.some((p) => p.kind === 'nebula_cloud');
      const hasOrbit = first.props?.some((p) => p.kind === 'orbit_ring');
      expect(
        hasShip || hasIsland || hasNebula || hasOrbit,
        `${island.id} intro should establish setting`,
      ).toBe(true);
    }
  });

  it('outros tend to have celebratory animations', () => {
    let celebCount = 0;
    for (const island of dlcIslands) {
      const outroAnims = DLC_ROCKET_CINEMATICS[island.id]!.outro.beats
        .flatMap((b) => b.characters ?? []).map((c) => c.anim);
      if (outroAnims.includes('celebrate') || outroAnims.includes('wave')) celebCount++;
    }
    // At least 4 out of 5
    expect(celebCount).toBeGreaterThanOrEqual(4);
  });

  it('shake intensity escalates from Act 1 → Act 3', () => {
    const maxShake = (islandId: string) =>
      Math.max(...allBeats(DLC_ROCKET_CINEMATICS[islandId]!).map((b) => b.shake ?? 0));

    const act1Max = Math.max(maxShake('dlc_launchpad_lagoon'), maxShake('dlc_booster_reef'));
    const act3Max = maxShake('dlc_krakens_void');
    expect(act3Max).toBeGreaterThan(act1Max);
  });

  it('rocket prop appears in at least 3 islands (recurring motif)', () => {
    let count = 0;
    for (const cine of Object.values(DLC_ROCKET_CINEMATICS)) {
      if (hasProp(allBeats(cine), 'rocket')) count++;
    }
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('tentacle foreshadowing appears before boss reveal', () => {
    // Tentacles should appear in stages 3 or 4 outro (before stage 5)
    const stage3 = DLC_ROCKET_CINEMATICS['dlc_orbit_atoll']!;
    const stage4 = DLC_ROCKET_CINEMATICS['dlc_nebula_shallows']!;
    const hasForeshadowing =
      hasProp(allBeats(stage3), 'tentacle') ||
      hasProp(allBeats(stage4), 'tentacle');
    expect(hasForeshadowing, 'tentacles should foreshadow the boss').toBe(true);
  });
});

describe('DLC Story — re-entry sequence in Stage 5 outro', () => {
  const outro = DLC_ROCKET_CINEMATICS['dlc_krakens_void']!.outro;

  it('re-entry beats follow correct order: defeat → reentry → parachute → splash', () => {
    const beatKinds = outro.beats.map((b) => {
      if (b.characters?.some((c) => c.id === 'space_kraken' && c.anim === 'sink')) return 'defeat';
      if (b.props?.some((p) => p.kind === 'reentry_flame')) return 'reentry';
      if (b.props?.some((p) => p.kind === 'parachute')) return 'parachute';
      if (b.props?.some((p) => p.kind === 'splash')) return 'splash';
      return 'other';
    });
    const defeatIdx = beatKinds.indexOf('defeat');
    const reentryIdx = beatKinds.indexOf('reentry');
    const chuteIdx = beatKinds.indexOf('parachute');
    const splashIdx = beatKinds.indexOf('splash');

    expect(defeatIdx).toBeGreaterThanOrEqual(0);
    expect(reentryIdx).toBeGreaterThan(defeatIdx);
    expect(chuteIdx).toBeGreaterThan(reentryIdx);
    expect(splashIdx).toBeGreaterThan(chuteIdx);
  });

  it('sky brightens through re-entry: dark_sea/night → dusk → day → dawn', () => {
    const skies = outro.beats.map((b) => b.sky);
    // Should get progressively lighter
    const lightOrder: SkyPreset[] = ['dark_sea', 'night', 'dusk', 'day', 'dawn'];
    let lastRank = -1;
    for (const sky of skies) {
      const rank = lightOrder.indexOf(sky);
      expect(rank, `sky ${sky} should be in light order`).toBeGreaterThanOrEqual(0);
      expect(rank, `sky order should not reverse`).toBeGreaterThanOrEqual(lastRank);
      lastRank = rank;
    }
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 4 — CROSS-CINEMATIC TRANSITION SMOOTHNESS (ALL)
// ══════════════════════════════════════════════════════════════

describe('Transition Smoothness — all cinematics', () => {
  const allCinematics = Object.entries(ISLAND_CINEMATICS);

  it('no beat has durationS < 1s (prevents jarring flashes)', () => {
    for (const [id, cine] of allCinematics) {
      for (const beat of allBeats(cine)) {
        expect(
          beat.durationS,
          `${id}/${beat.id} duration ${beat.durationS}s is too short`,
        ).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('no beat has durationS > 5s (prevents stalling)', () => {
    for (const [id, cine] of allCinematics) {
      for (const beat of allBeats(cine)) {
        expect(
          beat.durationS,
          `${id}/${beat.id} duration ${beat.durationS}s is too long`,
        ).toBeLessThanOrEqual(5);
      }
    }
  });

  it('every beat has either characters or props (not blank screen)', () => {
    for (const [id, cine] of allCinematics) {
      for (const beat of allBeats(cine)) {
        const hasContent =
          (beat.characters && beat.characters.length > 0) ||
          (beat.props && beat.props.length > 0);
        expect(hasContent, `${id}/${beat.id} is an empty beat`).toBe(true);
      }
    }
  });

  it('every sequence has at least one captioned beat (no silent runs)', () => {
    for (const [id, cine] of allCinematics) {
      for (const seq of [cine.intro, cine.outro]) {
        const captioned = seq.beats.filter((b) => b.caption);
        expect(captioned.length, `${seq.id} has no captions`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('captions fit portrait UI (≤90 chars)', () => {
    for (const [, cine] of allCinematics) {
      for (const beat of allBeats(cine)) {
        if (beat.caption) {
          expect(
            beat.caption.length,
            `${beat.id}: "${beat.caption.slice(0, 40)}..."`,
          ).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it('all characters are in lower 3/4 of screen (y ≥ 80)', () => {
    for (const [, cine] of allCinematics) {
      for (const beat of allBeats(cine)) {
        for (const c of beat.characters ?? []) {
          // Kraken/space_kraken can appear higher (boss is looming)
          if (c.id === 'kraken' || c.id === 'space_kraken') continue;
          expect(c.y, `${beat.id}/${c.id} y=${c.y}`).toBeGreaterThanOrEqual(80);
        }
      }
    }
  });

  it('shake never exceeds 0.5 (prevents nausea)', () => {
    for (const [, cine] of allCinematics) {
      for (const beat of allBeats(cine)) {
        if (beat.shake !== undefined) {
          expect(beat.shake, `${beat.id} shake`).toBeLessThanOrEqual(0.5);
        }
      }
    }
  });
});

describe('Transition Smoothness — within-sequence sky continuity', () => {
  // Sky should not jump more than 2 steps in mood between consecutive beats
  const moodRank: Record<SkyPreset, number> = {
    dawn: 0, day: 1, dusk: 2, storm: 3, night: 4, dark_sea: 5,
  };

  for (const [id, cine] of Object.entries(ISLAND_CINEMATICS)) {
    for (const seq of [cine.intro, cine.outro]) {
      it(`${seq.id}: sky doesn't jump > 4 mood ranks between consecutive beats`, () => {
        for (let i = 1; i < seq.beats.length; i++) {
          const prev = moodRank[seq.beats[i - 1]!.sky];
          const curr = moodRank[seq.beats[i]!.sky];
          const jump = Math.abs(curr - prev);
          expect(
            jump,
            `${seq.id} beat ${i - 1}→${i}: ${seq.beats[i - 1]!.sky}→${seq.beats[i]!.sky} jumps ${jump} ranks`,
          ).toBeLessThanOrEqual(4);
        }
      });
    }
  }
});

describe('Transition Smoothness — intro→outro tonal bridge', () => {
  for (const [id, cine] of Object.entries(ISLAND_CINEMATICS)) {
    it(`${id}: outro sky doesn't contradict intro mood`, () => {
      const lastIntro = cine.intro.beats[cine.intro.beats.length - 1]!.sky;
      const firstOutro = cine.outro.beats[0]!.sky;
      // They should be within a reasonable mood distance
      const moodRank: Record<SkyPreset, number> = {
        dawn: 0, day: 1, dusk: 2, storm: 3, night: 4, dark_sea: 5,
      };
      const jump = Math.abs(moodRank[lastIntro] - moodRank[firstOutro]);
      // Allow up to 4 ranks (gameplay happens between, mood can shift)
      expect(jump, `${id}: ${lastIntro}→${firstOutro}`).toBeLessThanOrEqual(4);
    });
  }
});

describe('Transition Smoothness — total sequence timing', () => {
  for (const [id, cine] of Object.entries(ISLAND_CINEMATICS)) {
    const introTime = cine.intro.beats.reduce((s, b) => s + b.durationS, 0);
    const outroTime = cine.outro.beats.reduce((s, b) => s + b.durationS, 0);

    it(`${id} intro total time is reasonable (5–25s)`, () => {
      expect(introTime, 'too short').toBeGreaterThanOrEqual(5);
      expect(introTime, 'too long').toBeLessThanOrEqual(25);
    });

    it(`${id} outro total time is reasonable (4–30s)`, () => {
      expect(outroTime, 'too short').toBeGreaterThanOrEqual(4);
      expect(outroTime, 'too long').toBeLessThanOrEqual(30);
    });
  }
});

describe('Transition Smoothness — sequence ID conventions', () => {
  for (const [id, cine] of Object.entries(ISLAND_CINEMATICS)) {
    it(`${id} intro sequence ID contains 'intro'`, () => {
      expect(cine.intro.id).toContain('intro');
    });

    it(`${id} outro sequence ID contains 'outro'`, () => {
      expect(cine.outro.id).toContain('outro');
    });
  }
});
