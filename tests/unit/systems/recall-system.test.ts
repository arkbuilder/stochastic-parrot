import { describe, expect, it } from 'vitest';
import {
  answerRecall,
  calculateComboMultiplier,
  calculateSpeedMultiplier,
  createRecallState,
  tickRecallState,
} from '../../../src/systems/recall-system';

describe('recall-system', () => {
  it('calculates speed multiplier thresholds', () => {
    expect(calculateSpeedMultiplier(2_000)).toBe(2);
    expect(calculateSpeedMultiplier(4_000)).toBe(1.5);
    expect(calculateSpeedMultiplier(7_000)).toBe(1.2);
    expect(calculateSpeedMultiplier(9_000)).toBe(1);
  });

  it('calculates combo multiplier thresholds', () => {
    expect(calculateComboMultiplier(1)).toBe(1);
    expect(calculateComboMultiplier(2)).toBe(1.5);
    expect(calculateComboMultiplier(3)).toBe(2);
    expect(calculateComboMultiplier(5)).toBe(2.5);
  });

  it('scores correct answer and advances prompt', () => {
    const state = createRecallState(
      [
        { id: 'p1', conceptId: 'training_data', correctLandmarkId: 'dock_crates' },
        { id: 'p2', conceptId: 'model', correctLandmarkId: 'chart_table' },
      ],
      12_000,
    );

    const result = answerRecall(state, 'dock_crates', 2_500);

    expect(result.correct).toBe(true);
    expect(result.scoreAwarded).toBeGreaterThan(0);
    expect(state.currentPromptIndex).toBe(1);
    expect(state.totalScore).toBe(result.scoreAwarded);
  });

  it('returns incorrect answer without advancing prompt', () => {
    const state = createRecallState(
      [{ id: 'p1', conceptId: 'training_data', correctLandmarkId: 'dock_crates' }],
      12_000,
    );

    const result = answerRecall(state, 'cannon', 3_000);

    expect(result.correct).toBe(false);
    expect(state.currentPromptIndex).toBe(0);
    expect(state.totalScore).toBe(0);
  });

  it('sets timeout flag when timer expires', () => {
    const state = createRecallState(
      [{ id: 'p1', conceptId: 'training_data', correctLandmarkId: 'dock_crates' }],
      500,
    );

    tickRecallState(state, 250);
    expect(state.timedOut).toBe(false);

    tickRecallState(state, 300);
    expect(state.timedOut).toBe(true);
    expect(state.promptTimeRemainingMs).toBe(0);
  });
});
