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
  private muted = false;
  private masterVolume = 0.6;
  private musicVolume = 0.5;
  private sfxVolume = 0.6;

  initialize(): void {
    if (this.context) {
      return;
    }

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
    this.muted = muted;
    this.syncVolumes();
  }

  setMasterVolume(value: number): void {
    this.masterVolume = clamp01(value);
    this.syncVolumes();
  }

  setMusicVolume(value: number): void {
    this.musicVolume = clamp01(value);
    this.syncVolumes();
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = clamp01(value);
    this.syncVolumes();
  }

  getSnapshot(): { muted: boolean; masterVolume: number; musicVolume: number; sfxVolume: number } {
    return {
      muted: this.muted,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
    };
  }

  private syncVolumes(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }

    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }

    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
