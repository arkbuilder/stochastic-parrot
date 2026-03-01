/**
 * SolavineSound — Fanfares
 *
 * Short stingers and fanfares for victories, achievements, and transitions.
 * These are non-looping songs (loop: false) with a single pass.
 *
 * Fanfare types:
 *   - Victory Short (1.5s) — encounter complete
 *   - Victory Grand (3s) — island complete
 *   - Achievement (2.5s) — title/milestone earned
 *   - Game Over (2s) — session end (not punishing)
 */

import type { SongDefinition } from './types';

/* ── Helpers ── */

function n(midi: number, duration: number, velocity = 0.9) {
  return { midi, duration, velocity };
}
function r(duration: number) {
  return { midi: 0, duration, velocity: 0 };
}

/* ═══════════════════════════════════════════
 * VICTORY SHORT — ~1.5s at 160 BPM = 4 beats
 * C major, bright ascending fanfare
 * ═══════════════════════════════════════════ */

export const VICTORY_SHORT: SongDefinition = {
  name: 'Victory (Short)',
  bpm: 160,
  key: 'C',
  scale: 'major',
  beatsPerMeasure: 4,
  loop: false,

  melody: {
    name: 'vic_short_melody',
    instrument: 'triangle_smooth',
    lengthBeats: 4,
    notes: [
      n(72, 0.5), n(76, 0.5), n(79, 0.5), n(84, 1.5), r(1),
    ],
  },

  harmony: {
    name: 'vic_short_harmony',
    instrument: 'pulse_hollow',
    lengthBeats: 4,
    notes: [
      n(60, 0.5), n(64, 0.5), n(67, 0.5), n(72, 1.5), r(1),
    ],
  },

  bass: {
    name: 'vic_short_bass',
    instrument: 'sine_pure',
    lengthBeats: 4,
    notes: [
      n(36, 2), n(43, 2),
    ],
  },

  drums: {
    name: 'vic_short_drums',
    lengthBeats: 4,
    hits: [
      { drum: 'snare', beat: 0, velocity: 0.6 },
      { drum: 'snare', beat: 0.5, velocity: 0.7 },
      { drum: 'crash', beat: 1.5, velocity: 0.8 },
      { drum: 'kick', beat: 1.5, velocity: 0.9 },
    ],
  },
};

/* ═══════════════════════════════════════════
 * VICTORY GRAND — ~3s at 120 BPM = 6 beats
 * C major, fuller orchestral feel
 * ═══════════════════════════════════════════ */

export const VICTORY_GRAND: SongDefinition = {
  name: 'Victory (Grand)',
  bpm: 120,
  key: 'C',
  scale: 'major',
  beatsPerMeasure: 4,
  loop: false,

  melody: {
    name: 'vic_grand_melody',
    instrument: 'vibrato_lead',
    lengthBeats: 8,
    notes: [
      // Heroic ascending triads
      n(60, 0.5), n(64, 0.5), n(67, 0.5), r(0.5),
      n(72, 0.5), n(76, 0.5), n(79, 0.5), r(0.5),
      n(84, 2), n(79, 1), n(84, 1),
    ],
  },

  harmony: {
    name: 'vic_grand_harmony',
    instrument: 'detuned_chorus',
    lengthBeats: 8,
    notes: [
      n(48, 2), n(52, 2),
      n(55, 2), n(60, 2),
    ],
  },

  bass: {
    name: 'vic_grand_bass',
    instrument: 'sine_pure',
    lengthBeats: 8,
    notes: [
      n(36, 4), n(43, 4),
    ],
  },

  drums: {
    name: 'vic_grand_drums',
    lengthBeats: 8,
    hits: [
      { drum: 'kick', beat: 0, velocity: 0.7 },
      { drum: 'snare', beat: 1, velocity: 0.5 },
      { drum: 'snare', beat: 1.5, velocity: 0.6 },
      { drum: 'snare', beat: 2, velocity: 0.7 },
      { drum: 'crash', beat: 4, velocity: 0.9 },
      { drum: 'kick', beat: 4, velocity: 0.9 },
      { drum: 'tom_high', beat: 6, velocity: 0.5 },
      { drum: 'crash', beat: 7, velocity: 0.7 },
    ],
  },
};

/* ═══════════════════════════════════════════
 * ACHIEVEMENT — ~2.5s at 120 BPM = 5 beats
 * G major, triumphant ascending
 * ═══════════════════════════════════════════ */

export const ACHIEVEMENT_FANFARE: SongDefinition = {
  name: 'Achievement Fanfare',
  bpm: 120,
  key: 'G',
  scale: 'major',
  beatsPerMeasure: 4,
  loop: false,

  melody: {
    name: 'achieve_melody',
    instrument: 'triangle_smooth',
    lengthBeats: 6,
    notes: [
      n(67, 0.5), n(71, 0.5), n(74, 0.5), n(79, 0.5),
      n(83, 1.5), n(79, 0.5), n(83, 2),
    ],
  },

  harmony: {
    name: 'achieve_harmony',
    instrument: 'fm_bell',
    lengthBeats: 6,
    notes: [
      n(55, 1.5), n(59, 0.5),
      n(67, 2), n(71, 2),
    ],
  },

  bass: {
    name: 'achieve_bass',
    instrument: 'sine_pure',
    lengthBeats: 6,
    notes: [
      n(43, 3), n(47, 3),
    ],
  },

  drums: {
    name: 'achieve_drums',
    lengthBeats: 6,
    hits: [
      { drum: 'kick', beat: 0, velocity: 0.6 },
      { drum: 'rim', beat: 0.5, velocity: 0.4 },
      { drum: 'rim', beat: 1, velocity: 0.5 },
      { drum: 'crash', beat: 2, velocity: 0.8 },
      { drum: 'kick', beat: 2, velocity: 0.8 },
    ],
  },
};

/* ═══════════════════════════════════════════
 * GAME OVER — ~2s at 90 BPM = 3 beats
 * A minor, gentle descending (not punishing)
 * ═══════════════════════════════════════════ */

export const GAME_OVER_STINGER: SongDefinition = {
  name: 'Game Over',
  bpm: 90,
  key: 'A',
  scale: 'natural_minor',
  beatsPerMeasure: 4,
  loop: false,

  melody: {
    name: 'gameover_melody',
    instrument: 'filtered_pad',
    lengthBeats: 4,
    notes: [
      n(69, 1), n(67, 1), n(64, 1), n(60, 1),
    ],
  },

  harmony: {
    name: 'gameover_harmony',
    instrument: 'sine_pure',
    lengthBeats: 4,
    notes: [
      n(57, 2), n(48, 2),
    ],
  },

  bass: {
    name: 'gameover_bass',
    instrument: 'sine_pure',
    lengthBeats: 4,
    notes: [
      n(45, 4),
    ],
  },

  drums: {
    name: 'gameover_drums',
    lengthBeats: 4,
    hits: [
      { drum: 'tom_low', beat: 0, velocity: 0.4 },
      { drum: 'tom_low', beat: 2, velocity: 0.3 },
    ],
  },
};

/* ── Fanfare Registry ── */

export const ALL_FANFARES: Record<string, SongDefinition> = {
  victory_short: VICTORY_SHORT,
  victory_grand: VICTORY_GRAND,
  achievement: ACHIEVEMENT_FANFARE,
  game_over: GAME_OVER_STINGER,
};

export function getFanfare(id: string): SongDefinition | undefined {
  return ALL_FANFARES[id];
}

export function getFanfareIds(): string[] {
  return Object.keys(ALL_FANFARES);
}
