import { describe, it, expect } from 'vitest';
import { BESTIARY, CRITTERS, THREATS, FLORA, TERRAIN, type BestiaryEntry } from '../../../src/data/bestiary';

// ── Basic structure ──────────────────────────────────────────

describe('Bestiary — data structure', () => {
  it('BESTIARY is a non-empty array', () => {
    expect(Array.isArray(BESTIARY)).toBe(true);
    expect(BESTIARY.length).toBeGreaterThan(0);
  });

  it('every entry has required fields', () => {
    for (const entry of BESTIARY) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.category).toMatch(/^(critter|threat|flora|terrain)$/);
      expect(entry.flavour.length).toBeGreaterThan(0);
      expect(entry.behaviour.length).toBeGreaterThan(0);
      expect(entry.danger).toBeGreaterThanOrEqual(0);
      expect(entry.danger).toBeLessThanOrEqual(5);
      expect(entry.habitat.length).toBeGreaterThan(0);
      expect(entry.renderHint).toBeTruthy();
    }
  });

  it('every entry has a unique id', () => {
    const ids = BESTIARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a unique name', () => {
    const names = BESTIARY.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ── Category filtering ───────────────────────────────────────

describe('Bestiary — categories', () => {
  it('CRITTERS contains only critter entries', () => {
    for (const entry of CRITTERS) {
      expect(entry.category).toBe('critter');
    }
  });

  it('THREATS contains only threat entries', () => {
    for (const entry of THREATS) {
      expect(entry.category).toBe('threat');
    }
  });

  it('CRITTERS + THREATS + FLORA + TERRAIN equals BESTIARY length', () => {
    expect(CRITTERS.length + THREATS.length + FLORA.length + TERRAIN.length).toBe(BESTIARY.length);
  });

  it('TERRAIN contains only terrain entries', () => {
    for (const entry of TERRAIN) {
      expect(entry.category).toBe('terrain');
    }
  });

  it('has at least 10 terrain entries', () => {
    expect(TERRAIN.length).toBeGreaterThanOrEqual(10);
  });

  it('FLORA contains only flora entries', () => {
    for (const entry of FLORA) {
      expect(entry.category).toBe('flora');
    }
  });

  it('has at least 6 flora entries', () => {
    expect(FLORA.length).toBeGreaterThanOrEqual(6);
  });

  it('has at least 8 critters', () => {
    expect(CRITTERS.length).toBeGreaterThanOrEqual(8);
  });

  it('has at least 5 threats', () => {
    expect(THREATS.length).toBeGreaterThanOrEqual(5);
  });
});

// ── Island critter entries ───────────────────────────────────

describe('Bestiary — critters', () => {
  const critterIds = CRITTERS.map((e) => e.id);

  it('contains crab', () => {
    expect(critterIds).toContain('crab');
  });

  it('contains fire_crab', () => {
    expect(critterIds).toContain('fire_crab');
  });

  it('contains jellyfish', () => {
    expect(critterIds).toContain('jellyfish');
  });

  it('contains shadow_jelly', () => {
    expect(critterIds).toContain('shadow_jelly');
  });

  it('contains burrower', () => {
    expect(critterIds).toContain('burrower');
  });

  it('contains sand_wyrm', () => {
    expect(critterIds).toContain('sand_wyrm');
  });

  it('contains urchin', () => {
    expect(critterIds).toContain('urchin');
  });

  it('contains ray', () => {
    expect(critterIds).toContain('ray');
  });

  it('critter render hints match enemy kinds', () => {
    const validKinds = ['crab', 'fire_crab', 'jellyfish', 'shadow_jelly', 'burrower', 'sand_wyrm', 'urchin', 'ray'];
    for (const c of CRITTERS) {
      expect(validKinds).toContain(c.renderHint);
    }
  });

  it('crab has lower danger than burrower', () => {
    const crab = CRITTERS.find((e) => e.id === 'crab')!;
    const burrower = CRITTERS.find((e) => e.id === 'burrower')!;
    expect(crab.danger).toBeLessThan(burrower.danger);
  });

  it('elite variants have higher danger than base forms', () => {
    const crab = CRITTERS.find((e) => e.id === 'crab')!;
    const fireCrab = CRITTERS.find((e) => e.id === 'fire_crab')!;
    expect(fireCrab.danger).toBeGreaterThan(crab.danger);

    const jelly = CRITTERS.find((e) => e.id === 'jellyfish')!;
    const shadowJelly = CRITTERS.find((e) => e.id === 'shadow_jelly')!;
    expect(shadowJelly.danger).toBeGreaterThan(jelly.danger);

    const burrower = CRITTERS.find((e) => e.id === 'burrower')!;
    const sandWyrm = CRITTERS.find((e) => e.id === 'sand_wyrm')!;
    expect(sandWyrm.danger).toBeGreaterThan(burrower.danger);
  });
});

// ── Encounter threat entries ─────────────────────────────────

describe('Bestiary — threats', () => {
  const threatIds = THREATS.map((e) => e.id);

  it('contains cursed_fog', () => {
    expect(threatIds).toContain('cursed_fog');
  });

  it('contains storm', () => {
    expect(threatIds).toContain('storm');
  });

  it('contains rival_battle', () => {
    expect(threatIds).toContain('rival_battle');
  });

  it('contains ruins', () => {
    expect(threatIds).toContain('ruins');
  });

  it('contains giant_squid (Kraken)', () => {
    expect(threatIds).toContain('giant_squid');
  });

  it('threat render hints match encounter types', () => {
    const validTypes = ['fog', 'storm', 'battle', 'ruins', 'squid'];
    for (const t of THREATS) {
      expect(validTypes).toContain(t.renderHint);
    }
  });

  it('Kraken has the highest danger rating (5)', () => {
    const kraken = THREATS.find((e) => e.id === 'giant_squid')!;
    expect(kraken.danger).toBe(5);
    for (const t of THREATS) {
      expect(t.danger).toBeLessThanOrEqual(kraken.danger);
    }
  });
});

// ── Flavour / behaviour text quality ─────────────────────────

describe('Bestiary — text quality', () => {
  it('flavour text is under 80 chars (fits UI)', () => {
    for (const entry of BESTIARY) {
      expect(entry.flavour.length, `${entry.id} flavour too long`).toBeLessThanOrEqual(80);
    }
  });

  it('behaviour text is under 100 chars', () => {
    for (const entry of BESTIARY) {
      expect(entry.behaviour.length, `${entry.id} behaviour too long`).toBeLessThanOrEqual(100);
    }
  });

  it('names are under 20 chars', () => {
    for (const entry of BESTIARY) {
      expect(entry.name.length, `${entry.id} name too long`).toBeLessThanOrEqual(20);
    }
  });
});

// ── Danger distribution ──────────────────────────────────────

describe('Bestiary — danger ratings', () => {
  it('danger levels span at least 3 distinct values', () => {
    const levels = new Set(BESTIARY.map((e) => e.danger));
    expect(levels.size).toBeGreaterThanOrEqual(3);
  });

  it('no entry exceeds danger 5', () => {
    for (const e of BESTIARY) {
      expect(e.danger).toBeLessThanOrEqual(5);
    }
  });

  it('at least one entry has danger 1 (easy)', () => {
    expect(BESTIARY.some((e) => e.danger === 1)).toBe(true);
  });

  it('at least one entry has danger 5 (boss)', () => {
    expect(BESTIARY.some((e) => e.danger === 5)).toBe(true);
  });
});

// ── Habitat validity ─────────────────────────────────────────

describe('Bestiary — habitats', () => {
  const validIslands = [
    'Bay of Learning',
    'Driftwood Shallows',
    'Coral Maze',
    'Storm Bastion',
    "Kraken's Reach",
    'Hidden Reef',
  ];

  it('all habitats reference known islands', () => {
    for (const entry of BESTIARY) {
      for (const h of entry.habitat) {
        expect(validIslands, `Unknown habitat "${h}" on ${entry.id}`).toContain(h);
      }
    }
  });
});
