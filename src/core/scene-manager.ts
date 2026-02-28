import type { InputAction } from '../input/types';
import type { Scene, SceneContext } from './types';

export class SceneManager {
  private stack: Scene[] = [];
  private readonly context: SceneContext;
  private transitionAlpha = 0;

  constructor(context: SceneContext) {
    this.context = context;
  }

  get activeScene(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  push(scene: Scene): void {
    this.stack.push(scene);
    scene.enter(this.context);
    this.transitionAlpha = 1;
  }

  pop(): Scene | undefined {
    const scene = this.stack.pop();
    if (scene) {
      scene.exit();
      this.transitionAlpha = 1;
    }
    return scene;
  }

  replace(scene: Scene): void {
    const current = this.stack.pop();
    if (current) {
      current.exit();
    }

    this.stack.push(scene);
    scene.enter(this.context);
    this.transitionAlpha = 1;
  }

  update(dt: number, actions: InputAction[]): void {
    this.activeScene?.update(dt, actions);
    this.transitionAlpha = Math.max(0, this.transitionAlpha - dt * 4);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.activeScene?.render(ctx);
    if (this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(2, 6, 23, ${this.transitionAlpha * 0.35})`;
      ctx.fillRect(0, 0, 240, 400);
    }
  }
}
