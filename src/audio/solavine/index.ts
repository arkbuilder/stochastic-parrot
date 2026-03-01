/**
 * SolavineSound — Public API
 *
 * Single entry-point for the procedural audio engine.
 * Import from 'src/audio/solavine' to access all subsystems.
 */

/* ── Engine ── */
export { SolavineEngine } from './solavine-engine';

/* ── Types ── */
export type {
  NoteName, ScaleType, ChordType,
  ADSREnvelope, WaveShape,
  PulseConfig, FMConfig, FilterConfig, VibratoConfig,
  InstrumentPreset, DrumPreset,
  PatternNote, DrumHit, MelodicPattern, DrumPattern,
  SongDefinition,
  SfxDefinition, SfxTone, SfxArp, SfxSweep, SfxNoiseBurst, SfxMulti, SfxLayer,
  SolavineMusicLayer,
} from './types';
export { SolavineEvent } from './types';

/* ── Music Theory ── */
export {
  midiToFreq, freqToMidi, noteToMidi, midiToNote, noteFreq,
  getScaleMidi, getScaleFrequencies, scaleIntervalSum,
  buildChordMidi, buildChordFrequencies,
  intervalSemitones, transpose, centsBetween, semitonesToRatio,
  bpmToMs, bpmToSeconds, beatsToSeconds, secondsToBeats,
  swingBeatTime, noteDurationBeats,
  NOTE_NAMES, SCALE_INTERVALS, CHORD_INTERVALS,
} from './music-theory';

/* ── Envelope ── */
export {
  ENVELOPE_PRESETS,
  computeEnvelopeValue, envelopeTotalDuration, getEnvelopePoints, validateEnvelope,
} from './envelope';

/* ── Instruments ── */
export { INSTRUMENTS, getInstrumentNames, getInstrument, validateInstrument } from './instruments';

/* ── Drums ── */
export { DRUM_KIT, getDrumNames, getDrum, validateDrum } from './drums';

/* ── SFX ── */
export { SFX_LIBRARY, getSfxEventNames, getSfxDefinition, getSfxDuration } from './sfx-library';

/* ── Sequencer ── */
export {
  scheduleMelodicPattern, scheduleDrumPattern, patternDurationSeconds,
  scheduleFullSong, loopStartTime, computePatternBeatLength,
  validatePatternLength, maxDrumBeat, getEventsInWindow,
  metronomeIntervalMs, songTotalDurationSeconds,
} from './sequencer';
export type { ScheduledNote, ScheduledDrumHit } from './sequencer';

/* ── Songs ── */
export { ALL_SONGS, getSong, getSongIds } from './island-songs';
export {
  ISLAND_01_BAY_OF_LEARNING,
  ISLAND_02_DRIFTWOOD_SHALLOWS,
  ISLAND_03_CORAL_MAZE,
  ISLAND_04_STORM_BASTION,
  ISLAND_05_KRAKENS_REACH,
  OVERWORLD_SEA_SHANTY,
  COMBAT_THEME,
} from './island-songs';

/* ── Fanfares ── */
export { ALL_FANFARES, getFanfare, getFanfareIds } from './fanfares';
export { VICTORY_SHORT, VICTORY_GRAND, ACHIEVEMENT_FANFARE, GAME_OVER_STINGER } from './fanfares';

/* ── Encounter Music ── */
export {
  ENCOUNTER_PRESETS, getEncounterPreset, getEncounterPresetKeys,
  ENCOUNTER_AMBIENCES, getEncounterAmbience,
} from './encounter-music';
export type { EncounterMusicPreset, EncounterAmbience } from './encounter-music';
