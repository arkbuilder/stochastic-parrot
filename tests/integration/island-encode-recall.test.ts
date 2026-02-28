import { describe, expect, it } from 'vitest';
import { createConceptCard } from '../../src/entities/concept-card';
import { createLandmark } from '../../src/entities/landmark';
import { updateEncodeSystem } from '../../src/systems/encode-system';
import { answerRecall, createRecallState } from '../../src/systems/recall-system';
import { computeIslandScore, gradeFromRatio } from '../../src/systems/scoring-system';

describe('island encode -> recall -> reward flow', () => {
  it('completes all prompts and produces score + grade', () => {
    const concepts = [
      { id: 'training_data', landmark: 'dock_crates', x: 52, y: 290, trayX: 12 },
      { id: 'model', landmark: 'chart_table', x: 120, y: 220, trayX: 88 },
      { id: 'inference', landmark: 'cannon', x: 185, y: 260, trayX: 164 },
    ];

    const landmarks = concepts.map((entry) => createLandmark(entry.landmark, entry.id, entry.x, entry.y));
    const cards = concepts.map((entry, index) => {
      const card = createConceptCard(`card_${entry.id}`, entry.id, entry.id, `C${index + 1}`, entry.trayX, 352);
      card.state.unlocked = true;
      return card;
    });

    const runtime = { heldCardId: null as string | null };

    for (const [index, concept] of concepts.entries()) {
      const card = cards[index];
      if (!card) {
        throw new Error('Missing concept card during integration test setup');
      }

      updateEncodeSystem(
        [card],
        landmarks,
        [
          { type: 'primary', x: concept.trayX + 8, y: 360 },
          { type: 'drag', x: concept.x, y: concept.y },
          { type: 'primary_end', x: concept.x, y: concept.y },
        ],
        runtime,
      );
    }

    expect(cards.every((card) => card.state.placed)).toBe(true);

    const recall = createRecallState(
      concepts.map((entry, index) => ({
        id: `prompt_${index + 1}`,
        conceptId: entry.id,
        correctLandmarkId: entry.landmark,
      })),
      12_000,
    );

    for (const concept of concepts) {
      const result = answerRecall(recall, concept.landmark, 2_000);
      expect(result.correct).toBe(true);
    }

    expect(recall.completed).toBe(true);
    const islandScore = computeIslandScore(recall.totalScore, 0, true);
    const grade = gradeFromRatio(islandScore / 1400);

    expect(islandScore).toBeGreaterThan(0);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(grade);
  });
});
