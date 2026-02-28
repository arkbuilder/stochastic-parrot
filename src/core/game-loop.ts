import { Clock } from './clock';
import type { SceneManager } from './scene-manager';
import type { Renderer } from '../rendering/renderer';
import type { InputAction } from '../input/types';
import { ParticleSystem } from '../rendering/particles';

interface InputSource {
  poll(): InputAction[];
}

interface GameLoopOptions {
  onPerfCritical?: (frameTimeMs: number) => void;
}

export class GameLoop {
  private running = false;
  private rafId = 0;
  private readonly clock = new Clock();
  private longFrameStreak = 0;
  private lastSceneRef: unknown = null;

  constructor(
    private readonly sceneManager: SceneManager,
    private readonly inputManager: InputSource,
    private readonly renderer: Renderer,
    private readonly options: GameLoopOptions = {},
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.clock.reset();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (ts: number): void => {
    if (!this.running) {
      return;
    }

    const dt = this.clock.tick(ts);
    const frameTimeMs = dt * 1000;
    const activeScene = this.sceneManager.activeScene;
    if (activeScene !== this.lastSceneRef) {
      this.lastSceneRef = activeScene;
      this.longFrameStreak = 0;
      ParticleSystem.setPerformanceDisabled(false);
    }

    const isLongFrame = frameTimeMs > 33;
    ParticleSystem.setFrameSkip(isLongFrame);

    if (isLongFrame) {
      this.longFrameStreak += 1;
      if (this.longFrameStreak > 5) {
        ParticleSystem.setPerformanceDisabled(true);
      }
    } else {
      this.longFrameStreak = 0;
    }

    const actions = this.inputManager.poll();

    this.sceneManager.update(dt, actions);

    if (frameTimeMs > 100) {
      ParticleSystem.setFrameSkip(false);
      this.options.onPerfCritical?.(frameTimeMs);
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    this.renderer.clear();
    this.sceneManager.render(this.renderer.offscreenContext);
    this.renderer.present();
    ParticleSystem.setFrameSkip(false);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
