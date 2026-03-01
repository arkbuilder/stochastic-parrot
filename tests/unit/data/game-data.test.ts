import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeDlcIntoGameData, resetGameData,
  getAllIslands, getAllConcepts, getAllOverworldNodes, getAllBestiary,
  getBaseBestiary, getDlcBestiary, getMergedDlcIds,
  findIsland, findConcept, findMinigameByConceptId,
} from '../../../src/data/game-data';
import { ISLANDS } from '../../../src/data/islands';
import { CONCEPTS } from '../../../src/data/concepts';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { BESTIARY } from '../../../src/data/bestiary';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import { CYBERSECURITY_PACK } from '../../../src/dlc/packs/cybersecurity-pack';

beforeEach(() => {
  resetGameData();
});

// ── Initial state (base only) ────────────────────────────────

describe('game-data — initial state', () => {
  it('getAllIslands returns base islands', () => {
    expect(getAllIslands()).toEqual(ISLANDS);
  });

  it('getAllConcepts returns base concepts', () => {
    expect(getAllConcepts()).toEqual(CONCEPTS);
  });

  it('getAllOverworldNodes returns base nodes', () => {
    expect(getAllOverworldNodes()).toEqual(OVERWORLD_NODES);
  });

  it('getAllBestiary returns base bestiary', () => {
    expect(getAllBestiary()).toEqual(BESTIARY);
  });

  it('no DLCs merged initially', () => {
    expect(getMergedDlcIds()).toHaveLength(0);
  });

  it('getDlcBestiary returns empty for unknown DLC', () => {
    expect(getDlcBestiary('nonexistent')).toEqual([]);
  });
});

// ── findIsland / findConcept ─────────────────────────────────

describe('game-data — find helpers', () => {
  it('findIsland returns base island by ID', () => {
    const island = findIsland('island_01');
    expect(island).toBeDefined();
    expect(island!.id).toBe('island_01');
  });

  it('findIsland returns undefined for missing ID', () => {
    expect(findIsland('nonexistent')).toBeUndefined();
  });

  it('findConcept returns base concept by ID', () => {
    const concept = findConcept(CONCEPTS[0]!.id);
    expect(concept).toBeDefined();
  });

  it('findConcept returns undefined for DLC concept before merge', () => {
    const dlcConceptId = ROCKET_SCIENCE_PACK.content.concepts[0]!.id;
    expect(findConcept(dlcConceptId)).toBeUndefined();
  });
});

// ── Merging DLC ──────────────────────────────────────────────

describe('game-data — mergeDlcIntoGameData', () => {
  it('merging Rocket Science adds its islands', () => {
    const baseLenIslands = getAllIslands().length;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(getAllIslands().length).toBe(baseLenIslands + ROCKET_SCIENCE_PACK.content.islands.length);
  });

  it('merging Rocket Science adds its concepts', () => {
    const baseLenConcepts = getAllConcepts().length;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(getAllConcepts().length).toBe(baseLenConcepts + ROCKET_SCIENCE_PACK.content.concepts.length);
  });

  it('merging Rocket Science adds its overworld nodes', () => {
    const baseLenNodes = getAllOverworldNodes().length;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(getAllOverworldNodes().length).toBe(baseLenNodes + ROCKET_SCIENCE_PACK.content.overworldNodes.length);
  });

  it('merging Rocket Science adds its bestiary entries', () => {
    const baseLenBestiary = getAllBestiary().length;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(getAllBestiary().length).toBe(baseLenBestiary + ROCKET_SCIENCE_PACK.content.bestiary.length);
  });

  it('DLC bestiary can be queried by pack ID', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const dlcBestiary = getDlcBestiary(ROCKET_SCIENCE_PACK.manifest.id);
    expect(dlcBestiary.length).toBe(ROCKET_SCIENCE_PACK.content.bestiary.length);
  });

  it('base bestiary is unchanged after merge', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(getBaseBestiary()).toEqual(BESTIARY);
  });

  it('merged DLC ID is tracked', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(getMergedDlcIds()).toContain(ROCKET_SCIENCE_PACK.manifest.id);
  });

  it('findIsland returns DLC island after merge', () => {
    const dlcIslandId = ROCKET_SCIENCE_PACK.content.islands[0]!.id;
    expect(findIsland(dlcIslandId)).toBeUndefined();
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(findIsland(dlcIslandId)).toBeDefined();
  });

  it('findConcept returns DLC concept after merge', () => {
    const dlcConceptId = ROCKET_SCIENCE_PACK.content.concepts[0]!.id;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(findConcept(dlcConceptId)).toBeDefined();
  });

  it('findMinigameByConceptId returns DLC minigame after merge', () => {
    const dlcConceptId = ROCKET_SCIENCE_PACK.content.concepts[0]!.id;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const minigame = findMinigameByConceptId(dlcConceptId);
    expect(minigame).toBeDefined();
    expect(minigame!.conceptId).toBe(dlcConceptId);
  });
});

// ── Idempotent merge ─────────────────────────────────────────

describe('game-data — idempotent merge', () => {
  it('merging same DLC twice does not duplicate', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const afterFirst = getAllIslands().length;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(getAllIslands().length).toBe(afterFirst);
  });

  it('merged DLC IDs do not duplicate', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const ids = getMergedDlcIds().filter((id) => id === ROCKET_SCIENCE_PACK.manifest.id);
    expect(ids).toHaveLength(1);
  });
});

// ── Multiple DLC merges ──────────────────────────────────────

describe('game-data — multiple DLCs', () => {
  it('can merge both Rocket Science and Cybersecurity', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    mergeDlcIntoGameData(CYBERSECURITY_PACK);
    expect(getMergedDlcIds()).toHaveLength(2);
  });

  it('all islands include both DLC packs', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    mergeDlcIntoGameData(CYBERSECURITY_PACK);
    const totalExpected = ISLANDS.length
      + ROCKET_SCIENCE_PACK.content.islands.length
      + CYBERSECURITY_PACK.content.islands.length;
    expect(getAllIslands().length).toBe(totalExpected);
  });

  it('each DLC bestiary is independently queryable', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    mergeDlcIntoGameData(CYBERSECURITY_PACK);
    expect(getDlcBestiary(ROCKET_SCIENCE_PACK.manifest.id).length)
      .toBe(ROCKET_SCIENCE_PACK.content.bestiary.length);
    expect(getDlcBestiary(CYBERSECURITY_PACK.manifest.id).length)
      .toBe(CYBERSECURITY_PACK.content.bestiary.length);
  });
});

// ── Reset ────────────────────────────────────────────────────

describe('game-data — reset', () => {
  it('resetGameData restores base-only state', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    mergeDlcIntoGameData(CYBERSECURITY_PACK);
    resetGameData();
    expect(getAllIslands().length).toBe(ISLANDS.length);
    expect(getAllConcepts().length).toBe(CONCEPTS.length);
    expect(getAllOverworldNodes().length).toBe(OVERWORLD_NODES.length);
    expect(getAllBestiary().length).toBe(BESTIARY.length);
    expect(getMergedDlcIds()).toHaveLength(0);
  });

  it('after reset, DLC find returns undefined', () => {
    const dlcIslandId = ROCKET_SCIENCE_PACK.content.islands[0]!.id;
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    expect(findIsland(dlcIslandId)).toBeDefined();
    resetGameData();
    expect(findIsland(dlcIslandId)).toBeUndefined();
  });
});
