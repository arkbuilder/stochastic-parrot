/**
 * Pacing & Balance — validates the difficulty curve, timing, and scoring
 * feel "fair" and well-tuned across the full campaign.
 *
 * Tests the scoring formulas, speed multiplier boundaries, encounter
 * time windows, concept tier ramp, and enemy escalation match design.
 */
import { describe, it, expect } from 'vitest';
import { ISLANDS } from '../../../src/data/islands';
import { CONCEPTS } from '../../../src/data/concepts';
import { ENCOUNTERS } from '../../../src/data/encounters';
import {
  gradeFromRatio,
  computeIslandScore,
  computeMaxPromptScore,
} from '../../../src/systems/scoring-system';
import {
  calculateSpeedMultiplier,
  calculateComboMultiplier,
  calculateBasePoints,
  createRecallState,
  answerRecall,
} from '../../../src/systems/recall-system';
import { createFogThreat, type ThreatEntity } from '../../../src/entities/threat';
import { updateThreatSystem, applyRecallOutcomeToThreat } from '../../../src/systems/threat-system';

// ── Scoring boundaries match design ──────────────────────────

describe('Pacing — grade thresholds', () => {
  it('S grade at 95%', () => {
    expect(gradeFromRatio(0.95)).toBe('S');
    expect(gradeFromRatio(0.949)).toBe('A');
  });

  it('A grade at 80%', () => {
    expect(gradeFromRatio(0.80)).toBe('A');
    expect(gradeFromRatio(0.799)).toBe('B');
  });

  it('B grade at 60%', () => {
    expect(gradeFromRatio(0.60)).toBe('B');
    expect(gradeFromRatio(0.599)).toBe('C');
  });

  it('C grade at 40%', () => {
    expect(gradeFromRatio(0.40)).toBe('C');
    expect(gradeFromRatio(0.399)).toBe('D');
  });

  it('D grade below 40%', () => {
    expect(gradeFromRatio(0.1)).toBe('D');
    expect(gradeFromRatio(0)).toBe('D');
  });

  it('perfect score (1.0) earns S', () => {
    expect(gradeFromRatio(1.0)).toBe('S');
  });
});

// ── Speed multiplier boundaries per design doc ───────────────

describe('Pacing — speed multiplier boundaries', () => {
  it('≤3s → 2.0x', () => {
    expect(calculateSpeedMultiplier(1000)).toBe(2.0);
    expect(calculateSpeedMultiplier(3000)).toBe(2.0);
  });

  it('3-5s → 1.5x', () => {
    expect(calculateSpeedMultiplier(3001)).toBe(1.5);
    expect(calculateSpeedMultiplier(5000)).toBe(1.5);
  });

  it('5-8s → 1.2x', () => {
    expect(calculateSpeedMultiplier(5001)).toBe(1.2);
    expect(calculateSpeedMultiplier(8000)).toBe(1.2);
  });

  it('>8s → 1.0x', () => {
    expect(calculateSpeedMultiplier(8001)).toBe(1.0);
    expect(calculateSpeedMultiplier(15000)).toBe(1.0);
  });
});

// ── Combo multiplier stacking ────────────────────────────────

describe('Pacing — combo multiplier stacking', () => {
  it('streak 1 → 1.0x', () => expect(calculateComboMultiplier(1)).toBe(1.0));
  it('streak 2 → 1.5x', () => expect(calculateComboMultiplier(2)).toBe(1.5));
  it('streak 3 → 2.0x', () => expect(calculateComboMultiplier(3)).toBe(2.0));
  it('streak 4+ → 2.5x', () => {
    expect(calculateComboMultiplier(4)).toBe(2.5);
    expect(calculateComboMultiplier(5)).toBe(2.5);
  });
});

// ── Base points by attempt ───────────────────────────────────

describe('Pacing — base points by attempt', () => {
  it('1st attempt → 100 points', () => expect(calculateBasePoints(1)).toBe(100));
  it('2nd attempt → 50 points', () => expect(calculateBasePoints(2)).toBe(50));
  it('3rd+ attempt → 25 points', () => {
    expect(calculateBasePoints(3)).toBe(25);
    expect(calculateBasePoints(4)).toBe(25);
  });
});

// ── Max score calculation ────────────────────────────────────

describe('Pacing — max prompt scores', () => {
  it('3-prompt island max score (standard encounter)', () => {
    const max3 = computeMaxPromptScore(3);
    // Prompt 1: 100 * 2 * 1.0 = 200
    // Prompt 2: 100 * 2 * 1.5 = 300
    // Prompt 3: 100 * 2 * 2.0 = 400
    expect(max3).toBe(900);
  });

  it('5-prompt encounter max score (squid)', () => {
    const max5 = computeMaxPromptScore(5);
    // 200 + 300 + 400 + 500 + 500 = 1900 (streak 4&5 both 2.5x)
    expect(max5).toBe(1900);
  });

  it('expert bonus adds 500', () => {
    const score = computeIslandScore(900, 0, true);
    expect(score).toBe(1400); // 900 + 500
  });

  it('coins add 5 each', () => {
    const score = computeIslandScore(0, 10, false);
    expect(score).toBe(50);
  });
});

// ── Perfect play produces S grade on every island ────────────

describe('Pacing — perfect play always earns S', () => {
  for (const island of ISLANDS) {
    const encounter = ENCOUNTERS.find((e) => e.type === island.encounterType)!;

    it(`${island.name}: perfect fast recalls → S grade`, () => {
      const prompts = island.landmarks.map((lm) => ({
        id: lm.id,
        conceptId: lm.conceptId,
        correctLandmarkId: lm.id,
      }));
      const state = createRecallState(prompts, encounter.timeWindowMs);

      for (const prompt of prompts) {
        answerRecall(state, prompt.correctLandmarkId, 1500); // very fast
      }

      const maxScore = computeMaxPromptScore(prompts.length);
      const ratio = state.totalScore / maxScore;
      expect(gradeFromRatio(ratio)).toBe('S');
    });
  }
});

// ── Slow but correct play still passes ───────────────────────

describe('Pacing — slow correct play is still winnable', () => {
  it('answering all correctly but slowly → at least C grade', () => {
    const encounter = ENCOUNTERS[0]!; // cursed_fog
    const prompts = ISLANDS[0]!.landmarks.map((lm) => ({
      id: lm.id,
      conceptId: lm.conceptId,
      correctLandmarkId: lm.id,
    }));
    const state = createRecallState(prompts, encounter.timeWindowMs);

    for (const prompt of prompts) {
      answerRecall(state, prompt.correctLandmarkId, 10000); // very slow
    }

    const maxScore = computeMaxPromptScore(prompts.length);
    const ratio = state.totalScore / maxScore;
    expect(ratio).toBeGreaterThanOrEqual(0.3); // not penalized to zero
    expect(['S', 'A', 'B', 'C']).toContain(gradeFromRatio(ratio));
  });
});

// ── Encounter time windows ───────────────────────────────────

describe('Pacing — encounter time windows', () => {
  it('all encounters have ≥8s time window', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.timeWindowMs, `${enc.id} too short`).toBeGreaterThanOrEqual(8000);
    }
  });

  it('time windows don\'t exceed 15s (keeps tension)', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.timeWindowMs, `${enc.id} too long`).toBeLessThanOrEqual(15000);
    }
  });

  it('time decay never exceeds 50% of window per prompt', () => {
    for (const enc of ENCOUNTERS) {
      const maxDecay = enc.timeDecayPerPromptMs * enc.promptCount;
      expect(maxDecay, `${enc.id} decays too aggressively`).toBeLessThan(enc.timeWindowMs * 0.5);
    }
  });

  it('squid encounter has more prompts than standard', () => {
    const squid = ENCOUNTERS.find((e) => e.type === 'squid')!;
    const standard = ENCOUNTERS.filter((e) => e.type !== 'squid');
    for (const s of standard) {
      expect(squid.promptCount).toBeGreaterThan(s.promptCount);
    }
  });
});

// ── Concept tier progression ─────────────────────────────────

describe('Pacing — concept tier ramp', () => {
  it('tier 1 concepts are on islands 1-2 (introductory)', () => {
    const tier1 = CONCEPTS.filter((c) => c.tier === 1);
    for (const c of tier1) {
      expect(['island_01', 'island_02'], `${c.id} tier 1 on wrong island`).toContain(c.islandId);
    }
  });

  it('tier 2 concepts are on islands 3-4 (intermediate)', () => {
    const tier2 = CONCEPTS.filter((c) => c.tier === 2);
    for (const c of tier2) {
      expect(['island_03', 'island_04'], `${c.id} tier 2 on wrong island`).toContain(c.islandId);
    }
  });

  it('tier 3 concepts are on island 5 (advanced)', () => {
    const tier3 = CONCEPTS.filter((c) => c.tier === 3);
    for (const c of tier3) {
      expect(c.islandId, `${c.id} tier 3 on wrong island`).toBe('island_05');
    }
  });

  it('each tier has at least 3 concepts', () => {
    expect(CONCEPTS.filter((c) => c.tier === 1).length).toBeGreaterThanOrEqual(3);
    expect(CONCEPTS.filter((c) => c.tier === 2).length).toBeGreaterThanOrEqual(3);
    expect(CONCEPTS.filter((c) => c.tier === 3).length).toBeGreaterThanOrEqual(3);
  });
});

// ── Island unlock chain forms a valid progression ────────────

describe('Pacing — island unlock chain', () => {
  it('island_01 has no prerequisites (starting island)', () => {
    const island1 = ISLANDS.find((i) => i.id === 'island_01')!;
    expect(island1.unlockAfter).toBeUndefined();
  });

  it('islands 2-5 form a linear chain', () => {
    expect(ISLANDS.find((i) => i.id === 'island_02')!.unlockAfter).toBe('island_01');
    expect(ISLANDS.find((i) => i.id === 'island_03')!.unlockAfter).toBe('island_02');
    expect(ISLANDS.find((i) => i.id === 'island_04')!.unlockAfter).toBe('island_03');
    expect(ISLANDS.find((i) => i.id === 'island_05')!.unlockAfter).toBe('island_04');
  });

  it('hidden reef unlocks after island 5 (post-game content)', () => {
    const reef = ISLANDS.find((i) => i.id === 'hidden_reef')!;
    expect(reef.unlockAfter).toBe('island_05');
  });

  it('every unlockAfter references a valid island', () => {
    const ids = ISLANDS.map((i) => i.id);
    for (const island of ISLANDS) {
      if (island.unlockAfter) {
        expect(ids, `${island.id} unlocks after unknown island`).toContain(island.unlockAfter);
      }
    }
  });
});

// ── Threat fog pacing feels fair ─────────────────────────────

describe('Pacing — fog threat timing', () => {
  it('fog takes at least 10 seconds to fully envelop', () => {
    const threat = createFogThreat();
    let failed = false;
    for (let frame = 0; frame < 600; frame++) { // 10s at 60fps
      const result = updateThreatSystem(threat, 1 / 60);
      if (result.failed) {
        failed = true;
        break;
      }
    }
    expect(failed).toBe(false);
  });

  it('fog reaches danger zone (>50%) within 20 seconds', () => {
    const threat = createFogThreat();
    for (let frame = 0; frame < 1200; frame++) {
      updateThreatSystem(threat, 1 / 60);
    }
    expect(threat.state.fogDepth).toBeGreaterThan(0.5);
  });

  it('3 wrong answers don\'t cause instant failure', () => {
    const threat = createFogThreat();
    applyRecallOutcomeToThreat(threat, false);
    applyRecallOutcomeToThreat(threat, false);
    applyRecallOutcomeToThreat(threat, false);
    expect(threat.state.fogDepth).toBeLessThan(1);
  });
});
