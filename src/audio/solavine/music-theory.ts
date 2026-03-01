/**
 * SolavineSound — Music Theory
 *
 * Pure functions for frequency calculation, scale generation,
 * chord building, interval math, and BPM timing.
 * No Web Audio dependency — fully testable.
 *
 * Reference: A4 = MIDI 69 = 440 Hz (12-TET equal temperament)
 * Formula: f(n) = 440 × 2^((n − 69) / 12)
 */

import type { NoteName, ScaleType, ChordType } from './types';

/* ── Constants ── */

export const NOTE_NAMES: readonly NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/** Scale interval patterns in semitones */
export const SCALE_INTERVALS: Record<ScaleType, readonly number[]> = {
  major:            [2, 2, 1, 2, 2, 2, 1],
  natural_minor:    [2, 1, 2, 2, 1, 2, 2],
  harmonic_minor:   [2, 1, 2, 2, 1, 3, 1],
  melodic_minor:    [2, 1, 2, 2, 2, 2, 1],
  dorian:           [2, 1, 2, 2, 2, 1, 2],
  phrygian:         [1, 2, 2, 2, 1, 2, 2],
  lydian:           [2, 2, 2, 1, 2, 2, 1],
  mixolydian:       [2, 2, 1, 2, 2, 1, 2],
  locrian:          [1, 2, 2, 1, 2, 2, 2],
  pentatonic_major: [2, 2, 3, 2, 3],
  pentatonic_minor: [3, 2, 2, 3, 2],
  blues:            [3, 2, 1, 1, 3, 2],
  chromatic:        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

/** Chord interval patterns in semitones from root */
export const CHORD_INTERVALS: Record<ChordType, readonly number[]> = {
  major:       [0, 4, 7],
  minor:       [0, 3, 7],
  diminished:  [0, 3, 6],
  augmented:   [0, 4, 8],
  major7:      [0, 4, 7, 11],
  minor7:      [0, 3, 7, 10],
  dominant7:   [0, 4, 7, 10],
  diminished7: [0, 3, 6, 9],
  sus2:        [0, 2, 7],
  sus4:        [0, 5, 7],
  power:       [0, 7],
};

/* ── Frequency / MIDI Conversion ── */

/**
 * Convert MIDI note number to frequency in Hz.
 * Uses 12-TET: f = 440 × 2^((midi − 69) / 12)
 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convert frequency in Hz to fractional MIDI note number.
 * Inverse of midiToFreq: n = 69 + 12 × log₂(f / 440)
 */
export function freqToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Note name + octave → MIDI note number.
 * Convention: C4 = 60, A4 = 69.
 * Formula: midi = (octave + 1) × 12 + pitchClass
 */
export function noteToMidi(name: NoteName, octave: number): number {
  const index = NOTE_NAMES.indexOf(name);
  if (index === -1) throw new Error(`Invalid note name: ${name}`);
  return (octave + 1) * 12 + index;
}

/**
 * MIDI note number → { name, octave }.
 */
export function midiToNote(midi: number): { name: NoteName; octave: number } {
  const index = ((midi % 12) + 12) % 12; // handle negatives
  const octave = Math.floor(midi / 12) - 1;
  return { name: NOTE_NAMES[index]!, octave };
}

/**
 * Get frequency of a named note. Shorthand for midiToFreq(noteToMidi(...)).
 */
export function noteFreq(name: NoteName, octave: number): number {
  return midiToFreq(noteToMidi(name, octave));
}

/* ── Scale Generation ── */

/**
 * Generate scale degrees as MIDI note numbers, starting from rootMidi.
 * Returns (intervals.length + 1) notes including the root.
 * For a 7-note scale, returns 8 notes (root through octave).
 */
export function getScaleMidi(rootMidi: number, scale: ScaleType): number[] {
  const intervals = SCALE_INTERVALS[scale];
  const notes: number[] = [rootMidi];
  let current = rootMidi;
  for (const interval of intervals) {
    current += interval;
    notes.push(current);
  }
  return notes;
}

/**
 * Generate scale as frequencies (Hz).
 */
export function getScaleFrequencies(rootMidi: number, scale: ScaleType): number[] {
  return getScaleMidi(rootMidi, scale).map(midiToFreq);
}

/**
 * Sum of all intervals in a scale — should equal 12 for octave-repeating scales.
 */
export function scaleIntervalSum(scale: ScaleType): number {
  return SCALE_INTERVALS[scale].reduce((sum, i) => sum + i, 0);
}

/* ── Chord Building ── */

/**
 * Build a chord as MIDI note numbers from a root.
 */
export function buildChordMidi(rootMidi: number, chord: ChordType): number[] {
  return CHORD_INTERVALS[chord].map(i => rootMidi + i);
}

/**
 * Build a chord as frequencies (Hz).
 */
export function buildChordFrequencies(rootMidi: number, chord: ChordType): number[] {
  return buildChordMidi(rootMidi, chord).map(midiToFreq);
}

/* ── Interval Calculation ── */

/**
 * Interval in semitones between two MIDI notes (absolute distance).
 */
export function intervalSemitones(a: number, b: number): number {
  return Math.abs(b - a);
}

/**
 * Transpose a MIDI note by semitones (positive = up, negative = down).
 */
export function transpose(midi: number, semitones: number): number {
  return midi + semitones;
}

/**
 * Calculate the interval in cents between two frequencies.
 * 100 cents = 1 semitone, 1200 cents = 1 octave.
 * Formula: cents = 1200 × log₂(f2 / f1)
 */
export function centsBetween(f1: number, f2: number): number {
  if (f1 <= 0 || f2 <= 0) return 0;
  return 1200 * Math.log2(f2 / f1);
}

/**
 * Frequency ratio between two notes separated by n semitones.
 * ratio = 2^(n/12)
 */
export function semitonesToRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/* ── BPM / Timing ── */

/**
 * BPM to milliseconds per beat (quarter note).
 * Formula: ms = 60000 / bpm
 */
export function bpmToMs(bpm: number): number {
  return 60000 / bpm;
}

/**
 * BPM to seconds per beat.
 */
export function bpmToSeconds(bpm: number): number {
  return 60 / bpm;
}

/**
 * Convert a number of beats to seconds at given BPM.
 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}

/**
 * Convert seconds to beats at given BPM.
 */
export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60;
}

/**
 * Swing timing: shift odd 8th-note subdivisions forward.
 * @param beatIndex - sequential beat index (0-based)
 * @param bpm - tempo
 * @param swingAmount - 0 = straight, 0.33 = triplet swing, 0.5 = max shuffle
 * @returns absolute time offset in seconds for this beat
 */
export function swingBeatTime(beatIndex: number, bpm: number, swingAmount: number): number {
  const beatDur = 60 / bpm;
  const base = beatIndex * beatDur;
  const isOdd = beatIndex % 2 === 1;
  return base + (isOdd ? beatDur * swingAmount : 0);
}

/**
 * Note duration name to fraction of a whole note (4 beats).
 */
export function noteDurationBeats(name: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'dotted_quarter' | 'dotted_half' | 'triplet_quarter'): number {
  const table: Record<string, number> = {
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25,
    dotted_quarter: 1.5,
    dotted_half: 3,
    triplet_quarter: 2 / 3,
  };
  return table[name] ?? 1;
}
