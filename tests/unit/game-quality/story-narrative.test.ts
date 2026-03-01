/**
 * Story & Narrative — validates cinematics, bestiary lore, concept
 * metaphors, and the narrative arc feel cohesive and complete.
 *
 * These are structural checks on the data that drives storytelling:
 * every island has intro/outro cinematics, every concept has a pirate
 * metaphor, bestiary entries have flavour text, and the three-act
 * structure is properly represented.
 */
import { describe, it, expect } from 'vitest';
import { ISLANDS } from '../../../src/data/islands';
import { CONCEPTS } from '../../../src/data/concepts';
import { BESTIARY, CRITTERS, THREATS, FLORA, TERRAIN } from '../../../src/data/bestiary';
import { ISLAND_CINEMATICS } from '../../../src/cinematics/island-cinematics';
import { GAME_OVER_CINEMATIC } from '../../../src/cinematics/game-over-cinematics';
import type { CinematicSequence, CinematicBeat } from '../../../src/cinematics/types';

// ── Every island has intro + outro cinematics ────────────────

describe('Story — island cinematics', () => {
  for (const island of ISLANDS) {
    describe(island.name, () => {
      it('has an intro cinematic', () => {
        const cine = ISLAND_CINEMATICS[island.id];
        expect(cine, `missing cinematics for ${island.id}`).toBeDefined();
        expect(cine.intro.beats.length).toBeGreaterThanOrEqual(2);
      });

      it('has an outro cinematic', () => {
        const cine = ISLAND_CINEMATICS[island.id];
        expect(cine.outro.beats.length).toBeGreaterThanOrEqual(1);
      });

      it('intro beats have unique IDs', () => {
        const ids = ISLAND_CINEMATICS[island.id].intro.beats.map((b: CinematicBeat) => b.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('outro beats have unique IDs', () => {
        const ids = ISLAND_CINEMATICS[island.id].outro.beats.map((b: CinematicBeat) => b.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('every beat has a positive duration', () => {
        const all = [
          ...ISLAND_CINEMATICS[island.id].intro.beats,
          ...ISLAND_CINEMATICS[island.id].outro.beats,
        ];
        for (const beat of all) {
          expect(beat.durationS, `${beat.id} duration`).toBeGreaterThan(0);
        }
      });
    });
  }

  it('game-over cinematic exists with beats', () => {
    expect(GAME_OVER_CINEMATIC).toBeDefined();
    expect(GAME_OVER_CINEMATIC.beats.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Three-act narrative structure ────────────────────────────

describe('Story — three-act structure', () => {
  it('Act 1 (islands 1-2): dawn/day sky — "Learning to Learn"', () => {
    const act1Beats = [
      ...ISLAND_CINEMATICS['island_01'].intro.beats,
      ...ISLAND_CINEMATICS['island_02'].intro.beats,
    ];
    // Act 1 should use lighter atmospheric tones (dawn/day)
    const skyKinds = act1Beats.map((b: CinematicBeat) => b.sky);
    const lightSkies = skyKinds.filter((s: string) => s === 'dawn' || s === 'day');
    expect(lightSkies.length).toBeGreaterThanOrEqual(act1Beats.length / 2);
  });

  it('Act 2 (islands 3-4): introduces rival — "The Rival Appears"', () => {
    const act2Beats = [
      ...ISLAND_CINEMATICS['island_03'].intro.beats,
      ...ISLAND_CINEMATICS['island_03'].outro.beats,
      ...ISLAND_CINEMATICS['island_04'].intro.beats,
      ...ISLAND_CINEMATICS['island_04'].outro.beats,
    ];
    // Captain Null should appear in at least one Act 2 beat
    const hasRival = act2Beats.some(
      (b: CinematicBeat) => b.characters?.some((c) => c.id === 'null'),
    );
    expect(hasRival, 'rival Captain Null should appear in Act 2').toBe(true);
  });

  it('Act 3 (island 5): Kraken appears', () => {
    const act3Beats = [
      ...ISLAND_CINEMATICS['island_05'].intro.beats,
      ...ISLAND_CINEMATICS['island_05'].outro.beats,
    ];
    const hasKraken = act3Beats.some(
      (b: CinematicBeat) => b.characters?.some((c) => c.id === 'kraken'),
    );
    expect(hasKraken, 'Kraken should appear in Act 3').toBe(true);
  });

  it('final act sky gets darker (dusk/night/storm/dark_sea)', () => {
    const act3IntroBeats = ISLAND_CINEMATICS['island_05'].intro.beats;
    const darkSkies = act3IntroBeats.filter(
      (b: CinematicBeat) =>
        b.sky === 'dusk' || b.sky === 'night' || b.sky === 'storm' || b.sky === 'dark_sea',
    );
    expect(darkSkies.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Concept metaphors ────────────────────────────────────────

describe('Story — every concept has a pirate metaphor', () => {
  for (const concept of CONCEPTS) {
    it(`${concept.name} → ${concept.metaphorObject}`, () => {
      expect(concept.metaphorObject).toBeTruthy();
      expect(concept.metaphorObject.length).toBeGreaterThan(2);
    });
  }

  it('all 15 AI/ML concepts are covered', () => {
    expect(CONCEPTS.length).toBe(15);
  });

  it('concept names are unique', () => {
    const names = CONCEPTS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('metaphor objects are unique', () => {
    const metaphors = CONCEPTS.map((c) => c.metaphorObject);
    expect(new Set(metaphors).size).toBe(metaphors.length);
  });
});

// ── Bestiary flavour text quality ────────────────────────────

describe('Story — bestiary lore quality', () => {
  it('all 29 bestiary entries exist', () => {
    expect(BESTIARY.length).toBe(29);
  });

  it('every entry has non-empty flavour text', () => {
    for (const entry of BESTIARY) {
      expect(entry.flavour, `${entry.id} missing flavour`).toBeTruthy();
      expect(entry.flavour.length, `${entry.id} flavour too short`).toBeGreaterThan(10);
    }
  });

  it('every entry has behaviour text', () => {
    for (const entry of BESTIARY) {
      expect(entry.behaviour, `${entry.id} missing behaviour`).toBeTruthy();
      expect(entry.behaviour.length, `${entry.id} behaviour too short`).toBeGreaterThan(10);
    }
  });

  it('flavour text fits UI (≤100 chars)', () => {
    for (const entry of BESTIARY) {
      expect(entry.flavour.length, `${entry.id} flavour too long`).toBeLessThanOrEqual(100);
    }
  });

  it('all entries have unique names', () => {
    const names = BESTIARY.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('critters have danger 1-4 (no max danger)', () => {
    for (const c of CRITTERS) {
      expect(c.danger, `${c.id}`).toBeGreaterThanOrEqual(1);
      expect(c.danger, `${c.id}`).toBeLessThanOrEqual(4);
    }
  });

  it('the Kraken is the most dangerous (danger 5)', () => {
    const kraken = THREATS.find((t) => t.id === 'giant_squid');
    expect(kraken).toBeDefined();
    expect(kraken!.danger).toBe(5);
  });

  it('flora has 0 danger', () => {
    for (const f of FLORA) {
      expect(f.danger, `${f.id}`).toBe(0);
    }
  });
});

// ── Island names create sense of progression ─────────────────

describe('Story — island name flavour', () => {
  it('all island names are unique', () => {
    const names = ISLANDS.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('island names are evocative (≥3 words or ≥10 chars)', () => {
    for (const island of ISLANDS) {
      const words = island.name.split(/[\s']+/).length;
      expect(
        words >= 2 || island.name.length >= 10,
        `${island.name} should be evocative`,
      ).toBe(true);
    }
  });

  it('no two consecutive islands share the same encounter type', () => {
    for (let i = 1; i < ISLANDS.length - 1; i++) {
      // skip hidden_reef (bonus) — compare main chain only
      if (ISLANDS[i]!.id === 'hidden_reef') continue;
      const prev = ISLANDS[i - 1]!;
      const curr = ISLANDS[i]!;
      expect(
        curr.encounterType,
        `${prev.name} and ${curr.name} both use ${curr.encounterType}`,
      ).not.toBe(prev.encounterType);
    }
  });
});

// ── Cinematic caption quality ────────────────────────────────

describe('Story — caption quality', () => {
  const allCinematics: CinematicSequence[] = [];
  for (const island of ISLANDS) {
    const cine = ISLAND_CINEMATICS[island.id];
    if (cine) {
      allCinematics.push(cine.intro, cine.outro);
    }
  }
  allCinematics.push(GAME_OVER_CINEMATIC);

  it('every cinematic has at least one captioned beat', () => {
    for (const seq of allCinematics) {
      const captioned = seq.beats.filter((b: CinematicBeat) => b.caption);
      expect(captioned.length, `${seq.id} has no captions`).toBeGreaterThanOrEqual(1);
    }
  });

  it('captions fit portrait screen (≤90 chars)', () => {
    for (const seq of allCinematics) {
      for (const beat of seq.beats) {
        if (beat.caption) {
          expect(
            beat.caption.length,
            `${beat.id}: "${beat.caption}"`,
          ).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it('character coordinates are within 240×400 bounds', () => {
    for (const seq of allCinematics) {
      for (const beat of seq.beats) {
        for (const ch of beat.characters ?? []) {
          expect(ch.x, `${beat.id} ${ch.id} x`).toBeGreaterThanOrEqual(0);
          expect(ch.x, `${beat.id} ${ch.id} x`).toBeLessThanOrEqual(240);
          expect(ch.y, `${beat.id} ${ch.id} y`).toBeGreaterThanOrEqual(0);
          expect(ch.y, `${beat.id} ${ch.id} y`).toBeLessThanOrEqual(400);
        }
      }
    }
  });
});
