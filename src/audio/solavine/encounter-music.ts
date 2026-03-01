/**
 * SolavineSound — Encounter Music
 *
 * Adaptive music cues triggered by encounter state.
 * These define layer-selection presets and encounter-specific
 * stingers/ambience that override or complement the island song.
 */

import type { SolavineMusicLayer, SongDefinition } from './types';

/* ── Layer Presets per Encounter Phase ── */

/**
 * Recommended active music layers for each encounter phase.
 * The engine crossfades between these presets.
 */
export interface EncounterMusicPreset {
  /** Display name for debugging */
  name: string;
  /** Active music layers */
  layers: SolavineMusicLayer[];
  /** Optional BPM override (null = keep island song BPM) */
  bpmOverride: number | null;
}

export const ENCOUNTER_PRESETS: Record<string, EncounterMusicPreset> = {

  /** Normal exploration — base + rhythm */
  exploration: {
    name: 'Exploration',
    layers: ['base', 'rhythm'],
    bpmOverride: null,
  },

  /** Encounter triggered — add tension */
  encounter_start: {
    name: 'Encounter Start',
    layers: ['base', 'tension'],
    bpmOverride: null,
  },

  /** Recall mode active — tension only */
  recall_active: {
    name: 'Recall Active',
    layers: ['base', 'tension'],
    bpmOverride: null,
  },

  /** Timer critical (<50%) — add urgency */
  recall_urgent: {
    name: 'Recall Urgent',
    layers: ['base', 'tension', 'urgency'],
    bpmOverride: null,
  },

  /** Encounter victory — resolution layer */
  encounter_victory: {
    name: 'Encounter Victory',
    layers: ['base', 'resolution'],
    bpmOverride: null,
  },

  /** Encounter failure — base only, subdued */
  encounter_failure: {
    name: 'Encounter Failure',
    layers: ['base'],
    bpmOverride: null,
  },

  /** Boss (Kraken) phase — all layers */
  boss_phase: {
    name: 'Boss Phase',
    layers: ['base', 'rhythm', 'tension', 'urgency'],
    bpmOverride: null,
  },

  /** Leaderboard / menu — calm base only */
  menu: {
    name: 'Menu',
    layers: ['base'],
    bpmOverride: null,
  },

  /** Reward screen — base + resolution */
  reward: {
    name: 'Reward Screen',
    layers: ['base', 'resolution'],
    bpmOverride: null,
  },
};

/**
 * Get encounter preset by key.
 */
export function getEncounterPreset(key: string): EncounterMusicPreset | undefined {
  return ENCOUNTER_PRESETS[key];
}

/**
 * Get all preset keys.
 */
export function getEncounterPresetKeys(): string[] {
  return Object.keys(ENCOUNTER_PRESETS);
}

/* ── Encounter-Specific Ambient Definitions ── */

/**
 * Per-encounter ambient sound descriptors.
 * The engine interprets these alongside the music layer system.
 */
export interface EncounterAmbience {
  /** Encounter type */
  encounterType: string;
  /** Ambient SFX events to loop during this encounter */
  ambientEvents: string[];
  /** Interval between ambient events (seconds) */
  ambientInterval: number;
  /** Recommended music preset key */
  musicPreset: string;
}

export const ENCOUNTER_AMBIENCES: EncounterAmbience[] = [
  {
    encounterType: 'fog',
    ambientEvents: ['waves_crash'],
    ambientInterval: 8,
    musicPreset: 'encounter_start',
  },
  {
    encounterType: 'storm',
    ambientEvents: ['storm_thunder', 'waves_crash'],
    ambientInterval: 5,
    musicPreset: 'recall_active',
  },
  {
    encounterType: 'battle',
    ambientEvents: ['cannon_fire'],
    ambientInterval: 6,
    musicPreset: 'encounter_start',
  },
  {
    encounterType: 'ruins',
    ambientEvents: ['ruins_echo'],
    ambientInterval: 10,
    musicPreset: 'recall_active',
  },
  {
    encounterType: 'squid',
    ambientEvents: ['squid_horn', 'waves_crash'],
    ambientInterval: 7,
    musicPreset: 'boss_phase',
  },
];

/**
 * Get ambience config for an encounter type.
 */
export function getEncounterAmbience(encounterType: string): EncounterAmbience | undefined {
  return ENCOUNTER_AMBIENCES.find(a => a.encounterType === encounterType);
}
