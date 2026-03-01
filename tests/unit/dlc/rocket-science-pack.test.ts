import { describe, expect, it, beforeEach } from 'vitest';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
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

// ── Real base data snapshot ───────────────────────────────────

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

// ══════════════════════════════════════════════════════════════
// Manifest
// ══════════════════════════════════════════════════════════════

describe('Rocket Science DLC Pack — manifest', () => {
  const m = ROCKET_SCIENCE_PACK.manifest;

  it('has the correct id and topic', () => {
    expect(m.id).toBe('rocket-science');
    expect(m.topic).toBe('Rocket Science');
  });

  it('has 5 islands and 15 concepts declared', () => {
    expect(m.islandCount).toBe(5);
    expect(m.conceptCount).toBe(15);
  });

  it('declares prerequisite as base_complete', () => {
    expect(m.prerequisite).toBe('base_complete');
  });

  it('tier range covers tier 1 to tier 3', () => {
    expect(m.tierRange).toEqual({ min: 1, max: 3 });
  });

  it('manifest counts match actual content', () => {
    const c = ROCKET_SCIENCE_PACK.content;
    expect(c.islands).toHaveLength(m.islandCount);
    expect(c.concepts).toHaveLength(m.conceptCount);
  });
});

// ══════════════════════════════════════════════════════════════
// Content structure
// ══════════════════════════════════════════════════════════════

describe('Rocket Science DLC Pack — content structure', () => {
  const { islands, concepts, minigames, bestiary, overworldNodes } = ROCKET_SCIENCE_PACK.content;

  it('has exactly 5 islands', () => {
    expect(islands).toHaveLength(5);
  });

  it('has exactly 15 concepts', () => {
    expect(concepts).toHaveLength(15);
  });

  it('has exactly 15 minigames (one per concept)', () => {
    expect(minigames).toHaveLength(15);
  });

  it('every concept has a matching minigame', () => {
    const minigameIds = new Set(minigames.map((mg) => mg.conceptId));
    for (const concept of concepts) {
      expect(minigameIds.has(concept.id)).toBe(true);
    }
  });

  it('each island has exactly 3 concepts and 3 landmarks', () => {
    for (const island of islands) {
      expect(island.conceptIds).toHaveLength(3);
      expect(island.landmarks).toHaveLength(3);
    }
  });

  it('every island has a matching overworld node', () => {
    const nodeIslandIds = new Set(overworldNodes.map((n) => n.islandId));
    for (const island of islands) {
      expect(nodeIslandIds.has(island.id)).toBe(true);
    }
  });

  it('all concept islandIds reference a DLC island', () => {
    const islandIds = new Set(islands.map((i) => i.id));
    for (const concept of concepts) {
      expect(islandIds.has(concept.islandId)).toBe(true);
    }
  });

  it('all landmark conceptIds reference a DLC concept', () => {
    const conceptIds = new Set(concepts.map((c) => c.id));
    for (const island of islands) {
      for (const lm of island.landmarks) {
        expect(conceptIds.has(lm.conceptId)).toBe(true);
      }
    }
  });

  it('islands are chained via unlockAfter (linear progression)', () => {
    // First island has no unlockAfter
    expect(islands[0].unlockAfter).toBeUndefined();
    // Each subsequent island unlocks after the previous one
    for (let i = 1; i < islands.length; i++) {
      expect(islands[i].unlockAfter).toBe(islands[i - 1].id);
    }
  });

  it('concepts span tiers 1, 2, and 3', () => {
    const tiers = new Set(concepts.map((c) => c.tier));
    expect(tiers.has(1)).toBe(true);
    expect(tiers.has(2)).toBe(true);
    expect(tiers.has(3)).toBe(true);
  });

  it('bestiary has at least one entry per category used', () => {
    const categories = new Set(bestiary.map((b) => b.category));
    expect(categories.has('critter')).toBe(true);
    expect(categories.has('threat')).toBe(true);
    expect(categories.has('flora')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// Stage-specific content
// ══════════════════════════════════════════════════════════════

describe('Rocket Science DLC Pack — stage detail', () => {
  const { islands, bestiary } = ROCKET_SCIENCE_PACK.content;

  it('Stage 1 is Launchpad Lagoon with fog encounter', () => {
    expect(islands[0].id).toBe('dlc_launchpad_lagoon');
    expect(islands[0].encounterType).toBe('fog');
  });

  it('Stage 2 is Booster Reef with storm encounter', () => {
    expect(islands[1].id).toBe('dlc_booster_reef');
    expect(islands[1].encounterType).toBe('storm');
  });

  it('Stage 3 is Orbit Atoll with ruins encounter', () => {
    expect(islands[2].id).toBe('dlc_orbit_atoll');
    expect(islands[2].encounterType).toBe('ruins');
  });

  it('Stage 4 is Nebula Shallows with battle encounter', () => {
    expect(islands[3].id).toBe('dlc_nebula_shallows');
    expect(islands[3].encounterType).toBe('battle');
  });

  it('Stage 5 is Kraken\'s Void with squid (boss) encounter', () => {
    expect(islands[4].id).toBe('dlc_krakens_void');
    expect(islands[4].encounterType).toBe('squid');
  });

  it('Space Kraken boss is in the bestiary with danger 5', () => {
    const kraken = bestiary.find((b) => b.id === 'space_kraken');
    expect(kraken).toBeDefined();
    expect(kraken!.category).toBe('threat');
    expect(kraken!.danger).toBe(5);
    expect(kraken!.habitat).toContain("Kraken's Void");
  });

  it('final island reward is kraken_trophy', () => {
    expect(islands[4].reward).toBe('kraken_trophy');
  });
});

// ══════════════════════════════════════════════════════════════
// Validation against real base data
// ══════════════════════════════════════════════════════════════

describe('Rocket Science DLC Pack — validation', () => {
  it('passes validation against real base game data', () => {
    const errors = validateDlcPack(ROCKET_SCIENCE_PACK, realBaseData());
    expect(errors).toEqual([]);
  });

  it('has no island IDs that collide with base', () => {
    const baseIds = new Set(ISLANDS.map((i) => i.id));
    for (const island of ROCKET_SCIENCE_PACK.content.islands) {
      expect(baseIds.has(island.id)).toBe(false);
    }
  });

  it('has no concept IDs that collide with base', () => {
    const baseIds = new Set(CONCEPTS.map((c) => c.id));
    for (const concept of ROCKET_SCIENCE_PACK.content.concepts) {
      expect(baseIds.has(concept.id)).toBe(false);
    }
  });

  it('has no bestiary IDs that collide with base', () => {
    const baseIds = new Set(BESTIARY.map((b) => b.id));
    for (const entry of ROCKET_SCIENCE_PACK.content.bestiary) {
      expect(baseIds.has(entry.id)).toBe(false);
    }
  });

  it('has no overworld node collisions with base', () => {
    const baseIds = new Set(OVERWORLD_NODES.map((n) => n.islandId));
    for (const node of ROCKET_SCIENCE_PACK.content.overworldNodes) {
      expect(baseIds.has(node.islandId)).toBe(false);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Merge with base data
// ══════════════════════════════════════════════════════════════

describe('Rocket Science DLC Pack — merge', () => {
  it('merges cleanly with base data', () => {
    const base = realBaseData();
    const merged = mergeDlcContent(ROCKET_SCIENCE_PACK, base);
    expect(merged.islands).toHaveLength(base.islands.length + 5);
    expect(merged.concepts).toHaveLength(base.concepts.length + 15);
    expect(merged.overworldNodes).toHaveLength(base.overworldNodes.length + 5);
  });

  it('merged data contains base + all DLC islands', () => {
    const merged = mergeDlcContent(ROCKET_SCIENCE_PACK, realBaseData());
    const ids = merged.islands.map((i) => i.id);
    expect(ids).toContain('island_01');
    expect(ids).toContain('dlc_launchpad_lagoon');
    expect(ids).toContain('dlc_krakens_void');
  });

  it('total concepts after merge = 30 (15 base + 15 DLC)', () => {
    const merged = mergeDlcContent(ROCKET_SCIENCE_PACK, realBaseData());
    expect(merged.concepts).toHaveLength(30);
  });

  it('does not mutate base data arrays', () => {
    const base = realBaseData();
    const origLen = base.islands.length;
    mergeDlcContent(ROCKET_SCIENCE_PACK, base);
    expect(base.islands).toHaveLength(origLen);
  });
});

// ══════════════════════════════════════════════════════════════
// Registry + unlock integration
// ══════════════════════════════════════════════════════════════

describe('Rocket Science DLC — registry & unlock flow', () => {
  beforeEach(() => {
    clearDlcRegistry();
  });

  it('registers and retrieves the rocket science pack', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    expect(getDlcPack('rocket-science')).toBe(ROCKET_SCIENCE_PACK);
  });

  it('appears in manifest listing', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const ids = listDlcManifests().map((m) => m.id);
    expect(ids).toContain('rocket-science');
  });

  it('is locked when base campaign is incomplete', () => {
    const status = getDlcStatus(ROCKET_SCIENCE_PACK.manifest, ['island_01'], [], []);
    expect(status).toBe('locked');
  });

  it('becomes available when all 5 base islands are completed', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    expect(isBaseCampaignComplete(allBase)).toBe(true);
    const status = getDlcStatus(ROCKET_SCIENCE_PACK.manifest, allBase, [], []);
    expect(status).toBe('available');
  });

  it('becomes unlocked when player activates it', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    const status = getDlcStatus(ROCKET_SCIENCE_PACK.manifest, allBase, ['rocket-science'], []);
    expect(status).toBe('unlocked');
  });

  it('becomes completed when player finishes all DLC stages', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    const status = getDlcStatus(
      ROCKET_SCIENCE_PACK.manifest,
      allBase,
      ['rocket-science'],
      ['rocket-science'],
    );
    expect(status).toBe('completed');
  });
});

// ══════════════════════════════════════════════════════════════
// Cross-DLC isolation (no collision with cybersecurity pack)
// ══════════════════════════════════════════════════════════════

describe('Rocket Science DLC — cross-DLC isolation', () => {
  // Lazy import avoids issues if cybersecurity pack doesn't exist
  let cyberIslandIds: Set<string>;
  let cyberConceptIds: Set<string>;
  let cyberBestiaryIds: Set<string>;

  beforeEach(async () => {
    const { CYBERSECURITY_PACK } = await import('../../../src/dlc/packs/cybersecurity-pack');
    cyberIslandIds = new Set(CYBERSECURITY_PACK.content.islands.map((i) => i.id));
    cyberConceptIds = new Set(CYBERSECURITY_PACK.content.concepts.map((c) => c.id));
    cyberBestiaryIds = new Set(CYBERSECURITY_PACK.content.bestiary.map((b) => b.id));
  });

  it('no island ID collisions with cybersecurity pack', () => {
    for (const island of ROCKET_SCIENCE_PACK.content.islands) {
      expect(cyberIslandIds.has(island.id)).toBe(false);
    }
  });

  it('no concept ID collisions with cybersecurity pack', () => {
    for (const concept of ROCKET_SCIENCE_PACK.content.concepts) {
      expect(cyberConceptIds.has(concept.id)).toBe(false);
    }
  });

  it('no bestiary ID collisions with cybersecurity pack', () => {
    for (const entry of ROCKET_SCIENCE_PACK.content.bestiary) {
      expect(cyberBestiaryIds.has(entry.id)).toBe(false);
    }
  });
});
