import { describe, expect, it } from 'vitest';
import { clamp, lerp, distance, normalize } from '../../../src/utils/math';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min when below', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to max when above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when min equals max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it('handles negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });
});

describe('lerp', () => {
  it('returns start at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns end at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('extrapolates beyond t=1', () => {
    expect(lerp(0, 10, 2)).toBe(20);
  });

  it('extrapolates below t=0', () => {
    expect(lerp(0, 10, -1)).toBe(-10);
  });
});

describe('distance', () => {
  it('returns 0 for the same point', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('returns correct distance for axis-aligned points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
  });

  it('returns correct distance for 3-4-5 triangle', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('is commutative', () => {
    const a = { x: 10, y: 20 };
    const b = { x: 30, y: 40 };
    expect(distance(a, b)).toBe(distance(b, a));
  });
});

describe('normalize', () => {
  it('returns zero vector for zero input', () => {
    const result = normalize(0, 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('returns unit vector along x', () => {
    const result = normalize(10, 0);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
  });

  it('returns unit vector along y', () => {
    const result = normalize(0, -5);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(-1);
  });

  it('returns unit length for arbitrary vector', () => {
    const result = normalize(3, 4);
    const length = Math.hypot(result.x, result.y);
    expect(length).toBeCloseTo(1);
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
  });

  it('preserves direction for negative values', () => {
    const result = normalize(-3, -4);
    expect(result.x).toBeCloseTo(-0.6);
    expect(result.y).toBeCloseTo(-0.8);
  });
});
