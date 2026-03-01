/**
 * Game Playability — end-to-end flow validation.
 *
 * Validates the full game loop is playable from start to finish:
 * island setup → exploration → encoding → encounter → scoring → progression.
 * Covers cross-system integration that per-unit tests miss.
 */
import { describe, it, expect } from 'vitest';
import { ISLANDS } from '../../../src/data/islands';
import { CONCEPTS } from '../../../src/data/concepts';
import { ENCOUNTERS } from '../../../src/data/encounters';
import { OVERWORLD_NODES, ISLAND_UPGRADE_REWARDS } from '../../../src/data/progression';
import { UPGRADES } from '../../../src/data/upgrades';
import { BESTIARY, CRITTERS, THREATS, FLORA, TERRAIN } from '../../../src/data/bestiary';
import { createPlayer } from '../../../src/entities/player';
import { createParrot } from '../../../src/entities/parrot';
import { createLandmark } from '../../../src/entities/landmark';
import { createConceptCard } from '../../../src/entities/concept-card';
import { createFogThreat } from '../../../src/entities/threat';
import { createEnemy, updateEnemy } from '../../../src/entities/enemy';
import { createPowerup } from '../../../src/entities/powerup';
import { updateMovementSystem } from '../../../src/systems/movement-system';
import { createRecallState, answerRecall, tickRecallState } from '../../../src/systems/recall-system';
import { updateThreatSystem, applyRecallOutcomeToThreat } from '../../../src/systems/threat-system';
import {
  gradeFromRatio,
  computeIslandScore,
  computeMaxPromptScore,
} from '../../../src/systems/scoring-system';
import { createWeatherState, updateWeatherSystem } from '../../../src/systems/weather-system';

// ── Island setup is valid for every island ───────────────────

describe('Playability — every island can be set up', () => {
  for (const island of ISLANDS) {
    it(`${island.name}: has exactly 3 concepts`, () => {
      expect(island.conceptIds).toHaveLength(3);
    });

    it(`${island.name}: has exactly 3 landmarks`, () => {
      expect(island.landmarks).toHaveLength(3);
    });

    it(`${island.name}: every concept exists in CONCEPTS`, () => {
      for (const cid of island.conceptIds) {
        const concept = CONCEPTS.find((c) => c.id === cid);
        expect(concept, `Concept "${cid}" not found`).toBeDefined();
      }
    });

    it(`${island.name}: every concept has a corresponding landmark on this island`, () => {
      for (const cid of island.conceptIds) {
        // The island's landmarks reference concepts by conceptId
        const lm = island.landmarks.find((l) => l.conceptId === cid);
        expect(lm, `No landmark for concept "${cid}" on ${island.id}`).toBeDefined();
      }
    });

    it(`${island.name}: landmark conceptIds align with island conceptIds`, () => {
      const landmarkConceptIds = island.landmarks.map((l) => l.conceptId);
      for (const cid of island.conceptIds) {
        expect(landmarkConceptIds).toContain(cid);
      }
    });

    it(`${island.name}: has a matching encounter template`, () => {
      const encounter = ENCOUNTERS.find((e) => e.type === island.encounterType);
      expect(encounter, `No encounter for type "${island.encounterType}"`).toBeDefined();
    });

    it(`${island.name}: has a matching overworld node`, () => {
      const node = OVERWORLD_NODES.find((n) => n.islandId === island.id);
      expect(node, `No overworld node for ${island.id}`).toBeDefined();
    });

    it(`${island.name}: vegetation kinds exist in flora bestiary`, () => {
      const floraHints = FLORA.map((f) => f.renderHint);
      for (const veg of island.vegetation) {
        expect(floraHints, `Vegetation "${veg}" not in FLORA`).toContain(veg);
      }
    });

    it(`${island.name}: creates weather without error`, () => {
      const state = createWeatherState(island.encounterType);
      expect(state.kind).toBeTruthy();
      updateWeatherSystem(state, 0.016, island.encounterType);
      expect(state.elapsed).toBeGreaterThan(0);
    });
  }
});

// ── Full encode→recall→score flow per island ─────────────────

describe('Playability — encode→recall→score per island', () => {
  for (const island of ISLANDS) {
    it(`${island.name}: full flow produces valid score and grade`, () => {
      // 1. Create entities
      const player = createPlayer(120, 300);
      const parrot = createParrot(114, 290);
      const landmarks = island.landmarks.map((lm) =>
        createLandmark(lm.id, lm.conceptId, lm.x, lm.y),
      );
      const cards = island.conceptIds.map((cid, i) => {
        const concept = CONCEPTS.find((c) => c.id === cid)!;
        return createConceptCard(`card_${i}`, cid, concept.name, '★', 20 + i * 52, 370);
      });

      // 2. Simulate encoding — place each card on its landmark
      for (const card of cards) {
        const lm = landmarks.find((l) => l.state.conceptId === card.state.conceptId)!;
        card.state.placed = true;
        lm.state.placedConceptId = card.state.conceptId;
      }
      expect(cards.every((c) => c.state.placed)).toBe(true);
      expect(landmarks.every((l) => l.state.placedConceptId !== null)).toBe(true);

      // 3. Get encounter for this island
      const encounter = ENCOUNTERS.find((e) => e.type === island.encounterType)!;

      // 4. Create recall state
      const prompts = landmarks.map((lm) => ({
        id: lm.id,
        conceptId: lm.state.conceptId,
        correctLandmarkId: lm.id,
      }));
      const recallState = createRecallState(prompts, encounter.timeWindowMs);

      // 5. Answer all prompts correctly (first attempt, fast)
      for (let i = 0; i < prompts.length; i++) {
        const result = answerRecall(recallState, prompts[i].correctLandmarkId, 2000);
        expect(result.correct).toBe(true);
        expect(result.scoreAwarded).toBeGreaterThan(0);
      }
      expect(recallState.completed).toBe(true);

      // 6. Compute score and grade (use actual prompts answered, not encounter.promptCount)
      const maxScore = computeMaxPromptScore(prompts.length);
      const islandScore = computeIslandScore(recallState.totalScore, 0, false);
      const ratio = recallState.totalScore / maxScore;
      const grade = gradeFromRatio(ratio);

      expect(islandScore).toBeGreaterThan(0);
      expect(['S', 'A', 'B', 'C', 'D']).toContain(grade);
      // Perfect fast answers should get S
      expect(grade).toBe('S');
    });
  }
});

// ── Player can move to every landmark on every island ────────

describe('Playability — player movement reaches landmarks', () => {
  for (const island of ISLANDS) {
    it(`${island.name}: player can walk to every landmark`, () => {
      const player = createPlayer(24, 332);
      const parrot = createParrot(18, 320);

      for (const lmConfig of island.landmarks) {
        // Reset to spawn
        player.position.x = 24;
        player.position.y = 332;
        player.state.targetX = lmConfig.x;
        player.state.targetY = lmConfig.y;

        // Simulate movement for up to 10 seconds
        for (let step = 0; step < 600; step++) {
          updateMovementSystem(player, parrot, [], 1 / 60);
        }

        const dx = Math.abs(player.position.x - lmConfig.x);
        const dy = Math.abs(player.position.y - lmConfig.y);
        // Player should be within reach
        expect(dx, `Player X not near landmark ${lmConfig.id}`).toBeLessThan(30);
        expect(dy, `Player Y not near landmark ${lmConfig.id}`).toBeLessThan(30);
      }
    });
  }
});

// ── Threat system is survivable with correct play ────────────

describe('Playability — threat system survivable', () => {
  it('3 correct recalls pushes fog below failure', () => {
    const threat = createFogThreat();
    // Advance fog a bit
    for (let i = 0; i < 60; i++) {
      updateThreatSystem(threat, 1 / 60);
    }
    expect(threat.state.fogDepth).toBeGreaterThan(0);

    // 3 correct answers should substantially reduce fog
    applyRecallOutcomeToThreat(threat, true);
    applyRecallOutcomeToThreat(threat, true);
    applyRecallOutcomeToThreat(threat, true);

    expect(threat.state.fogDepth).toBeLessThan(0.5);
    expect(threat.state.healthRatio).toBeGreaterThan(0.5);
  });

  it('a mix of correct/wrong answers is recoverable', () => {
    const threat = createFogThreat();
    for (let i = 0; i < 30; i++) updateThreatSystem(threat, 1 / 60);

    applyRecallOutcomeToThreat(threat, false); // wrong
    applyRecallOutcomeToThreat(threat, true);  // correct
    applyRecallOutcomeToThreat(threat, true);  // correct

    expect(threat.state.fogDepth).toBeLessThan(1);
    expect(threat.state.healthRatio).toBeGreaterThan(0);
  });

  it('fog does not instant-kill (takes multiple seconds)', () => {
    const threat = createFogThreat();
    // 5 seconds at 60fps
    for (let i = 0; i < 300; i++) {
      const result = updateThreatSystem(threat, 1 / 60);
      if (i < 180) { // first 3 seconds should be safe
        expect(result.failed).toBe(false);
      }
    }
  });
});

// ── Powerups spawn and have meaningful durations ─────────────

describe('Playability — powerups', () => {
  const powerupKinds = ['speed', 'shield', 'freeze', 'reveal'] as const;

  for (const kind of powerupKinds) {
    it(`${kind} powerup creates without error`, () => {
      const pu = createPowerup(`pu_${kind}`, kind, 100, 200);
      expect(pu.state.kind).toBe(kind);
      expect(pu.state.collected).toBe(false);
    });
  }
});

// ── Enemies function correctly ───────────────────────────────

describe('Playability — enemy behaviour', () => {
  const patrolKinds = ['crab', 'jellyfish', 'fire_crab', 'shadow_jelly', 'ray'] as const;
  const stationaryKinds = ['urchin'] as const;
  const burrowerKinds = ['burrower', 'sand_wyrm'] as const;

  for (const kind of patrolKinds) {
    it(`${kind} patrol enemy moves over time`, () => {
      const e = createEnemy(`enemy_${kind}`, kind, 50, 200, 150, 200, 28);
      const startX = e.position.x;
      for (let i = 0; i < 60; i++) updateEnemy(e, 1 / 60);
      expect(e.position.x).not.toBe(startX);
    });
  }

  for (const kind of stationaryKinds) {
    it(`${kind} stays in place (stationary)`, () => {
      const e = createEnemy(`enemy_${kind}`, kind, 100, 200, 100, 200, 28);
      const startX = e.position.x;
      const startY = e.position.y;
      for (let i = 0; i < 60; i++) updateEnemy(e, 1 / 60);
      expect(e.position.x).toBe(startX);
      expect(e.position.y).toBe(startY);
    });
  }

  for (const kind of burrowerKinds) {
    it(`${kind} enters hidden phase`, () => {
      const e = createEnemy(`enemy_${kind}`, kind, 50, 200, 150, 200, 28);
      expect(e.state.burrowPhase).toBe('hidden');
    });
  }

  it('defeated enemy does not move', () => {
    const e = createEnemy('enemy_crab', 'crab', 50, 200, 150, 200, 28);
    e.state.defeated = true;
    const startX = e.position.x;
    for (let i = 0; i < 60; i++) updateEnemy(e, 1 / 60);
    expect(e.position.x).toBe(startX);
  });
});
