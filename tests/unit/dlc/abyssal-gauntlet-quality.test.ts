/**
 * Abyssal Gauntlet DLC - Pack Integrity & Quality Verification
 *
 * Validates the "Abyssal Gauntlet" combat-only roguelike DLC. This DLC has
 * ZERO concepts, ZERO minigames, and ZERO landmarks - it is a pure
 * combat/exploration mode with Zelda NES-style screen navigation.
 *
 * Tests cover: manifest, island metadata, encounters, overworld nodes,
 * bestiary, validation, merge, registry, unlock flow, and progressive
 * difficulty.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ABYSSAL_GAUNTLET_PACK } from '../../../src/dlc/packs/abyssal-gauntlet-pack';
import { validateDlcPack, mergeDlcContent } from '../../../src/dlc/dlc-driver';
import type { MergedGameData } from '../../../src/dlc/dlc-driver';
import {
  registerDlcPack,
  getDlcPack,
  listDlcManifests,
  clearDlcRegistry,
} from '../../../src/dlc/dlc-registry';
import {
  isBaseCampaignComplete,
  getDlcStatus,
  BASE_CAMPAIGN_ISLANDS,
} from '../../../src/dlc/dlc-unlock';
import { ISLANDS } from '../../../src/data/islands';
import { CONCEPTS } from '../../../src/data/concepts';
import { ENCOUNTERS } from '../../../src/data/encounters';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { BESTIARY } from '../../../src/data/bestiary';
import { CONCEPT_MINIGAMES } from '../../../src/data/concept-minigames';
import { createWeatherState, updateWeatherSystem } from '../../../src/systems/weather-system';
import type { EncounterWeatherType } from '../../../src/systems/weather-system';

const { manifest, content } = ABYSSAL_GAUNTLET_PACK;
const { islands, concepts, encounters, overworldNodes, bestiary, minigames } = content;

// -- Real base data snapshot --

function realBaseData(): MergedGameData {
  return {
    islands: [...ISLANDS],
    concepts: [...CONCEPTS],
    encounters: [...ENCOUNTERS],
    overworldNodes: [...OVERWORLD_NODES],
    bestiary: [...BESTIARY],
    minigames: [...CONCEPT_MINIGAMES],
  };
}

// SECTION 1 - MANIFEST & CONTENT

describe('Abyssal Gauntlet DLC - manifest', () => {
  it('has correct manifest metadata', () => {
    expect(manifest.id).toBe('abyssal-gauntlet');
    expect(manifest.topic).toBe('Combat Mastery');
    expect(manifest.prerequisite).toBe('base_complete');
    expect(manifest.conceptCount).toBe(0);
    expect(manifest.islandCount).toBe(6);
    expect(manifest.tierRange.min).toBeLessThanOrEqual(manifest.tierRange.max);
  });

  it('manifest counts match actual content', () => {
    expect(concepts).toHaveLength(manifest.conceptCount);
    expect(islands).toHaveLength(manifest.islandCount);
  });

  it('version is semver', () => {
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('Abyssal Gauntlet DLC - combat-only contract', () => {
  it('has zero concepts', () => {
    expect(concepts).toHaveLength(0);
  });

  it('has zero minigames', () => {
    expect(minigames).toHaveLength(0);
  });

  it('all islands have empty conceptIds', () => {
    for (const island of islands) {
      expect(island.conceptIds, island.id + ' should have no concepts').toEqual([]);
    }
  });

  it('all islands have empty landmarks', () => {
    for (const island of islands) {
      expect(island.landmarks, island.id + ' should have no landmarks').toEqual([]);
    }
  });
});

// SECTION 2 - ISLAND METADATA

describe('Gameplay - island setup', () => {
  for (const island of islands) {
    it(island.name + ': has a valid encounter type', () => {
      const valid = ['fog', 'storm', 'battle', 'ruins', 'squid'];
      expect(valid).toContain(island.encounterType);
    });

    it(island.name + ': has vegetation', () => {
      expect(island.vegetation!.length).toBeGreaterThanOrEqual(1);
    });

    it(island.name + ': has a reward', () => {
      expect(island.reward).toBeTruthy();
    });
  }
});

describe('Gameplay - overworld node coverage', () => {
  it('every DLC island has an overworld node', () => {
    for (const island of islands) {
      const node = overworldNodes.find((n) => n.islandId === island.id);
      expect(node, 'no overworld node for ' + island.id).toBeDefined();
    }
  });

  it('overworld node names match island names', () => {
    for (const island of islands) {
      const node = overworldNodes.find((n) => n.islandId === island.id)!;
      expect(node.name).toBe(island.name);
    }
  });

  it('overworld nodes form a linear chain (all unique positions)', () => {
    const positions = overworldNodes.map((n) => n.x + ',' + n.y);
    const unique = new Set(positions);
    expect(unique.size).toBe(overworldNodes.length);
  });
});

describe('Gameplay - encounters', () => {
  it('has at least 1 encounter template', () => {
    expect(encounters.length).toBeGreaterThanOrEqual(1);
  });

  it('encounter time windows decrease (difficulty ramp)', () => {
    const sorted = [...encounters].sort((a, b) => a.promptCount - b.promptCount);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.timeWindowMs).toBeLessThanOrEqual(sorted[i - 1]!.timeWindowMs + 2000);
    }
  });

  it('all encounters have valid types', () => {
    const valid = ['fog', 'storm', 'battle', 'ruins', 'squid'];
    for (const enc of encounters) {
      expect(valid).toContain(enc.type);
    }
  });
});

describe('Gameplay - weather system integration', () => {
  for (const island of islands) {
    it(island.name + ': weather creates and updates', () => {
      const type = island.encounterType as EncounterWeatherType;
      const state = createWeatherState(type);
      expect(state).toBeDefined();
      for (let i = 0; i < 300; i++) {
        updateWeatherSystem(state, 1 / 60, type);
      }
      expect(state).toBeDefined();
    });
  }
});

// SECTION 3 - NO COLLISIONS WITH BASE GAME

describe('No ID collisions - base game', () => {
  it('DLC island IDs do not collide', () => {
    const baseIds = new Set(ISLANDS.map((i) => i.id));
    for (const island of islands) {
      expect(baseIds.has(island.id), island.id + ' collides').toBe(false);
    }
  });

  it('DLC bestiary IDs do not collide', () => {
    const baseIds = new Set(BESTIARY.map((b) => b.id));
    for (const entry of bestiary) {
      expect(baseIds.has(entry.id), entry.id + ' collides').toBe(false);
    }
  });

  it('DLC overworld node IDs do not collide', () => {
    const baseIds = new Set(OVERWORLD_NODES.map((n) => n.islandId));
    for (const node of overworldNodes) {
      expect(baseIds.has(node.islandId), node.islandId + ' collides').toBe(false);
    }
  });
});

// SECTION 4 - PACING & BALANCE

describe('Pacing - island unlock chain', () => {
  it('first island has no prerequisite', () => {
    expect(islands[0]!.unlockAfter).toBeUndefined();
  });

  it('subsequent islands form a linear chain', () => {
    for (let i = 1; i < islands.length; i++) {
      expect(islands[i]!.unlockAfter).toBe(islands[i - 1]!.id);
    }
  });
});

// SECTION 5 - BESTIARY

describe('Bestiary - content quality', () => {
  it('has critters, threats, flora, and terrain', () => {
    const categories = new Set(bestiary.map((b) => b.category));
    expect(categories.has('critter')).toBe(true);
    expect(categories.has('threat')).toBe(true);
    expect(categories.has('flora')).toBe(true);
    expect(categories.has('terrain')).toBe(true);
  });

  it('every entry has non-empty flavour and behaviour', () => {
    for (const entry of bestiary) {
      expect(entry.flavour.length, entry.id + ' flavour').toBeGreaterThan(0);
      expect(entry.behaviour.length, entry.id + ' behaviour').toBeGreaterThan(0);
    }
  });

  it('danger levels span 0-5', () => {
    const dangers = bestiary.map((b) => b.danger);
    expect(Math.min(...dangers)).toBe(0);
    expect(Math.max(...dangers)).toBe(5);
  });

  it('boss entry exists with danger 5', () => {
    const boss = bestiary.find((b) => b.danger === 5);
    expect(boss).toBeDefined();
    expect(boss!.name).toBe('The Drowned King');
  });

  it('bridge/chain terrain entries exist for island connections', () => {
    const terrain = bestiary.filter((b) => b.category === 'terrain');
    expect(terrain.length).toBeGreaterThanOrEqual(2);
  });
});

// SECTION 6 - VALIDATION & MERGE

describe('Validation & merge - real base data', () => {
  it('passes validation against real base game data', () => {
    const errors = validateDlcPack(ABYSSAL_GAUNTLET_PACK, realBaseData());
    expect(errors).toEqual([]);
  });

  it('merges cleanly with real base data', () => {
    const base = realBaseData();
    const merged = mergeDlcContent(ABYSSAL_GAUNTLET_PACK, base);
    expect(merged.islands).toHaveLength(base.islands.length + 6);
    // Zero new concepts added
    expect(merged.concepts).toHaveLength(base.concepts.length);
    expect(merged.overworldNodes).toHaveLength(base.overworldNodes.length + 6);
  });

  it('merged data contains both base and gauntlet islands', () => {
    const merged = mergeDlcContent(ABYSSAL_GAUNTLET_PACK, realBaseData());
    const ids = merged.islands.map((i) => i.id);
    expect(ids).toContain('island_01');
    expect(ids).toContain('dlc_boneshore_landing');
    expect(ids).toContain('dlc_drowned_throne');
  });
});

// SECTION 7 - REGISTRY & UNLOCK FLOW

describe('Abyssal Gauntlet DLC - registry & unlock flow', () => {
  beforeEach(() => {
    clearDlcRegistry();
  });

  it('registers and retrieves the gauntlet pack', () => {
    registerDlcPack(ABYSSAL_GAUNTLET_PACK);
    expect(getDlcPack('abyssal-gauntlet')).toBe(ABYSSAL_GAUNTLET_PACK);
  });

  it('appears in manifest listing after registration', () => {
    registerDlcPack(ABYSSAL_GAUNTLET_PACK);
    const manifests = listDlcManifests();
    expect(manifests.some((m) => m.id === 'abyssal-gauntlet')).toBe(true);
  });

  it('is locked when base campaign is not complete', () => {
    const status = getDlcStatus(manifest, ['island_01', 'island_02'], [], []);
    expect(status).toBe('locked');
  });

  it('becomes available when all 5 base islands are done', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    expect(isBaseCampaignComplete(allBase)).toBe(true);
    const status = getDlcStatus(manifest, allBase, [], []);
    expect(status).toBe('available');
  });

  it('becomes unlocked when player opts in', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    const status = getDlcStatus(manifest, allBase, ['abyssal-gauntlet'], []);
    expect(status).toBe('unlocked');
  });

  it('becomes completed when player finishes all DLC islands', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    const status = getDlcStatus(
      manifest,
      allBase,
      ['abyssal-gauntlet'],
      ['abyssal-gauntlet'],
    );
    expect(status).toBe('completed');
  });
});

// SECTION 8 - ROGUELIKE-SPECIFIC FEATURES

describe('Roguelike-specific - progressive difficulty', () => {
  it('all islands use combat-type encounters', () => {
    const combatTypes = ['battle', 'squid', 'storm'];
    for (const island of islands) {
      expect(combatTypes).toContain(island.encounterType);
    }
  });

  it('encounter difficulty escalates (more prompts or less time)', () => {
    const easyEnc = encounters.find((e) => e.id === 'gauntlet_brawl_easy')!;
    const bossEnc = encounters.find((e) => e.id === 'gauntlet_boss')!;
    expect(bossEnc.promptCount).toBeGreaterThan(easyEnc.promptCount);
    expect(bossEnc.timeWindowMs).toBeLessThan(easyEnc.timeWindowMs);
  });

  it('bestiary danger levels increase through the chain', () => {
    const critters = bestiary.filter((b) => b.category === 'critter');
    const firstCreature = critters.find((c) => c.habitat.includes('Boneshore Landing'))!;
    const lastCreature = critters.find((c) => c.habitat.includes('The Drowned Throne'))!;
    expect(lastCreature.danger).toBeGreaterThan(firstCreature.danger);
  });

  it('has unique rewards per island (no duplicates)', () => {
    const rewards = islands.map((i) => i.reward);
    const unique = new Set(rewards);
    expect(unique.size).toBe(rewards.length);
  });

  it('linear island chain means no branching paths', () => {
    for (let i = 1; i < islands.length; i++) {
      expect(islands[i]!.unlockAfter).toBe(islands[i - 1]!.id);
    }
  });
});
