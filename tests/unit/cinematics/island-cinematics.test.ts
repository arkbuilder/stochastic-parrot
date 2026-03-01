import { describe, it, expect } from 'vitest';
import { ISLAND_CINEMATICS } from '../../../src/cinematics/island-cinematics';
import { ISLANDS } from '../../../src/data/islands';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import type { CinematicSequence, CinematicBeat, SkyPreset, CharacterId } from '../../../src/cinematics/types';

// ── helpers ──────────────────────────────────────────────────

const VALID_SKY: SkyPreset[] = ['dawn', 'day', 'dusk', 'night', 'storm', 'dark_sea'];
const VALID_CHARS: CharacterId[] = ['nemo', 'bit', 'null', 'kraken', 'ship_loci', 'ship_overfit', 'space_kraken'];
const VALID_PROPS = [
  'island_silhouette', 'fog_wall', 'lightning', 'tentacle',
  'chart_fragment', 'golden_chart', 'wreckage', 'sunrise', 'cannon_flash',
  'rocket', 'exhaust_plume', 'asteroid', 'nebula_cloud', 'star_chart', 'orbit_ring',
  'reentry_flame', 'parachute', 'splash',
];

/** All beats for an island (intro + outro). */
function allBeats(islandId: string): CinematicBeat[] {
  const cine = ISLAND_CINEMATICS[islandId]!;
  return [...cine.intro.beats, ...cine.outro.beats];
}

/** All captions for a sequence, joined. */
function captions(seq: CinematicSequence): string {
  return seq.beats.map((b) => b.caption ?? '').join(' ');
}

/** Whether any beat in the array contains a character. */
function hasCharacter(beats: CinematicBeat[], id: CharacterId): boolean {
  return beats.some((b) => b.characters?.some((c) => c.id === id));
}

/** Whether any beat contains a prop of given kind. */
function hasProp(beats: CinematicBeat[], kind: string): boolean {
  return beats.some((b) => b.props?.some((p) => p.kind === kind));
}

// ── Structural validation per sequence ───────────────────────

function validateSequence(seq: CinematicSequence, label: string): void {
  describe(`sequence ${label}`, () => {
    it('has a non-empty id', () => {
      expect(seq.id).toBeTruthy();
      expect(typeof seq.id).toBe('string');
    });

    it('has at least one beat', () => {
      expect(seq.beats.length).toBeGreaterThanOrEqual(1);
    });

    it('every beat has a unique id within the sequence', () => {
      const ids = seq.beats.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    for (const beat of seq.beats) {
      describe(`beat "${beat.id}"`, () => {
        it('has positive durationS', () => {
          expect(beat.durationS).toBeGreaterThan(0);
        });

        it('has a valid sky preset', () => {
          expect(VALID_SKY).toContain(beat.sky);
        });

        it('has short caption (≤100 chars) for UI fit', () => {
          if (beat.caption) {
            expect(beat.caption.length).toBeLessThanOrEqual(100);
          }
        });

        it('has valid character ids', () => {
          if (beat.characters) {
            for (const c of beat.characters) {
              expect(VALID_CHARS).toContain(c.id);
            }
          }
        });

        it('character positions are within viewport', () => {
          if (beat.characters) {
            for (const c of beat.characters) {
              expect(c.x).toBeGreaterThanOrEqual(-20);
              expect(c.x).toBeLessThanOrEqual(260);
              expect(c.y).toBeGreaterThanOrEqual(-20);
              expect(c.y).toBeLessThanOrEqual(420);
            }
          }
        });

        it('has valid prop types', () => {
          if (beat.props) {
            for (const p of beat.props) {
              expect(VALID_PROPS).toContain(p.kind);
            }
          }
        });

        it('prop positions are within viewport', () => {
          if (beat.props) {
            for (const p of beat.props) {
              expect(p.x).toBeGreaterThanOrEqual(-80);
              expect(p.x).toBeLessThanOrEqual(320);
              expect(p.y).toBeGreaterThanOrEqual(-80);
              expect(p.y).toBeLessThanOrEqual(480);
            }
          }
        });

        it('shake is between 0 and 1 (when set)', () => {
          if (beat.shake !== undefined) {
            expect(beat.shake).toBeGreaterThanOrEqual(0);
            expect(beat.shake).toBeLessThanOrEqual(1);
          }
        });

        it('tint is a valid rgba string (when set)', () => {
          if (beat.tint) {
            expect(beat.tint).toMatch(/^rgba\(\s*\d/);
          }
        });
      });
    }
  });
}

// ── Coverage: every island in ISLANDS has cinematics ─────────

describe('Island Cinematics — coverage', () => {
  it('every island in ISLANDS has cinematics data', () => {
    for (const island of ISLANDS) {
      expect(
        ISLAND_CINEMATICS[island.id],
        `Missing cinematics for ${island.id}`,
      ).toBeDefined();
    }
  });

  it('no extra cinematics for non-existent islands', () => {
    const islandIds = new Set([
      ...ISLANDS.map((i) => i.id),
      ...ROCKET_SCIENCE_PACK.content.islands.map((i) => i.id),
    ]);
    for (const key of Object.keys(ISLAND_CINEMATICS)) {
      expect(islandIds.has(key), `Extra cinematics key "${key}" has no island`).toBe(true);
    }
  });

  it('all beat ids are globally unique', () => {
    const allIds: string[] = [];
    for (const cine of Object.values(ISLAND_CINEMATICS)) {
      for (const beat of cine.intro.beats) allIds.push(beat.id);
      for (const beat of cine.outro.beats) allIds.push(beat.id);
    }
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('total beats across all islands is reasonable (20–150)', () => {
    let total = 0;
    for (const cine of Object.values(ISLAND_CINEMATICS)) {
      total += cine.intro.beats.length + cine.outro.beats.length;
    }
    expect(total).toBeGreaterThanOrEqual(20);
    expect(total).toBeLessThanOrEqual(150);
  });
});

// ── Per-island validation ────────────────────────────────────

for (const island of ISLANDS) {
  describe(`Island ${island.id} — ${island.name}`, () => {
    const cine = ISLAND_CINEMATICS[island.id];

    it('has intro and outro', () => {
      expect(cine).toBeDefined();
      expect(cine!.intro).toBeDefined();
      expect(cine!.outro).toBeDefined();
    });

    if (cine) {
      validateSequence(cine.intro, `${island.id} intro`);
      validateSequence(cine.outro, `${island.id} outro`);
    }
  });
}

// ── Narrative alignment — per-island story beat verification ─

describe('Narrative alignment', () => {
  // ── Island 1 — Bay of Learning (Act 1 opener) ──

  it('Island 1 intro mentions the Memory Sea or Bay of Learning', () => {
    expect(captions(ISLAND_CINEMATICS['island_01']!.intro)).toMatch(/Memory Sea|Bay of Learning/i);
  });

  it('Island 1 intro opens with ship_loci arriving (beat 1)', () => {
    const first = ISLAND_CINEMATICS['island_01']!.intro.beats[0];
    expect(first.characters?.some((c) => c.id === 'ship_loci')).toBe(true);
  });

  it('Island 1 intro uses dawn sky (wonder, new beginning)', () => {
    const skies = ISLAND_CINEMATICS['island_01']!.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'dawn')).toBe(true);
  });

  it('Island 1 intro has Nemo and Bit together (protagonist + companion)', () => {
    const intro = ISLAND_CINEMATICS['island_01']!.intro.beats;
    expect(hasCharacter(intro, 'nemo')).toBe(true);
    expect(hasCharacter(intro, 'bit')).toBe(true);
  });

  it('Island 1 intro mentions fog or landmarks (teaching moment)', () => {
    expect(captions(ISLAND_CINEMATICS['island_01']!.intro)).toMatch(/fog|landmark/i);
  });

  it('Island 1 outro has chart_fragment (first reward)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_01']!.outro.beats, 'chart_fragment')).toBe(true);
  });

  it('Island 1 outro has celebratory animation on Nemo', () => {
    const nemo = ISLAND_CINEMATICS['island_01']!.outro.beats
      .flatMap((b) => b.characters ?? [])
      .find((c) => c.id === 'nemo');
    expect(nemo?.anim).toBe('celebrate');
  });

  it('Island 1 outro has kraken stinger (tentacle prop)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_01']!.outro.beats, 'tentacle')).toBe(true);
  });

  it('Island 1 outro stinger beat has shake (ominous rumble)', () => {
    const stinger = ISLAND_CINEMATICS['island_01']!.outro.beats.find(
      (b) => b.props?.some((p) => p.kind === 'tentacle'),
    );
    expect(stinger?.shake).toBeGreaterThan(0);
  });

  it('Island 1 outro teases next island (forward-looking caption)', () => {
    const outroCaption = captions(ISLAND_CINEMATICS['island_01']!.outro);
    expect(outroCaption).toMatch(/another island|mist|stirs/i);
  });

  // ── Island 2 — Driftwood Shallows (Act 1 escalation) ──

  it('Island 2 intro uses storm sky throughout', () => {
    const skies = ISLAND_CINEMATICS['island_02']!.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'storm')).toBe(true);
  });

  it('Island 2 intro has lightning prop (storm imagery)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_02']!.intro.beats, 'lightning')).toBe(true);
  });

  it('Island 2 intro has shake (stormy waters)', () => {
    const maxShake = Math.max(...ISLAND_CINEMATICS['island_02']!.intro.beats.map((b) => b.shake ?? 0));
    expect(maxShake).toBeGreaterThan(0);
  });

  it('Island 2 outro has chart_fragment (second reward)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_02']!.outro.beats, 'chart_fragment')).toBe(true);
  });

  it('Island 2 outro has celebratory animations', () => {
    const anims = ISLAND_CINEMATICS['island_02']!.outro.beats
      .flatMap((b) => b.characters ?? [])
      .map((c) => c.anim);
    expect(anims).toContain('celebrate');
  });

  it('Island 2 outro mentions confidence or method (learning payoff)', () => {
    expect(captions(ISLAND_CINEMATICS['island_02']!.outro)).toMatch(/confidence|method/i);
  });

  // ── Island 3 — Coral Maze (Act 2 — Null arrives) ──

  it('Island 3 intro introduces ship_overfit (Null sighted on horizon)', () => {
    expect(hasCharacter(ISLAND_CINEMATICS['island_03']!.intro.beats, 'ship_overfit')).toBe(true);
  });

  it('Island 3 intro introduces Null character in person', () => {
    expect(hasCharacter(ISLAND_CINEMATICS['island_03']!.intro.beats, 'null')).toBe(true);
  });

  it('Island 3 intro has both Nemo and Null (confrontation)', () => {
    const beats = ISLAND_CINEMATICS['island_03']!.intro.beats;
    const confrontation = beats.find(
      (b) => b.characters?.some((c) => c.id === 'nemo') &&
             b.characters?.some((c) => c.id === 'null'),
    );
    expect(confrontation).toBeDefined();
  });

  it('Island 3 intro Null uses fist_shake animation (threatening gesture)', () => {
    const nullChars = ISLAND_CINEMATICS['island_03']!.intro.beats
      .flatMap((b) => b.characters ?? [])
      .filter((c) => c.id === 'null');
    expect(nullChars.some((c) => c.anim === 'fist_shake')).toBe(true);
  });

  it('Island 3 outro has cannon_flash prop (upgrade reward)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_03']!.outro.beats, 'cannon_flash')).toBe(true);
  });

  it('Island 3 outro shows Null retreating with fist_shake', () => {
    const retreatBeat = ISLAND_CINEMATICS['island_03']!.outro.beats.find(
      (b) => b.characters?.some((c) => c.id === 'null' && c.anim === 'fist_shake'),
    );
    expect(retreatBeat).toBeDefined();
  });

  it('Island 3 outro has chart_fragment (third reward)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_03']!.outro.beats, 'chart_fragment')).toBe(true);
  });

  it('Island 3 outro mentions method vs brute force (thematic payoff)', () => {
    expect(captions(ISLAND_CINEMATICS['island_03']!.outro)).toMatch(/method|brute force/i);
  });

  // ── Island 4 — Storm Bastion (Act 2 — escalation) ──

  it('Island 4 intro mentions ruins or cartographers', () => {
    expect(captions(ISLAND_CINEMATICS['island_04']!.intro)).toMatch(/ruins|cartographer/i);
  });

  it('Island 4 intro uses dusk/night skies (darkening mood)', () => {
    const skies = ISLAND_CINEMATICS['island_04']!.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'dusk' || s === 'night')).toBe(true);
  });

  it('Island 4 outro mentions Kraken in caption (foreshadowing)', () => {
    const outroCaption = captions(ISLAND_CINEMATICS['island_04']!.outro);
    expect(outroCaption.toLowerCase()).toContain('kraken');
  });

  it('Island 4 outro has tentacle props (Kraken stinger 2)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_04']!.outro.beats, 'tentacle')).toBe(true);
  });

  it('Island 4 outro has chart_fragment (fourth reward)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_04']!.outro.beats, 'chart_fragment')).toBe(true);
  });

  it('Island 4 outro mentions journal or cartographers', () => {
    expect(captions(ISLAND_CINEMATICS['island_04']!.outro)).toMatch(/journal|cartographer/i);
  });

  it('Island 4 outro transitions to dark_sea (Act 3 looming)', () => {
    const beats = ISLAND_CINEMATICS['island_04']!.outro.beats;
    expect(beats.some((b) => b.sky === 'dark_sea')).toBe(true);
  });

  // ── Island 5 — Kraken's Reach (Act 3 — climax) ──

  it('Island 5 intro uses dark_sea sky (dread atmosphere)', () => {
    const skies = ISLAND_CINEMATICS['island_05']!.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'dark_sea')).toBe(true);
  });

  it('Island 5 intro has wreckage prop (Null\'s ship wrecked)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_05']!.intro.beats, 'wreckage')).toBe(true);
  });

  it('Island 5 intro mentions Null\'s failure in caption', () => {
    expect(captions(ISLAND_CINEMATICS['island_05']!.intro)).toMatch(/null|brute force|wrecked/i);
  });

  it('Island 5 intro features Kraken character (boss reveal)', () => {
    expect(hasCharacter(ISLAND_CINEMATICS['island_05']!.intro.beats, 'kraken')).toBe(true);
  });

  it('Island 5 intro Kraken uses emerge animation', () => {
    const kraken = ISLAND_CINEMATICS['island_05']!.intro.beats
      .flatMap((b) => b.characters ?? [])
      .find((c) => c.id === 'kraken');
    expect(kraken?.anim).toBe('emerge');
  });

  it('Island 5 intro has highest shake of all intros (climax)', () => {
    const i05MaxShake = Math.max(
      ...ISLAND_CINEMATICS['island_05']!.intro.beats.map((b) => b.shake ?? 0),
    );
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04']) {
      const maxShake = Math.max(
        ...ISLAND_CINEMATICS[islandId]!.intro.beats.map((b) => b.shake ?? 0),
      );
      expect(i05MaxShake).toBeGreaterThanOrEqual(maxShake);
    }
  });

  it('Island 5 has the most beats of all islands (climax length)', () => {
    const i05Total = ISLAND_CINEMATICS['island_05']!.intro.beats.length +
      ISLAND_CINEMATICS['island_05']!.outro.beats.length;
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04']) {
      const total = ISLAND_CINEMATICS[islandId]!.intro.beats.length +
        ISLAND_CINEMATICS[islandId]!.outro.beats.length;
      expect(i05Total).toBeGreaterThanOrEqual(total);
    }
  });

  it('Island 5 outro Kraken sinks (defeated)', () => {
    const kraken = ISLAND_CINEMATICS['island_05']!.outro.beats
      .flatMap((b) => b.characters ?? [])
      .find((c) => c.id === 'kraken');
    expect(kraken?.anim).toBe('sink');
  });

  it('Island 5 outro has golden_chart (ultimate reward)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_05']!.outro.beats, 'golden_chart')).toBe(true);
  });

  it('golden_chart appears ONLY in Island 5 outro (not earlier)', () => {
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04']) {
      const all = allBeats(islandId);
      expect(hasProp(all, 'golden_chart')).toBe(false);
    }
  });

  it('Island 5 outro has sunrise prop (triumph)', () => {
    expect(hasProp(ISLAND_CINEMATICS['island_05']!.outro.beats, 'sunrise')).toBe(true);
  });

  it('Island 5 outro Nemo and Bit celebrate together', () => {
    const celebBeat = ISLAND_CINEMATICS['island_05']!.outro.beats.find(
      (b) => b.characters?.some((c) => c.id === 'nemo' && c.anim === 'celebrate') &&
             b.characters?.some((c) => c.id === 'bit' && c.anim === 'celebrate'),
    );
    expect(celebBeat).toBeDefined();
  });

  it('Island 5 outro mentions Dead Reckoner (title earned)', () => {
    expect(captions(ISLAND_CINEMATICS['island_05']!.outro)).toMatch(/Dead Reckoner/i);
  });

  it('Island 5 outro ends at dawn sky (triumph after dark_sea)', () => {
    const outroBeats = ISLAND_CINEMATICS['island_05']!.outro.beats;
    const lastBeat = outroBeats[outroBeats.length - 1];
    expect(lastBeat.sky).toBe('dawn');
  });

  it('Island 5 outro has post-credits stinger (fog_wall + island_silhouette = new seas)', () => {
    const lastBeat = ISLAND_CINEMATICS['island_05']!.outro.beats.at(-1)!;
    expect(lastBeat.props?.some((p) => p.kind === 'fog_wall')).toBe(true);
    expect(lastBeat.props?.some((p) => p.kind === 'island_silhouette')).toBe(true);
    expect(lastBeat.caption).toMatch(/new seas|horizon|mysteries/i);
  });

  // ── Hidden Reef — bonus island ──

  it('Hidden Reef has fewer beats than Island 5 (bonus, not climax)', () => {
    const hr = ISLAND_CINEMATICS['hidden_reef']!;
    const hrTotal = hr.intro.beats.length + hr.outro.beats.length;
    const i05Total = ISLAND_CINEMATICS['island_05']!.intro.beats.length +
      ISLAND_CINEMATICS['island_05']!.outro.beats.length;
    expect(hrTotal).toBeLessThan(i05Total);
  });

  it('Hidden Reef intro uses night sky (mystery)', () => {
    const skies = ISLAND_CINEMATICS['hidden_reef']!.intro.beats.map((b) => b.sky);
    expect(skies.every((s) => s === 'night')).toBe(true);
  });

  it('Hidden Reef intro has fog_wall (hidden in fog)', () => {
    expect(hasProp(ISLAND_CINEMATICS['hidden_reef']!.intro.beats, 'fog_wall')).toBe(true);
  });

  it('Hidden Reef outro mentions mastery', () => {
    expect(captions(ISLAND_CINEMATICS['hidden_reef']!.outro)).toMatch(/master/i);
  });

  it('Hidden Reef outro ends at dawn (echoes final triumph)', () => {
    const lastBeat = ISLAND_CINEMATICS['hidden_reef']!.outro.beats.at(-1)!;
    expect(lastBeat.sky).toBe('dawn');
  });

  it('Hidden Reef has no major story characters (Null, Kraken)', () => {
    const all = allBeats('hidden_reef');
    expect(hasCharacter(all, 'null')).toBe(false);
    expect(hasCharacter(all, 'kraken')).toBe(false);
    expect(hasCharacter(all, 'ship_overfit')).toBe(false);
  });
});

// ── Cross-island narrative arc tests ─────────────────────────

describe('Three-act story arc', () => {
  it('Act 1 (Islands 1-2) never features Null or ship_overfit', () => {
    for (const islandId of ['island_01', 'island_02']) {
      const all = allBeats(islandId);
      expect(hasCharacter(all, 'null'), `${islandId} should not have Null`).toBe(false);
      expect(hasCharacter(all, 'ship_overfit'), `${islandId} should not have ship_overfit`).toBe(false);
    }
  });

  it('Act 1 (Islands 1-2) never features Kraken character (only stinger tentacle)', () => {
    for (const islandId of ['island_01', 'island_02']) {
      const all = allBeats(islandId);
      expect(hasCharacter(all, 'kraken'), `${islandId} should not have Kraken character`).toBe(false);
    }
  });

  it('Act 2 (Islands 3-4) features Null but NOT Kraken character', () => {
    const act2Beats = [...allBeats('island_03'), ...allBeats('island_04')];
    expect(hasCharacter(act2Beats, 'null')).toBe(true);
    expect(hasCharacter(act2Beats, 'kraken')).toBe(false);
  });

  it('Act 3 (Island 5) features Kraken character', () => {
    expect(hasCharacter(allBeats('island_05'), 'kraken')).toBe(true);
  });

  it('sky mood darkens across acts: dawn → storm → dusk → dark_sea → dawn', () => {
    // Act 1 starts with dawn
    expect(ISLAND_CINEMATICS['island_01']!.intro.beats[0].sky).toBe('dawn');
    // Act 1 escalation: storm
    expect(ISLAND_CINEMATICS['island_02']!.intro.beats[0].sky).toBe('storm');
    // Act 2: day → dusk → night
    expect(ISLAND_CINEMATICS['island_03']!.intro.beats[0].sky).toBe('day');
    expect(ISLAND_CINEMATICS['island_04']!.intro.beats[0].sky).toBe('dusk');
    // Act 3: dark_sea (climax darkness)
    expect(ISLAND_CINEMATICS['island_05']!.intro.beats[0].sky).toBe('dark_sea');
    // Resolution: dawn (new beginning)
    const lastI05 = ISLAND_CINEMATICS['island_05']!.outro.beats.at(-1)!;
    expect(lastI05.sky).toBe('dawn');
  });

  it('chart_fragment appears in Acts 1-2 outros (islands 1-4)', () => {
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04']) {
      const outroBeats = ISLAND_CINEMATICS[islandId]!.outro.beats;
      expect(
        hasProp(outroBeats, 'chart_fragment'),
        `${islandId} outro should have chart_fragment`,
      ).toBe(true);
    }
  });

  it('Nemo appears in every island intro', () => {
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04', 'island_05', 'hidden_reef']) {
      const introBeats = ISLAND_CINEMATICS[islandId]!.intro.beats;
      const hasNemoOrShip = hasCharacter(introBeats, 'nemo') || hasCharacter(introBeats, 'ship_loci');
      expect(hasNemoOrShip, `${islandId} intro should have Nemo or ship_loci`).toBe(true);
    }
  });

  it('Bit appears in every island as a companion', () => {
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04', 'island_05', 'hidden_reef']) {
      const all = allBeats(islandId);
      expect(hasCharacter(all, 'bit'), `${islandId} should have Bit as companion`).toBe(true);
    }
  });

  it('Nemo is positioned in lower third (portrait-first rule, y > 240)', () => {
    for (const cine of Object.values(ISLAND_CINEMATICS)) {
      const nemos = [...cine.intro.beats, ...cine.outro.beats]
        .flatMap((b) => b.characters ?? [])
        .filter((c) => c.id === 'nemo');
      for (const n of nemos) {
        expect(n.y, `Nemo at y=${n.y} should be > 240 (lower third)`).toBeGreaterThan(240);
      }
    }
  });

  it('outros tend to have celebratory animations', () => {
    let celebCount = 0;
    let outroCount = 0;
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04', 'island_05', 'hidden_reef']) {
      outroCount++;
      const outroBeats = ISLAND_CINEMATICS[islandId]!.outro.beats;
      const anims = outroBeats.flatMap((b) => b.characters ?? []).map((c) => c.anim);
      if (anims.includes('celebrate') || anims.includes('wave')) celebCount++;
    }
    // At least 5 out of 6 (allow one exception)
    expect(celebCount).toBeGreaterThanOrEqual(5);
  });

  it('shake intensity escalates from Act 1 → Act 3', () => {
    const maxShakeByIsland = (islandId: string) =>
      Math.max(...allBeats(islandId).map((b) => b.shake ?? 0));

    const act1Max = Math.max(maxShakeByIsland('island_01'), maxShakeByIsland('island_02'));
    const act3Max = maxShakeByIsland('island_05');
    expect(act3Max).toBeGreaterThan(act1Max);
  });

  it('every intro starts with a remote/establishing beat (ship or landscape)', () => {
    for (const islandId of ['island_01', 'island_02', 'island_03', 'island_04', 'island_05', 'hidden_reef']) {
      const first = ISLAND_CINEMATICS[islandId]!.intro.beats[0];
      const hasShip = first.characters?.some((c) => c.id === 'ship_loci');
      const hasIsland = first.props?.some((p) => p.kind === 'island_silhouette');
      const hasFog = first.props?.some((p) => p.kind === 'fog_wall');
      expect(
        hasShip || hasIsland || hasFog,
        `${islandId} intro beat 1 should establish setting with ship/island/fog`,
      ).toBe(true);
    }
  });

  it('every sequence sets waitForTap on its beats (player controls pacing)', () => {
    for (const cine of Object.values(ISLAND_CINEMATICS)) {
      for (const beat of [...cine.intro.beats, ...cine.outro.beats]) {
        expect(beat.waitForTap, `Beat ${beat.id} should have waitForTap`).toBe(true);
      }
    }
  });
});
