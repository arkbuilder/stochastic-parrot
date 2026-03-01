/**
 * SolavineSound — Envelope Math Tests
 *
 * Verifies ADSR envelope computation: amplitude at each stage,
 * total duration, control points, and preset validation.
 */
import { describe, it, expect } from 'vitest';
import {
  computeEnvelopeValue,
  envelopeTotalDuration,
  getEnvelopePoints,
  validateEnvelope,
  ENVELOPE_PRESETS,
} from '../../../../src/audio/solavine/envelope';
import type { ADSREnvelope } from '../../../../src/audio/solavine/types';

/* ── Test Envelope ── */
const ENV: ADSREnvelope = {
  attack: 0.1,
  decay: 0.2,
  sustain: 0.5,
  release: 0.3,
  peak: 1.0,
};

describe('computeEnvelopeValue', () => {
  it('returns 0 before note-on (time < 0)', () => {
    expect(computeEnvelopeValue(-0.1, ENV, 1.0)).toBe(0);
  });

  it('returns 0 at time = 0 (start of attack)', () => {
    expect(computeEnvelopeValue(0, ENV, 1.0)).toBe(0);
  });

  it('ramps linearly during attack', () => {
    // Halfway through attack (0.05s out of 0.1s)
    expect(computeEnvelopeValue(0.05, ENV, 1.0)).toBeCloseTo(0.5, 4);
  });

  it('reaches peak at end of attack', () => {
    expect(computeEnvelopeValue(0.1, ENV, 1.0)).toBeCloseTo(1.0, 4);
  });

  it('decays from peak to sustain level during decay', () => {
    // Halfway through decay (0.2s): peak=1.0, sustain*peak=0.5
    // At 0.1 + 0.1 = 0.2: halfway between 1.0 and 0.5 = 0.75
    expect(computeEnvelopeValue(0.2, ENV, 1.0)).toBeCloseTo(0.75, 4);
  });

  it('reaches sustain level at end of decay', () => {
    // End of decay: 0.1 + 0.2 = 0.3
    expect(computeEnvelopeValue(0.3, ENV, 1.0)).toBeCloseTo(0.5, 4);
  });

  it('holds sustain level during sustain phase', () => {
    expect(computeEnvelopeValue(0.5, ENV, 1.0)).toBeCloseTo(0.5, 4);
    expect(computeEnvelopeValue(0.9, ENV, 1.0)).toBeCloseTo(0.5, 4);
  });

  it('releases linearly after note-off', () => {
    // At note-off (1.0s), sustain = 0.5
    // Halfway through release (1.15s): 0.5 * 0.5 = 0.25
    expect(computeEnvelopeValue(1.15, ENV, 1.0)).toBeCloseTo(0.25, 4);
  });

  it('reaches 0 at end of release', () => {
    expect(computeEnvelopeValue(1.3, ENV, 1.0)).toBeCloseTo(0, 4);
  });

  it('stays at 0 after release completes', () => {
    expect(computeEnvelopeValue(2.0, ENV, 1.0)).toBe(0);
  });

  it('respects custom peak value', () => {
    const env: ADSREnvelope = { ...ENV, peak: 0.6 };
    // At end of attack: peak = 0.6
    expect(computeEnvelopeValue(0.1, env, 1.0)).toBeCloseTo(0.6, 4);
    // Sustain: 0.5 * 0.6 = 0.3
    expect(computeEnvelopeValue(0.5, env, 1.0)).toBeCloseTo(0.3, 4);
  });

  it('handles zero attack time (instant peak)', () => {
    const env: ADSREnvelope = { attack: 0, decay: 0.1, sustain: 0.8, release: 0.1, peak: 1.0 };
    expect(computeEnvelopeValue(0, env, 1.0)).toBeCloseTo(1.0, 4);
  });

  it('handles zero decay (immediate sustain after attack)', () => {
    const env: ADSREnvelope = { attack: 0.1, decay: 0, sustain: 0.6, release: 0.2, peak: 1.0 };
    expect(computeEnvelopeValue(0.1, env, 1.0)).toBeCloseTo(0.6, 4);
  });

  it('handles zero release (instant off)', () => {
    const env: ADSREnvelope = { attack: 0.05, decay: 0.05, sustain: 0.5, release: 0, peak: 1.0 };
    expect(computeEnvelopeValue(1.0, env, 1.0)).toBe(0);
  });

  it('handles sustain = 0 (percussive envelope)', () => {
    const env: ADSREnvelope = { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05, peak: 1.0 };
    expect(computeEnvelopeValue(0.5, env, 1.0)).toBeCloseTo(0, 4);
  });

  it('handles sustain = 1 (organ-like envelope)', () => {
    const env: ADSREnvelope = { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.01, peak: 1.0 };
    expect(computeEnvelopeValue(0.5, env, 1.0)).toBeCloseTo(1.0, 4);
  });
});

describe('envelopeTotalDuration', () => {
  it('is note duration + release for typical notes', () => {
    // noteDuration=1.0 > attack+decay=0.3, so total = 1.0 + 0.3 = 1.3
    expect(envelopeTotalDuration(ENV, 1.0)).toBeCloseTo(1.3, 4);
  });

  it('extends past note duration when attack+decay exceeds it', () => {
    // Short note: 0.1s, but attack+decay = 0.3, so active = 0.3 + release 0.3 = 0.6
    expect(envelopeTotalDuration(ENV, 0.1)).toBeCloseTo(0.6, 4);
  });

  it('is just release for zero attack+decay', () => {
    const env: ADSREnvelope = { attack: 0, decay: 0, sustain: 1.0, release: 0.5, peak: 1.0 };
    expect(envelopeTotalDuration(env, 0.5)).toBeCloseTo(1.0, 4);
  });
});

describe('getEnvelopePoints', () => {
  it('returns 5 control points', () => {
    const points = getEnvelopePoints(ENV, 1.0);
    expect(points).toHaveLength(5);
  });

  it('starts at 0 and ends at 0', () => {
    const points = getEnvelopePoints(ENV, 1.0);
    expect(points[0]!.value).toBe(0);
    expect(points[4]!.value).toBe(0);
  });

  it('peak occurs at attack time', () => {
    const points = getEnvelopePoints(ENV, 1.0);
    expect(points[1]!.time).toBeCloseTo(0.1, 4);
    expect(points[1]!.value).toBeCloseTo(1.0, 4);
  });

  it('sustain level at end of decay', () => {
    const points = getEnvelopePoints(ENV, 1.0);
    expect(points[2]!.time).toBeCloseTo(0.3, 4); // attack + decay
    expect(points[2]!.value).toBeCloseTo(0.5, 4); // sustain * peak
  });

  it('note-off at note duration', () => {
    const points = getEnvelopePoints(ENV, 1.0);
    expect(points[3]!.time).toBeCloseTo(1.0, 4);
    expect(points[3]!.value).toBeCloseTo(0.5, 4);
  });

  it('silence at note duration + release', () => {
    const points = getEnvelopePoints(ENV, 1.0);
    expect(points[4]!.time).toBeCloseTo(1.3, 4); // 1.0 + 0.3
  });

  it('times are monotonically increasing', () => {
    const points = getEnvelopePoints(ENV, 1.0);
    for (let i = 1; i < points.length; i++) {
      expect(points[i]!.time).toBeGreaterThanOrEqual(points[i - 1]!.time);
    }
  });
});

describe('validateEnvelope', () => {
  it('valid envelope returns no errors', () => {
    expect(validateEnvelope(ENV)).toEqual([]);
  });

  it('catches negative attack', () => {
    const env = { ...ENV, attack: -0.1 };
    expect(validateEnvelope(env)).toContain('attack must be ≥ 0');
  });

  it('catches negative decay', () => {
    const env = { ...ENV, decay: -0.1 };
    expect(validateEnvelope(env)).toContain('decay must be ≥ 0');
  });

  it('catches sustain out of range', () => {
    expect(validateEnvelope({ ...ENV, sustain: -0.1 })).toContain('sustain must be in [0, 1]');
    expect(validateEnvelope({ ...ENV, sustain: 1.5 })).toContain('sustain must be in [0, 1]');
  });

  it('catches negative release', () => {
    expect(validateEnvelope({ ...ENV, release: -0.1 })).toContain('release must be ≥ 0');
  });

  it('catches peak out of range', () => {
    expect(validateEnvelope({ ...ENV, peak: 1.5 })).toContain('peak must be in [0, 1]');
    expect(validateEnvelope({ ...ENV, peak: -0.1 })).toContain('peak must be in [0, 1]');
  });

  it('undefined peak is valid', () => {
    const { peak, ...noPeak } = ENV;
    expect(validateEnvelope(noPeak as ADSREnvelope)).toEqual([]);
  });
});

describe('ENVELOPE_PRESETS', () => {
  it('has at least 9 presets', () => {
    expect(Object.keys(ENVELOPE_PRESETS).length).toBeGreaterThanOrEqual(9);
  });

  it('all presets pass validation', () => {
    for (const [name, preset] of Object.entries(ENVELOPE_PRESETS)) {
      const errors = validateEnvelope(preset);
      expect(errors, `preset '${name}' has errors: ${errors.join(', ')}`).toEqual([]);
    }
  });

  it('percussive has zero sustain', () => {
    expect(ENVELOPE_PRESETS.percussive!.sustain).toBe(0);
  });

  it('organ has full sustain', () => {
    expect(ENVELOPE_PRESETS.organ!.sustain).toBe(1.0);
  });

  it('pad has slow attack', () => {
    expect(ENVELOPE_PRESETS.pad!.attack).toBeGreaterThanOrEqual(0.2);
  });

  it('blip has very fast attack', () => {
    expect(ENVELOPE_PRESETS.blip!.attack).toBeLessThanOrEqual(0.01);
  });
});
