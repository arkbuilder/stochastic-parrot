import { AudioEvent, type MusicLayerName } from './types';
import { SfxEngine } from './sfx';
import { MusicLayerEngine } from './music-layer';

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private sfx: SfxEngine | null = null;
  private music: MusicLayerEngine | null = null;

  initialize(): void {
    if (this.context) {
      return;
    }

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();

    this.masterGain.gain.value = 0.6;
    this.musicGain.gain.value = 0.5;
    this.sfxGain.gain.value = 0.6;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    this.sfx = new SfxEngine(this.context, this.sfxGain);
    this.music = new MusicLayerEngine(this.context, this.musicGain);
    this.music.start();
  }

  async resume(): Promise<void> {
    if (!this.context) {
      this.initialize();
    }

    if (this.context && this.context.state !== 'running') {
      await this.context.resume();
    }
  }

  setMusicLayers(layers: MusicLayerName[]): void {
    this.music?.transition(layers);
  }

  play(event: AudioEvent): void {
    this.sfx?.play(event);
  }

  setMuted(muted: boolean): void {
    if (!this.masterGain) {
      return;
    }

    this.masterGain.gain.value = muted ? 0 : 0.6;
  }

  setMusicVolume(value: number): void {
    if (this.musicGain) {
      this.musicGain.gain.value = clamp01(value);
    }
  }

  setSfxVolume(value: number): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = clamp01(value);
    }
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
