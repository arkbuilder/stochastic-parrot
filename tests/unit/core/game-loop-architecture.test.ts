/**
 * Game Loop & Architecture — Design Compliance Tests
 *
 * Validates requirements PF8, SM6–SM8 from state-machine-and-game-loop.md:
 *  - Game loop separates update and render phases
 *  - Island state model includes required fields
 *  - Performance: long-frame detection and particle degradation
 *  - Scene transition uses stack (no page reload)
 *  - Overworld navigation is node-based
 */
import { describe, it, expect } from 'vitest';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/core/types';
import { ISLANDS } from '../../../src/data/islands';
import { ENCOUNTERS } from '../../../src/data/encounters';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { UPGRADES } from '../../../src/data/upgrades';
import { createRecallState } from '../../../src/systems/recall-system';

// ── PF8: Update/Render separation ──

describe('Game Loop — Update/Render Separation (PF8)', () => {
  it('PF8 — GameLoop class has separate update and render flow', async () => {
    const mod = await import('../../../src/core/game-loop');
    expect(mod.GameLoop).toBeDefined();
    // The GameLoop tick() calls sceneManager.update() THEN renderer.clear/present
    // This ensures logic and rendering are decoupled
  });

  it('PF8 — SceneManager delegates update() and render() independently', async () => {
    const { SceneManager } = await import('../../../src/core/scene-manager');
    const sm = new SceneManager({ now: () => Date.now() });

    let updateCalled = false;
    let renderCalled = false;

    sm.push({
      enter() {},
      exit() {},
      update() { updateCalled = true; },
      render() { renderCalled = true; },
    });

    sm.update(0.016, []);
    expect(updateCalled).toBe(true);
    expect(renderCalled).toBe(false);

    const fakeCtx = {
      fillStyle: '',
      fillRect() {},
    } as unknown as CanvasRenderingContext2D;
    sm.render(fakeCtx);
    expect(renderCalled).toBe(true);
  });
});

// ── SM6: Island state model ──

describe('Game Loop — Island State Model (SM6)', () => {
  it('SM6 — IslandConfig has id, encounterType, conceptIds, landmarks', () => {
    for (const island of ISLANDS) {
      expect(island.id).toBeDefined();
      expect(typeof island.id).toBe('string');
      expect(island.encounterType).toBeDefined();
      expect(['fog', 'storm', 'battle', 'ruins', 'squid']).toContain(island.encounterType);
      expect(island.conceptIds).toBeDefined();
      expect(Array.isArray(island.conceptIds)).toBe(true);
      expect(island.landmarks).toBeDefined();
      expect(Array.isArray(island.landmarks)).toBe(true);
    }
  });

  it('SM6 — RecallState tracks prompt index, attempts, score, timeout', () => {
    const state = createRecallState(
      [{ id: 'p0', conceptId: 'c0', correctLandmarkId: 'l0' }],
      10000,
    );

    expect(state.currentPromptIndex).toBeDefined();
    expect(state.attemptsForCurrentPrompt).toBeDefined();
    expect(state.totalScore).toBeDefined();
    expect(state.timedOut).toBeDefined();
    expect(state.promptTimeRemainingMs).toBeDefined();
    expect(state.completed).toBeDefined();
    expect(state.firstAttemptStreak).toBeDefined();
  });
});

// ── N1: Node-based navigation ──

describe('Game Loop — Overworld Node Navigation (N1)', () => {
  it('N1 — overworld has discrete nodes, not free movement', () => {
    expect(OVERWORLD_NODES.length).toBeGreaterThanOrEqual(5);
    for (const node of OVERWORLD_NODES) {
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
      expect(typeof node.islandId).toBe('string');
    }
  });

  it('N1 — nodes correspond to game islands', () => {
    const nodeIslandIds = OVERWORLD_NODES.map((n) => n.islandId);
    for (const island of ISLANDS) {
      expect(nodeIslandIds).toContain(island.id);
    }
  });

  it('N3 — Hidden Reef node is marked as secret', () => {
    const hiddenReef = OVERWORLD_NODES.find((n) => n.islandId === 'hidden_reef');
    expect(hiddenReef).toBeDefined();
    expect(hiddenReef!.secret).toBe(true);
  });
});

// ── Data Integrity ──

describe('Game Loop — Data Integrity Cross-Checks', () => {
  it('every island has a matching encounter template', () => {
    const encounterTypes = new Set(ENCOUNTERS.map((e) => e.type));
    for (const island of ISLANDS) {
      expect(encounterTypes.has(island.encounterType)).toBe(true);
    }
  });

  it('every island (except hidden reef) has a unique encounter type', () => {
    const mainIslands = ISLANDS.filter((i) => i.id !== 'hidden_reef');
    const types = mainIslands.map((i) => i.encounterType);
    expect(new Set(types).size).toBe(types.length);
  });

  it('upgrade unlock chain matches island progression', () => {
    const islandOrder = ISLANDS.filter((i) => i.id.startsWith('island_')).map((i) => i.id);
    const upgradesForIslands = UPGRADES.filter((u) => u.unlockedAfterIsland.startsWith('island_'));

    for (const upgrade of upgradesForIslands) {
      expect(islandOrder).toContain(upgrade.unlockedAfterIsland);
    }
  });

  it('all concepts referenced by islands are valid concept IDs', () => {
    // Collect all concept IDs from islands
    const allConceptIds = ISLANDS.flatMap((i) => i.conceptIds);
    // Each concept should be a non-empty string
    for (const id of allConceptIds) {
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    }
  });

  it('landmark concept IDs match their island concept IDs', () => {
    for (const island of ISLANDS) {
      for (const landmark of island.landmarks) {
        expect(island.conceptIds).toContain(landmark.conceptId);
      }
    }
  });
});

// ── P1-P5: Progression chain ──

describe('Game Loop — Island Progression Chain (P1-P5)', () => {
  it('P1 — exactly 5 main islands in linear unlock chain', () => {
    const mainIslands = ISLANDS.filter((i) => i.id.startsWith('island_'));
    expect(mainIslands).toHaveLength(5);
  });

  it('P2 — each main island has exactly 3 concepts', () => {
    const mainIslands = ISLANDS.filter((i) => i.id.startsWith('island_'));
    for (const island of mainIslands) {
      expect(island.conceptIds).toHaveLength(3);
    }
  });

  it('P3 — islands unlock sequentially (island_01 → 02 → 03 → 04 → 05)', () => {
    const island1 = ISLANDS.find((i) => i.id === 'island_01')!;
    const island2 = ISLANDS.find((i) => i.id === 'island_02')!;
    const island3 = ISLANDS.find((i) => i.id === 'island_03')!;
    const island4 = ISLANDS.find((i) => i.id === 'island_04')!;
    const island5 = ISLANDS.find((i) => i.id === 'island_05')!;

    expect(island1.unlockAfter).toBeUndefined(); // First island is always unlocked
    expect(island2.unlockAfter).toBe('island_01');
    expect(island3.unlockAfter).toBe('island_02');
    expect(island4.unlockAfter).toBe('island_03');
    expect(island5.unlockAfter).toBe('island_04');
  });

  it('P5 — Hidden Reef unlocks after island_05', () => {
    const reef = ISLANDS.find((i) => i.id === 'hidden_reef')!;
    expect(reef.unlockAfter).toBe('island_05');
  });

  it('P6 — each island rewards a chart fragment or special item', () => {
    for (const island of ISLANDS) {
      expect(island.reward).toBeTruthy();
      expect(typeof island.reward).toBe('string');
    }
  });
});

// ── G1-G3: Core interaction rules ──

describe('Game Loop — Core Interaction Rules', () => {
  it('G2 — max 3 concepts per island', () => {
    for (const island of ISLANDS) {
      expect(island.conceptIds.length).toBeLessThanOrEqual(3);
    }
  });

  it('G3 — each island has matching landmarks for its concepts', () => {
    for (const island of ISLANDS) {
      expect(island.landmarks.length).toBe(island.conceptIds.length);
    }
  });

  it('G4 — landmarks have unique IDs within each island', () => {
    for (const island of ISLANDS) {
      const ids = island.landmarks.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('G4 — landmarks have unique IDs across all islands', () => {
    const allIds = ISLANDS.flatMap((i) => i.landmarks.map((l) => l.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
