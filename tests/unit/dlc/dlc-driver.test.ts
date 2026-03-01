import { describe, expect, it } from 'vitest';
import { validateDlcPack, mergeDlcContent } from '../../../src/dlc/dlc-driver';
import type { MergedGameData } from '../../../src/dlc/dlc-driver';
import type { DlcPack } from '../../../src/dlc/types';
import type { IslandConfig } from '../../../src/data/islands';
import type { ConceptDefinition } from '../../../src/data/concepts';
import type { EncounterTemplate } from '../../../src/data/encounters';
import type { OverworldNodeConfig } from '../../../src/data/progression';
import type { BestiaryEntry } from '../../../src/data/bestiary';
import type { ConceptMinigame } from '../../../src/data/concept-minigames';

// ── Minimal helpers ───────────────────────────────────────────

function makeIsland(id: string, conceptIds: string[] = ['c1'], landmarks?: IslandConfig['landmarks']): IslandConfig {
  return {
    id,
    name: `Island ${id}`,
    encounterType: 'fog',
    conceptIds,
    landmarks: landmarks ?? conceptIds.map((cid, i) => ({ id: `lm_${cid}`, conceptId: cid, x: i * 50, y: 200 })),
    reward: 'test_reward',
    vegetation: ['palm_tree'],
  };
}

function makeConcept(id: string, islandId: string, landmarkId?: string): ConceptDefinition {
  return {
    id,
    name: `Concept ${id}`,
    islandId,
    metaphorObject: 'Test Object',
    landmarkId: landmarkId ?? `lm_${id}`,
    tier: 1,
  };
}

function makeEncounter(id: string, type: EncounterTemplate['type'] = 'fog'): EncounterTemplate {
  return {
    id,
    type,
    promptCount: 3,
    timeWindowMs: 10000,
    timeDecayPerPromptMs: 500,
    noviceAssistThreshold: 2,
    assistStrength: 'medium',
    expertParTimeMs: 15000,
  };
}

function makeNode(islandId: string): OverworldNodeConfig {
  return { islandId, name: `Node ${islandId}`, x: 100, y: 100 };
}

function makeBestiary(id: string): BestiaryEntry {
  return {
    id,
    name: `Beast ${id}`,
    category: 'critter',
    flavour: 'Test flavour',
    behaviour: 'Test behaviour',
    danger: 1,
    habitat: ['Test Island'],
    renderHint: 'crab',
  };
}

function makeMinigame(conceptId: string): ConceptMinigame {
  return {
    conceptId,
    conceptName: `Concept ${conceptId}`,
    metaphor: 'Test',
    dialog: [{ speaker: 'parrot', text: 'Squawk!' }],
    challenge: {
      type: 'select',
      instruction: 'Pick one',
      items: ['a', 'b'],
      answer: 0,
      successText: 'Correct!',
      hintText: 'Try again',
    },
    wrapUp: 'Done!',
  };
}

function makeBaseData(): MergedGameData {
  return {
    islands: [makeIsland('island_01', ['training_data'])],
    concepts: [makeConcept('training_data', 'island_01', 'lm_training_data')],
    encounters: [makeEncounter('cursed_fog', 'fog')],
    overworldNodes: [makeNode('island_01')],
    bestiary: [makeBestiary('crab')],
    minigames: [makeMinigame('training_data')],
  };
}

function makeValidDlcPack(overrides: Partial<DlcPack['content']> = {}): DlcPack {
  return {
    manifest: {
      id: 'test-dlc',
      title: 'Test DLC',
      description: 'Test',
      version: '1.0.0',
      topic: 'Testing',
      conceptCount: 1,
      islandCount: 1,
      prerequisite: 'base_complete',
      tierRange: { min: 1, max: 1 },
    },
    content: {
      islands: [makeIsland('dlc_island', ['dlc_concept'])],
      concepts: [makeConcept('dlc_concept', 'dlc_island', 'lm_dlc_concept')],
      encounters: [],
      overworldNodes: [makeNode('dlc_island')],
      bestiary: [makeBestiary('dlc_beast')],
      minigames: [makeMinigame('dlc_concept')],
      ...overrides,
    },
  };
}

// ── validateDlcPack ───────────────────────────────────────────

describe('validateDlcPack', () => {
  it('returns no errors for a valid pack', () => {
    const errors = validateDlcPack(makeValidDlcPack(), makeBaseData());
    expect(errors).toEqual([]);
  });

  // ── Non-empty checks ──

  it('errors when islands array is empty', () => {
    const pack = makeValidDlcPack({ islands: [] });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'islands' && e.message.includes('at least one island'))).toBe(true);
  });

  it('errors when concepts array is empty', () => {
    const pack = makeValidDlcPack({ concepts: [] });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'concepts' && e.message.includes('at least one concept'))).toBe(true);
  });

  // ── ID Collision checks ──

  it('errors on island ID collision with base data', () => {
    const pack = makeValidDlcPack({
      islands: [makeIsland('island_01', ['dlc_concept'])], // collides
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'islands' && e.message.includes('island_01'))).toBe(true);
  });

  it('errors on concept ID collision with base data', () => {
    const pack = makeValidDlcPack({
      concepts: [makeConcept('training_data', 'dlc_island', 'lm_dlc_concept')], // collides
      minigames: [makeMinigame('training_data')],
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'concepts' && e.message.includes('training_data'))).toBe(true);
  });

  it('errors on overworld node collision with base data', () => {
    const pack = makeValidDlcPack({
      overworldNodes: [makeNode('island_01')], // collides
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'overworldNodes' && e.message.includes('island_01'))).toBe(true);
  });

  it('errors on bestiary ID collision with base data', () => {
    const pack = makeValidDlcPack({
      bestiary: [makeBestiary('crab')], // collides
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'bestiary' && e.message.includes('crab'))).toBe(true);
  });

  it('errors on duplicate encounter IDs within the DLC', () => {
    const pack = makeValidDlcPack({
      encounters: [makeEncounter('dupe_enc'), makeEncounter('dupe_enc')],
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'encounters' && e.message.includes('dupe_enc'))).toBe(true);
  });

  // ── Internal consistency ──

  it('errors when concept references unknown island', () => {
    const pack = makeValidDlcPack({
      concepts: [makeConcept('dlc_concept', 'nonexistent_island', 'lm_dlc_concept')],
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.message.includes('nonexistent_island'))).toBe(true);
  });

  it('errors when island references unknown concept ID', () => {
    const island = makeIsland('dlc_island', ['unknown_concept']);
    const pack = makeValidDlcPack({
      islands: [island],
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.message.includes('unknown_concept'))).toBe(true);
  });

  it('errors when landmark references unknown concept', () => {
    const island = makeIsland('dlc_island', ['dlc_concept'], [
      { id: 'bad_lm', conceptId: 'ghost_concept', x: 0, y: 0 },
    ]);
    const pack = makeValidDlcPack({ islands: [island] });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.message.includes('ghost_concept'))).toBe(true);
  });

  // ── Minigame coverage ──

  it('errors when a DLC concept has no minigame', () => {
    const pack = makeValidDlcPack({
      minigames: [], // no minigame for dlc_concept
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.some((e) => e.field === 'minigames' && e.message.includes('dlc_concept'))).toBe(true);
  });

  it('allows extra minigames beyond DLC concepts (no error)', () => {
    const pack = makeValidDlcPack({
      minigames: [makeMinigame('dlc_concept'), makeMinigame('extra_mini')],
    });
    const errors = validateDlcPack(pack, makeBaseData());
    // Only care about coverage of DLC concepts, extra minigames shouldn't error
    expect(errors.some((e) => e.field === 'minigames')).toBe(false);
  });

  // ── Multiple errors at once ──

  it('accumulates multiple errors', () => {
    const pack = makeValidDlcPack({
      islands: [], // error: no islands
      concepts: [], // error: no concepts
    });
    const errors = validateDlcPack(pack, makeBaseData());
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ── mergeDlcContent ───────────────────────────────────────────

describe('mergeDlcContent', () => {
  it('merges all content arrays into new arrays', () => {
    const base = makeBaseData();
    const pack = makeValidDlcPack();
    const merged = mergeDlcContent(pack, base);

    expect(merged.islands).toHaveLength(2);
    expect(merged.concepts).toHaveLength(2);
    expect(merged.overworldNodes).toHaveLength(2);
    expect(merged.bestiary).toHaveLength(2);
    expect(merged.minigames).toHaveLength(2);
  });

  it('does not mutate original base data arrays', () => {
    const base = makeBaseData();
    const originalIslandCount = base.islands.length;
    const pack = makeValidDlcPack();
    mergeDlcContent(pack, base);
    expect(base.islands).toHaveLength(originalIslandCount);
  });

  it('appends DLC content after base content', () => {
    const base = makeBaseData();
    const pack = makeValidDlcPack();
    const merged = mergeDlcContent(pack, base);
    expect(merged.islands[0].id).toBe('island_01');
    expect(merged.islands[1].id).toBe('dlc_island');
  });

  // ── Encounter de-duplication ──

  it('appends new encounters that have unique IDs', () => {
    const base = makeBaseData();
    const pack = makeValidDlcPack({
      encounters: [makeEncounter('new_enc', 'storm')],
    });
    const merged = mergeDlcContent(pack, base);
    expect(merged.encounters).toHaveLength(2);
    expect(merged.encounters[1].id).toBe('new_enc');
  });

  it('replaces base encounter when DLC has the same ID', () => {
    const base = makeBaseData();
    const dlcEnc = makeEncounter('cursed_fog', 'fog');
    dlcEnc.timeWindowMs = 99999; // modified value
    const pack = makeValidDlcPack({
      encounters: [dlcEnc],
    });
    const merged = mergeDlcContent(pack, base);
    // Should still have 1 encounter (replaced, not appended)
    expect(merged.encounters).toHaveLength(1);
    expect(merged.encounters[0].timeWindowMs).toBe(99999);
  });

  it('preserves base encounters not overridden by DLC', () => {
    const base: MergedGameData = {
      ...makeBaseData(),
      encounters: [makeEncounter('fog_a'), makeEncounter('storm_b', 'storm')],
    };
    const pack = makeValidDlcPack({
      encounters: [makeEncounter('fog_a')], // override fog_a only
    });
    const merged = mergeDlcContent(pack, base);
    expect(merged.encounters).toHaveLength(2);
    expect(merged.encounters.find((e) => e.id === 'storm_b')).toBeDefined();
  });

  // ── Empty DLC content ──

  it('returns base data when DLC content arrays are empty', () => {
    const base = makeBaseData();
    const pack = makeValidDlcPack({
      islands: [],
      concepts: [],
      encounters: [],
      overworldNodes: [],
      bestiary: [],
      minigames: [],
    });
    const merged = mergeDlcContent(pack, base);
    expect(merged.islands).toHaveLength(1);
    expect(merged.concepts).toHaveLength(1);
    expect(merged.encounters).toHaveLength(1);
  });
});
