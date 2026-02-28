import { describe, expect, it } from 'vitest';
import { Clock } from '../../../src/core/clock';

describe('Clock', () => {
  it('returns zero for first tick and computes delta afterwards', () => {
    const clock = new Clock();

    expect(clock.tick(1_000)).toBe(0);
    expect(clock.tick(1_016)).toBeCloseTo(0.016, 5);
    expect(clock.tick(1_032)).toBeCloseTo(0.016, 5);
  });

  it('returns zero while paused', () => {
    const clock = new Clock();

    clock.tick(1_000);
    clock.setPaused(true);

    expect(clock.tick(1_050)).toBe(0);
    clock.setPaused(false);
    expect(clock.tick(1_066)).toBeCloseTo(0.016, 5);
  });

  it('resets timing state', () => {
    const clock = new Clock();

    clock.tick(1_000);
    clock.tick(1_040);
    clock.reset();

    expect(clock.tick(2_000)).toBe(0);
    expect(clock.tick(2_010)).toBeCloseTo(0.01, 5);
  });
});
