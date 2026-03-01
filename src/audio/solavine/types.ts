/**
 * SolavineSound — Core Type Definitions
 *
 * All types for the procedural audio engine.
 * No runtime dependencies — pure type declarations.
 */

/* ── Pitch & Note ── */

/** Note name without octave */
export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

/** Scale type identifier */
export type ScaleType =
  | 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian'
  | 'pentatonic_major' | 'pentatonic_minor' | 'blues'
  | 'chromatic';

/** Chord quality */
export type ChordType =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'major7' | 'minor7' | 'dominant7' | 'diminished7'
  | 'sus2' | 'sus4' | 'power';

/* ── Envelope ── */

export interface ADSREnvelope {
  /** Attack time in seconds */
  attack: number;
  /** Decay time in seconds */
  decay: number;
  /** Sustain level (0–1) */
  sustain: number;
  /** Release time in seconds */
  release: number;
  /** Attack curve shape */
  attackCurve?: 'linear' | 'exponential';
  /** Peak amplitude (default 1.0) */
  peak?: number;
}

/* ── Instrument ── */

export type WaveShape = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'pulse' | 'noise' | 'fm';

export interface PulseConfig {
  /** Duty cycle: 0.125 (12.5%), 0.25 (25%), 0.5 (50%) */
  dutyCycle: number;
}

export interface FMConfig {
  /** Modulator-to-carrier frequency ratio */
  modulatorRatio: number;
  /** Modulation index (depth) */
  modulationIndex: number;
  /** Modulator waveform */
  modulatorWave: OscillatorType;
}

export interface FilterConfig {
  type: BiquadFilterType;
  frequency: number;
  Q?: number;
  /** LFO modulation rate (Hz) */
  lfoRate?: number;
  /** LFO modulation depth (Hz) */
  lfoDepth?: number;
}

export interface VibratoConfig {
  /** Rate in Hz */
  rate: number;
  /** Depth in cents */
  depth: number;
  /** Delay before vibrato starts (seconds) */
  delay?: number;
}

export interface InstrumentPreset {
  name: string;
  waveShape: WaveShape;
  envelope: ADSREnvelope;
  /** Volume multiplier (0–1) */
  volume: number;
  /** Detune in cents */
  detune?: number;
  /** Second detuned oscillator spread in cents (chorus) */
  detuneSpread?: number;
  pulse?: PulseConfig;
  fm?: FMConfig;
  filter?: FilterConfig;
  vibrato?: VibratoConfig;
}

/* ── Drum ── */

export interface DrumPreset {
  name: string;
  /** Tone pitch start (Hz), 0 = noise only */
  pitchStart: number;
  /** Tone pitch end (Hz) for sweep */
  pitchEnd: number;
  /** Pitch sweep time (seconds) */
  pitchDecay: number;
  /** Tone oscillator waveform */
  toneWave: OscillatorType;
  /** Tone volume (0–1) */
  toneVolume: number;
  /** Noise volume (0–1), 0 = no noise component */
  noiseVolume: number;
  /** Noise type */
  noiseType: 'white' | 'periodic';
  /** Amplitude envelope */
  envelope: ADSREnvelope;
  /** Optional noise filter */
  noiseFilter?: FilterConfig;
}

/* ── Sequencer / Pattern ── */

export interface PatternNote {
  /** MIDI note number (0 = rest) */
  midi: number;
  /** Duration in beats (1 = quarter note at 4/4) */
  duration: number;
  /** Velocity 0–1 */
  velocity: number;
}

export interface DrumHit {
  /** Drum preset name */
  drum: string;
  /** Beat position in pattern */
  beat: number;
  /** Velocity 0–1 */
  velocity: number;
}

export interface MelodicPattern {
  name: string;
  notes: PatternNote[];
  /** Instrument preset name */
  instrument: string;
  /** Total pattern length in beats */
  lengthBeats: number;
}

export interface DrumPattern {
  name: string;
  hits: DrumHit[];
  /** Total pattern length in beats */
  lengthBeats: number;
}

/* ── Song ── */

export interface SongDefinition {
  name: string;
  /** Tempo in BPM */
  bpm: number;
  /** Key root note */
  key: NoteName;
  /** Scale/mode */
  scale: ScaleType;
  /** Beats per measure */
  beatsPerMeasure: number;
  /** Musical tracks */
  melody: MelodicPattern;
  harmony: MelodicPattern;
  bass: MelodicPattern;
  drums: DrumPattern;
  /** Whether the song loops */
  loop: boolean;
}

/* ── SFX ── */

export interface SfxTone {
  shape: 'tone';
  freq: number;
  duration: number;
  wave: OscillatorType;
  envelope: ADSREnvelope;
}

export interface SfxArp {
  shape: 'arp';
  freqs: number[];
  totalDuration: number;
  wave: OscillatorType;
  envelope: ADSREnvelope;
}

export interface SfxSweep {
  shape: 'sweep';
  freqStart: number;
  freqEnd: number;
  duration: number;
  wave: OscillatorType;
  envelope: ADSREnvelope;
}

export interface SfxNoiseBurst {
  shape: 'noise_burst';
  duration: number;
  filterFreq: number;
  filterType: BiquadFilterType;
  envelope: ADSREnvelope;
}

export interface SfxMulti {
  shape: 'multi';
  layers: SfxLayer[];
}

export type SfxLayer = (SfxTone | SfxArp | SfxSweep | SfxNoiseBurst) & {
  /** Offset in seconds from trigger */
  offset: number;
};

export type SfxDefinition = SfxTone | SfxArp | SfxSweep | SfxNoiseBurst | SfxMulti;

/* ── Extended Audio Events ── */

export enum SolavineEvent {
  /* === Original 13 (backward-compatible) === */
  ConceptPlaced = 'concept_placed',
  RecallCorrect = 'recall_correct',
  RecallIncorrect = 'recall_incorrect',
  RecallTimeout = 'recall_timeout',
  FogAdvance = 'fog_advance',
  FogPushBack = 'fog_push_back',
  ChartFragmentEarned = 'chart_fragment_earned',
  BitChirp = 'bit_chirp',
  NemoFootstep = 'nemo_footstep',
  CurtainOpen = 'curtain_open',
  TypewriterTick = 'typewriter_tick',
  EnemyBurrow = 'enemy_burrow',
  FreezeBlast = 'freeze_blast',

  /* === New: UI Sounds === */
  ButtonTap = 'button_tap',
  MenuOpen = 'menu_open',
  MenuClose = 'menu_close',
  ConceptDragStart = 'concept_drag_start',
  RecallPromptAppear = 'recall_prompt_appear',

  /* === New: State Transitions === */
  FailStateRumble = 'fail_state_rumble',
  RetryBootUp = 'retry_boot_up',

  /* === New: Rewards / Upgrades === */
  UpgradeCommon = 'upgrade_common',
  UpgradeRare = 'upgrade_rare',
  UpgradeLegendary = 'upgrade_legendary',
  AchievementEarned = 'achievement_earned',
  CoinCollect = 'coin_collect',

  /* === New: Encounter Ambience === */
  StormThunder = 'storm_thunder',
  RuinsEcho = 'ruins_echo',
  SquidHorn = 'squid_horn',
  CannonFire = 'cannon_fire',
  KrakenRoar = 'kraken_roar',

  /* === New: Navigation === */
  SailUnfurl = 'sail_unfurl',
  AnchorDrop = 'anchor_drop',
  MapRustle = 'map_rustle',
  WavesCrash = 'waves_crash',

  /* === New: Bit (Parrot) === */
  BitCelebrate = 'bit_celebrate',
  BitWingFlutter = 'bit_wing_flutter',

  /* === New: Combat === */
  CritHit = 'crit_hit',
  ShieldBlock = 'shield_block',
  HealChime = 'heal_chime',
  ComboHit = 'combo_hit',
}

/** 5-layer adaptive music system (adds 'urgency' per AudioDirection.md) */
export type SolavineMusicLayer = 'base' | 'rhythm' | 'tension' | 'urgency' | 'resolution';
