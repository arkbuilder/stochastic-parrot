/**
 * SolavineSound — Sequencer
 *
 * Pure timing math for pattern-based music playback.
 * Converts musical patterns (beats) to absolute wall-clock times.
 * No Web Audio dependency — all functions are deterministic and testable.
 */

import type { MelodicPattern, DrumPattern, DrumHit, SongDefinition } from './types';
import { midiToFreq, beatsToSeconds, bpmToMs, bpmToSeconds } from './music-theory';

/* ── Scheduled Event Types ── */

export interface ScheduledNote {
  /** Absolute time in seconds */
  time: number;
  /** Frequency in Hz (0 = rest) */
  freq: number;
  /** Duration in seconds */
  durationS: number;
  /** Velocity 0–1 */
  velocity: number;
  /** Instrument preset name */
  instrument: string;
}

export interface ScheduledDrumHit {
  /** Absolute time in seconds */
  time: number;
  /** Drum preset name */
  drum: string;
  /** Velocity 0–1 */
  velocity: number;
}

/* ── Pattern Timing ── */

/**
 * Convert a melodic pattern to scheduled notes at absolute times.
 *
 * @param pattern - The melodic pattern to schedule
 * @param bpm - Tempo
 * @param startTime - Absolute time offset for first note (seconds)
 * @returns Array of scheduled notes with absolute times and frequencies
 */
export function scheduleMelodicPattern(
  pattern: MelodicPattern,
  bpm: number,
  startTime: number,
): ScheduledNote[] {
  const notes: ScheduledNote[] = [];
  let beatPos = 0;

  for (const note of pattern.notes) {
    if (note.midi > 0) {
      notes.push({
        time: startTime + beatsToSeconds(beatPos, bpm),
        freq: midiToFreq(note.midi),
        durationS: beatsToSeconds(note.duration, bpm),
        velocity: note.velocity,
        instrument: pattern.instrument,
      });
    }
    beatPos += note.duration;
  }

  return notes;
}

/**
 * Convert a drum pattern to scheduled hits at absolute times.
 */
export function scheduleDrumPattern(
  pattern: DrumPattern,
  bpm: number,
  startTime: number,
): ScheduledDrumHit[] {
  return pattern.hits.map(hit => ({
    time: startTime + beatsToSeconds(hit.beat, bpm),
    drum: hit.drum,
    velocity: hit.velocity,
  }));
}

/**
 * Pattern duration in seconds at given BPM.
 */
export function patternDurationSeconds(lengthBeats: number, bpm: number): number {
  return beatsToSeconds(lengthBeats, bpm);
}

/**
 * Schedule a full song (all 4 tracks) for one loop iteration.
 */
export function scheduleFullSong(
  song: SongDefinition,
  startTime: number,
): {
  melody: ScheduledNote[];
  harmony: ScheduledNote[];
  bass: ScheduledNote[];
  drums: ScheduledDrumHit[];
  durationS: number;
} {
  return {
    melody: scheduleMelodicPattern(song.melody, song.bpm, startTime),
    harmony: scheduleMelodicPattern(song.harmony, song.bpm, startTime),
    bass: scheduleMelodicPattern(song.bass, song.bpm, startTime),
    drums: scheduleDrumPattern(song.drums, song.bpm, startTime),
    durationS: patternDurationSeconds(song.melody.lengthBeats, song.bpm),
  };
}

/**
 * Compute the loop point: when the next iteration of a looping song should start.
 */
export function loopStartTime(
  currentLoopStart: number,
  lengthBeats: number,
  bpm: number,
): number {
  return currentLoopStart + patternDurationSeconds(lengthBeats, bpm);
}

/**
 * Compute the number of beats consumed by a pattern's notes.
 * Should equal pattern.lengthBeats if the pattern is properly defined.
 */
export function computePatternBeatLength(notes: Array<{ duration: number }>): number {
  return notes.reduce((sum, n) => sum + n.duration, 0);
}

/**
 * Validate that a pattern's notes' total duration matches the declared length.
 */
export function validatePatternLength(pattern: MelodicPattern): { valid: boolean; actual: number; declared: number } {
  const actual = computePatternBeatLength(pattern.notes);
  return { valid: Math.abs(actual - pattern.lengthBeats) < 0.001, actual, declared: pattern.lengthBeats };
}

/**
 * Find the maximum beat position used in a drum pattern.
 * Should not exceed pattern.lengthBeats.
 */
export function maxDrumBeat(pattern: DrumPattern): number {
  if (pattern.hits.length === 0) return 0;
  return Math.max(...pattern.hits.map(h => h.beat));
}

/**
 * Generate a look-ahead scheduling window for real-time playback.
 * Returns events within [now, now + lookahead].
 */
export function getEventsInWindow<T extends { time: number }>(
  events: T[],
  windowStart: number,
  windowEnd: number,
): T[] {
  return events.filter(e => e.time >= windowStart && e.time < windowEnd);
}

/**
 * BPM to metronome click interval in ms. Convenience for UI.
 */
export function metronomeIntervalMs(bpm: number): number {
  return bpmToMs(bpm);
}

/**
 * Calculate total song duration including all tracks.
 * Uses the longest track's declared length.
 */
export function songTotalDurationSeconds(song: SongDefinition): number {
  const maxBeats = Math.max(
    song.melody.lengthBeats,
    song.harmony.lengthBeats,
    song.bass.lengthBeats,
    song.drums.lengthBeats,
  );
  return beatsToSeconds(maxBeats, song.bpm);
}
