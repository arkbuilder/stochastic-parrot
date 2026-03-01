/**
 * CinematicScene — plays a CinematicSequence as a full Scene.
 *
 * Flow: beat 0 → beat 1 → … → beat N → onDone()
 *
 * Each beat shows for durationS seconds (or until tap if waitForTap).
 * A tap during auto-advance speeds up the typewriter; a second tap skips.
 * Caption text uses a typewriter reveal effect.
 */

import type { Scene, SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import type { CinematicSequence } from './types';
import type { AudioManager } from '../audio/audio-manager';
import { renderBeat, renderTapPrompt } from './beat-renderer';

const TYPE_SPEED_MS = 30;       // normal typewriter speed
const TYPE_SPEED_FAST_MS = 6;   // speed when tapping
const TRANSITION_FADE_S = 0.35; // fade between beats

export class CinematicScene implements Scene {
  private beatIndex = 0;
  private beatElapsed = 0;
  private elapsed = 0;
  private typewriterTimer = 0;
  private typewriterProgress = 0;
  private fastMode = false;
  private beatTextDone = false;
  private transitioning = false;
  private transitionTimer = 0;
  private finished = false;

  constructor(
    private readonly sequence: CinematicSequence,
    private readonly onDone: () => void,
    private readonly audio?: AudioManager,
  ) {}

  get currentBeatIndex(): number { return this.beatIndex; }

  enter(_context: SceneContext): void {
    this.beatIndex = 0;
    this.beatElapsed = 0;
    this.elapsed = 0;
    this.typewriterTimer = 0;
    this.typewriterProgress = 0;
    this.fastMode = false;
    this.beatTextDone = false;
    this.transitioning = false;
    this.transitionTimer = 0;
    this.finished = false;
    this.playBeatAudio();
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsed += dt;
    this.beatElapsed += dt;

    const beat = this.sequence.beats[this.beatIndex];
    if (!beat) {
      if (!this.finished) {
        this.finished = true;
        this.onDone();
      }
      return;
    }

    // Transition fade between beats
    if (this.transitioning) {
      this.transitionTimer += dt;
      if (this.transitionTimer >= TRANSITION_FADE_S) {
        this.transitioning = false;
        this.transitionTimer = 0;
        this.advanceBeat();
      }
      return;
    }

    // Typewriter for caption
    const captionLen = beat.caption?.length ?? 0;
    if (captionLen > 0 && this.typewriterProgress < captionLen) {
      const speed = this.fastMode ? TYPE_SPEED_FAST_MS : TYPE_SPEED_MS;
      this.typewriterTimer += dt * 1000;
      this.typewriterProgress = Math.min(captionLen, Math.floor(this.typewriterTimer / speed));
      if (this.typewriterProgress >= captionLen) {
        this.beatTextDone = true;
      }
    } else {
      this.beatTextDone = true;
    }

    // Input
    const hasTap = actions.some((a) => a.type === 'primary');
    if (hasTap) {
      if (!this.beatTextDone) {
        // First tap: speed up typewriter
        this.fastMode = true;
      } else {
        // Text done → advance
        this.beginTransition();
        return;
      }
    }

    // Auto-advance after durationS (only if not waitForTap)
    if (!beat.waitForTap && this.beatElapsed >= beat.durationS && this.beatTextDone) {
      this.beginTransition();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const beat = this.sequence.beats[this.beatIndex];
    if (!beat) return;

    // Camera shake
    const shakeIntensity = beat.shake ?? 0;
    const shake = {
      x: shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 6 : 0,
      y: shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 6 : 0,
    };

    renderBeat(ctx, beat, this.elapsed, this.typewriterProgress, shake);

    // "Tap to continue" prompt
    if (this.beatTextDone) {
      renderTapPrompt(ctx, this.elapsed);
    }

    // Transition fade
    if (this.transitioning) {
      const alpha = Math.min(1, this.transitionTimer / TRANSITION_FADE_S);
      ctx.fillStyle = `rgba(2,6,23,${alpha * 0.9})`;
      ctx.fillRect(0, 0, 240, 400);
    }
  }

  private beginTransition(): void {
    this.transitioning = true;
    this.transitionTimer = 0;
  }

  private advanceBeat(): void {
    this.beatIndex++;
    if (this.beatIndex >= this.sequence.beats.length) {
      if (!this.finished) {
        this.finished = true;
        this.onDone();
      }
      return;
    }
    this.beatElapsed = 0;
    this.typewriterTimer = 0;
    this.typewriterProgress = 0;
    this.fastMode = false;
    this.beatTextDone = false;
    this.playBeatAudio();
  }

  /** Play SFX / apply music preset for the current beat if audio is wired. */
  private playBeatAudio(): void {
    if (!this.audio) return;
    const beat = this.sequence.beats[this.beatIndex];
    if (!beat) return;

    if (beat.sfxEvent) {
      this.audio.play(beat.sfxEvent);
    }
    if (beat.musicPreset) {
      this.audio.applyEncounterPreset(beat.musicPreset);
    }
    if (beat.songId) {
      this.audio.playSong(beat.songId);
    }
  }
}
