/**
 * SolavineSound — ADSR Envelope System
 *
 * Pure functions for computing envelope amplitudes, durations,
 * and control points. No Web Audio dependency.
 *
 * Envelope stages:
 *   0 → peak (Attack) → sustain×peak (Decay) → sustain×peak (Sustain) → 0 (Release)
 */

import type { ADSREnvelope } from './types';

/* ── Preset Envelopes ── */

export const ENVELOPE_PRESETS: Record<string, ADSREnvelope> = {
  /** Sharp attack, instant decay — drums, clicks */
  percussive: { attack: 0.005, decay: 0.1, sustain: 0.0, release: 0.05, peak: 1.0 },

  /** Quick pluck — guitar-like, harp */
  pluck: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1, peak: 1.0 },

  /** Slow attack pad — ambient, warm */
  pad: { attack: 0.3, decay: 0.2, sustain: 0.7, release: 0.5, peak: 1.0 },

  /** Instant on/off — organ, 8-bit toggle */
  organ: { attack: 0.005, decay: 0.01, sustain: 1.0, release: 0.01, peak: 1.0 },

  /** Chiptune standard — slight click attack, medium sustain */
  chip: { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.08, peak: 1.0 },

  /** Bell-like — instant attack, long ring-out */
  bell: { attack: 0.002, decay: 0.8, sustain: 0.0, release: 0.3, peak: 1.0 },

  /** String ensemble — slow attack, high sustain */
  strings: { attack: 0.15, decay: 0.1, sustain: 0.8, release: 0.4, peak: 1.0 },

  /** Bass instrument — fast attack, medium decay */
  bass: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.1, peak: 1.0 },

  /** Tiny blip — very short, UI feedback */
  blip: { attack: 0.005, decay: 0.03, sustain: 0.0, release: 0.02, peak: 1.0 },

  /** Brass stab — medium attack, strong sustain */
  brass: { attack: 0.05, decay: 0.08, sustain: 0.7, release: 0.15, peak: 1.0 },
};

/* ── Envelope Math ── */

/**
 * Compute the amplitude of an ADSR envelope at a given time.
 *
 * @param time - Seconds since note-on
 * @param env - ADSR parameters
 * @param noteDuration - How long the note is held before release (seconds)
 * @returns Amplitude (0–peak)
 */
export function computeEnvelopeValue(
  time: number,
  env: ADSREnvelope,
  noteDuration: number,
): number {
  const peak = env.peak ?? 1.0;
  if (time < 0) return 0;

  // Attack phase: 0 → peak
  if (time < env.attack) {
    if (env.attack === 0) return peak;
    return (time / env.attack) * peak;
  }

  // Decay phase: peak → sustain·peak
  const decayStart = env.attack;
  if (time < decayStart + env.decay) {
    if (env.decay === 0) return env.sustain * peak;
    const t = (time - decayStart) / env.decay;
    return peak - (peak - env.sustain * peak) * t;
  }

  // Sustain phase: hold sustain·peak until note-off
  if (time < noteDuration) {
    return env.sustain * peak;
  }

  // Release phase: sustain·peak → 0
  if (env.release === 0) return 0;
  const releaseT = (time - noteDuration) / env.release;
  if (releaseT >= 1) return 0;
  return env.sustain * peak * (1 - releaseT);
}

/**
 * Total duration of the envelope for a given note hold time.
 * Accounts for attack+decay extending beyond note duration.
 */
export function envelopeTotalDuration(env: ADSREnvelope, noteDuration: number): number {
  const activePhase = Math.max(noteDuration, env.attack + env.decay);
  return activePhase + env.release;
}

/**
 * Generate key control points for the envelope.
 * Useful for visualization or scheduling Web Audio automation.
 *
 * Returns array of { time, value } pairs describing the envelope shape.
 */
export function getEnvelopePoints(
  env: ADSREnvelope,
  noteDuration: number,
): Array<{ time: number; value: number }> {
  const peak = env.peak ?? 1.0;
  const sustainLevel = env.sustain * peak;

  return [
    { time: 0, value: 0 },                                     // note-on
    { time: env.attack, value: peak },                          // end of attack
    { time: env.attack + env.decay, value: sustainLevel },      // end of decay
    { time: noteDuration, value: sustainLevel },                 // note-off (release begins)
    { time: noteDuration + env.release, value: 0 },             // silence
  ];
}

/**
 * Validate an ADSR envelope has sensible parameters.
 */
export function validateEnvelope(env: ADSREnvelope): string[] {
  const errors: string[] = [];
  if (env.attack < 0) errors.push('attack must be ≥ 0');
  if (env.decay < 0) errors.push('decay must be ≥ 0');
  if (env.sustain < 0 || env.sustain > 1) errors.push('sustain must be in [0, 1]');
  if (env.release < 0) errors.push('release must be ≥ 0');
  if (env.peak !== undefined && (env.peak < 0 || env.peak > 1)) {
    errors.push('peak must be in [0, 1]');
  }
  return errors;
}
