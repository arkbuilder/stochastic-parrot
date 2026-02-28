import { Clock } from './clock';
import type { SceneManager } from './scene-manager';
import type { Renderer } from '../rendering/renderer';
import type { InputAction } from '../input/types';

interface InputSource {
  poll(): InputAction[];
}

export class GameLoop {
  private running = false;
  private rafId = 0;
  private readonly clock = new Clock();

  constructor(
    private readonly sceneManager: SceneManager,
    private readonly inputManager: InputSource,
    private readonly renderer: Renderer,
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
    const actions = this.inputManager.poll();

    this.sceneManager.update(dt, actions);

    this.renderer.clear();
    this.sceneManager.render(this.renderer.offscreenContext);
    this.renderer.present();

    this.rafId = requestAnimationFrame(this.tick);
  };
}
