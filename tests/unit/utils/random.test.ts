import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../../src/utils/random';

describe('SeededRandom', () => {
  it('produces values in [0, 1)', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('same seed produces same sequence', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);
    for (let i = 0; i < 20; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = new SeededRandom(1);
    const rng2 = new SeededRandom(2);
    const seq1 = Array.from({ length: 5 }, () => rng1.next());
    const seq2 = Array.from({ length: 5 }, () => rng2.next());
    expect(seq1).not.toEqual(seq2);
  });

  describe('nextInt', () => {
    it('returns integers in [min, max]', () => {
      const rng = new SeededRandom(999);
      for (let i = 0; i < 100; i++) {
        const v = rng.nextInt(1, 6);
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(6);
      }
    });

    it('returns min when min equals max', () => {
      const rng = new SeededRandom(0);
      expect(rng.nextInt(5, 5)).toBe(5);
    });

    it('is deterministic', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      for (let i = 0; i < 10; i++) {
        expect(rng1.nextInt(0, 100)).toBe(rng2.nextInt(0, 100));
      }
    });
  });
});
