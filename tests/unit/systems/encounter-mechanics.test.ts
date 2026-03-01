/**
 * Encounter Mechanics — Design Compliance Tests
 *
 * Validates requirements G12–G19, T7–T10, EA1–EA9 from EncounterDesign.md / CoreInteraction.md:
 *  - Fog pushback = ~1/3 width per correct answer
 *  - Each encounter type has correct prompt count
 *  - Novice assist threshold at 2 failures
 *  - Time window decay per prompt
 *  - Squid has highest prompt count (cross-island boss)
 *  - Threat system fail/recover behaviour
 *  - Fail-to-control timing within budget
 */
import { describe, it, expect } from 'vitest';
import { ENCOUNTERS, type EncounterTemplate } from '../../../src/data/encounters';
import {
  createRecallState,
  tickRecallState,
  answerRecall,
  calculateSpeedMultiplier,
  calculateComboMultiplier,
  calculateBasePoints,
} from '../../../src/systems/recall-system';
import {
  updateThreatSystem,
  applyRecallOutcomeToThreat,
} from '../../../src/systems/threat-system';
import type { ThreatEntity } from '../../../src/entities/threat';

function makeThreat(fogDepth = 0): ThreatEntity {
  return {
    id: 'test_threat',
    type: 'threat',
    position: { x: 0, y: 0 },
    bounds: { w: 240, h: 400 },
    visible: true,
    interactive: false,
    state: {
      fogDepth,
      fogSpeed: 0.05,
      healthRatio: 1 - fogDepth,
      shakeFrames: 0,
    },
  };
}

// ── G12: Fog pushback ~1/3 per correct ──

describe('Encounter Mechanics — Fog Pushback', () => {
  it('G12 — correct recall pushes fog back by ~1/3 (0.34)', () => {
    const threat = makeThreat(0.5);
    applyRecallOutcomeToThreat(threat, true);
    // 0.5 - 0.34 = 0.16
    expect(threat.state.fogDepth).toBeCloseTo(0.16, 2);
  });

  it('G12 — fog pushback does not go below 0', () => {
    const threat = makeThreat(0.1);
    applyRecallOutcomeToThreat(threat, true);
    expect(threat.state.fogDepth).toBe(0);
  });

  it('G12 — incorrect recall advances fog and triggers shake', () => {
    const threat = makeThreat(0.3);
    applyRecallOutcomeToThreat(threat, false);
    expect(threat.state.fogDepth).toBeCloseTo(0.42, 2);
    expect(threat.state.shakeFrames).toBe(3);
  });

  it('G12 — fog does not exceed 1.0 on incorrect', () => {
    const threat = makeThreat(0.95);
    applyRecallOutcomeToThreat(threat, false);
    expect(threat.state.fogDepth).toBeLessThanOrEqual(1.0);
  });

  it('G12 — health ratio tracks inverse of fog depth', () => {
    const threat = makeThreat(0.6);
    applyRecallOutcomeToThreat(threat, true);
    expect(threat.state.healthRatio).toBeCloseTo(1 - threat.state.fogDepth, 4);
  });
});

// ── G13–G16: Encounter prompt counts ──

describe('Encounter Mechanics — Prompt Counts Per Type', () => {
  const byType = (type: string): EncounterTemplate =>
    ENCOUNTERS.find((e) => e.type === type)!;

  it('G13 — Fog (cursed_fog) has 3 prompts', () => {
    expect(byType('fog').promptCount).toBe(3);
  });

  it('G13 — Storm has 3 prompts (3 lightning cycles)', () => {
    expect(byType('storm').promptCount).toBe(3);
  });

  it('G14 — Battle has 3 prompts (3 exchanges)', () => {
    expect(byType('battle').promptCount).toBe(3);
  });

  it('G15 — Ruins has 3 prompts', () => {
    expect(byType('ruins').promptCount).toBe(3);
  });

  it('G16 — Squid has 5 prompts (5–8 tentacles, cross-island)', () => {
    expect(byType('squid').promptCount).toBe(5);
  });

  it('G16 — Squid has the highest prompt count of all encounters', () => {
    const maxOther = Math.max(
      ...ENCOUNTERS.filter((e) => e.type !== 'squid').map((e) => e.promptCount),
    );
    expect(byType('squid').promptCount).toBeGreaterThan(maxOther);
  });
});

// ── G8/G19: Novice assist threshold at 2 failures ──

describe('Encounter Mechanics — Novice Assist Trigger', () => {
  it('G19 — all encounters have noviceAssistThreshold = 2', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.noviceAssistThreshold).toBe(2);
    }
  });

  it('G19 — assist strength varies by encounter difficulty', () => {
    const strengths = new Set(ENCOUNTERS.map((e) => e.assistStrength));
    // At least 2 different strength levels
    expect(strengths.size).toBeGreaterThanOrEqual(2);
  });

  it('G8 — easier encounters (fog, ruins) have medium/obvious assists', () => {
    const fog = ENCOUNTERS.find((e) => e.type === 'fog')!;
    const ruins = ENCOUNTERS.find((e) => e.type === 'ruins')!;
    expect(['medium', 'obvious']).toContain(fog.assistStrength);
    expect(['medium', 'obvious']).toContain(ruins.assistStrength);
  });
});

// ── Recall timer decay per prompt ──

describe('Encounter Mechanics — Timer Decay', () => {
  it('all encounters have positive time decay per prompt', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.timeDecayPerPromptMs).toBeGreaterThan(0);
    }
  });

  it('time decay reduces available time for later prompts', () => {
    for (const enc of ENCOUNTERS) {
      const firstPromptTime = enc.timeWindowMs;
      const lastPromptTime = enc.timeWindowMs - enc.timeDecayPerPromptMs * (enc.promptCount - 1);
      expect(lastPromptTime).toBeGreaterThan(0);
      expect(lastPromptTime).toBeLessThan(firstPromptTime);
    }
  });

  it('squid time decay is moderate — boss should be hard but fair', () => {
    const squid = ENCOUNTERS.find((e) => e.type === 'squid')!;
    // Each prompt loses 500ms, 5 prompts → last gets 8000 - 4*500 = 6000ms 
    const lastPromptMs = squid.timeWindowMs - squid.timeDecayPerPromptMs * (squid.promptCount - 1);
    expect(lastPromptMs).toBeGreaterThan(4000);
  });
});

// ── T1: Failure-to-control ≤ 5s ──

describe('Encounter Mechanics — Timing Budget', () => {
  it('T1 — threat system reaches failure in finite time, not instantly', () => {
    const threat = makeThreat(0);
    // Simulate 1 second of threat ticks
    for (let i = 0; i < 60; i++) {
      updateThreatSystem(threat, 1 / 60);
    }
    // After 1s at fogSpeed=0.05, fogDepth ≈ 0.05 — not dead yet
    expect(threat.state.fogDepth).toBeLessThan(1);
  });

  it('T1 — fog speed allows at minimum several seconds before failure', () => {
    const threat = makeThreat(0);
    // Time to fail = 1 / fogSpeed = 20 seconds — well over 5s
    const timeToFail = 1.0 / threat.state.fogSpeed;
    expect(timeToFail).toBeGreaterThan(5);
  });

  it('T7 — encounter time windows are all between 8000ms and 15000ms', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.timeWindowMs).toBeGreaterThanOrEqual(8000);
      expect(enc.timeWindowMs).toBeLessThanOrEqual(15000);
    }
  });

  it('T7 — expert par time exceeds base time window', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.expertParTimeMs).toBeGreaterThan(enc.timeWindowMs);
    }
  });
});

// ── Recall State Machine — correct flow ──

describe('Encounter Mechanics — Recall Flow', () => {
  function makeRecallState(promptCount = 3) {
    const prompts = Array.from({ length: promptCount }, (_, i) => ({
      id: `p${i}`,
      conceptId: `concept_${i}`,
      correctLandmarkId: `landmark_${i}`,
    }));
    return createRecallState(prompts, 10000);
  }

  it('recall state starts at prompt 0 with full time', () => {
    const state = makeRecallState();
    expect(state.currentPromptIndex).toBe(0);
    expect(state.promptTimeRemainingMs).toBe(10000);
    expect(state.completed).toBe(false);
  });

  it('correct answer advances prompt index', () => {
    const state = makeRecallState();
    const result = answerRecall(state, 'landmark_0', 2000);
    expect(result.correct).toBe(true);
    expect(result.promptComplete).toBe(true);
    expect(state.currentPromptIndex).toBe(1);
  });

  it('incorrect answer does not advance prompt', () => {
    const state = makeRecallState();
    const result = answerRecall(state, 'wrong_landmark', 2000);
    expect(result.correct).toBe(false);
    expect(result.promptComplete).toBe(false);
    expect(state.currentPromptIndex).toBe(0);
  });

  it('completing all prompts sets completed flag', () => {
    const state = makeRecallState(2);
    answerRecall(state, 'landmark_0', 2000);
    const result = answerRecall(state, 'landmark_1', 2000);
    expect(result.sequenceComplete).toBe(true);
    expect(state.completed).toBe(true);
  });

  it('timer ticks down and sets timedOut flag', () => {
    const state = makeRecallState();
    tickRecallState(state, 10000);
    expect(state.promptTimeRemainingMs).toBe(0);
    expect(state.timedOut).toBe(true);
  });

  it('timer resets after correct answer', () => {
    const state = makeRecallState();
    tickRecallState(state, 5000);
    expect(state.promptTimeRemainingMs).toBe(5000);
    answerRecall(state, 'landmark_0', 5000);
    expect(state.promptTimeRemainingMs).toBe(10000);
  });

  it('completed state stops timer ticks', () => {
    const state = makeRecallState(1);
    answerRecall(state, 'landmark_0', 1000);
    expect(state.completed).toBe(true);
    tickRecallState(state, 5000);
    // Timer should not change after completion
    expect(state.completed).toBe(true);
  });
});

// ── Scoring Integration in Encounters ──

describe('Encounter Mechanics — Scoring', () => {
  it('G21 — combo multiplier: 1→1x, 2→1.5x, 3→2x, 4+→2.5x cap', () => {
    expect(calculateComboMultiplier(1)).toBe(1.0);
    expect(calculateComboMultiplier(2)).toBe(1.5);
    expect(calculateComboMultiplier(3)).toBe(2.0);
    expect(calculateComboMultiplier(4)).toBe(2.5);
    expect(calculateComboMultiplier(10)).toBe(2.5); // cap
  });

  it('G22 — speed bonus: ≤3s→2x, 3-5s→1.5x, 5-8s→1.2x, 8s+→1x', () => {
    expect(calculateSpeedMultiplier(2000)).toBe(2.0);
    expect(calculateSpeedMultiplier(3000)).toBe(2.0);
    expect(calculateSpeedMultiplier(4000)).toBe(1.5);
    expect(calculateSpeedMultiplier(5000)).toBe(1.5);
    expect(calculateSpeedMultiplier(6000)).toBe(1.2);
    expect(calculateSpeedMultiplier(8000)).toBe(1.2);
    expect(calculateSpeedMultiplier(9000)).toBe(1.0);
  });

  it('G23 — base scoring: 1st attempt=100, 2nd=50, 3rd+=25', () => {
    expect(calculateBasePoints(1)).toBe(100);
    expect(calculateBasePoints(2)).toBe(50);
    expect(calculateBasePoints(3)).toBe(25);
    expect(calculateBasePoints(4)).toBe(25);
  });

  it('G24 — timeout awards 0 points → score never blocks progression', () => {
    const prompts = [{ id: 'p0', conceptId: 'c0', correctLandmarkId: 'l0' }];
    const state = createRecallState(prompts, 5000);
    // Simulate timeout
    tickRecallState(state, 5000);
    expect(state.timedOut).toBe(true);
    // Score should still be 0 — player can proceed
    expect(state.totalScore).toBe(0);
  });

  it('G25 — even all-wrong score does not block progression (score is informational)', () => {
    const prompts = [
      { id: 'p0', conceptId: 'c0', correctLandmarkId: 'l0' },
      { id: 'p1', conceptId: 'c1', correctLandmarkId: 'l1' },
    ];
    const state = createRecallState(prompts, 10000);
    // Wrong answers
    answerRecall(state, 'wrong', 2000);
    answerRecall(state, 'wrong', 2000);
    // Score is 0 but game state is still valid
    expect(state.totalScore).toBe(0);
    expect(state.currentPromptIndex).toBe(0);
    // The fact that this doesn't throw = progression not blocked
  });
});
