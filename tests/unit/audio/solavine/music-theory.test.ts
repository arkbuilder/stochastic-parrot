/**
 * SolavineSound — Music Theory Math Tests
 *
 * Verifies frequency calculations, scale generation, chord building,
 * interval math, and BPM timing conversions.
 * All functions are pure — no AudioContext needed.
 */
import { describe, it, expect } from 'vitest';
import {
  midiToFreq, freqToMidi, noteToMidi, midiToNote, noteFreq,
  getScaleMidi, getScaleFrequencies, scaleIntervalSum,
  buildChordMidi, buildChordFrequencies,
  intervalSemitones, transpose, centsBetween, semitonesToRatio,
  bpmToMs, bpmToSeconds, beatsToSeconds, secondsToBeats,
  swingBeatTime, noteDurationBeats,
  NOTE_NAMES, SCALE_INTERVALS, CHORD_INTERVALS,
} from '../../../../src/audio/solavine/music-theory';

/* ═══════════════════════════════════════════
 * Frequency / MIDI Conversion
 * ═══════════════════════════════════════════ */

describe('midiToFreq', () => {
  it('A4 (MIDI 69) = 440 Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 2);
  });

  it('C4 (MIDI 60) ≈ 261.63 Hz', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
  });

  it('A3 (MIDI 57) = 220 Hz (one octave below A4)', () => {
    expect(midiToFreq(57)).toBeCloseTo(220, 2);
  });

  it('A5 (MIDI 81) = 880 Hz (one octave above A4)', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 2);
  });

  it('octave relationship: freq doubles every 12 semitones', () => {
    const f60 = midiToFreq(60);
    const f72 = midiToFreq(72);
    expect(f72 / f60).toBeCloseTo(2.0, 6);
  });

  it('E4 (MIDI 64) ≈ 329.63 Hz', () => {
    expect(midiToFreq(64)).toBeCloseTo(329.63, 1);
  });

  it('G4 (MIDI 67) ≈ 392.00 Hz', () => {
    expect(midiToFreq(67)).toBeCloseTo(392.0, 1);
  });

  it('MIDI 0 produces a positive frequency', () => {
    expect(midiToFreq(0)).toBeGreaterThan(0);
    expect(midiToFreq(0)).toBeCloseTo(8.176, 2);
  });

  it('MIDI 127 produces a very high frequency', () => {
    expect(midiToFreq(127)).toBeCloseTo(12543.85, 0);
  });
});

describe('freqToMidi', () => {
  it('440 Hz → MIDI 69', () => {
    expect(freqToMidi(440)).toBeCloseTo(69, 6);
  });

  it('261.63 Hz → MIDI 60', () => {
    expect(freqToMidi(261.63)).toBeCloseTo(60, 1);
  });

  it('round-trip: midiToFreq → freqToMidi is identity', () => {
    for (const midi of [36, 48, 60, 69, 72, 84, 96]) {
      expect(freqToMidi(midiToFreq(midi))).toBeCloseTo(midi, 6);
    }
  });

  it('returns 0 for non-positive frequency', () => {
    expect(freqToMidi(0)).toBe(0);
    expect(freqToMidi(-100)).toBe(0);
  });
});

describe('noteToMidi', () => {
  it('C4 → 60', () => {
    expect(noteToMidi('C', 4)).toBe(60);
  });

  it('A4 → 69', () => {
    expect(noteToMidi('A', 4)).toBe(69);
  });

  it('C-1 → 0 (lowest MIDI)', () => {
    expect(noteToMidi('C', -1)).toBe(0);
  });

  it('G#3 → 56', () => {
    expect(noteToMidi('G#', 3)).toBe(56);
  });

  it('B4 → 71', () => {
    expect(noteToMidi('B', 4)).toBe(71);
  });

  it('F#6 → 90', () => {
    expect(noteToMidi('F#', 6)).toBe(90);
  });
});

describe('midiToNote', () => {
  it('60 → { name: C, octave: 4 }', () => {
    const { name, octave } = midiToNote(60);
    expect(name).toBe('C');
    expect(octave).toBe(4);
  });

  it('69 → { name: A, octave: 4 }', () => {
    const { name, octave } = midiToNote(69);
    expect(name).toBe('A');
    expect(octave).toBe(4);
  });

  it('round-trip: noteToMidi → midiToNote', () => {
    const result = midiToNote(noteToMidi('F#', 5));
    expect(result.name).toBe('F#');
    expect(result.octave).toBe(5);
  });
});

describe('noteFreq', () => {
  it('shorthand matches midiToFreq(noteToMidi(...))', () => {
    expect(noteFreq('C', 4)).toBeCloseTo(midiToFreq(60), 6);
    expect(noteFreq('A', 4)).toBeCloseTo(440, 6);
    expect(noteFreq('E', 3)).toBeCloseTo(midiToFreq(52), 6);
  });
});

/* ═══════════════════════════════════════════
 * Scale Generation
 * ═══════════════════════════════════════════ */

describe('SCALE_INTERVALS', () => {
  it('all 7-note scales sum to 12 (one octave)', () => {
    const sevenNoteScales = [
      'major', 'natural_minor', 'harmonic_minor', 'melodic_minor',
      'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
    ] as const;
    for (const scale of sevenNoteScales) {
      expect(scaleIntervalSum(scale)).toBe(12);
    }
  });

  it('pentatonic major sums to 12', () => {
    expect(scaleIntervalSum('pentatonic_major')).toBe(12);
  });

  it('pentatonic minor sums to 12', () => {
    expect(scaleIntervalSum('pentatonic_minor')).toBe(12);
  });

  it('blues scale sums to 12', () => {
    expect(scaleIntervalSum('blues')).toBe(12);
  });

  it('chromatic scale sums to 12', () => {
    expect(scaleIntervalSum('chromatic')).toBe(12);
  });

  it('major scale has 7 intervals', () => {
    expect(SCALE_INTERVALS.major).toHaveLength(7);
  });

  it('pentatonic scales have 5 intervals', () => {
    expect(SCALE_INTERVALS.pentatonic_major).toHaveLength(5);
    expect(SCALE_INTERVALS.pentatonic_minor).toHaveLength(5);
  });

  it('blues scale has 6 intervals', () => {
    expect(SCALE_INTERVALS.blues).toHaveLength(6);
  });

  it('chromatic scale has 12 intervals (all semitones)', () => {
    expect(SCALE_INTERVALS.chromatic).toHaveLength(12);
    for (const i of SCALE_INTERVALS.chromatic) {
      expect(i).toBe(1);
    }
  });
});

describe('getScaleMidi', () => {
  it('C major from C4 = [60, 62, 64, 65, 67, 69, 71, 72]', () => {
    const scale = getScaleMidi(60, 'major');
    expect(scale).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });

  it('A natural minor from A3 = [57, 59, 60, 62, 64, 65, 67, 69]', () => {
    const scale = getScaleMidi(57, 'natural_minor');
    expect(scale).toEqual([57, 59, 60, 62, 64, 65, 67, 69]);
  });

  it('scale ends one octave above root for 7-note scales', () => {
    const scale = getScaleMidi(48, 'major');
    expect(scale[scale.length - 1]).toBe(60);
  });

  it('pentatonic major returns 6 notes (5 intervals + root)', () => {
    expect(getScaleMidi(60, 'pentatonic_major')).toHaveLength(6);
  });

  it('D dorian from D4 contains the characteristic natural 6th', () => {
    const scale = getScaleMidi(62, 'dorian');
    // D dorian: D E F G A B C D
    // MIDI: 62 64 65 67 69 71 72 74
    expect(scale).toContain(71); // B natural (the dorian 6th)
  });
});

describe('getScaleFrequencies', () => {
  it('returns frequencies matching midiToFreq for each note', () => {
    const midis = getScaleMidi(60, 'major');
    const freqs = getScaleFrequencies(60, 'major');
    expect(freqs).toHaveLength(midis.length);
    for (let i = 0; i < freqs.length; i++) {
      expect(freqs[i]).toBeCloseTo(midiToFreq(midis[i]!), 4);
    }
  });
});

/* ═══════════════════════════════════════════
 * Chord Building
 * ═══════════════════════════════════════════ */

describe('CHORD_INTERVALS', () => {
  it('major chord = root + major 3rd + perfect 5th', () => {
    expect(CHORD_INTERVALS.major).toEqual([0, 4, 7]);
  });

  it('minor chord = root + minor 3rd + perfect 5th', () => {
    expect(CHORD_INTERVALS.minor).toEqual([0, 3, 7]);
  });

  it('diminished = root + minor 3rd + tritone', () => {
    expect(CHORD_INTERVALS.diminished).toEqual([0, 3, 6]);
  });

  it('augmented = root + major 3rd + augmented 5th', () => {
    expect(CHORD_INTERVALS.augmented).toEqual([0, 4, 8]);
  });

  it('all chords start with root (0)', () => {
    for (const intervals of Object.values(CHORD_INTERVALS)) {
      expect(intervals[0]).toBe(0);
    }
  });

  it('7th chords have 4 notes', () => {
    expect(CHORD_INTERVALS.major7).toHaveLength(4);
    expect(CHORD_INTERVALS.minor7).toHaveLength(4);
    expect(CHORD_INTERVALS.dominant7).toHaveLength(4);
    expect(CHORD_INTERVALS.diminished7).toHaveLength(4);
  });

  it('power chord has only root + 5th', () => {
    expect(CHORD_INTERVALS.power).toEqual([0, 7]);
  });
});

describe('buildChordMidi', () => {
  it('C major from C4 = [60, 64, 67]', () => {
    expect(buildChordMidi(60, 'major')).toEqual([60, 64, 67]);
  });

  it('A minor from A3 = [57, 60, 64]', () => {
    expect(buildChordMidi(57, 'minor')).toEqual([57, 60, 64]);
  });

  it('G7 from G4 = [67, 71, 74, 77]', () => {
    expect(buildChordMidi(67, 'dominant7')).toEqual([67, 71, 74, 77]);
  });

  it('D sus4 from D4 = [62, 67, 69]', () => {
    expect(buildChordMidi(62, 'sus4')).toEqual([62, 67, 69]);
  });
});

describe('buildChordFrequencies', () => {
  it('C major frequencies match expected values', () => {
    const freqs = buildChordFrequencies(60, 'major');
    expect(freqs[0]).toBeCloseTo(261.63, 1); // C4
    expect(freqs[1]).toBeCloseTo(329.63, 1); // E4
    expect(freqs[2]).toBeCloseTo(392.00, 0); // G4
  });
});

/* ═══════════════════════════════════════════
 * Interval Calculation
 * ═══════════════════════════════════════════ */

describe('intervalSemitones', () => {
  it('C4 to E4 = 4 semitones (major 3rd)', () => {
    expect(intervalSemitones(60, 64)).toBe(4);
  });

  it('C4 to G4 = 7 semitones (perfect 5th)', () => {
    expect(intervalSemitones(60, 67)).toBe(7);
  });

  it('is always positive (absolute value)', () => {
    expect(intervalSemitones(72, 60)).toBe(12);
  });

  it('unison = 0', () => {
    expect(intervalSemitones(69, 69)).toBe(0);
  });
});

describe('transpose', () => {
  it('C4 up 7 semitones = G4', () => {
    expect(transpose(60, 7)).toBe(67);
  });

  it('A4 down 12 semitones = A3', () => {
    expect(transpose(69, -12)).toBe(57);
  });

  it('transpose by 0 returns same note', () => {
    expect(transpose(60, 0)).toBe(60);
  });
});

describe('centsBetween', () => {
  it('octave = 1200 cents', () => {
    expect(centsBetween(220, 440)).toBeCloseTo(1200, 1);
  });

  it('semitone = 100 cents', () => {
    const f1 = midiToFreq(60);
    const f2 = midiToFreq(61);
    expect(centsBetween(f1, f2)).toBeCloseTo(100, 1);
  });

  it('unison = 0 cents', () => {
    expect(centsBetween(440, 440)).toBeCloseTo(0, 6);
  });

  it('returns 0 for non-positive frequencies', () => {
    expect(centsBetween(0, 440)).toBe(0);
    expect(centsBetween(440, 0)).toBe(0);
  });

  it('perfect 5th ≈ 702 cents', () => {
    const f1 = midiToFreq(60);
    const f2 = midiToFreq(67);
    expect(centsBetween(f1, f2)).toBeCloseTo(700, 0);
  });
});

describe('semitonesToRatio', () => {
  it('12 semitones = 2:1 ratio (octave)', () => {
    expect(semitonesToRatio(12)).toBeCloseTo(2.0, 6);
  });

  it('7 semitones = perfect 5th ratio ≈ 1.4983', () => {
    expect(semitonesToRatio(7)).toBeCloseTo(1.4983, 3);
  });

  it('0 semitones = 1:1', () => {
    expect(semitonesToRatio(0)).toBeCloseTo(1.0, 6);
  });

  it('negative semitones give ratio < 1', () => {
    expect(semitonesToRatio(-12)).toBeCloseTo(0.5, 6);
  });
});

/* ═══════════════════════════════════════════
 * BPM / Timing
 * ═══════════════════════════════════════════ */

describe('bpmToMs', () => {
  it('120 BPM = 500ms per beat', () => {
    expect(bpmToMs(120)).toBeCloseTo(500, 1);
  });

  it('60 BPM = 1000ms per beat', () => {
    expect(bpmToMs(60)).toBeCloseTo(1000, 1);
  });

  it('90 BPM ≈ 666.67ms per beat', () => {
    expect(bpmToMs(90)).toBeCloseTo(666.67, 0);
  });
});

describe('bpmToSeconds', () => {
  it('120 BPM = 0.5s per beat', () => {
    expect(bpmToSeconds(120)).toBeCloseTo(0.5, 6);
  });

  it('60 BPM = 1s per beat', () => {
    expect(bpmToSeconds(60)).toBeCloseTo(1.0, 6);
  });
});

describe('beatsToSeconds', () => {
  it('4 beats at 120 BPM = 2 seconds', () => {
    expect(beatsToSeconds(4, 120)).toBeCloseTo(2.0, 6);
  });

  it('16 beats at 90 BPM ≈ 10.667 seconds', () => {
    expect(beatsToSeconds(16, 90)).toBeCloseTo(10.667, 2);
  });

  it('1 beat at 60 BPM = exactly 1 second', () => {
    expect(beatsToSeconds(1, 60)).toBeCloseTo(1.0, 6);
  });
});

describe('secondsToBeats', () => {
  it('round-trip: beatsToSeconds → secondsToBeats', () => {
    expect(secondsToBeats(beatsToSeconds(4, 120), 120)).toBeCloseTo(4, 6);
  });

  it('2 seconds at 120 BPM = 4 beats', () => {
    expect(secondsToBeats(2, 120)).toBeCloseTo(4, 6);
  });
});

describe('swingBeatTime', () => {
  it('even beats are not swung', () => {
    expect(swingBeatTime(0, 120, 0.33)).toBeCloseTo(0, 6);
    expect(swingBeatTime(2, 120, 0.33)).toBeCloseTo(1.0, 6);
  });

  it('odd beats are pushed forward by swing amount', () => {
    const beatDur = 60 / 120; // 0.5s
    const swing = 0.33;
    // Beat 1: 1 * 0.5 + 0.5 * 0.33 = 0.665
    expect(swingBeatTime(1, 120, swing)).toBeCloseTo(0.5 + beatDur * swing, 6);
  });

  it('swing of 0 gives straight timing', () => {
    expect(swingBeatTime(1, 120, 0)).toBeCloseTo(0.5, 6);
    expect(swingBeatTime(3, 120, 0)).toBeCloseTo(1.5, 6);
  });
});

describe('noteDurationBeats', () => {
  it('whole = 4, half = 2, quarter = 1, eighth = 0.5', () => {
    expect(noteDurationBeats('whole')).toBe(4);
    expect(noteDurationBeats('half')).toBe(2);
    expect(noteDurationBeats('quarter')).toBe(1);
    expect(noteDurationBeats('eighth')).toBe(0.5);
    expect(noteDurationBeats('sixteenth')).toBe(0.25);
  });

  it('dotted quarter = 1.5 beats', () => {
    expect(noteDurationBeats('dotted_quarter')).toBeCloseTo(1.5, 6);
  });

  it('triplet quarter = 2/3 beat', () => {
    expect(noteDurationBeats('triplet_quarter')).toBeCloseTo(2 / 3, 6);
  });
});

/* ═══════════════════════════════════════════
 * Constants Integrity
 * ═══════════════════════════════════════════ */

describe('NOTE_NAMES', () => {
  it('has 12 note names', () => {
    expect(NOTE_NAMES).toHaveLength(12);
  });

  it('starts with C and ends with B', () => {
    expect(NOTE_NAMES[0]).toBe('C');
    expect(NOTE_NAMES[11]).toBe('B');
  });

  it('contains all chromatic notes', () => {
    const expected = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    expect([...NOTE_NAMES]).toEqual(expected);
  });
});
