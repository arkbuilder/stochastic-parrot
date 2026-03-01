/**
 * SolavineSound — Engine
 *
 * Main facade that ties together all subsystems:
 *   - Instrument synthesis (oscillators, FM, noise, filters)
 *   - Drum synthesis (pitch sweep + noise)
 *   - SFX playback (one-shot procedural effects)
 *   - Song playback (pattern sequencer with look-ahead scheduling)
 *   - Adaptive music layers (crossfade between layer presets)
 *   - Volume / mute controls
 *
 * This is the only module that touches the Web Audio API.
 * All other modules are pure data / pure functions.
 */

import type {
  SolavineEvent,
  SolavineMusicLayer,
  InstrumentPreset,
  DrumPreset,
  SfxDefinition,
  SfxTone,
  SfxArp,
  SfxSweep,
  SfxNoiseBurst,
  SfxMulti,
  ADSREnvelope,
  SongDefinition,
} from './types';
import { INSTRUMENTS, getInstrument } from './instruments';
import { DRUM_KIT, getDrum } from './drums';
import { SFX_LIBRARY, getSfxDuration } from './sfx-library';
import { ALL_SONGS, getSong } from './island-songs';
import { ALL_FANFARES } from './fanfares';
import { ENCOUNTER_PRESETS, getEncounterPreset } from './encounter-music';
import { midiToFreq, beatsToSeconds } from './music-theory';
import {
  scheduleMelodicPattern,
  scheduleDrumPattern,
  patternDurationSeconds,
  getEventsInWindow,
  type ScheduledNote,
  type ScheduledDrumHit,
} from './sequencer';

/* ── Engine Configuration ── */

const SCHEDULE_INTERVAL_MS = 50;
const LOOKAHEAD_S = 0.15;
const LAYER_CROSSFADE_S = 0.6;

export class SolavineEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private muted = false;
  private masterVolume = 0.6;
  private musicVolume = 0.5;
  private sfxVolume = 0.6;

  private currentSong: SongDefinition | null = null;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private nextLoopStart = 0;
  private scheduledUpTo = 0;
  private activeLayers: Set<SolavineMusicLayer> = new Set(['base']);

  /* ── Lifecycle ── */

  /** Initialize the Web Audio context and gain chain. */
  initialize(): void {
    if (this.context) return;

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();

    this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    this.musicGain.gain.value = this.musicVolume;
    this.sfxGain.gain.value = this.sfxVolume;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  /** Resume suspended AudioContext (required after user gesture). */
  async resume(): Promise<void> {
    if (!this.context) this.initialize();
    if (this.context?.state !== 'running') {
      await this.context?.resume();
    }
  }

  /** Stop everything and release resources. */
  dispose(): void {
    this.stopSong();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
  }

  /* ── Song Playback ── */

  /** Start playing a song by ID (e.g., 'island_01', 'overworld', 'combat'). */
  playSong(songId: string): void {
    const song = ALL_SONGS[songId] ?? ALL_FANFARES[songId];
    if (!song || !this.context || !this.musicGain) return;

    this.stopSong();
    this.currentSong = song;

    const now = this.context.currentTime + 0.1;
    this.nextLoopStart = now;
    this.scheduledUpTo = now;

    this.schedulerInterval = setInterval(() => this.scheduleAhead(), SCHEDULE_INTERVAL_MS);
  }

  /** Stop the current song. */
  stopSong(): void {
    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.currentSong = null;
  }

  /** Select island theme by ID. Shorthand for playSong('island_XX'). */
  selectIslandTheme(islandId: string): void {
    this.playSong(islandId);
  }

  /* ── Adaptive Layers ── */

  /** Set which music layers are active. Cross-fades music briefly. */
  setMusicLayers(layers: SolavineMusicLayer[]): void {
    this.activeLayers = new Set(layers);

    // Smooth dip: drop music gain briefly then ramp back (avoids hard cut)
    if (this.musicGain && this.context) {
      const now = this.context.currentTime;
      const vol = Math.max(this.musicVolume, 0.0001);
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(vol * 0.4, now);
      this.musicGain.gain.linearRampToValueAtTime(vol, now + LAYER_CROSSFADE_S);
    }
  }

  /** Apply an encounter music preset by key. */
  applyEncounterPreset(presetKey: string): void {
    const preset = getEncounterPreset(presetKey);
    if (preset) {
      this.setMusicLayers(preset.layers);
    }
  }

  /* ── SFX ── */

  /** Play a one-shot SFX by event name. */
  playSfx(event: SolavineEvent): void {
    const def = SFX_LIBRARY[event];
    if (!def || !this.context || !this.sfxGain) return;

    const now = this.context.currentTime;
    this.synthesizeSfx(def, now);
  }

  /* ── Volume Controls ── */

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.syncVolumes();
  }

  setMasterVolume(v: number): void {
    this.masterVolume = clamp01(v);
    this.syncVolumes();
  }

  setMusicVolume(v: number): void {
    this.musicVolume = clamp01(v);
    this.syncVolumes();
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = clamp01(v);
    this.syncVolumes();
  }

  getSnapshot() {
    return {
      muted: this.muted,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      currentSong: this.currentSong?.name ?? null,
      activeLayers: [...this.activeLayers],
    };
  }

  /* ── Internal: Volume Sync ── */

  private syncVolumes(): void {
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  /* ── Internal: Song Scheduler ── */

  private scheduleAhead(): void {
    if (!this.context || !this.currentSong || !this.musicGain) return;

    const horizon = this.context.currentTime + LOOKAHEAD_S;

    while (this.scheduledUpTo < horizon) {
      const song = this.currentSong;
      const loopDur = patternDurationSeconds(song.melody.lengthBeats, song.bpm);

      // Schedule one loop iteration
      const melodyNotes = scheduleMelodicPattern(song.melody, song.bpm, this.nextLoopStart);
      const harmonyNotes = scheduleMelodicPattern(song.harmony, song.bpm, this.nextLoopStart);
      const bassNotes = scheduleMelodicPattern(song.bass, song.bpm, this.nextLoopStart);
      const drumHits = scheduleDrumPattern(song.drums, song.bpm, this.nextLoopStart);

      // Filter to what's in the current window
      const windowEnd = this.nextLoopStart + loopDur;

      const res = this.isLayerActive('resolution');

      for (const note of getEventsInWindow(melodyNotes, this.scheduledUpTo, horizon)) {
        if (res || this.isLayerActive('base') || this.isLayerActive('tension')) {
          this.synthesizeNote(note);
        }
      }

      for (const note of getEventsInWindow(harmonyNotes, this.scheduledUpTo, horizon)) {
        if (res || this.isLayerActive('rhythm') || this.isLayerActive('tension')) {
          this.synthesizeNote(note);
        }
      }

      for (const note of getEventsInWindow(bassNotes, this.scheduledUpTo, horizon)) {
        if (res || this.isLayerActive('base')) {
          this.synthesizeNote(note);
        }
      }

      for (const hit of getEventsInWindow(drumHits, this.scheduledUpTo, horizon)) {
        if (this.isLayerActive('rhythm') || this.isLayerActive('urgency')) {
          this.synthesizeDrum(hit);
        }
      }

      // Advance
      if (horizon >= windowEnd) {
        if (song.loop) {
          this.nextLoopStart += loopDur;
          this.scheduledUpTo = this.nextLoopStart;
        } else {
          this.stopSong();
          return;
        }
      } else {
        this.scheduledUpTo = horizon;
      }
    }
  }

  private isLayerActive(layer: SolavineMusicLayer): boolean {
    return this.activeLayers.has(layer);
  }

  /* ── Internal: Synthesis ── */

  private synthesizeNote(note: ScheduledNote): void {
    if (!this.context || !this.musicGain || note.freq <= 0) return;

    const preset = getInstrument(note.instrument);
    if (!preset) return;

    const osc = this.context.createOscillator();
    const env = this.context.createGain();
    const when = note.time;
    const dur = note.durationS * 0.85;

    osc.type = this.getOscillatorType(preset);
    osc.frequency.setValueAtTime(note.freq, when);

    if (preset.detune) osc.detune.setValueAtTime(preset.detune, when);

    // ADSR envelope
    this.applyADSR(env, preset.envelope, when, dur, note.velocity * preset.volume);

    osc.connect(env);

    // Optional filter
    if (preset.filter && this.context) {
      const filter = this.context.createBiquadFilter();
      filter.type = preset.filter.type;
      filter.frequency.setValueAtTime(preset.filter.frequency, when);
      if (preset.filter.Q) filter.Q.setValueAtTime(preset.filter.Q, when);
      env.connect(filter);
      filter.connect(this.musicGain);
    } else {
      env.connect(this.musicGain);
    }

    osc.start(when);
    osc.stop(when + dur + (preset.envelope.release ?? 0.1));
  }

  private synthesizeDrum(hit: ScheduledDrumHit): void {
    if (!this.context || !this.musicGain) return;

    const preset = getDrum(hit.drum);
    if (!preset) return;

    const when = hit.time;

    // Tone component (if any)
    if (preset.toneVolume > 0 && preset.pitchStart > 0) {
      const osc = this.context.createOscillator();
      const env = this.context.createGain();
      osc.type = preset.toneWave;
      osc.frequency.setValueAtTime(preset.pitchStart, when);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(preset.pitchEnd, 1), when + preset.pitchDecay,
      );
      this.applyADSR(env, preset.envelope, when, preset.pitchDecay, hit.velocity * preset.toneVolume);
      osc.connect(env);
      env.connect(this.musicGain);
      osc.start(when);
      osc.stop(when + preset.envelope.attack + preset.envelope.decay + preset.envelope.release + 0.02);
    }

    // Noise component (if any) — uses buffer-based white noise
    if (preset.noiseVolume > 0 && this.context) {
      const dur = preset.envelope.attack + preset.envelope.decay + preset.envelope.release;
      const bufferSize = Math.ceil(this.context.sampleRate * dur);
      const buffer = this.context.createBuffer(1, Math.max(bufferSize, 1), this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.context.createBufferSource();
      noise.buffer = buffer;

      const noiseEnv = this.context.createGain();
      this.applyADSR(noiseEnv, preset.envelope, when, preset.pitchDecay, hit.velocity * preset.noiseVolume);

      noise.connect(noiseEnv);

      if (preset.noiseFilter) {
        const filter = this.context.createBiquadFilter();
        filter.type = preset.noiseFilter.type;
        filter.frequency.setValueAtTime(preset.noiseFilter.frequency, when);
        if (preset.noiseFilter.Q) filter.Q.setValueAtTime(preset.noiseFilter.Q, when);
        noiseEnv.connect(filter);
        filter.connect(this.musicGain);
      } else {
        noiseEnv.connect(this.musicGain);
      }

      noise.start(when);
      noise.stop(when + dur + 0.02);
    }
  }

  private synthesizeSfx(def: SfxDefinition, when: number): void {
    if (!this.context || !this.sfxGain) return;

    switch (def.shape) {
      case 'tone':
        this.synthTone(def, when);
        break;
      case 'arp':
        this.synthArp(def, when);
        break;
      case 'sweep':
        this.synthSweep(def, when);
        break;
      case 'noise_burst':
        this.synthNoiseBurst(def, when);
        break;
      case 'multi':
        for (const layer of def.layers) {
          this.synthesizeSfx(layer, when + layer.offset);
        }
        break;
    }
  }

  private synthTone(def: SfxTone, when: number): void {
    if (!this.context || !this.sfxGain) return;
    const osc = this.context.createOscillator();
    const env = this.context.createGain();
    osc.type = def.wave;
    osc.frequency.setValueAtTime(def.freq, when);
    this.applyADSR(env, def.envelope, when, def.duration, 0.3);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(when);
    osc.stop(when + def.duration + def.envelope.release + 0.02);
  }

  private synthArp(def: SfxArp, when: number): void {
    if (!this.context || !this.sfxGain) return;
    const stepDur = def.totalDuration / def.freqs.length;
    for (let i = 0; i < def.freqs.length; i++) {
      const freq = def.freqs[i]!;
      const start = when + i * stepDur;
      const osc = this.context.createOscillator();
      const env = this.context.createGain();
      osc.type = def.wave;
      osc.frequency.setValueAtTime(freq, start);
      this.applyADSR(env, def.envelope, start, stepDur * 0.8, 0.25);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + stepDur + 0.02);
    }
  }

  private synthSweep(def: SfxSweep, when: number): void {
    if (!this.context || !this.sfxGain) return;
    const osc = this.context.createOscillator();
    const env = this.context.createGain();
    osc.type = def.wave;
    osc.frequency.setValueAtTime(def.freqStart, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(def.freqEnd, 1), when + def.duration);
    this.applyADSR(env, def.envelope, when, def.duration, 0.3);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(when);
    osc.stop(when + def.duration + def.envelope.release + 0.02);
  }

  private synthNoiseBurst(def: SfxNoiseBurst, when: number): void {
    if (!this.context || !this.sfxGain) return;
    const bufferSize = Math.ceil(this.context.sampleRate * (def.duration + def.envelope.release));
    const buffer = this.context.createBuffer(1, Math.max(bufferSize, 1), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    const env = this.context.createGain();
    this.applyADSR(env, def.envelope, when, def.duration, 0.25);
    const filter = this.context.createBiquadFilter();
    filter.type = def.filterType;
    filter.frequency.setValueAtTime(def.filterFreq, when);
    noise.connect(env);
    env.connect(filter);
    filter.connect(this.sfxGain);
    noise.start(when);
    noise.stop(when + def.duration + def.envelope.release + 0.02);
  }

  /* ── Internal: ADSR Application ── */

  private applyADSR(
    gainNode: GainNode,
    adsr: ADSREnvelope,
    when: number,
    noteDur: number,
    peakVol: number,
  ): void {
    const peak = peakVol * (adsr.peak ?? 1.0);
    const sustainVol = peak * adsr.sustain;

    gainNode.gain.setValueAtTime(0.0001, when);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), when + adsr.attack);

    if (adsr.decay > 0) {
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(sustainVol, 0.0001), when + adsr.attack + adsr.decay,
      );
    }

    const releaseStart = when + Math.max(noteDur, adsr.attack + adsr.decay);
    gainNode.gain.setValueAtTime(Math.max(sustainVol, 0.0001), releaseStart);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart + adsr.release);
  }

  private getOscillatorType(preset: InstrumentPreset): OscillatorType {
    switch (preset.waveShape) {
      case 'pulse': return 'square'; // Approximate pulse with square (duty cycle applied elsewhere)
      case 'fm': return 'sine';      // FM carrier is sine
      case 'noise': return 'square'; // Noise handled separately
      default: return preset.waveShape as OscillatorType;
    }
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
