import { describe, expect, it } from 'vitest';
import {
  calculateBasePoints,
  calculateComboMultiplier,
  calculateSpeedMultiplier,
} from '../../../src/systems/recall-system';
import { computeIslandScore, computeMaxPromptScore, gradeFromRatio } from '../../../src/systems/scoring-system';

describe('scoring-system', () => {
  it('matches base points and multipliers model', () => {
    expect(calculateBasePoints(1)).toBe(100);
    expect(calculateBasePoints(2)).toBe(50);
    expect(calculateBasePoints(3)).toBe(25);

    expect(calculateSpeedMultiplier(2_500)).toBe(2);
    expect(calculateSpeedMultiplier(4_200)).toBe(1.5);
    expect(calculateSpeedMultiplier(6_200)).toBe(1.2);
    expect(calculateSpeedMultiplier(9_500)).toBe(1);

    expect(calculateComboMultiplier(1)).toBe(1);
    expect(calculateComboMultiplier(2)).toBe(1.5);
    expect(calculateComboMultiplier(3)).toBe(2);
    expect(calculateComboMultiplier(4)).toBe(2.5);
  });

  it('computes island score including expert bonus', () => {
    expect(computeIslandScore(900, 0, true)).toBe(1400);
    expect(computeIslandScore(700, 10, false)).toBe(750);
  });

  it('computes max prompt score and maps grades', () => {
    expect(computeMaxPromptScore(3)).toBe(900);

    expect(gradeFromRatio(0.96)).toBe('S');
    expect(gradeFromRatio(0.84)).toBe('A');
    expect(gradeFromRatio(0.7)).toBe('B');
    expect(gradeFromRatio(0.5)).toBe('C');
    expect(gradeFromRatio(0.2)).toBe('D');
  });
});
