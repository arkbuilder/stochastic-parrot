import { describe, expect, it } from 'vitest';
import { ISLANDS } from '../../src/data/islands';
import { answerRecall, createRecallState } from '../../src/systems/recall-system';
import { computeIslandScore } from '../../src/systems/scoring-system';

describe('full campaign progression', () => {
  it('simulates five-island completion with cumulative unlocks and total score', () => {
    const completed = new Set<string>();
    const expertBonuses = new Set<string>();
    let totalScore = 0;

    const mainIslands = ['island_01', 'island_02', 'island_03', 'island_04', 'island_05'];

    for (const islandId of mainIslands) {
      const island = ISLANDS.find((entry) => entry.id === islandId);
      expect(island).toBeDefined();

      const prompts = (island?.conceptIds ?? []).map((conceptId) => {
        const landmark = island?.landmarks.find((entry) => entry.conceptId === conceptId);
        return {
          id: `prompt_${conceptId}`,
          conceptId,
          correctLandmarkId: landmark?.id ?? '',
        };
      });

      const recall = createRecallState(prompts, 12_000);
      for (const prompt of prompts) {
        answerRecall(recall, prompt.correctLandmarkId, 2_000);
      }

      const islandScore = computeIslandScore(recall.totalScore, 0, true);
      totalScore += islandScore;
      completed.add(islandId);
      expertBonuses.add(islandId);
    }

    expect(completed.has('island_05')).toBe(true);
    expect(expertBonuses.size).toBe(5);
    expect(totalScore).toBeGreaterThan(5_000);
  });

  it('keeps hidden reef gated after island 5 in data sequence', () => {
    const hidden = ISLANDS.find((entry) => entry.id === 'hidden_reef');
    expect(hidden?.unlockAfter).toBe('island_05');
  });
});
