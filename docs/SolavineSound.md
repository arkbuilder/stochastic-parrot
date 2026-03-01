# SolavineSound — Procedural Audio Engine

> Implementation specification for Dead Reckoning: Memory Sea's
> expanded procedural audio system.

---

## Overview

SolavineSound is a pure-TypeScript procedural audio engine that generates
all music, SFX, and ambient sounds at runtime via the Web Audio API.
No audio files are shipped — every sound is synthesised from oscillators,
noise buffers, FM operators, and ADSR envelopes.

**Module path:** `src/audio/solavine/`  
**Public API:** `src/audio/solavine/index.ts`  
**Test suite:** `tests/unit/audio/solavine/` (4 files, 219 tests)

### Key Metrics

| Metric | Before | SolavineSound |
|---|---|---|
| Instruments | 4 waveforms | 12 presets (pulse / FM / noise / filtered / vibrato) |
| Drum Presets | 0 | 8 (kick, snare, hihats, toms, crash, rim) |
| SFX Events | 13 | 40 (core + UI + combat + environment + navigation) |
| Songs | 0 (shared pattern) | 7 unique themes (5 islands + overworld + combat) |
| Fanfares | 0 | 4 stingers (victory short/grand, achievement, game over) |
| Music Layers | 4 | 5 (adds `urgency` per AudioDirection.md) |
| Encounter Presets | 0 | 9 adaptive layer configs |
| Envelope System | gain ramp | Full ADSR with 10 named presets |
| Music Theory | none | Scales, chords, intervals, transpose, BPM math |
| Tests | 0 audio math tests | 219 pure-math verification tests |

---

## Architecture

```
src/audio/solavine/
├── types.ts              Core types — no runtime deps
├── music-theory.ts       Frequency / scale / chord / tempo math
├── envelope.ts           ADSR computation + 10 presets
├── instruments.ts        12 instrument preset definitions
├── drums.ts              8 drum kit preset definitions
├── sfx-library.ts        40 SFX event definitions
├── sequencer.ts          Pattern → wall-clock scheduling math
├── island-songs.ts       7 song definitions (melody/harmony/bass/drums)
├── fanfares.ts           4 non-looping stinger definitions
├── encounter-music.ts    9 layer presets + 5 ambience configs
├── solavine-engine.ts    Web Audio facade (only AudioContext consumer)
└── index.ts              Public barrel export
```

### Dependency Flow

```
types.ts  ←── everything depends on this
    ↑
music-theory.ts  ←── pure math (leaf module)
    ↑
envelope.ts  ←── pure math
    ↑
instruments.ts / drums.ts  ←── data referencing envelope presets
    ↑
sfx-library.ts / island-songs.ts / fanfares.ts  ←── content
    ↑
sequencer.ts  ←── timing math (imports music-theory)
    ↑
encounter-music.ts  ←── adaptive layer configs
    ↑
solavine-engine.ts  ←── ONLY module touching Web Audio API
```

**Rule:** Every module except `solavine-engine.ts` is a pure
function/data module that can be tested without an `AudioContext`.

---

## Music Theory Module

### Frequency Calculation

Equal temperament with A4 = 440 Hz:

$$f(n) = 440 \times 2^{(n - 69) / 12}$$

where $n$ is the MIDI note number. Key reference points:

| Note | MIDI | Frequency (Hz) |
|---|---|---|
| C4 (middle C) | 60 | 261.626 |
| A4 (tuning ref) | 69 | 440.000 |
| C5 | 72 | 523.251 |

MIDI numbering: `midi = (octave + 1) × 12 + pitchClass`  
where pitchClass: C=0, C#=1, D=2, … B=11.

### Scales (13 types)

Every scale's interval pattern sums to 12 semitones (one octave):

| Scale | Intervals | Notes |
|---|---|---|
| Major | 2-2-1-2-2-2-1 | 7 |
| Natural Minor | 2-1-2-2-1-2-2 | 7 |
| Harmonic Minor | 2-1-2-2-1-3-1 | 7 |
| Melodic Minor | 2-1-2-2-2-2-1 | 7 |
| Dorian | 2-1-2-2-2-1-2 | 7 |
| Phrygian | 1-2-2-2-1-2-2 | 7 |
| Lydian | 2-2-2-1-2-2-1 | 7 |
| Mixolydian | 2-2-1-2-2-1-2 | 7 |
| Locrian | 1-2-2-1-2-2-2 | 7 |
| Pentatonic Major | 2-2-3-2-3 | 5 |
| Pentatonic Minor | 3-2-2-3-2 | 5 |
| Blues | 3-2-1-1-3-2 | 6 |
| Chromatic | 1×12 | 12 |

### Chords (11 types)

| Chord | Intervals from root |
|---|---|
| Major | 0-4-7 |
| Minor | 0-3-7 |
| Diminished | 0-3-6 |
| Augmented | 0-4-8 |
| Major 7th | 0-4-7-11 |
| Minor 7th | 0-3-7-10 |
| Dominant 7th | 0-4-7-10 |
| Diminished 7th | 0-3-6-9 |
| Sus2 | 0-2-7 |
| Sus4 | 0-5-7 |
| Power | 0-7 |

### Interval Math

- **Cents between frequencies:** $c = 1200 \times \log_2(f_2 / f_1)$
- **Semitones to ratio:** $r = 2^{n/12}$
- **BPM to ms/beat:** $t = 60000 / \text{bpm}$
- **Beats to seconds:** $s = (b / \text{bpm}) \times 60$
- **Swing timing:** Odd beats offset by `swingAmount × beatDuration`

All functions are exported from `music-theory.ts` and fully unit-tested.

---

## ADSR Envelope System

### Stages

```
amplitude
  ^
  |    peak
  |    /\
  |   /  \  sustain
  |  /    \--------¬
  | /              |
  |/               +--->  0
  +--A---D---S------R--> time
```

1. **Attack** — Ramp from 0 to `peak` over `attack` seconds
2. **Decay** — Fall from `peak` to `sustain × peak` over `decay` seconds
3. **Sustain** — Hold at `sustain × peak` while note is held
4. **Release** — Fade to 0 over `release` seconds after note-off

### Presets (10)

| Name | Attack | Decay | Sustain | Release | Character |
|---|---|---|---|---|---|
| `percussive` | 0.005 | 0.10 | 0.0 | 0.05 | Sharp hit, no sustain |
| `pluck` | 0.010 | 0.15 | 0.2 | 0.10 | Guitar-like |
| `pad` | 0.300 | 0.20 | 0.7 | 0.50 | Soft ambient |
| `organ` | 0.005 | 0.01 | 1.0 | 0.01 | Instant on/off |
| `chip` | 0.010 | 0.05 | 0.6 | 0.08 | 8-bit default |
| `bell` | 0.002 | 0.80 | 0.0 | 0.30 | Long decay ring |
| `strings` | 0.150 | 0.10 | 0.8 | 0.40 | Orchestral swell |
| `bass` | 0.010 | 0.20 | 0.4 | 0.10 | Low-end punch |
| `blip` | 0.005 | 0.03 | 0.0 | 0.02 | Ultra-short SFX |
| `brass` | 0.080 | 0.15 | 0.6 | 0.20 | Bold brass |

### Pure Functions

- `computeEnvelopeValue(time, env, noteDuration)` → amplitude [0–1]
- `envelopeTotalDuration(env, noteDuration)` → seconds
- `getEnvelopePoints(env, noteDuration)` → 5 control points
- `validateEnvelope(env)` → string[] (errors, empty = valid)

---

## Instrument Library (12 Presets)

### Classic Chiptune Voices

| ID | Wave | Character |
|---|---|---|
| `pulse_thin` | Pulse 12.5% | Thin, tinny (NES pulse duty) |
| `pulse_hollow` | Pulse 25% | Hollow (NES pulse 2) |
| `square_full` | Square 50% | Full-bodied chip lead |
| `triangle_smooth` | Triangle | Mellow, warm bass/melody |
| `sawtooth_bright` | Sawtooth | Bright, buzzy |
| `sine_pure` | Sine | Clean sub-bass |

### Extended Voices

| ID | Technique | Character |
|---|---|---|
| `fm_bell` | FM (2:1 ratio, index 3) | Crystalline bell tone |
| `fm_metallic` | FM (7:1 ratio, index 5) | Metallic percussion |
| `noise_white` | White noise | Cymbal / wind / texture |
| `filtered_pad` | Sawtooth + LP 800Hz | Warm pad texture |
| `detuned_chorus` | Square × 2 (±12 cents) | Thick chorus effect |
| `vibrato_lead` | Triangle + vibrato (5.5Hz) | Expressive lead |

Each preset includes:
- `waveShape` — synthesis method
- `envelope` — ADSR preset reference
- `volume` — gain multiplier (0–1)
- Optional modifiers: `pulse`, `fm`, `filter`, `vibrato`, `detuneSpread`

---

## Drum Kit (8 Presets)

Each drum is synthesised from a pitch-swept oscillator + filtered noise:

| ID | Tone Sweep | Noise | Filter | Character |
|---|---|---|---|---|
| `kick` | 150→40 Hz Sine | Low white | — | Deep bass kick |
| `snare` | 200→120 Hz Tri | High white | HP 2kHz | Crisp snare |
| `hihat_closed` | — | White | HP 7kHz | Tight tick |
| `hihat_open` | — | White | HP 6kHz | Open shimmer |
| `tom_low` | 120→60 Hz Sine | Low white | — | Deep tom |
| `tom_high` | 200→100 Hz Sine | Low white | — | High tom |
| `crash` | — | White | BP 5kHz | Bright crash |
| `rim` | 800→600 Hz Sq | Periodic | — | Rim click |

---

## SFX Library (40 Events)

### Event Categories

**Core Interaction (13)** — backward-compatible with original AudioEvent:
`ConceptPlaced`, `RecallCorrect`, `RecallIncorrect`, `RecallTimeout`,
`FogAdvance`, `FogPushBack`, `ChartFragmentEarned`, `BitChirp`,
`NemoFootstep`, `CurtainOpen`, `TypewriterTick`, `EnemyBurrow`, `FreezeBlast`

**UI Sounds (5):** `ButtonTap`, `MenuOpen`, `MenuClose`, `ConceptDragStart`, `RecallPromptAppear`

**State Transitions (2):** `FailStateRumble`, `RetryBootUp`

**Rewards/Upgrades (5):** `UpgradeCommon`, `UpgradeRare`, `UpgradeLegendary`, `AchievementEarned`, `CoinCollect`

**Encounter Ambience (5):** `StormThunder`, `RuinsEcho`, `SquidHorn`, `CannonFire`, `KrakenRoar`

**Navigation (4):** `SailUnfurl`, `AnchorDrop`, `MapRustle`, `WavesCrash`

**Bit (Parrot) (2):** `BitCelebrate`, `BitWingFlutter`

**Combat (4):** `CritHit`, `ShieldBlock`, `HealChime`, `ComboHit`

### SFX Shape Types

| Shape | Parameters | Use |
|---|---|---|
| `tone` | freq, duration, wave, envelope | Single-pitch blip |
| `arp` | freqs[], totalDuration, wave, envelope | Rapid arpeggio |
| `sweep` | freqStart, freqEnd, duration, wave, envelope | Pitch glide |
| `noise_burst` | duration, filter, envelope | Impact / texture |
| `multi` | layers[] (each with offset) | Layered complex SFX |

Multi-layer SFX (e.g., `StormThunder`, `KrakenRoar`) combine
multiple shapes at staggered offsets for rich composite effects.

---

## Song System (7 Themes + 4 Fanfares)

### Island Themes

Each song has 4 tracks (melody, harmony, bass, drums) and loops.

| ID | Name | Key | BPM | Character |
|---|---|---|---|---|
| `island_01` | Bay of Learning | C major | 90 | Gentle exploratory |
| `island_02` | Driftwood Shallows | D minor | 100 | Rolling waves |
| `island_03` | Coral Maze | G major | 110 | Playful staccato |
| `island_04` | Storm Bastion | E minor | 95 | Dark echoey |
| `island_05` | Kraken's Reach | C minor | 80 | Ominous building |
| `overworld` | Sea Shanty | F major | 80 | Broad hopeful |
| `combat` | Battle Music | A minor | 140 | Fast intense |

### Instrument Assignments

| Song | Melody | Harmony | Bass |
|---|---|---|---|
| Island 01 | `triangle_smooth` | `sine_pure` | `sine_pure` |
| Island 02 | `pulse_hollow` | `triangle_smooth` | `sine_pure` |
| Island 03 | `square_full` | `pulse_thin` | `triangle_smooth` |
| Island 04 | `sawtooth_bright` | `filtered_pad` | `sine_pure` |
| Island 05 | `vibrato_lead` | `fm_bell` | `sine_pure` |
| Overworld | `triangle_smooth` | `pulse_hollow` | `sine_pure` |
| Combat | `sawtooth_bright` | `square_full` | `triangle_smooth` |

### Fanfares (non-looping)

| ID | Key | BPM | Beats | Duration |
|---|---|---|---|---|
| `victory_short` | C major | 160 | 4 | ~1.5s |
| `victory_grand` | C major | 120 | 8 | ~4s |
| `achievement` | G major | 120 | 6 | ~3s |
| `game_over` | A minor | 90 | 4 | ~2.7s |

---

## Sequencer

### Pattern → Wall-Clock Conversion

The sequencer is pure math — converts beat positions to absolute seconds:

$$t_{\text{note}} = t_{\text{start}} + \frac{\text{beat}}{bpm} \times 60$$

$$d_{\text{note}} = \frac{\text{beats}_{\text{dur}}}{bpm} \times 60$$

### Key Functions

| Function | Input | Output |
|---|---|---|
| `scheduleMelodicPattern` | pattern, bpm, startTime | `ScheduledNote[]` |
| `scheduleDrumPattern` | pattern, bpm, startTime | `ScheduledDrumHit[]` |
| `scheduleFullSong` | song, startTime | all 4 tracks scheduled |
| `patternDurationSeconds` | lengthBeats, bpm | seconds |
| `loopStartTime` | currentStart, lengthBeats, bpm | next loop start |
| `getEventsInWindow` | events, start, end | events in `[start, end)` |
| `computePatternBeatLength` | notes[] | total beats |
| `validatePatternLength` | pattern | `{valid, actual, declared}` |

### Look-Ahead Scheduling

The engine uses a 50ms interval with 150ms look-ahead window.
On each tick, `getEventsInWindow` filters scheduled events
and the engine synthesises them just-in-time via Web Audio nodes.

---

## Adaptive Music System

### 5-Layer Architecture

| Layer | Purpose | Active During |
|---|---|---|
| `base` | Core melody + harmony | Always |
| `rhythm` | Drum + bass groove | Exploration, some encounters |
| `tension` | Dissonant overlay | Encounter active |
| `urgency` | Fast arpeggios | Timer critical (< 50%) |
| `resolution` | Triumphant chord | Victory aftermath |

### Encounter Presets (9)

| Preset | Active Layers |
|---|---|
| `exploration` | base, rhythm |
| `encounter_start` | base, tension |
| `recall_active` | base, tension |
| `recall_urgent` | base, tension, urgency |
| `encounter_victory` | base, resolution |
| `encounter_failure` | base |
| `boss_phase` | base, rhythm, tension, urgency |
| `menu` | base |
| `reward` | base, rhythm, resolution |

### Encounter Ambiences (5)

| Encounter | Ambient SFX | Interval | Music Preset |
|---|---|---|---|
| Fog | WavesCrash | 8s | encounter_start |
| Storm | StormThunder + WavesCrash | 5s | recall_active |
| Battle | CannonFire | 6s | encounter_start |
| Ruins | RuinsEcho | 10s | recall_active |
| Squid | SquidHorn + WavesCrash | 7s | boss_phase |

---

## Engine API (`SolavineEngine`)

```typescript
class SolavineEngine {
  // Lifecycle
  initialize(): void;
  resume(): Promise<void>;
  dispose(): void;

  // Music
  playSong(songId: string): void;
  stopSong(): void;
  selectIslandTheme(islandIndex: number): void;
  setMusicLayers(layers: SolavineMusicLayer[]): void;
  applyEncounterPreset(presetKey: string): void;

  // SFX
  playSfx(event: SolavineEvent): void;

  // Volume
  setMasterVolume(v: number): void;
  setMusicVolume(v: number): void;
  setSfxVolume(v: number): void;

  // Debug
  getSnapshot(): EngineSnapshot;
}
```

The engine is the **only** module that touches the Web Audio API.
All other modules are pure functions/data and are fully testable
without a browser or AudioContext.

---

## Test Coverage

### Test Files

| File | Tests | Coverage |
|---|---|---|
| `music-theory.test.ts` | 85 | Frequency, scales, chords, intervals, timing |
| `envelope.test.ts` | 39 | ADSR stages, duration, points, validation, presets |
| `sequencer.test.ts` | 37 | Scheduling, timing, loops, windowing |
| `content-integrity.test.ts` | 58 | All data integrity: instruments, drums, SFX, songs, fanfares, encounters |
| **Total** | **219** | |

### What the Tests Verify

- **Frequency math is correct:** A4=440Hz, C4≈261.63Hz, octave=2:1
- **Scales sum to 12 semitones:** All 13 scale types validated
- **Chords have correct intervals:** Major=0-4-7, minor=0-3-7, etc.
- **ADSR phases produce correct amplitude:** Attack ramp, decay fall, sustain hold, release fade
- **BPM timing is accurate:** 120 BPM = 500ms/beat, beats-to-seconds round-trip
- **All 12 instruments pass validation:** Envelopes valid, volumes in range, modulation params positive
- **All 8 drums pass validation:** Envelopes valid, pitch/noise params consistent
- **All 40 SFX events mapped:** Every SolavineEvent enum has a definition, durations positive
- **All 7 songs have valid structure:** MIDI in range, instruments exist, drum presets exist, velocities in [0,1]
- **All 4 fanfares are non-looping and under 10 seconds**
- **All 9 encounter presets reference valid layers**
- **All 5 ambiences reference valid presets**

---

## Integration Guide

### Replacing the Existing Audio System

SolavineSound coexists with the current `src/audio/` system. To integrate:

1. **Create engine instance:**
   ```typescript
   import { SolavineEngine } from './audio/solavine';
   const engine = new SolavineEngine();
   engine.initialize();
   ```

2. **Map scenes to songs:**
   ```typescript
   engine.selectIslandTheme(islandIndex); // 0-4 for islands
   engine.playSong('overworld');           // overworld navigation
   engine.playSong('combat');              // battle sequences
   ```

3. **Trigger SFX from game events:**
   ```typescript
   import { SolavineEvent } from './audio/solavine';
   engine.playSfx(SolavineEvent.ConceptPlaced);
   engine.playSfx(SolavineEvent.CritHit);
   ```

4. **Adapt music to encounter state:**
   ```typescript
   engine.applyEncounterPreset('recall_urgent');
   ```

5. **Play fanfares:**
   ```typescript
   engine.playSong('victory_short'); // from ALL_FANFARES
   ```

### Backward Compatibility

The original 13 `AudioEvent` values are preserved as `SolavineEvent`
enum values with the same string keys. Existing code can be migrated
by replacing `AudioEvent.concept_placed` with `SolavineEvent.ConceptPlaced`.

---

## File Size

All audio is procedurally generated — **zero audio files shipped**.
The entire engine (12 TypeScript files) adds approximately 3,000 lines
of source code, compiles to roughly 15–20 KB minified+gzipped.
