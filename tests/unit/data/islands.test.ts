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

  it('contains Island 2 Driftwood Shallows unlocked after Island 1', () => {
    const island2 = ISLANDS.find((island) => island.id === 'island_02');
    expect(island2).toBeDefined();
    expect(island2?.name).toBe('Driftwood Shallows');
    expect(island2?.conceptIds).toHaveLength(3);
    expect(island2?.landmarks).toHaveLength(3);
    expect(island2?.encounterType).toBe('storm');
    expect(island2?.unlockAfter).toBe('island_01');
  });

  it('contains Islands 3-5 with battle/ruins/squid encounters', () => {
    const island3 = ISLANDS.find((island) => island.id === 'island_03');
    const island4 = ISLANDS.find((island) => island.id === 'island_04');
    const island5 = ISLANDS.find((island) => island.id === 'island_05');

    expect(island3?.encounterType).toBe('battle');
    expect(island4?.encounterType).toBe('ruins');
    expect(island5?.encounterType).toBe('squid');
    expect(island3?.conceptIds).toHaveLength(3);
    expect(island4?.conceptIds).toHaveLength(3);
    expect(island5?.conceptIds).toHaveLength(3);
  });

  it('contains Hidden Reef secret island unlocked after Island 5', () => {
    const hidden = ISLANDS.find((island) => island.id === 'hidden_reef');
    expect(hidden).toBeDefined();
    expect(hidden?.encounterType).toBe('ruins');
    expect(hidden?.unlockAfter).toBe('island_05');
    expect(hidden?.landmarks).toHaveLength(3);
  });
});
