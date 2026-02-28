import { describe, expect, it } from 'vitest';
import { ISLANDS } from '../../../src/data/islands';

describe('ISLANDS', () => {
  it('contains Island 1 Bay of Learning with 3 concepts and 3 landmarks', () => {
    const island1 = ISLANDS.find((island) => island.id === 'island_01');
    expect(island1).toBeDefined();
    expect(island1?.name).toBe('Bay of Learning');
    expect(island1?.conceptIds).toHaveLength(3);
    expect(island1?.landmarks).toHaveLength(3);
    expect(island1?.encounterType).toBe('fog');
  });
});
