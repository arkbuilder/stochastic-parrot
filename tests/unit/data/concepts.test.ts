import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '../../../src/data/concepts';

describe('CONCEPTS', () => {
  it('contains exactly 15 concept definitions', () => {
    expect(CONCEPTS).toHaveLength(15);
  });

  it('has unique IDs', () => {
    const ids = CONCEPTS.map((concept) => concept.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('keeps concept count to 3 per island', () => {
    const countsByIsland = CONCEPTS.reduce<Record<string, number>>((acc, concept) => {
      acc[concept.islandId] = (acc[concept.islandId] ?? 0) + 1;
      return acc;
    }, {});

    Object.values(countsByIsland).forEach((count) => {
      expect(count).toBe(3);
    });
  });
});
