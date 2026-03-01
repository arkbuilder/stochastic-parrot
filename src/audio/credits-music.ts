/**
 * Credits Music — "Homeward Stars"
 *
 * A warm, emotional oscillator-based melody for the DLC credits scene.
 * Uses triangle + sine waves for a gentle, celebratory feel.
 * Plays a single pass through the melody (no loop) — fades to silence.
 *
 * Self-contained: create → start → stop. No dependency on MusicLayerEngine.
 */

/* ── note frequencies ── */
const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  R: 0, // rest
};

interface CreditNote { freq: number; dur: number; }

/**
 * Melody: warm ascending theme → gentle resolution → soft fade.
 * ~30s total — enough to cover the credits scroll.
 */
const MELODY: CreditNote[] = [
  // Phrase 1 — "Thank you" (ascending warmth)
  { freq: N.C4!, dur: 0.7 }, { freq: N.E4!, dur: 0.7 }, { freq: N.G4!, dur: 0.9 },
  { freq: N.R!, dur: 0.3 },
  { freq: N.E4!, dur: 0.5 }, { freq: N.G4!, dur: 0.5 }, { freq: N.C5!, dur: 1.0 },
  { freq: N.R!, dur: 0.4 },

  // Phrase 2 — "We sailed together" (call and response)
  { freq: N.A3!, dur: 0.6 }, { freq: N.C4!, dur: 0.6 }, { freq: N.E4!, dur: 0.8 },
  { freq: N.D4!, dur: 0.8 }, { freq: N.C4!, dur: 1.0 },
  { freq: N.R!, dur: 0.4 },

  // Phrase 3 — "Through stars and sea" (emotional peak)
  { freq: N.G4!, dur: 0.7 }, { freq: N.A4!, dur: 0.7 }, { freq: N.C5!, dur: 1.0 },
  { freq: N.B4!, dur: 0.5 }, { freq: N.A4!, dur: 0.5 }, { freq: N.G4!, dur: 1.2 },
  { freq: N.R!, dur: 0.5 },

  // Phrase 4 — "And home again" (gentle descent/resolution)
  { freq: N.E5!, dur: 0.9 }, { freq: N.D5!, dur: 0.7 }, { freq: N.C5!, dur: 0.8 },
  { freq: N.G4!, dur: 0.7 }, { freq: N.E4!, dur: 0.8 }, { freq: N.C4!, dur: 1.5 },
  { freq: N.R!, dur: 0.5 },

  // Coda — long held chord (warmth)
  { freq: N.C4!, dur: 2.0 }, { freq: N.E4!, dur: 2.0 }, { freq: N.G4!, dur: 2.5 },
  { freq: N.C5!, dur: 3.0 },
];

const HARMONY: CreditNote[] = [
  // Gentle bass pedal underneath the melody
  { freq: N.C3!, dur: 2.6 }, { freq: N.R!, dur: 0.3 },
  { freq: N.C3!, dur: 2.0 }, { freq: N.R!, dur: 0.4 },
  { freq: N.A3!, dur: 3.4 }, { freq: N.R!, dur: 0.4 },
  { freq: N.G3!, dur: 3.6 }, { freq: N.R!, dur: 0.5 },
  { freq: N.F3!, dur: 3.2 }, { freq: N.E3!, dur: 2.8 },
  { freq: N.C3!, dur: 4.0 }, { freq: N.C3!, dur: 3.0 },
];

export class CreditsMusic {
  private gainNode: GainNode | null = null;
  private scheduledOscillators: OscillatorNode[] = [];
  private stopped = false;

  constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode,
  ) {}

  /** Schedule and start the full credits melody. */
  start(): void {
    if (this.stopped) return;

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 0.18;
    this.gainNode.connect(this.destination);

    const t0 = this.context.currentTime + 0.1;

    // Schedule melody (triangle — warm, clear)
    this.scheduleVoice(MELODY, 'triangle', 0.22, t0);

    // Schedule harmony (sine — soft bass)
    this.scheduleVoice(HARMONY, 'sine', 0.10, t0);

    // Fade out at the end
    const totalDur = MELODY.reduce((s, n) => s + n.dur, 0);
    const fadeStart = t0 + totalDur - 3.0;
    const fadeEnd = t0 + totalDur;
    this.gainNode.gain.setValueAtTime(0.18, fadeStart);
    this.gainNode.gain.linearRampToValueAtTime(0, fadeEnd);
  }

  /** Stop immediately. */
  stop(): void {
    this.stopped = true;
    for (const osc of this.scheduledOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.scheduledOscillators = [];
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  /** Total duration in seconds. */
  get durationS(): number {
    return MELODY.reduce((s, n) => s + n.dur, 0);
  }

  private scheduleVoice(
    notes: CreditNote[],
    waveform: OscillatorType,
    volume: number,
    startTime: number,
  ): void {
    let t = startTime;
    for (const note of notes) {
      if (note.freq > 0) {
        const osc = this.context.createOscillator();
        const env = this.context.createGain();

        osc.type = waveform;
        osc.frequency.setValueAtTime(note.freq, t);

        // Soft envelope
        env.gain.setValueAtTime(0.001, t);
        env.gain.exponentialRampToValueAtTime(volume, t + 0.04);
        env.gain.setValueAtTime(volume, t + note.dur * 0.7);
        env.gain.exponentialRampToValueAtTime(0.001, t + note.dur * 0.95);

        osc.connect(env);
        env.connect(this.gainNode!);

        osc.start(t);
        osc.stop(t + note.dur);
        this.scheduledOscillators.push(osc);
      }
      t += note.dur;
    }
  }
}

/** Exported for tests: the melody data */
export const CREDITS_MELODY = MELODY;
export const CREDITS_HARMONY = HARMONY;
