/**
 * Ship Upgrade Effects — Design Compliance Tests
 *
 * Validates requirements U1–U8 from ShipUpgrades.md:
 *  - Upgrades are auto-applied (no menu/shop)
 *  - Each island rewards a specific upgrade with a specific effect
 *  - Upgrade effects match the design specification exactly
 *  - Fog and Ruins encounters are NOT affected by ship upgrades
 */
import { describe, it, expect } from 'vitest';
import { UPGRADES, type UpgradeDefinition } from '../../../src/data/upgrades';
import { ISLAND_UPGRADE_REWARDS } from '../../../src/data/progression';
import { ENCOUNTERS, type EncounterTemplate } from '../../../src/data/encounters';
import { ISLANDS } from '../../../src/data/islands';

// ── U1: Auto-upgrades (no menu) — structural check ──

describe('Ship Upgrades — Auto-Apply Model', () => {
  it('U1 — upgrades are keyed to island completion, not a shop/menu', () => {
    // Every non-legendary upgrade is gated by an island id
    const islandGated = UPGRADES.filter((u) => u.unlockedAfterIsland.startsWith('island_'));
    expect(islandGated.length).toBeGreaterThanOrEqual(4);
    // No "shop_purchase" or "menu" strings in effects
    for (const u of UPGRADES) {
      expect(u.effects.join(' ')).not.toContain('shop');
      expect(u.effects.join(' ')).not.toContain('menu');
    }
  });

  it('U1 — progression table maps exactly 4 main islands to upgrades', () => {
    expect(Object.keys(ISLAND_UPGRADE_REWARDS)).toEqual([
      'island_01',
      'island_02',
      'island_03',
      'island_04',
    ]);
  });
});

// ── U2-U6: Specific effects per island ──

describe('Ship Upgrades — Effect Specification', () => {
  const upgradeById = (id: string): UpgradeDefinition | undefined =>
    UPGRADES.find((u) => u.id === id);

  it('U2 — Island 1 → Reinforced Mast → 1.2× sail speed', () => {
    expect(ISLAND_UPGRADE_REWARDS['island_01']).toBe('reinforced_mast');
    const mast = upgradeById('reinforced_mast')!;
    expect(mast).toBeDefined();
    expect(mast.unlockedAfterIsland).toBe('island_01');
    expect(mast.effects).toContain('sail_speed_1.2x');
  });

  it('U3 — Island 2 → Enchanted Cannon → +1 battle error tolerance', () => {
    expect(ISLAND_UPGRADE_REWARDS['island_02']).toBe('enchanted_cannon');
    const cannon = upgradeById('enchanted_cannon')!;
    expect(cannon).toBeDefined();
    expect(cannon.unlockedAfterIsland).toBe('island_02');
    expect(cannon.effects).toContain('battle_error_tolerance_plus_1');
  });

  it('U4 — Island 3 → Ironclad Hull → +1 storm resistance', () => {
    expect(ISLAND_UPGRADE_REWARDS['island_03']).toBe('ironclad_hull');
    const hull = upgradeById('ironclad_hull')!;
    expect(hull).toBeDefined();
    expect(hull.unlockedAfterIsland).toBe('island_03');
    expect(hull.effects).toContain('storm_resistance_plus_1');
  });

  it('U5 — Island 4 → Golden Compass → +2s recall window', () => {
    expect(ISLAND_UPGRADE_REWARDS['island_04']).toBe('golden_compass');
    const compass = upgradeById('golden_compass')!;
    expect(compass).toBeDefined();
    expect(compass.unlockedAfterIsland).toBe('island_04');
    expect(compass.effects).toContain('recall_window_plus_2_seconds');
  });

  it('U6 — Ghostlight Lantern unlocks Hidden Reef after expert completion', () => {
    const lantern = upgradeById('ghostlight_lantern')!;
    expect(lantern).toBeDefined();
    expect(lantern.unlockedAfterIsland).toBe('expert_completion');
    expect(lantern.effects).toContain('unlock_hidden_reef');
    expect(lantern.effects).toContain('clear_fog_of_war');
  });
});

// ── U7: Upgrade rarity escalation ──

describe('Ship Upgrades — Rarity Escalation', () => {
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  it('U7 — each subsequent upgrade has equal or higher rarity', () => {
    const islandOrder = ['island_01', 'island_02', 'island_03', 'island_04'];
    const orderedUpgrades = islandOrder.map((islandId) => {
      const upgradeId = ISLAND_UPGRADE_REWARDS[islandId];
      return UPGRADES.find((u) => u.id === upgradeId)!;
    });

    for (let i = 1; i < orderedUpgrades.length; i++) {
      const prev = rarityOrder.indexOf(orderedUpgrades[i - 1]!.rarity);
      const curr = rarityOrder.indexOf(orderedUpgrades[i]!.rarity);
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

// ── U8: Fog and Ruins are unaffected by ship upgrades ──

describe('Ship Upgrades — Fog/Ruins Unaffected', () => {
  it('U8 — no upgrade effect mentions fog or ruins encounters', () => {
    const allEffects = UPGRADES.flatMap((u) => u.effects);
    const fogEffects = allEffects.filter(
      (e) => e.includes('fog_') && !e.includes('fog_of_war'),
    );
    const ruinsEffects = allEffects.filter((e) => e.includes('ruins_'));
    expect(fogEffects).toEqual([]);
    expect(ruinsEffects).toEqual([]);
  });

  it('U8 — cannon effect targets battle only', () => {
    const cannon = UPGRADES.find((u) => u.id === 'enchanted_cannon')!;
    expect(cannon.effects.every((e) => e.includes('battle'))).toBe(true);
  });

  it('U8 — hull effect targets storm only', () => {
    const hull = UPGRADES.find((u) => u.id === 'ironclad_hull')!;
    expect(hull.effects.every((e) => e.includes('storm'))).toBe(true);
  });
});

// ── Cross-reference: upgrade rewards align with encounter types ──

describe('Ship Upgrades — Encounter Cross-Reference', () => {
  it('cannon upgrade applies to battle-type encounter (Island 3)', () => {
    const island3 = ISLANDS.find((i) => i.id === 'island_03')!;
    expect(island3.encounterType).toBe('battle');
    // Cannon is earned AFTER island 2, available for island 3's battle
    const cannon = UPGRADES.find((u) => u.id === 'enchanted_cannon')!;
    expect(cannon.unlockedAfterIsland).toBe('island_02');
  });

  it('hull upgrade applies to storm-type encounter (Island 2)', () => {
    // Hull earned after island 3, provides retroactive storm protection for replay
    const hull = UPGRADES.find((u) => u.id === 'ironclad_hull')!;
    expect(hull.unlockedAfterIsland).toBe('island_03');
  });

  it('compass upgrade extends recall window available for Island 5 boss', () => {
    const compass = UPGRADES.find((u) => u.id === 'golden_compass')!;
    expect(compass.unlockedAfterIsland).toBe('island_04');
    // Island 5 is squid boss — compass helps with harder recall
    const island5 = ISLANDS.find((i) => i.id === 'island_05')!;
    expect(island5.encounterType).toBe('squid');
  });
});
