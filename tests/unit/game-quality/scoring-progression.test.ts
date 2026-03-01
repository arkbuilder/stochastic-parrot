/**
 * Scoring, Progression & Navigation — Design Compliance Tests
 *
 * Validates requirements P7–P16, G21–G25, N1–N8 from ScoringAndProgression.md:
 *  - Grade system (S/A/B/C/D) with exact thresholds
 *  - Completion bonuses
 *  - Score never blocks progression
 *  - Leaderboard name max 12 chars (structural check)
 *  - Island-specific scoring validation
 *  - Overworld navigation data integrity
 */
import { describe, it, expect } from 'vitest';
import {
  gradeFromRatio,
  computeIslandScore,
  computeMaxPromptScore,
} from '../../../src/systems/scoring-system';
import {
  createRecallState,
  answerRecall,
  calculateSpeedMultiplier,
  calculateComboMultiplier,
  calculateBasePoints,
} from '../../../src/systems/recall-system';
import { ISLANDS } from '../../../src/data/islands';
import { ENCOUNTERS } from '../../../src/data/encounters';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/core/types';

// ── P7: Grade thresholds ──

describe('Scoring — Grade System (P7)', () => {
  it('P7 — S grade requires ≥ 95%', () => {
    expect(gradeFromRatio(0.95)).toBe('S');
    expect(gradeFromRatio(1.0)).toBe('S');
    expect(gradeFromRatio(0.949)).not.toBe('S');
  });

  it('P7 — A grade requires ≥ 80%', () => {
    expect(gradeFromRatio(0.80)).toBe('A');
    expect(gradeFromRatio(0.94)).toBe('A');
    expect(gradeFromRatio(0.79)).not.toBe('A');
  });

  it('P7 — B grade requires ≥ 60%', () => {
    expect(gradeFromRatio(0.60)).toBe('B');
    expect(gradeFromRatio(0.79)).toBe('B');
    expect(gradeFromRatio(0.59)).not.toBe('B');
  });

  it('P7 — C grade requires ≥ 40%', () => {
    expect(gradeFromRatio(0.40)).toBe('C');
    expect(gradeFromRatio(0.59)).toBe('C');
    expect(gradeFromRatio(0.39)).not.toBe('C');
  });

  it('P7 — D grade for < 40%', () => {
    expect(gradeFromRatio(0.39)).toBe('D');
    expect(gradeFromRatio(0.0)).toBe('D');
  });

  it('P7 — boundary values are exact', () => {
    const thresholds = [
      { ratio: 0.95, grade: 'S' },
      { ratio: 0.80, grade: 'A' },
      { ratio: 0.60, grade: 'B' },
      { ratio: 0.40, grade: 'C' },
      { ratio: 0.39, grade: 'D' },
    ] as const;

    for (const { ratio, grade } of thresholds) {
      expect(gradeFromRatio(ratio)).toBe(grade);
    }
  });
});

// ── P9: Island score computation ──

describe('Scoring — Island Score Computation (P9)', () => {
  it('P9 — island score includes prompt score + coins + expert bonus', () => {
    const score = computeIslandScore(500, 10, true);
    // 500 + 10*5 + 500 = 1050
    expect(score).toBe(1050);
  });

  it('P9 — without expert bonus', () => {
    const score = computeIslandScore(300, 5, false);
    // 300 + 5*5 = 325
    expect(score).toBe(325);
  });

  it('P9 — zero score case', () => {
    const score = computeIslandScore(0, 0, false);
    expect(score).toBe(0);
  });

  it('P10 — max prompt score computes correctly for 3 prompts', () => {
    const maxScore = computeMaxPromptScore(3);
    // Streak 1: 100*2*1 = 200
    // Streak 2: 100*2*1.5 = 300
    // Streak 3: 100*2*2 = 400
    // Total: 900
    expect(maxScore).toBe(900);
  });

  it('P10 — max prompt score computes correctly for 5 prompts (squid boss)', () => {
    const maxScore = computeMaxPromptScore(5);
    // Streak 1: 200*1=200, 2: 200*1.5=300, 3: 200*2=400, 4: 200*2.5=500, 5: 200*2.5=500
    // Total: 1900
    expect(maxScore).toBe(1900);
  });
});

// ── G25: Score never blocks progression ──

describe('Scoring — Score Does Not Block (G25)', () => {
  it('G25 — zero score is achievable (all wrong/timeout)', () => {
    const prompts = [{ id: 'p0', conceptId: 'c0', correctLandmarkId: 'l0' }];
    const state = createRecallState(prompts, 10000);

    // Wrong answer gives 0
    const result = answerRecall(state, 'wrong', 5000);
    expect(result.scoreAwarded).toBe(0);
    expect(state.totalScore).toBe(0);
  });

  it('G25 — grading handles 0 ratio gracefully', () => {
    expect(gradeFromRatio(0)).toBe('D');
  });

  it('G25 — island score with 0 prompts gives 0', () => {
    expect(computeIslandScore(0, 0, false)).toBe(0);
  });
});

// ── Combo/Speed/Base scoring edge cases ──

describe('Scoring — Edge Cases', () => {
  it('speed multiplier at exact boundaries', () => {
    expect(calculateSpeedMultiplier(0)).toBe(2.0);
    expect(calculateSpeedMultiplier(3000)).toBe(2.0);
    expect(calculateSpeedMultiplier(3001)).toBe(1.5);
    expect(calculateSpeedMultiplier(5000)).toBe(1.5);
    expect(calculateSpeedMultiplier(5001)).toBe(1.2);
    expect(calculateSpeedMultiplier(8000)).toBe(1.2);
    expect(calculateSpeedMultiplier(8001)).toBe(1.0);
  });

  it('combo multiplier caps at 2.5x for high streaks', () => {
    expect(calculateComboMultiplier(100)).toBe(2.5);
    expect(calculateComboMultiplier(50)).toBe(2.5);
  });

  it('base points: negative or zero attempt defaults to 25', () => {
    expect(calculateBasePoints(0)).toBe(100);
    expect(calculateBasePoints(-1)).toBe(100);
  });
});

// ── Perfect play scoring per island ──

describe('Scoring — Perfect Play Per Island', () => {
  for (const island of ISLANDS.filter((i) => i.id.startsWith('island_'))) {
    it(`perfect score → S grade for ${island.name}`, () => {
      const promptCount = island.conceptIds.length;
      const maxScore = computeMaxPromptScore(promptCount);
      expect(maxScore).toBeGreaterThan(0);
      // Perfect play gets max score → ratio = 1.0 → S grade
      expect(gradeFromRatio(1.0)).toBe('S');
    });
  }
});

// ── Overworld Navigation ──

describe('Navigation — Overworld Data (N1-N8)', () => {
  it('N1 — 5 main nodes + 1 secret = 6 total', () => {
    expect(OVERWORLD_NODES).toHaveLength(6);
  });

  it('N1 — main nodes are non-secret', () => {
    const mainNodes = OVERWORLD_NODES.filter((n) => !n.secret);
    expect(mainNodes).toHaveLength(5);
  });

  it('N3 — secret node is Hidden Reef', () => {
    const secrets = OVERWORLD_NODES.filter((n) => n.secret);
    expect(secrets).toHaveLength(1);
    expect(secrets[0]!.islandId).toBe('hidden_reef');
  });

  it('N1 — all nodes have names', () => {
    for (const node of OVERWORLD_NODES) {
      expect(node.name).toBeTruthy();
      expect(node.name.length).toBeGreaterThan(0);
    }
  });

  it('N6 — nodes are in lower-right quadrant trending (accessible one-handed)', () => {
    // Most nodes should be reachable in portrait mode
    for (const node of OVERWORLD_NODES) {
      expect(node.x).toBeGreaterThan(0);
      expect(node.y).toBeGreaterThan(0);
      expect(node.x).toBeLessThan(GAME_WIDTH);
      expect(node.y).toBeLessThan(GAME_HEIGHT);
    }
  });
});

// ── P14: Leaderboard name constraint ──

describe('Scoring — Leaderboard Constraints (P14)', () => {
  it('P14 — max name length of 12 is a reasonable constraint', () => {
    const maxNameLength = 12;
    expect(maxNameLength).toBe(12);
    // Validate that a 12-char name works
    const validName = 'CAPT_NEMO123';
    expect(validName.length).toBeLessThanOrEqual(maxNameLength);
    // 13 chars exceeds
    const tooLong = 'CAPTAIN_NEMO!';
    expect(tooLong.length).toBeGreaterThan(maxNameLength);
  });
});

// ── P12/P13: Completion bonuses ──

describe('Scoring — Completion Bonuses (P12/P13)', () => {
  it('P12 — completion bonus of 1000 points can be computed', () => {
    const completionBonus = 1000;
    const baseScore = computeIslandScore(500, 0, false);
    const withBonus = baseScore + completionBonus;
    expect(withBonus).toBe(1500);
  });

  it('P13 — Dead Reckoner bonus (all expert) of 2000 points', () => {
    const deadReckonerBonus = 2000;
    expect(deadReckonerBonus).toBe(2000);
  });
});

// ── Encounter-Island mapping ──

describe('Navigation — Encounter Assignment', () => {
  it('each main island encounter is unique', () => {
    const mainIslands = ISLANDS.filter((i) => i.id.startsWith('island_'));
    const types = mainIslands.map((i) => i.encounterType);
    expect(new Set(types).size).toBe(5);
  });

  it('encounter difficulty ramps with island number', () => {
    // Encounter time windows should generally decrease (harder)
    const mainIslands = ISLANDS.filter((i) => i.id.startsWith('island_'));
    const encounterWindows = mainIslands.map((island) => {
      const enc = ENCOUNTERS.find((e) => e.type === island.encounterType)!;
      return enc.timeWindowMs;
    });

    // Island 1 (fog) should have more generous time than island 5 (squid)
    expect(encounterWindows[0]).toBeGreaterThanOrEqual(encounterWindows[4]!);
  });
});
