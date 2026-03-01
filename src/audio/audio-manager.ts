/**
 * AudioManager — thin adapter over SolavineEngine.
 *
 * Public API is a superset of the old AudioManager so every existing
 * scene can keep calling `play(AudioEvent.X)` and `setMusicLayers(...)`.
 *
 * New capabilities exposed:
 *   - `playSong(id)` — start a named procedural song
 *   - `selectIslandTheme(islandId)` — convenience for island songs
 *   - `applyEncounterPreset(key)` — set layers via encounter preset
 *   - `playFanfare(id)` — play a non-looping fanfare
 *   - `stopSong()` — stop current song
 */
import { AudioEvent, type MusicLayerName } from './types';
import { SolavineEngine, SolavineEvent } from './solavine';

/**
 * Build a lookup from AudioEvent string value → SolavineEvent enum member.
 * Because both enums share identical string values this is a direct map.
 */
const EVENT_MAP: Record<string, SolavineEvent> = (() => {
  const map: Record<string, SolavineEvent> = {};
  for (const key of Object.keys(SolavineEvent) as Array<keyof typeof SolavineEvent>) {
    const value = SolavineEvent[key];
    map[value] = value as SolavineEvent;
  }
  return map;
})();

export class AudioManager {
  private engine = new SolavineEngine();

  /* ── Lifecycle ── */

  initialize(): void {
    this.engine.initialize();
  }

  async resume(): Promise<void> {
    await this.engine.resume();
  }

  dispose(): void {
    this.engine.dispose();
  }

  /* ── SFX ── */

  /** Play a one-shot SFX by AudioEvent or SolavineEvent key. */
  play(event: AudioEvent): void {
    const solavineEvent = EVENT_MAP[event as string];
    if (solavineEvent) {
      this.engine.playSfx(solavineEvent);
    }
  }

  /* ── Adaptive Music Layers ── */

  setMusicLayers(layers: MusicLayerName[]): void {
    // MusicLayerName is now a subset of SolavineMusicLayer — cast is safe
    this.engine.setMusicLayers(layers);
  }

  /* ── Song Playback (new) ── */

  /** Start a named song (e.g. 'island_01', 'overworld', 'combat'). */
  playSong(songId: string): void {
    this.engine.playSong(songId);
  }

  /** Select the song matching an island ID (shorthand for playSong). */
  selectIslandTheme(islandId: string): void {
    this.engine.selectIslandTheme(islandId);
  }

  /** Apply an encounter music preset by key (sets layers automatically). */
  applyEncounterPreset(presetKey: string): void {
    this.engine.applyEncounterPreset(presetKey);
  }

  /** Play a non-looping fanfare by ID. */
  playFanfare(fanfareId: string): void {
    this.engine.playSong(fanfareId);
  }

  /** Stop the current song / fanfare. */
  stopSong(): void {
    this.engine.stopSong();
  }

  /* ── Volume Controls ── */

  setMuted(muted: boolean): void {
    this.engine.setMuted(muted);
  }

  setMasterVolume(value: number): void {
    this.engine.setMasterVolume(value);
  }

  setMusicVolume(value: number): void {
    this.engine.setMusicVolume(value);
  }

  setSfxVolume(value: number): void {
    this.engine.setSfxVolume(value);
  }

  getSnapshot(): {
    muted: boolean;
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    currentSong: string | null;
    activeLayers: string[];
  } {
    return this.engine.getSnapshot();
  }
}
