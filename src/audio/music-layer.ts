/**
 * @deprecated Superseded by SolavineSound engine (`src/audio/solavine/`).
 * AudioManager now delegates layer management to SolavineEngine.setMusicLayers().
 * Kept for reference.
 */
import type { MusicLayerName } from './types';

/* ── note frequencies (A3=220 base, equal temperament) ── */
const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

/** Each layer is a looping sequencer that plays melodic patterns */
interface SequenceLayer {
  gain: GainNode;
  notes: number[];
  durations: number[];
  waveform: OscillatorType;
  stepIndex: number;
  nextNoteTime: number;
  activeOsc: OscillatorNode | null;
  volume: number;
}

/* ── Melodic patterns per layer ── */
const BASE_NOTES: number[] = [NOTE.C4!, NOTE.E4!, NOTE.G4!, NOTE.C5!, NOTE.G4!, NOTE.E4!, NOTE.C4!, NOTE.G3!];
const BASE_DURS  = [0.5,     0.5,     0.5,     0.75,    0.5,     0.5,     0.5,     0.75  ];

const RHYTHM_NOTES: number[] = [NOTE.C3!, 0, NOTE.G3!, 0, NOTE.C3!, NOTE.C3!, 0, NOTE.G3!];
const RHYTHM_DURS  = [0.25, 0.25, 0.25, 0.25, 0.25, 0.125, 0.125, 0.25  ];

const TENSION_NOTES: number[] = [NOTE.D4!, NOTE.F4!, NOTE.A4!, NOTE.F4!, NOTE.D4!, NOTE.E4!, NOTE.G4!, NOTE.E4!];
const TENSION_DURS  = [0.375,   0.375,   0.375,   0.375,   0.375,   0.375,   0.375,   0.375  ];

const RESOLUTION_NOTES: number[] = [NOTE.C5!, NOTE.E5!, NOTE.G5!, NOTE.E5!, NOTE.C5!, NOTE.G4!, NOTE.E4!, NOTE.G4!];
const RESOLUTION_DURS  = [0.6,     0.6,     0.8,     0.6,     0.6,     0.6,     0.6,     0.8    ];

export class MusicLayerEngine {
  private readonly layers = new Map<MusicLayerName, SequenceLayer>();
  private started = false;
  private scheduleIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly SCHEDULE_AHEAD = 0.12; // seconds to look ahead

  constructor(private readonly context: AudioContext, private readonly destination: GainNode) {
    this.layers.set('base', this.createLayer(BASE_NOTES, BASE_DURS, 'triangle', 0.14));
    this.layers.set('rhythm', this.createLayer(RHYTHM_NOTES, RHYTHM_DURS, 'square', 0.06));
    this.layers.set('tension', this.createLayer(TENSION_NOTES, TENSION_DURS, 'sawtooth', 0.09));
    this.layers.set('resolution', this.createLayer(RESOLUTION_NOTES, RESOLUTION_DURS, 'triangle', 0.12));
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    const now = this.context.currentTime;
    for (const layer of this.layers.values()) {
      layer.nextNoteTime = now;
    }

    // Enable the base layer by default
    const base = this.layers.get('base');
    if (base) {
      base.gain.gain.setValueAtTime(base.volume, now);
    }

    this.scheduleIntervalId = setInterval(() => this.scheduleNotes(), 50);
  }

  setLayer(layerName: MusicLayerName, targetGain: number, fadeSeconds = 0.5): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      return;
    }

    const now = this.context.currentTime;
    layer.gain.gain.cancelScheduledValues(now);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
    layer.gain.gain.linearRampToValueAtTime(targetGain, now + fadeSeconds);
  }

  transition(activeLayers: MusicLayerName[]): void {
    const target = new Set(activeLayers);
    for (const [name, layer] of this.layers.entries()) {
      const gain = target.has(name) ? layer.volume : 0;
      this.setLayer(name, gain, 0.6);
    }
  }

  stop(): void {
    if (this.scheduleIntervalId !== null) {
      clearInterval(this.scheduleIntervalId);
      this.scheduleIntervalId = null;
    }
    for (const layer of this.layers.values()) {
      layer.activeOsc?.stop();
      layer.activeOsc = null;
    }
    this.layers.clear();
  }

  /* ── internals ── */

  private createLayer(notes: number[], durations: number[], waveform: OscillatorType, volume: number): SequenceLayer {
    const gain = this.context.createGain();
    gain.gain.value = 0;
    gain.connect(this.destination);

    return { gain, notes, durations, waveform, stepIndex: 0, nextNoteTime: 0, activeOsc: null, volume };
  }

  private scheduleNotes(): void {
    const horizon = this.context.currentTime + this.SCHEDULE_AHEAD;

    for (const layer of this.layers.values()) {
      while (layer.nextNoteTime < horizon) {
        this.playNote(layer, layer.nextNoteTime);
        const dur = layer.durations[layer.stepIndex % layer.durations.length] ?? 0.5;
        layer.nextNoteTime += dur;
        layer.stepIndex = (layer.stepIndex + 1) % layer.notes.length;
      }
    }
  }

  private playNote(layer: SequenceLayer, when: number): void {
    const freq = layer.notes[layer.stepIndex % layer.notes.length] ?? 0;
    if (freq === 0) {
      return; // rest
    }

    const dur = (layer.durations[layer.stepIndex % layer.durations.length] ?? 0.5) * 0.85;
    const osc = this.context.createOscillator();
    const env = this.context.createGain();

    osc.type = layer.waveform;
    osc.frequency.setValueAtTime(freq, when);

    // Soft attack/release envelope
    env.gain.setValueAtTime(0.001, when);
    env.gain.exponentialRampToValueAtTime(0.3, when + 0.02);
    env.gain.setValueAtTime(0.3, when + dur * 0.6);
    env.gain.exponentialRampToValueAtTime(0.001, when + dur);

    osc.connect(env);
    env.connect(layer.gain);

    osc.start(when);
    osc.stop(when + dur + 0.02);
  }
}
