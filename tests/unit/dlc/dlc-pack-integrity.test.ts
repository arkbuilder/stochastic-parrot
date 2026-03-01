import { describe, expect, it, beforeEach } from 'vitest';
import { CYBERSECURITY_PACK } from '../../../src/dlc/packs/cybersecurity-pack';
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

// ── Tests ─────────────────────────────────────────────────────

describe('Cybersecurity DLC Pack — integrity', () => {
  // ── Manifest ──

  it('has correct manifest metadata', () => {
    const m = CYBERSECURITY_PACK.manifest;
    expect(m.id).toBe('cybersecurity');
    expect(m.topic).toBe('Cybersecurity');
    expect(m.prerequisite).toBe('base_complete');
    expect(m.conceptCount).toBe(6);
    expect(m.islandCount).toBe(2);
    expect(m.tierRange.min).toBeLessThanOrEqual(m.tierRange.max);
  });

  it('manifest counts match actual content', () => {
    const m = CYBERSECURITY_PACK.manifest;
    const c = CYBERSECURITY_PACK.content;
    expect(c.concepts).toHaveLength(m.conceptCount);
    expect(c.islands).toHaveLength(m.islandCount);
  });

  // ── Validation against real base data ──

  it('passes validation against the real base game data', () => {
    const errors = validateDlcPack(CYBERSECURITY_PACK, realBaseData());
    expect(errors).toEqual([]);
  });

  it('every DLC concept has a matching minigame', () => {
    const minigameIds = new Set(CYBERSECURITY_PACK.content.minigames.map((m) => m.conceptId));
    for (const concept of CYBERSECURITY_PACK.content.concepts) {
      expect(minigameIds.has(concept.id)).toBe(true);
    }
  });

  it('every DLC island references only DLC concepts', () => {
    const dlcConceptIds = new Set(CYBERSECURITY_PACK.content.concepts.map((c) => c.id));
    for (const island of CYBERSECURITY_PACK.content.islands) {
      for (const cid of island.conceptIds) {
        expect(dlcConceptIds.has(cid)).toBe(true);
      }
    }
  });

  it('every DLC landmark references a valid DLC concept', () => {
    const dlcConceptIds = new Set(CYBERSECURITY_PACK.content.concepts.map((c) => c.id));
    for (const island of CYBERSECURITY_PACK.content.islands) {
      for (const lm of island.landmarks) {
        expect(dlcConceptIds.has(lm.conceptId)).toBe(true);
      }
    }
  });

  it('DLC islands have 3 concepts and 3 landmarks each', () => {
    for (const island of CYBERSECURITY_PACK.content.islands) {
      expect(island.conceptIds).toHaveLength(3);
      expect(island.landmarks).toHaveLength(3);
    }
  });

  // ── Merge ──

  it('merges cleanly with real base data', () => {
    const base = realBaseData();
    const merged = mergeDlcContent(CYBERSECURITY_PACK, base);
    expect(merged.islands).toHaveLength(base.islands.length + 2);
    expect(merged.concepts).toHaveLength(base.concepts.length + 6);
    expect(merged.overworldNodes).toHaveLength(base.overworldNodes.length + 2);
  });

  it('merged data contains both base and DLC islands', () => {
    const merged = mergeDlcContent(CYBERSECURITY_PACK, realBaseData());
    const ids = merged.islands.map((i) => i.id);
    expect(ids).toContain('island_01');
    expect(ids).toContain('dlc_cipher_cove');
    expect(ids).toContain('dlc_fortress_harbor');
  });

  it('merged concepts include all 21 (15 base + 6 DLC)', () => {
    const merged = mergeDlcContent(CYBERSECURITY_PACK, realBaseData());
    expect(merged.concepts).toHaveLength(21);
  });

  // ── No collisions with base IDs ──

  it('has no island IDs that collide with base', () => {
    const baseIds = new Set(ISLANDS.map((i) => i.id));
    for (const island of CYBERSECURITY_PACK.content.islands) {
      expect(baseIds.has(island.id)).toBe(false);
    }
  });

  it('has no concept IDs that collide with base', () => {
    const baseIds = new Set(CONCEPTS.map((c) => c.id));
    for (const concept of CYBERSECURITY_PACK.content.concepts) {
      expect(baseIds.has(concept.id)).toBe(false);
    }
  });

  it('has no bestiary IDs that collide with base', () => {
    const baseIds = new Set(BESTIARY.map((b) => b.id));
    for (const entry of CYBERSECURITY_PACK.content.bestiary) {
      expect(baseIds.has(entry.id)).toBe(false);
    }
  });
});

// ── Registry + Unlock integration ─────────────────────────────

describe('Cybersecurity DLC — registry & unlock flow', () => {
  beforeEach(() => {
    clearDlcRegistry();
  });

  it('registers and retrieves the cybersecurity pack', () => {
    registerDlcPack(CYBERSECURITY_PACK);
    expect(getDlcPack('cybersecurity')).toBe(CYBERSECURITY_PACK);
  });

  it('appears in manifest listing after registration', () => {
    registerDlcPack(CYBERSECURITY_PACK);
    const manifests = listDlcManifests();
    expect(manifests.some((m) => m.id === 'cybersecurity')).toBe(true);
  });

  it('is locked when base campaign is not complete', () => {
    const status = getDlcStatus(CYBERSECURITY_PACK.manifest, ['island_01', 'island_02'], [], []);
    expect(status).toBe('locked');
  });

  it('becomes available when all 5 base islands are done', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    expect(isBaseCampaignComplete(allBase)).toBe(true);
    const status = getDlcStatus(CYBERSECURITY_PACK.manifest, allBase, [], []);
    expect(status).toBe('available');
  });

  it('becomes unlocked when player opts in', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    const status = getDlcStatus(CYBERSECURITY_PACK.manifest, allBase, ['cybersecurity'], []);
    expect(status).toBe('unlocked');
  });

  it('becomes completed when player finishes all DLC islands', () => {
    const allBase = [...BASE_CAMPAIGN_ISLANDS];
    const status = getDlcStatus(
      CYBERSECURITY_PACK.manifest,
      allBase,
      ['cybersecurity'],
      ['cybersecurity'],
    );
    expect(status).toBe('completed');
  });
});
