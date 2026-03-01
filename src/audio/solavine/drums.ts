/**
 * SolavineSound — Drum Kit
 *
 * 8 percussion presets synthesized via oscillator pitch-sweep + filtered noise.
 * Each preset is pure data — the engine synthesizes at runtime.
 *
 * Synthesis approach per drum hit:
 *   Tone: OscillatorNode(pitchStart → pitchEnd over pitchDecay) × toneVolume × envelope
 *   Noise: White/periodic noise → optional BiquadFilter → noiseVolume × envelope
 *   Both components share the same ADSR envelope for amplitude.
 */

import type { DrumPreset } from './types';

export const DRUM_KIT: Record<string, DrumPreset> = {

  /** Kick drum — sine pitch sweep 150→40 Hz over 80ms. Deep thump. */
  kick: {
    name: 'Kick',
    pitchStart: 150,
    pitchEnd: 40,
    pitchDecay: 0.08,
    toneWave: 'sine',
    toneVolume: 0.8,
    noiseVolume: 0.1,
    noiseType: 'white',
    envelope: { attack: 0.003, decay: 0.15, sustain: 0.0, release: 0.05, peak: 1.0 },
  },

  /** Snare drum — triangle pitch sweep + highpass-filtered noise. Crisp snap. */
  snare: {
    name: 'Snare',
    pitchStart: 200,
    pitchEnd: 120,
    pitchDecay: 0.04,
    toneWave: 'triangle',
    toneVolume: 0.4,
    noiseVolume: 0.6,
    noiseType: 'white',
    envelope: { attack: 0.002, decay: 0.12, sustain: 0.0, release: 0.08, peak: 1.0 },
    noiseFilter: { type: 'highpass', frequency: 2000 },
  },

  /** Closed hi-hat — pure highpass noise, very short decay. Tick. */
  hihat_closed: {
    name: 'Hi-Hat Closed',
    pitchStart: 0,
    pitchEnd: 0,
    pitchDecay: 0,
    toneWave: 'square',
    toneVolume: 0.0,
    noiseVolume: 0.7,
    noiseType: 'white',
    envelope: { attack: 0.001, decay: 0.04, sustain: 0.0, release: 0.02, peak: 1.0 },
    noiseFilter: { type: 'highpass', frequency: 7000, Q: 1.5 },
  },

  /** Open hi-hat — longer noise decay than closed. Sizzle. */
  hihat_open: {
    name: 'Hi-Hat Open',
    pitchStart: 0,
    pitchEnd: 0,
    pitchDecay: 0,
    toneWave: 'square',
    toneVolume: 0.0,
    noiseVolume: 0.6,
    noiseType: 'white',
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.15, peak: 1.0 },
    noiseFilter: { type: 'highpass', frequency: 6000, Q: 1.0 },
  },

  /** Low tom — sine sweep 120→60 Hz. Deep, resonant. */
  tom_low: {
    name: 'Tom Low',
    pitchStart: 120,
    pitchEnd: 60,
    pitchDecay: 0.12,
    toneWave: 'sine',
    toneVolume: 0.7,
    noiseVolume: 0.15,
    noiseType: 'white',
    envelope: { attack: 0.003, decay: 0.2, sustain: 0.0, release: 0.1, peak: 1.0 },
  },

  /** High tom — sine sweep 200→100 Hz. Brighter than low tom. */
  tom_high: {
    name: 'Tom High',
    pitchStart: 200,
    pitchEnd: 100,
    pitchDecay: 0.1,
    toneWave: 'sine',
    toneVolume: 0.7,
    noiseVolume: 0.15,
    noiseType: 'white',
    envelope: { attack: 0.003, decay: 0.15, sustain: 0.0, release: 0.08, peak: 1.0 },
  },

  /** Crash cymbal — bandpass-filtered noise with long decay. Wash. */
  crash: {
    name: 'Crash Cymbal',
    pitchStart: 0,
    pitchEnd: 0,
    pitchDecay: 0,
    toneWave: 'square',
    toneVolume: 0.0,
    noiseVolume: 0.5,
    noiseType: 'white',
    envelope: { attack: 0.002, decay: 0.8, sustain: 0.05, release: 0.4, peak: 1.0 },
    noiseFilter: { type: 'bandpass', frequency: 5000, Q: 0.5 },
  },

  /** Rim shot — short square ping + periodic noise. Clicky. */
  rim: {
    name: 'Rim Shot',
    pitchStart: 800,
    pitchEnd: 600,
    pitchDecay: 0.02,
    toneWave: 'square',
    toneVolume: 0.6,
    noiseVolume: 0.3,
    noiseType: 'periodic',
    envelope: { attack: 0.001, decay: 0.03, sustain: 0.0, release: 0.02, peak: 1.0 },
  },
};

/** Get all drum preset names. */
export function getDrumNames(): string[] {
  return Object.keys(DRUM_KIT);
}

/** Get a drum preset by name, or undefined. */
export function getDrum(name: string): DrumPreset | undefined {
  return DRUM_KIT[name];
}

/** Validate a drum preset. */
export function validateDrum(preset: DrumPreset): string[] {
  const errors: string[] = [];
  if (!preset.name) errors.push('name is required');
  if (preset.pitchStart < 0) errors.push('pitchStart must be ≥ 0');
  if (preset.pitchEnd < 0) errors.push('pitchEnd must be ≥ 0');
  if (preset.pitchDecay < 0) errors.push('pitchDecay must be ≥ 0');
  if (preset.toneVolume < 0 || preset.toneVolume > 1) errors.push('toneVolume must be in [0, 1]');
  if (preset.noiseVolume < 0 || preset.noiseVolume > 1) errors.push('noiseVolume must be in [0, 1]');
  return errors;
}
