import { describe, expect, it } from 'vitest';
import { UPGRADES } from '../../../src/data/upgrades';

describe('UPGRADES', () => {
  it('contains all five progression upgrades with unique IDs', () => {
    expect(UPGRADES).toHaveLength(5);

    const ids = new Set(UPGRADES.map((upgrade) => upgrade.id));
    expect(ids.size).toBe(UPGRADES.length);
    expect(ids.has('reinforced_mast')).toBe(true);
    expect(ids.has('enchanted_cannon')).toBe(true);
    expect(ids.has('ironclad_hull')).toBe(true);
    expect(ids.has('golden_compass')).toBe(true);
    expect(ids.has('ghostlight_lantern')).toBe(true);
  });

  it('keeps expected unlock cadence for M3 milestones', () => {
    const byId = Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, upgrade]));

    expect(byId.reinforced_mast?.unlockedAfterIsland).toBe('island_01');
    expect(byId.enchanted_cannon?.unlockedAfterIsland).toBe('island_02');
    expect(byId.ironclad_hull?.unlockedAfterIsland).toBe('island_03');
    expect(byId.golden_compass?.unlockedAfterIsland).toBe('island_04');
    expect(byId.ghostlight_lantern?.unlockedAfterIsland).toBe('expert_completion');
  });
});
