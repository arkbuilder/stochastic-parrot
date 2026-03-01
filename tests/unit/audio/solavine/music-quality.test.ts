import { describe, expect, it } from 'vitest';
import { ALL_SONGS } from '../../../../src/audio/solavine/island-songs';
import type { PatternNote, SongDefinition } from '../../../../src/audio/solavine/types';

function pitchedNotes(notes: PatternNote[]): PatternNote[] {
  return notes.filter((n) => n.midi > 0);
}

function motifRecurrenceSignal(notes: PatternNote[]): number {
  const pitched = pitchedNotes(notes);
  if (pitched.length < 4) return 0;

  // Blend a transposition-invariant interval signal and a concrete pitch-class signal.
  const intervals: number[] = [];
  for (let i = 0; i < pitched.length - 1; i++) {
    intervals.push(pitched[i + 1].midi - pitched[i].midi);
  }
  const pitchClasses = pitched.map((n) => n.midi % 12);

  const recurrence = (arr: number[], n: number): number => {
    if (arr.length < n) return 0;
    const seen = new Map<string, number>();
    for (let i = 0; i <= arr.length - n; i++) {
      const key = arr.slice(i, i + n).join(',');
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const windows = arr.length - n + 1;
    const recurringWindows = Array.from(seen.values())
      .filter((count) => count >= 2)
      .reduce((sum, count) => sum + count, 0);
    return recurringWindows / windows;
  };

  return Math.max(recurrence(intervals, 2), recurrence(intervals, 3), recurrence(pitchClasses, 3));
}

function noteDensityPerBeat(notes: PatternNote[], lengthBeats: number): number {
  if (lengthBeats <= 0) return 0;
  return pitchedNotes(notes).length / lengthBeats;
}

function rhythmicVarietyScore(notes: PatternNote[]): number {
  if (notes.length === 0) return 0;
  const values = notes.map((n) => n.duration);
  return new Set(values).size / values.length;
}

function longestMonotonicRun(notes: PatternNote[]): number {
  const pitched = pitchedNotes(notes);
  if (pitched.length < 3) return pitched.length;

  let longest = 1;
  let current = 1;
  let direction: -1 | 0 | 1 = 0;

  for (let i = 1; i < pitched.length; i++) {
    const diff = pitched[i].midi - pitched[i - 1].midi;
    const nextDirection: -1 | 0 | 1 = diff === 0 ? 0 : diff > 0 ? 1 : -1;

    if (nextDirection === direction && nextDirection !== 0) {
      current += 1;
    } else {
      current = nextDirection === 0 ? 1 : 2;
      direction = nextDirection;
    }

    longest = Math.max(longest, current);
  }

  return longest;
}

function cadenceBoundaryScore(song: SongDefinition, phraseBeats = 4): number {
  const notes = song.melody.notes;
  const total = song.melody.lengthBeats;
  if (total <= phraseBeats) return 1;

  // At each phrase boundary, look for a nearby melodic event transition.
  // A healthy cadence tends to have at least one of:
  // 1) a rest near boundary, 2) a downward motion, 3) a controlled leap.
  let passing = 0;
  let checked = 0;

  for (let boundary = phraseBeats; boundary < total; boundary += phraseBeats) {
    let t = 0;
    let prev: PatternNote | undefined;
    let next: PatternNote | undefined;

    for (const note of notes) {
      const start = t;
      const end = t + note.duration;

      if (end <= boundary) prev = note;
      if (start >= boundary && !next) next = note;

      t = end;
    }

    if (!prev || !next) continue;
    checked += 1;

    const hasRestNearBoundary = prev.midi === 0 || next.midi === 0;
    const melodicMotion = prev.midi > 0 && next.midi > 0 ? next.midi - prev.midi : 0;
    const isDownward = melodicMotion < 0;
    const isControlledLeap = Math.abs(melodicMotion) <= 7;

    if (hasRestNearBoundary || isDownward || isControlledLeap) passing += 1;
  }

  return checked > 0 ? passing / checked : 1;
}

const REQUIRED_SONGS = ['overworld', 'island_01', 'combat'] as const;

describe('Solavine song quality metrics', () => {
  it('includes required focus songs and validates all songs', () => {
    for (const id of REQUIRED_SONGS) {
      expect(ALL_SONGS[id]).toBeDefined();
    }
    expect(Object.keys(ALL_SONGS).length).toBeGreaterThanOrEqual(REQUIRED_SONGS.length);
  });

  it('has motif recurrence signal in melody (interval + pitch-class n-grams)', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      const signal = motifRecurrenceSignal(song.melody.notes);
      // Too low means random/noisy; too high means one tiny loop repeated endlessly.
      expect(signal, `${id} motif recurrence too low`).toBeGreaterThanOrEqual(0.08);
      expect(signal, `${id} motif recurrence too high`).toBeLessThanOrEqual(0.95);
    }
  });

  it('keeps melody and drum density in practical bounds', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      const melodyDensity = noteDensityPerBeat(song.melody.notes, song.melody.lengthBeats);
      const drumDensity = song.drums.hits.length / song.drums.lengthBeats;

      // Melody: avoid barren lines and machine-gun spam.
      expect(melodyDensity, `${id} melody too sparse`).toBeGreaterThanOrEqual(0.55);
      expect(melodyDensity, `${id} melody too dense`).toBeLessThanOrEqual(2.25);

      // Drums: avoid dead groove and overfilled percussion grid.
      expect(drumDensity, `${id} drums too sparse`).toBeGreaterThanOrEqual(0.9);
      expect(drumDensity, `${id} drums too dense`).toBeLessThanOrEqual(5.0);
    }
  });

  it('has rhythmic variety in melody and drums', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      const melodyRhythmVariety = rhythmicVarietyScore(song.melody.notes);
      const drumEventVariety = new Set(song.drums.hits.map((h) => h.beat % 1)).size;

      // Melody durations should not collapse into a single duration value.
      expect(melodyRhythmVariety, `${id} melody rhythm variety too low`).toBeGreaterThanOrEqual(0.08);

      // Drums should use at least 1 subdivision style (integer beats only is allowed for calmer tracks),
      // and fast tracks should usually introduce finer placement.
      expect(drumEventVariety, `${id} drum subdivision variety missing`).toBeGreaterThanOrEqual(1);
      if (id === 'combat' || id === 'island_03') {
        expect(drumEventVariety, `${id} should have finer drum subdivisions`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('avoids overly long monotonic contours', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      const run = longestMonotonicRun(song.melody.notes);
      // Long strictly up/down runs feel scale-drill-ish and less memorable.
      expect(run, `${id} monotonic contour run too long`).toBeLessThanOrEqual(9);
    }
  });

  it('has cadence sanity around phrase boundaries', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      const score = cadenceBoundaryScore(song, song.beatsPerMeasure);
      // Require most phrase boundaries to include a sensible transition signal.
      expect(score, `${id} cadence boundary score too low`).toBeGreaterThanOrEqual(0.33);
    }
  });
});
