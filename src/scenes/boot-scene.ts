import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';

export class BootScene implements Scene {
  private elapsed = 0;
  private ready = false;

  constructor(private readonly onReady: () => void) {}

  enter(context: SceneContext): void {
    void context;
    this.elapsed = 0;
    this.ready = false;
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    void actions;
    this.elapsed += dt;

    if (this.elapsed >= 0.4 && !this.ready) {
      this.ready = true;
      this.onReady();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = TOKENS.colorBackground;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading...', GAME_WIDTH / 2, GAME_HEIGHT / 2);
  }
}
