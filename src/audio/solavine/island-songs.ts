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
      // A (1-4): hook — lilting stepwise rise and answer
      n(64, 0.5), n(67, 0.5), n(69, 1), n(67, 1), n(64, 1),
      // A' (5-8): same cell with a brighter lift to B
      n(64, 0.5), n(67, 0.5), n(71, 1), n(69, 1), n(67, 1),
      // B (9-12): gentle tension toward the upper color tones
      n(65, 1), n(67, 0.5), n(69, 0.5), n(71, 1), n(69, 1),
      // A" (13-16): hook returns and settles
      n(64, 0.5), n(67, 0.5), n(69, 1), n(67, 1), n(64, 1),
    ],
  },

  harmony: {
    name: 'bay_harmony',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      // C → Am → F/G tension → C
      n(48, 1), n(52, 1), n(55, 1), n(52, 1),
      n(45, 1), n(48, 1), n(52, 1), n(48, 1),
      n(53, 1), n(57, 1), n(55, 1), n(59, 1),
      n(48, 1), n(52, 1), n(55, 1), n(52, 1),
    ],
  },

  bass: {
    name: 'bay_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      n(36, 2), n(40, 1), n(43, 1),
      n(45, 2), n(40, 1), n(45, 1),
      n(41, 2), n(43, 2),
      n(36, 2), n(38, 1), n(36, 1),
    ],
  },

  drums: {
    name: 'bay_drums',
    lengthBeats: 16,
    hits: [
      // Gentle shuffle feel: sparse kick, soft off-beat hats, light rim punctuation
      { drum: 'kick', beat: 0, velocity: 0.5 },
      { drum: 'hihat_closed', beat: 1.5, velocity: 0.25 },
      { drum: 'rim', beat: 2.5, velocity: 0.3 },
      { drum: 'hihat_closed', beat: 3.5, velocity: 0.25 },

      { drum: 'kick', beat: 4, velocity: 0.5 },
      { drum: 'hihat_closed', beat: 5.5, velocity: 0.25 },
      { drum: 'kick', beat: 7, velocity: 0.4 },
      { drum: 'hihat_closed', beat: 7.5, velocity: 0.25 },

      { drum: 'kick', beat: 8, velocity: 0.55 },
      { drum: 'hihat_closed', beat: 9.5, velocity: 0.25 },
      { drum: 'rim', beat: 10.5, velocity: 0.32 },
      { drum: 'hihat_closed', beat: 11.5, velocity: 0.25 },

      { drum: 'kick', beat: 12, velocity: 0.5 },
      { drum: 'hihat_closed', beat: 13.5, velocity: 0.25 },
      { drum: 'rim', beat: 14.5, velocity: 0.3 },
      { drum: 'hihat_closed', beat: 15.5, velocity: 0.25 },
    ],
  },
}

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
      // A (1-4): singable shanty hook
      n(65, 1), n(69, 0.5), n(70, 0.5), n(69, 1), n(67, 1),
      // A' (5-8): same contour with a purposeful leap to C5
      n(65, 1), n(69, 0.5), n(72, 0.5), n(69, 1), n(67, 0.5), n(65, 0.5),
      // B (9-12): tension around dominant color before release
      n(64, 0.5), n(67, 0.5), n(69, 1), n(67, 1), n(65, 1),
      // A" (13-16): return of hook with firm home cadence
      n(65, 1), n(69, 0.5), n(70, 0.5), n(69, 0.5), n(67, 0.5), n(65, 1),
    ],
  },

  harmony: {
    name: 'shanty_harmony',
    instrument: 'pulse_hollow',
    lengthBeats: 16,
    notes: [
      // F → Bb → C → F as buoyant broken-chord pulses
      n(53, 1), n(57, 1), n(60, 1), n(57, 1),
      n(58, 1), n(62, 1), n(65, 1), n(62, 1),
      n(48, 1), n(52, 1), n(55, 1), n(52, 1),
      n(53, 1), n(57, 1), n(60, 1), n(57, 1),
    ],
  },

  bass: {
    name: 'shanty_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      n(41, 2), n(36, 1), n(41, 1),
      n(34, 2), n(41, 1), n(34, 1),
      n(36, 2), n(43, 1), n(36, 1),
      n(41, 2), n(36, 1), n(41, 1),
    ],
  },

  drums: {
    name: 'shanty_drums',
    lengthBeats: 16,
    hits: [
      // Swaying 6/8-like accenting inside 4/4: stomp + offbeat taps
      { drum: 'kick', beat: 0, velocity: 0.55 },
      { drum: 'hihat_closed', beat: 1.5, velocity: 0.22 },
      { drum: 'rim', beat: 2.5, velocity: 0.4 },
      { drum: 'hihat_closed', beat: 3.5, velocity: 0.22 },

      { drum: 'kick', beat: 4, velocity: 0.55 },
      { drum: 'hihat_closed', beat: 5.5, velocity: 0.22 },
      { drum: 'rim', beat: 6.5, velocity: 0.38 },
      { drum: 'hihat_closed', beat: 7.5, velocity: 0.22 },

      { drum: 'kick', beat: 8, velocity: 0.58 },
      { drum: 'hihat_closed', beat: 9.5, velocity: 0.22 },
      { drum: 'rim', beat: 10.5, velocity: 0.42 },
      { drum: 'hihat_closed', beat: 11.5, velocity: 0.22 },

      { drum: 'kick', beat: 12, velocity: 0.55 },
      { drum: 'hihat_closed', beat: 13.5, velocity: 0.22 },
      { drum: 'rim', beat: 14.5, velocity: 0.4 },
      { drum: 'hihat_closed', beat: 15.5, velocity: 0.22 },
    ],
  },
}

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
      // A (1-4): tight hook with bite, mostly stepwise descent
      n(69, 0.5), n(72, 0.5), n(74, 1), n(72, 0.5), n(71, 0.5), n(69, 1),
      // A' (5-8): same motif, intensified with a leap to E5
      n(69, 0.5), n(72, 0.5), n(76, 1), n(74, 0.5), n(72, 0.5), n(71, 1),
      // B (9-12): forward-driving bridge to dominant tension
      n(67, 0.5), n(69, 0.5), n(71, 0.5), n(72, 0.5), n(74, 1), n(72, 1),
      // A" (13-16): hook returns for loop-ready close
      n(69, 0.5), n(72, 0.5), n(74, 1), n(72, 0.5), n(71, 0.5), n(69, 1),
    ],
  },

  harmony: {
    name: 'combat_harmony',
    instrument: 'square_full',
    lengthBeats: 16,
    notes: [
      // Am → F → Dm → E(→Am implied)
      n(57, 1), n(64, 1), n(60, 1), n(64, 1),
      n(53, 1), n(60, 1), n(57, 1), n(60, 1),
      n(50, 1), n(57, 1), n(53, 1), n(57, 1),
      n(52, 1), n(56, 1), n(59, 1), n(57, 1),
    ],
  },

  bass: {
    name: 'combat_bass',
    instrument: 'sine_pure',
    lengthBeats: 16,
    notes: [
      // Galloping ostinato, less fatiguing than constant 8ths
      n(45, 1), n(45, 0.5), n(45, 0.5), n(40, 1), n(45, 1),
      n(41, 1), n(41, 0.5), n(41, 0.5), n(40, 1), n(41, 1),
      n(38, 1), n(38, 0.5), n(38, 0.5), n(40, 1), n(38, 1),
      n(40, 1), n(40, 0.5), n(40, 0.5), n(44, 0.5), n(45, 1.5),
    ],
  },

  drums: {
    name: 'combat_drums',
    lengthBeats: 16,
    hits: [
      // Energetic but cleaner: backbeat snare, syncopated kicks, 8th-note hats
      ...Array.from({ length: 4 }, (_, m) => [
        { drum: 'kick', beat: m * 4, velocity: 0.78 },
        { drum: 'hihat_closed', beat: m * 4 + 0.5, velocity: 0.28 },
        { drum: 'kick', beat: m * 4 + 1.5, velocity: 0.62 },
        { drum: 'snare', beat: m * 4 + 2, velocity: 0.72 },
        { drum: 'hihat_closed', beat: m * 4 + 2.5, velocity: 0.32 },
        { drum: 'kick', beat: m * 4 + 3, velocity: 0.68 },
        { drum: 'hihat_closed', beat: m * 4 + 3.5, velocity: 0.28 },
      ]).flat(),
    ],
  },
}

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
