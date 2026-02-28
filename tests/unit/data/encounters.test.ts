import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '../../../src/data/encounters';

describe('ENCOUNTERS', () => {
  it('defines all five encounter archetypes', () => {
    const ids = new Set(ENCOUNTERS.map((entry) => entry.type));
    expect(ids.has('fog')).toBe(true);
    expect(ids.has('storm')).toBe(true);
    expect(ids.has('battle')).toBe(true);
    expect(ids.has('ruins')).toBe(true);
    expect(ids.has('squid')).toBe(true);
  });

  it('keeps squid encounter as highest prompt count profile', () => {
    const squid = ENCOUNTERS.find((entry) => entry.type === 'squid');
    const maxPrompts = Math.max(...ENCOUNTERS.map((entry) => entry.promptCount));

    expect(squid?.promptCount).toBe(maxPrompts);
    expect(squid?.promptCount).toBeGreaterThanOrEqual(5);
  });
});
