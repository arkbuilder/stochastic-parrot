import type { MusicLayerName } from './types';

interface LayerNodes {
  osc: OscillatorNode;
  gain: GainNode;
}

export class MusicLayerEngine {
  private readonly layers = new Map<MusicLayerName, LayerNodes>();
  private started = false;

  constructor(private readonly context: AudioContext, private readonly destination: GainNode) {
    this.layers.set('base', this.createLayer(220, 'triangle'));
    this.layers.set('rhythm', this.createLayer(110, 'square'));
    this.layers.set('tension', this.createLayer(164, 'sawtooth'));
    this.layers.set('resolution', this.createLayer(330, 'triangle'));
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    for (const layer of this.layers.values()) {
      layer.osc.start();
      layer.gain.gain.value = 0;
    }

    this.setLayer('base', 0.18, 0.3);
  }

  setLayer(layerName: MusicLayerName, targetGain: number, fadeSeconds = 0.5): void {
    const layer = this.layers.get(layerName);
    if (!layer) {
      return;
    }

    const now = this.context.currentTime;
    layer.gain.gain.cancelScheduledValues(now);
    layer.gain.gain.linearRampToValueAtTime(targetGain, now + fadeSeconds);
  }

  transition(activeLayers: MusicLayerName[]): void {
    const target = new Set(activeLayers);

    for (const [name, nodes] of this.layers.entries()) {
      const now = this.context.currentTime;
      nodes.gain.gain.cancelScheduledValues(now);
      const gain = target.has(name) ? 0.18 : 0;
      nodes.gain.gain.linearRampToValueAtTime(gain, now + 0.5);
    }
  }

  stop(): void {
    for (const layer of this.layers.values()) {
      layer.osc.stop();
    }
    this.layers.clear();
  }

  private createLayer(frequency: number, type: OscillatorType): LayerNodes {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.destination);

    return { osc, gain };
  }
}
