/**
 * @deprecated Superseded by SolavineSound SFX library (`src/audio/solavine/sfx-library.ts`).
 * AudioManager now delegates SFX to SolavineEngine.playSfx().
 * Kept for reference.
 */
import { AudioEvent } from './types';

export class SfxEngine {
  constructor(private readonly context: AudioContext, private readonly gain: GainNode) {}

  play(event: AudioEvent): void {
    const config = getSfxConfig(event);
    if (config.arp) {
      this.playArp(config.arp, config.type, config.duration);
    } else {
      this.playTone(config.freq, config.duration, config.type);
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType): void {
    const osc = this.context.createOscillator();
    const envelope = this.context.createGain();
    const now = this.context.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    envelope.gain.setValueAtTime(0.22, now + duration * 0.3);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(envelope);
    envelope.connect(this.gain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playArp(freqs: number[], type: OscillatorType, totalDuration: number): void {
    const stepDur = totalDuration / freqs.length;
    const now = this.context.currentTime;

    for (let i = 0; i < freqs.length; i++) {
      const osc = this.context.createOscillator();
      const env = this.context.createGain();
      const start = now + i * stepDur;

      osc.type = type;
      osc.frequency.setValueAtTime(freqs[i] ?? 440, start);

      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
      env.gain.setValueAtTime(0.18, start + stepDur * 0.5);
      env.gain.exponentialRampToValueAtTime(0.0001, start + stepDur * 0.95);

      osc.connect(env);
      env.connect(this.gain);

      osc.start(start);
      osc.stop(start + stepDur + 0.02);
    }
  }
}

interface SfxConfig {
  freq: number;
  duration: number;
  type: OscillatorType;
  arp?: number[];
}

function getSfxConfig(event: AudioEvent): SfxConfig {
  switch (event) {
    case AudioEvent.ConceptPlaced:
      return { freq: 523, duration: 0.35, type: 'triangle', arp: [523, 659, 784] };
    case AudioEvent.RecallCorrect:
      return { freq: 660, duration: 0.4, type: 'triangle', arp: [392, 523, 659, 784] };
    case AudioEvent.RecallIncorrect:
      return { freq: 233, duration: 0.3, type: 'sawtooth', arp: [294, 233] };
    case AudioEvent.RecallTimeout:
      return { freq: 175, duration: 0.5, type: 'sawtooth', arp: [262, 233, 196, 175] };
    case AudioEvent.FogAdvance:
      return { freq: 147, duration: 0.25, type: 'sine', arp: [175, 147] };
    case AudioEvent.FogPushBack:
      return { freq: 392, duration: 0.3, type: 'triangle', arp: [330, 392, 523] };
    case AudioEvent.ChartFragmentEarned:
      return { freq: 784, duration: 0.6, type: 'triangle', arp: [523, 659, 784, 1047] };
    case AudioEvent.BitChirp:
      return { freq: 880, duration: 0.15, type: 'square', arp: [784, 880] };
    case AudioEvent.NemoFootstep:
      return { freq: 330, duration: 0.06, type: 'square' };
    case AudioEvent.CurtainOpen:
      return { freq: 130, duration: 1.2, type: 'sine', arp: [130, 147, 165, 196, 220, 262, 330, 392] };
    case AudioEvent.TypewriterTick:
      return { freq: 1200, duration: 0.03, type: 'square' };
    case AudioEvent.EnemyBurrow:
      return { freq: 110, duration: 0.5, type: 'sawtooth', arp: [110, 147, 175, 220] };
    case AudioEvent.FreezeBlast:
      return { freq: 880, duration: 0.6, type: 'sine', arp: [880, 784, 659, 523, 440] };
    default:
      return { freq: 440, duration: 0.2, type: 'triangle' };
  }
}
