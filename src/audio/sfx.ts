import { AudioEvent } from './types';

export class SfxEngine {
  constructor(private readonly context: AudioContext, private readonly gain: GainNode) {}

  play(event: AudioEvent): void {
    const osc = this.context.createOscillator();
    const envelope = this.context.createGain();
    const now = this.context.currentTime;

    osc.type = 'square';
    const { freq, duration, type } = getSfxConfig(event);
    osc.frequency.setValueAtTime(freq, now);
    osc.type = type;

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(envelope);
    envelope.connect(this.gain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}

function getSfxConfig(event: AudioEvent): { freq: number; duration: number; type: OscillatorType } {
  switch (event) {
    case AudioEvent.ConceptPlaced:
      return { freq: 480, duration: 0.2, type: 'square' };
    case AudioEvent.RecallCorrect:
      return { freq: 660, duration: 0.22, type: 'triangle' };
    case AudioEvent.RecallIncorrect:
      return { freq: 210, duration: 0.2, type: 'sawtooth' };
    case AudioEvent.RecallTimeout:
      return { freq: 160, duration: 0.35, type: 'sawtooth' };
    case AudioEvent.FogAdvance:
      return { freq: 130, duration: 0.18, type: 'sine' };
    case AudioEvent.FogPushBack:
      return { freq: 430, duration: 0.2, type: 'triangle' };
    case AudioEvent.ChartFragmentEarned:
      return { freq: 740, duration: 0.35, type: 'triangle' };
    case AudioEvent.BitChirp:
      return { freq: 840, duration: 0.12, type: 'square' };
    case AudioEvent.NemoFootstep:
      return { freq: 320, duration: 0.08, type: 'square' };
    default:
      return { freq: 400, duration: 0.2, type: 'square' };
  }
}
