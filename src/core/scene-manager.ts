import type { InputAction } from '../input/types';
import type { Scene, SceneContext } from './types';

export class SceneManager {
  private stack: Scene[] = [];
  private readonly context: SceneContext;

  constructor(context: SceneContext) {
    this.context = context;
  }

  get activeScene(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  push(scene: Scene): void {
    this.stack.push(scene);
    scene.enter(this.context);
  }

  pop(): Scene | undefined {
    const scene = this.stack.pop();
    if (scene) {
      scene.exit();
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
  }

  update(dt: number, actions: InputAction[]): void {
    this.activeScene?.update(dt, actions);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.activeScene?.render(ctx);
  }
}
