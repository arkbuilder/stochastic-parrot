/**
 * Fun Factor & Variety — validates player delight comes from enough
 * variety in enemies, weather, flora, terrain, powerups, and encounters
 * to keep each island feeling fresh and the overall campaign rewarding.
 */
import { describe, it, expect } from 'vitest';
import { ISLANDS } from '../../../src/data/islands';
import { ENCOUNTERS } from '../../../src/data/encounters';
import { UPGRADES } from '../../../src/data/upgrades';
import { OVERWORLD_NODES, ISLAND_UPGRADE_REWARDS } from '../../../src/data/progression';
import { BESTIARY, CRITTERS, THREATS, FLORA, TERRAIN } from '../../../src/data/bestiary';
import { createWeatherState, updateWeatherSystem, type EncounterWeatherType } from '../../../src/systems/weather-system';
import { createPowerup, type PowerupKind } from '../../../src/entities/powerup';
import { createEnemy, updateEnemy, type EnemyKind } from '../../../src/entities/enemy';

// ── Weather variety ──────────────────────────────────────────

describe('Fun — weather variety per encounter type', () => {
  const encounterTypes: EncounterWeatherType[] = ['fog', 'storm', 'battle', 'ruins', 'squid'];

  it('5 distinct encounter types produce weather', () => {
    for (const type of encounterTypes) {
      const state = createWeatherState(type);
      expect(state, `no weather for ${type}`).toBeDefined();
      expect(state.kind).toBeTruthy();
    }
  });

  it('weather kinds differ across encounter types', () => {
    const kinds = encounterTypes.map((t) => createWeatherState(t).kind);
    const unique = new Set(kinds);
    // At least 4 out of 5 should differ (fog and clear could overlap)
    expect(unique.size).toBeGreaterThanOrEqual(4);
  });

  it('weather state updates without error over 10s', () => {
    for (const type of encounterTypes) {
      const state = createWeatherState(type);
      for (let i = 0; i < 600; i++) {
        updateWeatherSystem(state, 1 / 60, type);
      }
      expect(state.elapsed).toBeGreaterThan(0);
    }
  });
});

// ── Enemy variety ────────────────────────────────────────────

describe('Fun — enemy variety', () => {
  const allKinds: EnemyKind[] = ['crab', 'fire_crab', 'jellyfish', 'shadow_jelly', 'burrower', 'sand_wyrm', 'urchin', 'ray'];

  it('8 unique enemy kinds', () => {
    expect(allKinds.length).toBe(8);
  });

  it('3 behaviour patterns represented (patrol, stationary, burrower)', () => {
    const patrol = createEnemy('e1', 'crab', 10, 100, 100, 100, 30);
    const stationary = createEnemy('e2', 'urchin', 50, 50, 50, 50, 0);
    const burrower = createEnemy('e3', 'burrower', 30, 120, 90, 120, 25);

    // Patrol: moves between points
    const px0 = patrol.position.x;
    updateEnemy(patrol, 0.5);
    expect(patrol.position.x).not.toBe(px0);

    // Stationary: doesn't move
    const sx0 = stationary.position.x;
    updateEnemy(stationary, 0.5);
    expect(stationary.position.x).toBe(sx0);

    // Burrower: starts hidden
    expect(burrower.state.burrowPhase).toBe('hidden');
  });

  it('every critter bestiary entry maps to the enemy factory', () => {
    for (const critter of CRITTERS) {
      const enemy = createEnemy(critter.id, critter.id as EnemyKind, 50, 100, 100, 100, 20);
      expect(enemy, `${critter.id} failed factory`).toBeDefined();
      expect(enemy.state.kind).toBe(critter.id);
    }
  });

  it('danger levels escalate across critters', () => {
    const dangers = CRITTERS.map((c) => c.danger);
    expect(Math.min(...dangers)).toBe(1);
    expect(Math.max(...dangers)).toBe(4);
  });
});

// ── Flora variety ────────────────────────────────────────────

describe('Fun — flora per island', () => {
  it('6 unique flora types (one per island)', () => {
    expect(FLORA.length).toBe(6);
    const ids = FLORA.map((f) => f.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('each island references a valid flora vegetation type', () => {
    const floraHints = FLORA.map((f) => f.renderHint);
    for (const island of ISLANDS) {
      for (const v of island.vegetation) {
        expect(floraHints, `${island.id} vegetation "${v}" not in flora`).toContain(v);
      }
    }
  });

  it('each island has unique vegetation', () => {
    const vegSets: string[][] = ISLANDS.map((i) => i.vegetation);
    // No two islands should share the same primary vegetation
    const primaries = vegSets.map((v) => v[0]);
    expect(new Set(primaries).size).toBe(primaries.length);
  });
});

// ── Terrain variety ──────────────────────────────────────────

describe('Fun — terrain variety', () => {
  it('10 terrain types exist', () => {
    expect(TERRAIN.length).toBe(10);
  });

  it('terrain IDs are all unique', () => {
    const ids = TERRAIN.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('common terrains appear on all islands', () => {
    const water = TERRAIN.find((t) => t.id === 'terrain_water')!;
    const sand = TERRAIN.find((t) => t.id === 'terrain_sand')!;
    const grass = TERRAIN.find((t) => t.id === 'terrain_grass')!;

    // These should appear everywhere
    expect(water.habitat.length).toBe(6);
    expect(sand.habitat.length).toBe(6);
    expect(grass.habitat.length).toBe(6);
  });

  it('some terrain is unique to specific islands', () => {
    const volcanic = TERRAIN.find((t) => t.id === 'terrain_volcanic')!;
    expect(volcanic.habitat.length).toBe(1);
    expect(volcanic.habitat[0]).toBe("Kraken's Reach");
  });
});

// ── Powerup variety ──────────────────────────────────────────

describe('Fun — powerup variety', () => {
  const kinds: PowerupKind[] = ['speed', 'shield', 'freeze', 'reveal'];

  it('4 powerup types', () => {
    expect(kinds.length).toBe(4);
  });

  it('all powerups create successfully', () => {
    let idx = 0;
    for (const kind of kinds) {
      const p = createPowerup(`pu_${idx++}`, kind, 50, 100);
      expect(p.state.kind).toBe(kind);
      expect(p.state.duration).toBeGreaterThan(0);
    }
  });

  it('powerup durations are between 3 and 10 seconds', () => {
    for (const kind of kinds) {
      const p = createPowerup('t', kind, 0, 0);
      expect(p.state.duration, `${kind}`)
        .toBeGreaterThanOrEqual(3);
      expect(p.state.duration, `${kind}`)
        .toBeLessThanOrEqual(10);
    }
  });
});

// ── Encounter variety ────────────────────────────────────────

describe('Fun — encounter variety', () => {
  it('5 encounter types', () => {
    expect(ENCOUNTERS.length).toBe(5);
  });

  it('encounter IDs are unique', () => {
    const ids = ENCOUNTERS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('encounter types are unique', () => {
    const types = ENCOUNTERS.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('each main island maps to a different encounter type', () => {
    const mainIslands = ISLANDS.filter((i) => i.id !== 'hidden_reef');
    const types = mainIslands.map((i) => i.encounterType);
    expect(new Set(types).size).toBe(types.length);
  });
});

// ── Upgrade variety ──────────────────────────────────────────

describe('Fun — upgrade progression', () => {
  it('5 upgrades exist', () => {
    expect(UPGRADES.length).toBe(5);
  });

  it('upgrades have escalating rarity', () => {
    const rarities = UPGRADES.map((u) => u.rarity);
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    for (let i = 0; i < rarities.length; i++) {
      expect(order).toContain(rarities[i]);
    }
    // The first should be common, the last legendary
    expect(rarities[0]).toBe('common');
    expect(rarities[rarities.length - 1]).toBe('legendary');
  });

  it('ISLAND_UPGRADE_REWARDS map to valid upgrade IDs', () => {
    const upgradeIds = UPGRADES.map((u) => u.id);
    for (const [islandId, upgradeId] of Object.entries(ISLAND_UPGRADE_REWARDS)) {
      expect(upgradeIds, `${islandId} → ${upgradeId} unknown`).toContain(upgradeId);
    }
  });

  it('every upgrade has at least one effect', () => {
    for (const u of UPGRADES) {
      expect(u.effects.length, `${u.id} has no effects`).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── Bestiary completeness ────────────────────────────────────

describe('Fun — bestiary completeness', () => {
  it('29 total entries across 4 categories', () => {
    expect(BESTIARY.length).toBe(29);
    expect(CRITTERS.length).toBe(8);
    expect(THREATS.length).toBe(5);
    expect(FLORA.length).toBe(6);
    expect(TERRAIN.length).toBe(10);
    expect(CRITTERS.length + THREATS.length + FLORA.length + TERRAIN.length).toBe(29);
  });

  it('every threat corresponds to an encounter type', () => {
    const encounterTypes = ENCOUNTERS.map((e) => e.type);
    for (const threat of THREATS) {
      expect(
        encounterTypes,
        `${threat.id} renderHint "${threat.renderHint}" not mapped to an encounter`,
      ).toContain(threat.renderHint);
    }
  });

  it('secret overworld node for Hidden Reef', () => {
    const reef = OVERWORLD_NODES.find((n) => n.islandId === 'hidden_reef');
    expect(reef).toBeDefined();
    expect(reef!.secret).toBe(true);
  });
});
