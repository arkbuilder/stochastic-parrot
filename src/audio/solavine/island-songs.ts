/**
 * SolavineSound — Island Songs
 *
 * 7 complete song definitions:
 *   - 5 per-island themes (per AudioDirection.md key/BPM specifications)
 *   - 1 overworld sea shanty
 *   - 1 combat theme
 *
 * Each song has 4 tracks: melody, harmony, bass, drums.
 * All patterns are loopable and defined in MIDI note numbers.
 *
 * MIDI reference:
 *   C4=60  D4=62  E4=64  F4=65  G4=67  A4=69  B4=71
 *   C5=72  D5=74  E5=76  F5=77  G5=79  A5=81
 *   C3=48  E3=52  G3=55  A3=57  Bb3=58  B3=59
 *   C2=36  D2=38  E2=40  F2=41  G2=43  A2=45
 */

import type { SongDefinition, PatternNote, DrumHit } from './types';

/* ── Helpers ── */

/** Shorthand for a note */
function n(midi: number, duration: number, velocity = 0.8): PatternNote {
  return { midi, duration, velocity };
}

/** Rest (silent beat) */
function r(duration: number): PatternNote {
  return { midi: 0, duration, velocity: 0 };
}

/* ═══════════════════════════════════════════
 * ISLAND 1 — Bay of Learning
 * C major, 90 BPM, gentle & exploratory
 * ═══════════════════════════════════════════ */

export const ISLAND_01_BAY_OF_LEARNING: SongDefinition = {
  name: 'Bay of Learning',
  bpm: 90,
  key: 'C',
  scale: 'major',
  beatsPerMeasure: 4,
  loop: true,

  melody: {
    name: 'bay_melody',
    instrument: 'triangle_smooth',
    lengthBeats: 16,
    notes: [
      // Measure 1: gentle ascending C major
      n(60, 1), n(64, 1), n(67, 1), n(69, 1),
      // Measure 2: peak and gentle descent
      n(67, 1), n(64, 1), n(62, 1), n(60, 1),
      // Measure 3: variation — push to high C
      n(64, 1), n(67, 1), n(69, 1), n(72, 1),
      // Measure 4: resolve back down
      n(69, 1), n(67, 1), n(64, 0.5), n(62, 0.5), n(60, 1),
    ],
  },

  harmony: {
    name: 'bay_harmony',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      // Sustained chord arpeggios (C major → F major → G major → C major)
      n(48, 2), n(52, 2),   // C3, E3
      n(53, 2), n(57, 2),   // F3, A3
      n(55, 2), n(59, 2),   // G3, B3
      n(48, 2), n(52, 2),   // C3, E3
    ],
  },

  bass: {
    name: 'bay_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      // Root notes — C, F, G, C
      n(36, 4),  // C2
      n(41, 4),  // F2
      n(43, 4),  // G2
      n(36, 4),  // C2
    ],
  },

  drums: {
    name: 'bay_drums',
    lengthBeats: 16,
    hits: [
      // Gentle: kick on 1, hihat on every beat
      ...Array.from({ length: 4 }, (_, m) => [
        { drum: 'kick', beat: m * 4, velocity: 0.5 },
        { drum: 'hihat_closed', beat: m * 4 + 1, velocity: 0.3 },
        { drum: 'hihat_closed', beat: m * 4 + 2, velocity: 0.3 },
        { drum: 'hihat_closed', beat: m * 4 + 3, velocity: 0.3 },
      ]).flat(),
    ],
  },
};

/* ═══════════════════════════════════════════
 * ISLAND 2 — Driftwood Shallows
 * D minor, 100 BPM, rolling wave-like motion
 * ═══════════════════════════════════════════ */

export const ISLAND_02_DRIFTWOOD_SHALLOWS: SongDefinition = {
  name: 'Driftwood Shallows',
  bpm: 100,
  key: 'D',
  scale: 'natural_minor',
  beatsPerMeasure: 4,
  loop: true,

  melody: {
    name: 'drift_melody',
    instrument: 'pulse_hollow',
    lengthBeats: 16,
    notes: [
      // Measure 1: rising like a wave
      n(62, 1), n(65, 1), n(69, 1), n(67, 1),
      // Measure 2: falling back
      n(65, 1), n(64, 1), n(62, 0.5), n(60, 0.5), n(62, 1),
      // Measure 3: second wave, higher
      n(65, 1), n(69, 1), n(72, 1), n(69, 1),
      // Measure 4: settle down
      n(67, 1), n(65, 0.5), n(64, 0.5), n(62, 2),
    ],
  },

  harmony: {
    name: 'drift_harmony',
    instrument: 'filtered_pad',
    lengthBeats: 16,
    notes: [
      // Dm → Bb → C → Dm
      n(50, 2), n(53, 2),   // D3, F3
      n(58, 2), n(53, 2),   // Bb3, F3
      n(48, 2), n(52, 2),   // C3, E3
      n(50, 2), n(53, 2),   // D3, F3
    ],
  },

  bass: {
    name: 'drift_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      n(38, 4),  // D2
      n(34, 4),  // Bb1 (MIDI 46 - 12 = 34)
      n(36, 4),  // C2
      n(38, 4),  // D2
    ],
  },

  drums: {
    name: 'drift_drums',
    lengthBeats: 16,
    hits: [
      // Rolling: kick on 1/3, snare on 2/4
      ...Array.from({ length: 4 }, (_, m) => [
        { drum: 'kick', beat: m * 4, velocity: 0.6 },
        { drum: 'snare', beat: m * 4 + 1, velocity: 0.4 },
        { drum: 'kick', beat: m * 4 + 2, velocity: 0.5 },
        { drum: 'snare', beat: m * 4 + 3, velocity: 0.4 },
      ]).flat(),
    ],
  },
};

/* ═══════════════════════════════════════════
 * ISLAND 3 — Coral Maze
 * G major, 110 BPM, playful staccato
 * ═══════════════════════════════════════════ */

export const ISLAND_03_CORAL_MAZE: SongDefinition = {
  name: 'Coral Maze',
  bpm: 110,
  key: 'G',
  scale: 'major',
  beatsPerMeasure: 4,
  loop: true,

  melody: {
    name: 'coral_melody',
    instrument: 'square_full',
    lengthBeats: 16,
    notes: [
      // Measure 1: bouncy G major
      n(67, 0.5), n(71, 0.5), n(74, 0.5), r(0.5), n(71, 0.5), n(69, 0.5), n(67, 0.5), r(0.5),
      // Measure 2: ascending run
      n(69, 0.5), n(71, 0.5), n(72, 0.5), n(74, 0.5), n(76, 1), r(1),
      // Measure 3: echo of measure 1 up an octave
      n(79, 0.5), n(83, 0.5), n(86, 0.5), r(0.5), n(83, 0.5), n(81, 0.5), n(79, 0.5), r(0.5),
      // Measure 4: resolve
      n(76, 0.5), n(74, 0.5), n(72, 0.5), n(71, 0.5), n(67, 2),
    ],
  },

  harmony: {
    name: 'coral_harmony',
    instrument: 'pulse_thin',
    lengthBeats: 16,
    notes: [
      // G → C → D → G (staccato arps)
      n(55, 1), n(59, 1), r(1), n(55, 1),
      n(48, 1), n(52, 1), r(1), n(48, 1),
      n(50, 1), n(54, 1), r(1), n(50, 1),
      n(55, 1), n(59, 1), r(1), n(55, 1),
    ],
  },

  bass: {
    name: 'coral_bass',
    instrument: 'triangle_smooth',
    lengthBeats: 16,
    notes: [
      n(43, 2), n(43, 2),  // G2
      n(36, 2), n(36, 2),  // C2
      n(38, 2), n(38, 2),  // D2
      n(43, 2), n(43, 2),  // G2
    ],
  },

  drums: {
    name: 'coral_drums',
    lengthBeats: 16,
    hits: [
      // Energetic: kick on 1/3, snare on 2/4, hihat on 8ths
      ...Array.from({ length: 4 }, (_, m) => [
        { drum: 'kick', beat: m * 4, velocity: 0.7 },
        { drum: 'hihat_closed', beat: m * 4 + 0.5, velocity: 0.3 },
        { drum: 'snare', beat: m * 4 + 1, velocity: 0.5 },
        { drum: 'hihat_closed', beat: m * 4 + 1.5, velocity: 0.3 },
        { drum: 'kick', beat: m * 4 + 2, velocity: 0.6 },
        { drum: 'hihat_closed', beat: m * 4 + 2.5, velocity: 0.3 },
        { drum: 'snare', beat: m * 4 + 3, velocity: 0.5 },
        { drum: 'hihat_closed', beat: m * 4 + 3.5, velocity: 0.3 },
      ]).flat(),
    ],
  },
};

/* ═══════════════════════════════════════════
 * ISLAND 4 — Storm Bastion
 * E minor, 95 BPM, dark & echoey
 * ═══════════════════════════════════════════ */

export const ISLAND_04_STORM_BASTION: SongDefinition = {
  name: 'Storm Bastion',
  bpm: 95,
  key: 'E',
  scale: 'natural_minor',
  beatsPerMeasure: 4,
  loop: true,

  melody: {
    name: 'storm_melody',
    instrument: 'sawtooth_bright',
    lengthBeats: 16,
    notes: [
      // Measure 1: brooding E minor
      n(64, 1.5), n(67, 1), n(71, 1.5),
      // Measure 2: descending tension
      n(69, 1), n(67, 1), n(66, 1), n(64, 1),
      // Measure 3: darker, lower register repeat
      n(52, 1.5), n(55, 1), n(59, 1.5),
      // Measure 4: resolve to E
      n(57, 1), n(55, 0.5), n(54, 0.5), n(52, 2),
    ],
  },

  harmony: {
    name: 'storm_harmony',
    instrument: 'filtered_pad',
    lengthBeats: 16,
    notes: [
      // Em → Am → B → Em (dark pads)
      n(52, 2), n(55, 2),   // E3, G3
      n(57, 2), n(48, 2),   // A3, C3
      n(59, 2), n(54, 2),   // B3, F#3
      n(52, 2), n(55, 2),   // E3, G3
    ],
  },

  bass: {
    name: 'storm_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      n(40, 4),  // E2
      n(45, 4),  // A2
      n(47, 4),  // B2
      n(40, 4),  // E2
    ],
  },

  drums: {
    name: 'storm_drums',
    lengthBeats: 16,
    hits: [
      // Sparse, ominous: tom + kick, no hihats
      ...Array.from({ length: 4 }, (_, m) => [
        { drum: 'kick', beat: m * 4, velocity: 0.7 },
        { drum: 'tom_low', beat: m * 4 + 1.5, velocity: 0.4 },
        { drum: 'kick', beat: m * 4 + 2.5, velocity: 0.5 },
        { drum: 'tom_high', beat: m * 4 + 3, velocity: 0.35 },
      ]).flat(),
    ],
  },
};

/* ═══════════════════════════════════════════
 * ISLAND 5 — Kraken's Reach
 * C minor, 80 BPM, ominous & building
 * ═══════════════════════════════════════════ */

export const ISLAND_05_KRAKENS_REACH: SongDefinition = {
  name: "Kraken's Reach",
  bpm: 80,
  key: 'C',
  scale: 'natural_minor',
  beatsPerMeasure: 4,
  loop: true,

  melody: {
    name: 'kraken_melody',
    instrument: 'vibrato_lead',
    lengthBeats: 16,
    notes: [
      // Measure 1: ominous C minor
      n(60, 2), n(63, 1), n(67, 1),
      // Measure 2: chromatic tension
      n(65, 1), n(63, 1), n(62, 1), n(60, 1),
      // Measure 3: low menacing phrase
      n(55, 1.5), n(58, 1), n(60, 1.5),
      // Measure 4: unresolved ending
      n(63, 1), n(62, 1), n(60, 1), r(1),
    ],
  },

  harmony: {
    name: 'kraken_harmony',
    instrument: 'detuned_chorus',
    lengthBeats: 16,
    notes: [
      // Cm → Ab → Fm → G power chord
      n(48, 2), n(51, 2),   // C3, Eb3
      n(56, 2), n(48, 2),   // Ab3, C3
      n(53, 2), n(56, 2),   // F3, Ab3
      n(55, 2), n(47, 2),   // G3, B2
    ],
  },

  bass: {
    name: 'kraken_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      n(36, 4),   // C2
      n(32, 4),   // Ab1
      n(29, 4),   // F1
      n(31, 4),   // G1
    ],
  },

  drums: {
    name: 'kraken_drums',
    lengthBeats: 16,
    hits: [
      // Heavy, slow: deep kick, crash accents
      { drum: 'crash', beat: 0, velocity: 0.6 },
      { drum: 'kick', beat: 0, velocity: 0.8 },
      { drum: 'tom_low', beat: 2, velocity: 0.5 },
      { drum: 'kick', beat: 3, velocity: 0.6 },
      { drum: 'kick', beat: 4, velocity: 0.7 },
      { drum: 'tom_high', beat: 5.5, velocity: 0.4 },
      { drum: 'tom_low', beat: 6, velocity: 0.5 },
      { drum: 'kick', beat: 7, velocity: 0.6 },
      { drum: 'crash', beat: 8, velocity: 0.5 },
      { drum: 'kick', beat: 8, velocity: 0.8 },
      { drum: 'tom_low', beat: 10, velocity: 0.5 },
      { drum: 'kick', beat: 11, velocity: 0.6 },
      { drum: 'kick', beat: 12, velocity: 0.7 },
      { drum: 'snare', beat: 13, velocity: 0.5 },
      { drum: 'tom_low', beat: 14, velocity: 0.5 },
      { drum: 'kick', beat: 15, velocity: 0.7 },
    ],
  },
};

/* ═══════════════════════════════════════════
 * OVERWORLD — Sea Shanty
 * F major, 80 BPM, broad & hopeful
 * ═══════════════════════════════════════════ */

export const OVERWORLD_SEA_SHANTY: SongDefinition = {
  name: 'Sea Shanty (Overworld)',
  bpm: 80,
  key: 'F',
  scale: 'major',
  beatsPerMeasure: 4,
  loop: true,

  melody: {
    name: 'shanty_melody',
    instrument: 'triangle_smooth',
    lengthBeats: 16,
    notes: [
      // Measure 1: broad, hopeful F major
      n(65, 1), n(69, 1), n(72, 1.5), r(0.5),
      // Measure 2: gentle fall
      n(70, 1), n(69, 1), n(67, 1), n(65, 1),
      // Measure 3: sea shanty call
      n(67, 0.5), n(69, 0.5), n(72, 1), n(70, 1), n(69, 1),
      // Measure 4: resolve to F
      n(67, 1), n(65, 1), r(1), n(65, 1),
    ],
  },

  harmony: {
    name: 'shanty_harmony',
    instrument: 'pulse_hollow',
    lengthBeats: 16,
    notes: [
      // F → Bb → C → F
      n(53, 2), n(57, 2),   // F3, A3
      n(58, 2), n(53, 2),   // Bb3, F3
      n(48, 2), n(52, 2),   // C3, E3
      n(53, 2), n(57, 2),   // F3, A3
    ],
  },

  bass: {
    name: 'shanty_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      n(41, 4),  // F2
      n(34, 4),  // Bb1
      n(36, 4),  // C2
      n(41, 4),  // F2
    ],
  },

  drums: {
    name: 'shanty_drums',
    lengthBeats: 16,
    hits: [
      // Swaying: kick on 1, rim on 3 (sea shanty groove)
      ...Array.from({ length: 4 }, (_, m) => [
        { drum: 'kick', beat: m * 4, velocity: 0.5 },
        { drum: 'hihat_closed', beat: m * 4 + 1, velocity: 0.25 },
        { drum: 'rim', beat: m * 4 + 2, velocity: 0.4 },
        { drum: 'hihat_closed', beat: m * 4 + 3, velocity: 0.25 },
      ]).flat(),
    ],
  },
};

/* ═══════════════════════════════════════════
 * COMBAT — Battle Music
 * A minor, 140 BPM, fast & aggressive
 * ═══════════════════════════════════════════ */

export const COMBAT_THEME: SongDefinition = {
  name: 'Battle Music',
  bpm: 140,
  key: 'A',
  scale: 'natural_minor',
  beatsPerMeasure: 4,
  loop: true,

  melody: {
    name: 'combat_melody',
    instrument: 'sawtooth_bright',
    lengthBeats: 16,
    notes: [
      // Measure 1: aggressive A minor
      n(69, 0.5), n(72, 0.5), n(76, 0.5), r(0.5), n(74, 0.5), n(72, 0.5), n(71, 0.5), n(69, 0.5),
      // Measure 2: descending attack
      n(72, 0.5), n(71, 0.5), n(69, 0.5), n(67, 0.5), n(64, 1), r(1),
      // Measure 3: rapid ascending run
      n(57, 0.5), n(60, 0.5), n(64, 0.5), n(67, 0.5), n(69, 0.5), n(72, 0.5), n(76, 1),
      // Measure 4: dramatic resolution
      n(76, 0.5), n(74, 0.5), n(72, 1), n(69, 2),
    ],
  },

  harmony: {
    name: 'combat_harmony',
    instrument: 'square_full',
    lengthBeats: 16,
    notes: [
      // Am → Dm → E → Am (power chord feeling)
      n(57, 2), n(52, 2),   // A3, E3
      n(50, 2), n(57, 2),   // D3, A3
      n(52, 2), n(56, 2),   // E3, Ab3/G#3
      n(57, 2), n(52, 2),   // A3, E3
    ],
  },

  bass: {
    name: 'combat_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      // Driving 8th-note bass
      n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5),
      n(38, 0.5), n(38, 0.5), n(38, 0.5), n(38, 0.5), n(38, 0.5), n(38, 0.5), n(38, 0.5), n(38, 0.5),
      n(40, 0.5), n(40, 0.5), n(40, 0.5), n(40, 0.5), n(40, 0.5), n(40, 0.5), n(40, 0.5), n(40, 0.5),
      n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5), n(45, 0.5),
    ],
  },

  drums: {
    name: 'combat_drums',
    lengthBeats: 16,
    hits: [
      // Intense: double-time hihats, kick+snare on every beat
      ...Array.from({ length: 4 }, (_, m) => [
        { drum: 'kick', beat: m * 4, velocity: 0.8 },
        { drum: 'hihat_closed', beat: m * 4 + 0.25, velocity: 0.3 },
        { drum: 'hihat_closed', beat: m * 4 + 0.5, velocity: 0.4 },
        { drum: 'hihat_closed', beat: m * 4 + 0.75, velocity: 0.3 },
        { drum: 'snare', beat: m * 4 + 1, velocity: 0.7 },
        { drum: 'hihat_closed', beat: m * 4 + 1.25, velocity: 0.3 },
        { drum: 'hihat_closed', beat: m * 4 + 1.5, velocity: 0.4 },
        { drum: 'hihat_closed', beat: m * 4 + 1.75, velocity: 0.3 },
        { drum: 'kick', beat: m * 4 + 2, velocity: 0.7 },
        { drum: 'hihat_closed', beat: m * 4 + 2.25, velocity: 0.3 },
        { drum: 'hihat_closed', beat: m * 4 + 2.5, velocity: 0.4 },
        { drum: 'hihat_closed', beat: m * 4 + 2.75, velocity: 0.3 },
        { drum: 'snare', beat: m * 4 + 3, velocity: 0.7 },
        { drum: 'hihat_closed', beat: m * 4 + 3.25, velocity: 0.3 },
        { drum: 'hihat_closed', beat: m * 4 + 3.5, velocity: 0.4 },
        { drum: 'hihat_closed', beat: m * 4 + 3.75, velocity: 0.3 },
      ]).flat(),
    ],
  },
};

/* ── Song Registry ── */

export const ALL_SONGS: Record<string, SongDefinition> = {
  island_01: ISLAND_01_BAY_OF_LEARNING,
  island_02: ISLAND_02_DRIFTWOOD_SHALLOWS,
  island_03: ISLAND_03_CORAL_MAZE,
  island_04: ISLAND_04_STORM_BASTION,
  island_05: ISLAND_05_KRAKENS_REACH,
  overworld: OVERWORLD_SEA_SHANTY,
  combat: COMBAT_THEME,
};

/** Get a song by island/context ID. */
export function getSong(id: string): SongDefinition | undefined {
  return ALL_SONGS[id];
}

/** Get all song IDs. */
export function getSongIds(): string[] {
  return Object.keys(ALL_SONGS);
}
