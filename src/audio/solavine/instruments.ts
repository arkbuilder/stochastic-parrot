/**
 * SolavineSound — Instrument Library
 *
 * 12 synthesizer presets covering the full chiptune + extended palette.
 * Each preset is a pure data structure — the engine interprets these
 * to configure Web Audio oscillators at synthesis time.
 */

import type { InstrumentPreset } from './types';
import { ENVELOPE_PRESETS } from './envelope';

export const INSTRUMENTS: Record<string, InstrumentPreset> = {

  /* ── Classic Chiptune Voices (NES-style 4-channel) ── */

  /** Pulse 12.5% duty — thin, nasal, tinny. NES pulse channel at lowest duty. */
  pulse_thin: {
    name: 'Pulse 12.5%',
    waveShape: 'pulse',
    envelope: { ...ENVELOPE_PRESETS.chip! },
    volume: 0.18,
    pulse: { dutyCycle: 0.125 },
  },

  /** Pulse 25% duty — hollow, reedy. Good for counter-melodies. */
  pulse_hollow: {
    name: 'Pulse 25%',
    waveShape: 'pulse',
    envelope: { ...ENVELOPE_PRESETS.chip! },
    volume: 0.20,
    pulse: { dutyCycle: 0.25 },
  },

  /** Square 50% duty — full-bodied, classic chiptune lead. */
  square_full: {
    name: 'Square 50%',
    waveShape: 'square',
    envelope: { ...ENVELOPE_PRESETS.chip! },
    volume: 0.16,
  },

  /** Triangle — smooth, mellow. Bass and melody voice. */
  triangle_smooth: {
    name: 'Triangle',
    waveShape: 'triangle',
    envelope: { ...ENVELOPE_PRESETS.chip!, sustain: 0.8, release: 0.12 },
    volume: 0.22,
  },

  /** Sawtooth — bright, buzzy harmonics. Leads and arps. */
  sawtooth_bright: {
    name: 'Sawtooth',
    waveShape: 'sawtooth',
    envelope: { ...ENVELOPE_PRESETS.chip! },
    volume: 0.14,
  },

  /** Pure sine — sub bass and gentle tones. Lowest harmonic content. */
  sine_pure: {
    name: 'Sine (Sub Bass)',
    waveShape: 'sine',
    envelope: { ...ENVELOPE_PRESETS.bass! },
    volume: 0.25,
  },

  /* ── Extended Voices ── */

  /** FM Bell — 2-operator FM with 2:1 ratio. Mallet/bell timbre. */
  fm_bell: {
    name: 'FM Bell',
    waveShape: 'fm',
    envelope: { ...ENVELOPE_PRESETS.bell! },
    volume: 0.15,
    fm: { modulatorRatio: 2.0, modulationIndex: 3.0, modulatorWave: 'sine' },
  },

  /** FM Metallic — 2-operator FM with 7:1 ratio. Clangy, percussive. */
  fm_metallic: {
    name: 'FM Metallic',
    waveShape: 'fm',
    envelope: { attack: 0.002, decay: 0.4, sustain: 0.0, release: 0.2, peak: 1.0 },
    volume: 0.12,
    fm: { modulatorRatio: 7.0, modulationIndex: 5.0, modulatorWave: 'sine' },
  },

  /** White noise — hiss, ambience, wind. No pitched content. */
  noise_white: {
    name: 'White Noise',
    waveShape: 'noise',
    envelope: { ...ENVELOPE_PRESETS.percussive! },
    volume: 0.10,
  },

  /** Filtered sawtooth pad — warm, washed-out. Low-pass at 800 Hz. */
  filtered_pad: {
    name: 'Filtered Pad',
    waveShape: 'sawtooth',
    envelope: { ...ENVELOPE_PRESETS.pad! },
    volume: 0.12,
    filter: { type: 'lowpass', frequency: 800, Q: 2.0 },
  },

  /** Detuned chorus square — two slightly detuned oscillators for width. */
  detuned_chorus: {
    name: 'Detuned Chorus',
    waveShape: 'square',
    envelope: { ...ENVELOPE_PRESETS.strings! },
    volume: 0.14,
    detuneSpread: 12,
  },

  /** Vibrato lead — triangle with pitched LFO for expression. */
  vibrato_lead: {
    name: 'Vibrato Lead',
    waveShape: 'triangle',
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.15, peak: 1.0 },
    volume: 0.20,
    vibrato: { rate: 5.5, depth: 30, delay: 0.15 },
  },
};

/** Get all instrument preset names. */
export function getInstrumentNames(): string[] {
  return Object.keys(INSTRUMENTS);
}

/** Get a preset by name, or undefined if not found. */
export function getInstrument(name: string): InstrumentPreset | undefined {
  return INSTRUMENTS[name];
}

/** Validate an instrument preset has required fields. */
export function validateInstrument(preset: InstrumentPreset): string[] {
  const errors: string[] = [];
  if (!preset.name) errors.push('name is required');
  if (preset.volume < 0 || preset.volume > 1) errors.push('volume must be in [0, 1]');
  if (preset.waveShape === 'pulse' && !preset.pulse) {
    errors.push('pulse config required for pulse waveShape');
  }
  if (preset.waveShape === 'fm' && !preset.fm) {
    errors.push('fm config required for fm waveShape');
  }
  if (preset.pulse && (preset.pulse.dutyCycle <= 0 || preset.pulse.dutyCycle >= 1)) {
    errors.push('dutyCycle must be in (0, 1)');
  }
  if (preset.fm) {
    if (preset.fm.modulatorRatio <= 0) errors.push('modulatorRatio must be > 0');
    if (preset.fm.modulationIndex < 0) errors.push('modulationIndex must be ≥ 0');
  }
  return errors;
}
