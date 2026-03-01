/**
 * SolavineSound — Sequencer Math Tests
 *
 * Verifies pattern scheduling, timing math, beat-to-time conversion,
 * loop points, and event windowing — all pure math, no AudioContext.
 */
import { describe, it, expect } from 'vitest';
import {
  scheduleMelodicPattern,
  scheduleDrumPattern,
  patternDurationSeconds,
  computePatternBeatLength,
  validatePatternLength,
  maxDrumBeat,
  getEventsInWindow,
  metronomeIntervalMs,
  loopStartTime,
  songTotalDurationSeconds,
} from '../../../../src/audio/solavine/sequencer';
import type { MelodicPattern, DrumPattern, SongDefinition } from '../../../../src/audio/solavine/types';

/* ── Test Patterns ── */

const MELODY: MelodicPattern = {
  name: 'test_melody',
  instrument: 'triangle_smooth',
  lengthBeats: 4,
  notes: [
    { midi: 60, duration: 1, velocity: 0.8 },  // beat 0
    { midi: 64, duration: 1, velocity: 0.7 },  // beat 1
    { midi: 67, duration: 1, velocity: 0.9 },  // beat 2
    { midi: 72, duration: 1, velocity: 0.6 },  // beat 3
  ],
};

const DRUMS: DrumPattern = {
  name: 'test_drums',
  lengthBeats: 4,
  hits: [
    { drum: 'kick', beat: 0, velocity: 1.0 },
    { drum: 'hihat_closed', beat: 1, velocity: 0.6 },
    { drum: 'snare', beat: 2, velocity: 0.9 },
    { drum: 'hihat_closed', beat: 3, velocity: 0.6 },
  ],
};

const BPM = 120; // 0.5s per beat

/* ── scheduleMelodicPattern ── */

describe('scheduleMelodicPattern', () => {
  it('returns one event per note', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    expect(events).toHaveLength(4);
  });

  it('skips rest notes (midi = 0)', () => {
    const rest: MelodicPattern = {
      ...MELODY,
      notes: [
        { midi: 60, duration: 1, velocity: 0.8 },
        { midi: 0, duration: 1, velocity: 0 },
        { midi: 67, duration: 1, velocity: 0.9 },
        { midi: 0, duration: 1, velocity: 0 },
      ],
    };
    const events = scheduleMelodicPattern(rest, BPM, 0);
    expect(events).toHaveLength(2);
  });

  it('computes correct start times at 120 BPM', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    expect(events[0]!.time).toBeCloseTo(0, 4);
    expect(events[1]!.time).toBeCloseTo(0.5, 4);
    expect(events[2]!.time).toBeCloseTo(1.0, 4);
    expect(events[3]!.time).toBeCloseTo(1.5, 4);
  });

  it('respects startTime offset', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 5.0);
    expect(events[0]!.time).toBeCloseTo(5.0, 4);
    expect(events[1]!.time).toBeCloseTo(5.5, 4);
  });

  it('converts MIDI to frequency', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    // C4 = 261.626Hz
    expect(events[0]!.freq).toBeCloseTo(261.626, 1);
    // E4 = 329.628Hz
    expect(events[1]!.freq).toBeCloseTo(329.628, 1);
  });

  it('converts beat duration to seconds', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    // 1 beat at 120 BPM = 0.5s
    expect(events[0]!.durationS).toBeCloseTo(0.5, 4);
  });

  it('preserves velocity', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    expect(events[0]!.velocity).toBe(0.8);
    expect(events[2]!.velocity).toBe(0.9);
  });

  it('preserves instrument reference', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    expect(events[0]!.instrument).toBe('triangle_smooth');
  });

  it('handles fractional durations', () => {
    const half: MelodicPattern = {
      ...MELODY,
      notes: [{ midi: 60, duration: 0.5, velocity: 0.8 }],
    };
    const events = scheduleMelodicPattern(half, BPM, 0);
    expect(events[0]!.durationS).toBeCloseTo(0.25, 4);
  });
});

/* ── scheduleDrumPattern ── */

describe('scheduleDrumPattern', () => {
  it('returns one event per hit', () => {
    const events = scheduleDrumPattern(DRUMS, BPM, 0);
    expect(events).toHaveLength(4);
  });

  it('computes correct hit times at 120 BPM', () => {
    const events = scheduleDrumPattern(DRUMS, BPM, 0);
    expect(events[0]!.time).toBeCloseTo(0, 4);
    expect(events[1]!.time).toBeCloseTo(0.5, 4);
    expect(events[2]!.time).toBeCloseTo(1.0, 4);
    expect(events[3]!.time).toBeCloseTo(1.5, 4);
  });

  it('respects startTime offset', () => {
    const events = scheduleDrumPattern(DRUMS, BPM, 3.0);
    expect(events[0]!.time).toBeCloseTo(3.0, 4);
    expect(events[1]!.time).toBeCloseTo(3.5, 4);
  });

  it('preserves drum name and velocity', () => {
    const events = scheduleDrumPattern(DRUMS, BPM, 0);
    expect(events[0]!.drum).toBe('kick');
    expect(events[0]!.velocity).toBe(1.0);
    expect(events[2]!.drum).toBe('snare');
    expect(events[2]!.velocity).toBe(0.9);
  });

  it('handles fractional beat positions', () => {
    const swing: DrumPattern = {
      name: 'swing_hits',
      lengthBeats: 2,
      hits: [
        { drum: 'hihat_closed', beat: 0.5, velocity: 0.5 },
        { drum: 'hihat_closed', beat: 1.5, velocity: 0.5 },
      ],
    };
    const events = scheduleDrumPattern(swing, BPM, 0);
    expect(events[0]!.time).toBeCloseTo(0.25, 4);
    expect(events[1]!.time).toBeCloseTo(0.75, 4);
  });
});

/* ── patternDurationSeconds ── */

describe('patternDurationSeconds', () => {
  it('4 beats at 120 BPM = 2 seconds', () => {
    expect(patternDurationSeconds(MELODY.lengthBeats, BPM)).toBeCloseTo(2.0, 4);
  });

  it('4 beats at 60 BPM = 4 seconds', () => {
    expect(patternDurationSeconds(MELODY.lengthBeats, 60)).toBeCloseTo(4.0, 4);
  });

  it('16 beats at 120 BPM = 8 seconds', () => {
    expect(patternDurationSeconds(16, BPM)).toBeCloseTo(8.0, 4);
  });

  it('works for drum patterns', () => {
    expect(patternDurationSeconds(DRUMS.lengthBeats, BPM)).toBeCloseTo(2.0, 4);
  });
});

/* ── computePatternBeatLength ── */

describe('computePatternBeatLength', () => {
  it('sums note durations for melodic pattern', () => {
    expect(computePatternBeatLength(MELODY.notes)).toBe(4);
  });

  it('handles empty notes', () => {
    expect(computePatternBeatLength([])).toBe(0);
  });

  it('handles fractional durations', () => {
    const notes = [
      { midi: 60, duration: 0.5, velocity: 0.8 },
      { midi: 64, duration: 0.5, velocity: 0.7 },
      { midi: 67, duration: 1.0, velocity: 0.9 },
    ];
    expect(computePatternBeatLength(notes)).toBeCloseTo(2.0, 4);
  });
});

/* ── validatePatternLength ── */

describe('validatePatternLength', () => {
  it('returns valid=true when computed length matches declared length', () => {
    const result = validatePatternLength(MELODY);
    expect(result.valid).toBe(true);
    expect(result.actual).toBe(4);
    expect(result.declared).toBe(4);
  });

  it('returns valid=false when lengths do not match', () => {
    const bad: MelodicPattern = { ...MELODY, lengthBeats: 8 };
    const result = validatePatternLength(bad);
    expect(result.valid).toBe(false);
    expect(result.actual).toBe(4);
    expect(result.declared).toBe(8);
  });
});

/* ── maxDrumBeat ── */

describe('maxDrumBeat', () => {
  it('returns the highest beat value across hits', () => {
    expect(maxDrumBeat(DRUMS)).toBe(3);
  });

  it('returns 0 for empty pattern', () => {
    const empty: DrumPattern = { ...DRUMS, hits: [] };
    expect(maxDrumBeat(empty)).toBe(0);
  });

  it('handles fractional beats', () => {
    const frac: DrumPattern = {
      ...DRUMS,
      hits: [
        { drum: 'kick', beat: 0, velocity: 1 },
        { drum: 'snare', beat: 3.5, velocity: 0.8 },
      ],
    };
    expect(maxDrumBeat(frac)).toBe(3.5);
  });
});

/* ── getEventsInWindow ── */

describe('getEventsInWindow', () => {
  it('returns events within [start, end) window', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    // Window 0.0–1.0: beats 0 and 1 (times 0.0 and 0.5)
    const window = getEventsInWindow(events, 0, 1.0);
    expect(window).toHaveLength(2);
  });

  it('excludes events at window end (half-open)', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    // Window 0.0–0.5: only beat 0 (time 0.0), beat 1 at 0.5 excluded
    const window = getEventsInWindow(events, 0, 0.5);
    expect(window).toHaveLength(1);
  });

  it('includes events at window start', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    const window = getEventsInWindow(events, 0.5, 1.5);
    expect(window).toHaveLength(2); // beats 1 and 2
    expect(window[0]!.time).toBeCloseTo(0.5, 4);
  });

  it('returns empty array when no events in window', () => {
    const events = scheduleMelodicPattern(MELODY, BPM, 0);
    const window = getEventsInWindow(events, 10, 20);
    expect(window).toHaveLength(0);
  });
});

/* ── metronomeIntervalMs ── */

describe('metronomeIntervalMs', () => {
  it('120 BPM = 500ms', () => {
    expect(metronomeIntervalMs(120)).toBeCloseTo(500, 4);
  });

  it('60 BPM = 1000ms', () => {
    expect(metronomeIntervalMs(60)).toBeCloseTo(1000, 4);
  });

  it('90 BPM ≈ 666.67ms', () => {
    expect(metronomeIntervalMs(90)).toBeCloseTo(666.667, 1);
  });
});

/* ── loopStartTime ── */

describe('loopStartTime', () => {
  it('computes correct loop restart for a 4-beat pattern at 120 BPM', () => {
    // 4 beats at 120 BPM = 2s per loop
    // loopStartTime(currentStart, lengthBeats, bpm) = currentStart + duration
    // Loop 1 starts at: 0 + 2 = 2
    expect(loopStartTime(0, MELODY.lengthBeats, BPM)).toBeCloseTo(2.0, 4);
    // Loop 2 starts at: 2 + 2 = 4
    expect(loopStartTime(2.0, MELODY.lengthBeats, BPM)).toBeCloseTo(4.0, 4);
  });

  it('works with different BPM', () => {
    // 4 beats at 60 BPM = 4s per loop
    // Loop 1 starts at: 0 + 4 = 4
    expect(loopStartTime(0, MELODY.lengthBeats, 60)).toBeCloseTo(4.0, 4);
  });
});

/* ── songTotalDurationSeconds ── */

describe('songTotalDurationSeconds', () => {
  it('is the maximum track length in seconds', () => {
    const song: SongDefinition = {
      name: 'test_song',
      bpm: 120,
      key: 'C',
      scale: 'major',
      beatsPerMeasure: 4,
      loop: false,
      melody: { ...MELODY, lengthBeats: 8 },
      harmony: { ...MELODY, lengthBeats: 4 },
      bass: { ...MELODY, lengthBeats: 8 },
      drums: { ...DRUMS, lengthBeats: 4 },
    };
    // Max track = 8 beats at 120 BPM = 4 seconds
    expect(songTotalDurationSeconds(song)).toBeCloseTo(4.0, 4);
  });

  it('returns 0 for zero-length song', () => {
    const song: SongDefinition = {
      name: 'empty',
      bpm: 120,
      key: 'C',
      scale: 'major',
      beatsPerMeasure: 4,
      loop: false,
      melody: { ...MELODY, lengthBeats: 0 },
      harmony: { ...MELODY, lengthBeats: 0 },
      bass: { ...MELODY, lengthBeats: 0 },
      drums: { ...DRUMS, lengthBeats: 0 },
    };
    expect(songTotalDurationSeconds(song)).toBeCloseTo(0, 4);
  });
});
