import { describe, it, expect } from 'vitest';
import { GAME_OVER_CINEMATIC } from '../../../src/cinematics/game-over-cinematics';
import type { CinematicBeat, SkyPreset, CharacterId } from '../../../src/cinematics/types';

// ── Helpers ──────────────────────────────────────────────────

const VALID_SKY: SkyPreset[] = ['dawn', 'day', 'dusk', 'night', 'storm', 'dark_sea'];
const VALID_CHARS: CharacterId[] = ['nemo', 'bit', 'null', 'kraken', 'ship_loci', 'ship_overfit'];
const VALID_PROPS = [
  'island_silhouette', 'fog_wall', 'lightning', 'tentacle',
  'chart_fragment', 'golden_chart', 'wreckage', 'sunrise', 'cannon_flash',
];
const VALID_ANIMS = ['idle', 'walk', 'wave', 'fist_shake', 'celebrate', 'sink', 'emerge'];

const beats: CinematicBeat[] = GAME_OVER_CINEMATIC.beats;

function hasCharacter(id: CharacterId): boolean {
  return beats.some((b) => b.characters?.some((c) => c.id === id));
}

function hasProp(kind: string): boolean {
  return beats.some((b) => b.props?.some((p) => p.kind === kind));
}

function beatsWithSky(sky: SkyPreset): CinematicBeat[] {
  return beats.filter((b) => b.sky === sky);
}

function captionText(): string {
  return beats.map((b) => b.caption ?? '').join(' ');
}

// ── Top-level structure ──────────────────────────────────────

describe('Game Over Cinematic — structure', () => {
  it('has a non-empty id', () => {
    expect(GAME_OVER_CINEMATIC.id).toBeTruthy();
    expect(typeof GAME_OVER_CINEMATIC.id).toBe('string');
  });

  it('id starts with game_over', () => {
    expect(GAME_OVER_CINEMATIC.id).toMatch(/^game_over/);
  });

  it('has beats array', () => {
    expect(Array.isArray(beats)).toBe(true);
  });

  it('has at least 15 beats (Save the Cat minimum)', () => {
    expect(beats.length).toBeGreaterThanOrEqual(15);
  });

  it('has at most 25 beats (keeps total runtime reasonable)', () => {
    expect(beats.length).toBeLessThanOrEqual(25);
  });

  it('every beat has a unique id', () => {
    const ids = beats.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all beat ids start with go_ prefix', () => {
    for (const beat of beats) {
      expect(beat.id).toMatch(/^go_/);
    }
  });

  it('beat ids are numbered sequentially', () => {
    beats.forEach((beat, index) => {
      const num = String(index + 1).padStart(2, '0');
      expect(beat.id).toContain(num);
    });
  });
});

// ── Per-beat structural validation ───────────────────────────

describe('Game Over Cinematic — beat validation', () => {
  for (const beat of beats) {
    describe(`beat "${beat.id}"`, () => {
      it('has positive durationS', () => {
        expect(beat.durationS).toBeGreaterThan(0);
      });

      it('duration is within 2–6 seconds', () => {
        expect(beat.durationS).toBeGreaterThanOrEqual(2);
        expect(beat.durationS).toBeLessThanOrEqual(6);
      });

      it('has a valid sky preset', () => {
        expect(VALID_SKY).toContain(beat.sky);
      });

      it('has valid character ids', () => {
        if (beat.characters) {
          for (const c of beat.characters) {
            expect(VALID_CHARS).toContain(c.id);
          }
        }
      });

      it('has valid character animations', () => {
        if (beat.characters) {
          for (const c of beat.characters) {
            if (c.anim) {
              expect(VALID_ANIMS).toContain(c.anim);
            }
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

      it('caption is ≤100 chars for UI fit', () => {
        if (beat.caption) {
          expect(beat.caption.length).toBeLessThanOrEqual(100);
        }
      });

      it('has at least one visual element (character or prop)', () => {
        const hasChars = (beat.characters?.length ?? 0) > 0;
        const hasProps = (beat.props?.length ?? 0) > 0;
        expect(hasChars || hasProps).toBe(true);
      });
    });
  }
});

// ── Save the Cat beat sheet structure ────────────────────────

describe('Game Over Cinematic — Save the Cat compliance', () => {
  it('opens with a calm dawn (Opening Image)', () => {
    expect(beats[0].sky).toBe('dawn');
    expect(beats[0].shake).toBeUndefined();
  });

  it('ends with dawn (Final Image mirrors Opening Image)', () => {
    const last = beats[beats.length - 1];
    expect(last.sky).toBe('dawn');
  });

  it('first beat has ship_loci (the beginning)', () => {
    expect(beats[0].characters?.some((c) => c.id === 'ship_loci')).toBe(true);
  });

  it('last beat has ship_loci (the ending mirror)', () => {
    const last = beats[beats.length - 1];
    expect(last.characters?.some((c) => c.id === 'ship_loci')).toBe(true);
  });

  it('last beat has golden_chart (journey complete)', () => {
    const last = beats[beats.length - 1];
    expect(last.props?.some((p) => p.kind === 'golden_chart')).toBe(true);
  });

  it('last beat has sunrise (hopeful ending)', () => {
    const last = beats[beats.length - 1];
    expect(last.props?.some((p) => p.kind === 'sunrise')).toBe(true);
  });

  it('has a dark section in the middle-to-late beats (All Is Lost / Dark Night)', () => {
    const darkBeats = beats.filter((b) => b.sky === 'dark_sea');
    expect(darkBeats.length).toBeGreaterThanOrEqual(2);
    // Should be in the second half
    const firstDarkIdx = beats.findIndex((b) => b.sky === 'dark_sea');
    expect(firstDarkIdx).toBeGreaterThan(beats.length / 2 - 1);
  });

  it('has storm beats for conflict sections', () => {
    const stormBeats = beatsWithSky('storm');
    expect(stormBeats.length).toBeGreaterThanOrEqual(2);
  });

  it('follows emotional arc: calm → light → dark → resolution', () => {
    // First beat is dawn (calm)
    expect(beats[0].sky).toBe('dawn');
    // Middle-early beats include day (light / fun and games)
    const dayBeats = beats.filter((b) => b.sky === 'day');
    expect(dayBeats.length).toBeGreaterThanOrEqual(2);
    // Dark sea appears before final dawn
    const lastDarkIdx = beats.map((b) => b.sky).lastIndexOf('dark_sea');
    const lastDawnIdx = beats.map((b) => b.sky).lastIndexOf('dawn');
    expect(lastDarkIdx).toBeLessThan(lastDawnIdx);
  });

  it('the Catalyst beat (beat 5) introduces Null or ship_overfit', () => {
    // Beat 5 is the Catalyst — Captain Null appears
    const catalystBeat = beats[4]; // 0-indexed
    const hasNull = catalystBeat.characters?.some(
      (c) => c.id === 'null' || c.id === 'ship_overfit',
    );
    expect(hasNull).toBe(true);
  });

  it('has a Midpoint beat with golden_chart (false victory)', () => {
    // Midpoint should be around beat 11 (index 10)
    const midpointRange = beats.slice(9, 12);
    const hasGoldenChart = midpointRange.some((b) =>
      b.props?.some((p) => p.kind === 'golden_chart'),
    );
    expect(hasGoldenChart).toBe(true);
  });

  it('Kraken appears in the All Is Lost section', () => {
    const krakenBeats = beats.filter((b) => b.characters?.some((c) => c.id === 'kraken'));
    expect(krakenBeats.length).toBeGreaterThanOrEqual(1);
    // Kraken should appear in the later half
    const firstKrakenIdx = beats.findIndex((b) => b.characters?.some((c) => c.id === 'kraken'));
    expect(firstKrakenIdx).toBeGreaterThanOrEqual(Math.floor(beats.length * 0.6));
  });

  it('Finale beats have shake (intensity)', () => {
    // Beats 16 = index 15 (battle)
    const battleBeat = beats.find((b) => b.id.includes('finale_battle'));
    expect(battleBeat).toBeDefined();
    expect(battleBeat!.shake).toBeGreaterThan(0);
  });
});

// ── Pacing analysis ──────────────────────────────────────────

describe('Game Over Cinematic — pacing', () => {
  it('total auto-play duration is between 55 and 90 seconds', () => {
    const totalS = beats.reduce((acc, b) => acc + b.durationS, 0);
    expect(totalS).toBeGreaterThanOrEqual(55);
    expect(totalS).toBeLessThanOrEqual(90);
  });

  it('at least 8 beats require tap-to-advance (dramatic pauses)', () => {
    const tapBeats = beats.filter((b) => b.waitForTap);
    expect(tapBeats.length).toBeGreaterThanOrEqual(8);
  });

  it('first beat requires tap (let player absorb)', () => {
    expect(beats[0].waitForTap).toBe(true);
  });

  it('last beat requires tap (curtain call)', () => {
    expect(beats[beats.length - 1].waitForTap).toBe(true);
  });

  it('no two consecutive auto-advance beats exceed 8s combined', () => {
    for (let i = 0; i < beats.length - 1; i++) {
      if (!beats[i].waitForTap && !beats[i + 1].waitForTap) {
        const combined = beats[i].durationS + beats[i + 1].durationS;
        expect(combined).toBeLessThanOrEqual(8);
      }
    }
  });

  it('Dark Night of the Soul beat has longer duration (≥4s)', () => {
    const darkNight = beats.find((b) => b.id.includes('dark_night'));
    expect(darkNight).toBeDefined();
    expect(darkNight!.durationS).toBeGreaterThanOrEqual(4);
  });

  it('Finale battle beat is shorter for intensity (≤3.5s)', () => {
    const battle = beats.find((b) => b.id.includes('finale_battle'));
    expect(battle).toBeDefined();
    expect(battle!.durationS).toBeLessThanOrEqual(3.5);
  });

  it('Final Image beat is the longest (≥4.5s)', () => {
    const finalImage = beats[beats.length - 1];
    const maxDuration = Math.max(...beats.slice(0, -1).map((b) => b.durationS));
    expect(finalImage.durationS).toBeGreaterThanOrEqual(maxDuration);
  });
});

// ── Character coverage ───────────────────────────────────────

describe('Game Over Cinematic — character usage', () => {
  it('Nemo appears in multiple beats (protagonist)', () => {
    const nemoBeats = beats.filter((b) => b.characters?.some((c) => c.id === 'nemo'));
    expect(nemoBeats.length).toBeGreaterThanOrEqual(8);
  });

  it('Bit appears throughout (companion / B Story)', () => {
    const bitBeats = beats.filter((b) => b.characters?.some((c) => c.id === 'bit'));
    expect(bitBeats.length).toBeGreaterThanOrEqual(5);
  });

  it('Null/ship_overfit appears (antagonist)', () => {
    expect(hasCharacter('null') || hasCharacter('ship_overfit')).toBe(true);
  });

  it('Kraken appears (final guardian)', () => {
    expect(hasCharacter('kraken')).toBe(true);
  });

  it('ship_loci appears (the player\'s vessel)', () => {
    expect(hasCharacter('ship_loci')).toBe(true);
  });

  it('Nemo has celebrate animation in victory beats', () => {
    const victoryBeats = beats.filter(
      (b) => b.sky === 'dawn' && b.characters?.some((c) => c.id === 'nemo' && c.anim === 'celebrate'),
    );
    expect(victoryBeats.length).toBeGreaterThanOrEqual(1);
  });

  it('Kraken has emerge animation (rising from the deep)', () => {
    const krakenEmerge = beats.some((b) =>
      b.characters?.some((c) => c.id === 'kraken' && c.anim === 'emerge'),
    );
    expect(krakenEmerge).toBe(true);
  });

  it('Null has fist_shake animation (rivalry)', () => {
    const nullShake = beats.some((b) =>
      b.characters?.some((c) => c.id === 'null' && c.anim === 'fist_shake'),
    );
    expect(nullShake).toBe(true);
  });
});

// ── Prop coverage ────────────────────────────────────────────

describe('Game Over Cinematic — prop usage', () => {
  it('uses golden_chart (the ultimate reward)', () => {
    expect(hasProp('golden_chart')).toBe(true);
  });

  it('uses chart_fragment (journey progress)', () => {
    expect(hasProp('chart_fragment')).toBe(true);
  });

  it('uses sunrise (hope / new beginnings)', () => {
    expect(hasProp('sunrise')).toBe(true);
  });

  it('uses tentacle (Kraken threat)', () => {
    expect(hasProp('tentacle')).toBe(true);
  });

  it('uses lightning (storm / conflict)', () => {
    expect(hasProp('lightning')).toBe(true);
  });

  it('uses wreckage (Null\'s defeat)', () => {
    expect(hasProp('wreckage')).toBe(true);
  });

  it('uses fog_wall (mystery / unknown)', () => {
    expect(hasProp('fog_wall')).toBe(true);
  });

  it('uses island_silhouette (world building)', () => {
    expect(hasProp('island_silhouette')).toBe(true);
  });

  it('uses cannon_flash in battle', () => {
    expect(hasProp('cannon_flash')).toBe(true);
  });

  it('golden_chart appears in both midpoint and final beats', () => {
    const goldenBeats = beats.filter((b) => b.props?.some((p) => p.kind === 'golden_chart'));
    expect(goldenBeats.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Narrative captions ───────────────────────────────────────

describe('Game Over Cinematic — narrative', () => {
  it('every beat has a caption', () => {
    for (const beat of beats) {
      expect(beat.caption, `beat ${beat.id} missing caption`).toBeTruthy();
    }
  });

  it('captions mention memory/remember (core theme)', () => {
    const text = captionText().toLowerCase();
    expect(text).toMatch(/memory|remember|memories/);
  });

  it('captions mention the Kraken (climax)', () => {
    const text = captionText().toLowerCase();
    expect(text).toMatch(/kraken/);
  });

  it('captions mention Null (antagonist)', () => {
    const text = captionText().toLowerCase();
    expect(text).toMatch(/null/);
  });

  it('captions mention Dead Reckoner (earned title)', () => {
    const text = captionText();
    expect(text).toMatch(/Dead Reckoner/);
  });

  it('captions mention the Golden Chart (ultimate goal)', () => {
    const text = captionText();
    expect(text).toMatch(/Golden Chart/);
  });

  it('final caption references new seas (sequel hook)', () => {
    const lastCaption = beats[beats.length - 1].caption!;
    expect(lastCaption.toLowerCase()).toMatch(/new sea|await/);
  });

  it('opening caption references beginning', () => {
    const firstCaption = beats[0].caption!;
    expect(firstCaption.toLowerCase()).toMatch(/began|beginning|memory sea/);
  });
});

// ── Visual variety ───────────────────────────────────────────

describe('Game Over Cinematic — visual variety', () => {
  it('uses at least 4 different sky presets', () => {
    const skies = new Set(beats.map((b) => b.sky));
    expect(skies.size).toBeGreaterThanOrEqual(4);
  });

  it('uses at least 5 different prop types', () => {
    const propTypes = new Set<string>();
    for (const beat of beats) {
      if (beat.props) {
        for (const p of beat.props) {
          propTypes.add(p.kind);
        }
      }
    }
    expect(propTypes.size).toBeGreaterThanOrEqual(5);
  });

  it('uses at least 4 different character animations', () => {
    const anims = new Set<string>();
    for (const beat of beats) {
      if (beat.characters) {
        for (const c of beat.characters) {
          if (c.anim) anims.add(c.anim);
        }
      }
    }
    expect(anims.size).toBeGreaterThanOrEqual(4);
  });

  it('uses tint overlays in at least 4 beats', () => {
    const tintBeats = beats.filter((b) => b.tint);
    expect(tintBeats.length).toBeGreaterThanOrEqual(4);
  });

  it('uses shake in at least 3 beats (action/tension)', () => {
    const shakeBeats = beats.filter((b) => b.shake && b.shake > 0);
    expect(shakeBeats.length).toBeGreaterThanOrEqual(3);
  });

  it('shake increases toward the climax', () => {
    const shakeBeats = beats
      .map((b, i) => ({ index: i, shake: b.shake ?? 0 }))
      .filter((s) => s.shake > 0);
    if (shakeBeats.length >= 2) {
      const maxShake = shakeBeats.reduce((a, b) => (a.shake > b.shake ? a : b));
      // Max shake should be in the later half (finale)
      expect(maxShake.index).toBeGreaterThan(beats.length / 2);
    }
  });
});

// ── beat id uniqueness against island cinematics ─────────────

describe('Game Over Cinematic — id isolation', () => {
  it('beat ids do not collide with island cinematic ids', async () => {
    const { ISLAND_CINEMATICS } = await import('../../../src/cinematics/island-cinematics');
    const islandBeatIds = new Set<string>();
    for (const cine of Object.values(ISLAND_CINEMATICS)) {
      for (const b of cine.intro.beats) islandBeatIds.add(b.id);
      for (const b of cine.outro.beats) islandBeatIds.add(b.id);
    }
    for (const beat of beats) {
      expect(islandBeatIds.has(beat.id), `beat id "${beat.id}" collides with island cinematics`).toBe(false);
    }
  });
});
