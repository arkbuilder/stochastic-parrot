import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';

type Rect = { x: number; y: number; w: number; h: number };

const START_BUTTON: Rect = {
  x: 64,
  y: 300,
  w: 112,
  h: 40,
};

export class MenuScene implements Scene {
  constructor(private readonly onStart: () => void) {}

  enter(context: SceneContext): void {
    void context;
  }

  exit(): void {}

  update(_dt: number, actions: InputAction[]): void {
    for (const action of actions) {
      if (action.type !== 'primary') {
        continue;
      }

      if (isPointInRect(action.x, action.y, START_BUTTON) || Number.isNaN(action.x)) {
        this.onStart();
        return;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = TOKENS.colorBackground;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Dead Reckoning', GAME_WIDTH / 2, 120);
    ctx.fillText('Memory Sea', GAME_WIDTH / 2, 142);

    ctx.fillStyle = TOKENS.colorPanel;
    ctx.fillRect(START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h);

    ctx.strokeStyle = TOKENS.colorYellow400;
    ctx.strokeRect(START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontMedium;
    ctx.fillText('START', GAME_WIDTH / 2, START_BUTTON.y + START_BUTTON.h / 2);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('Tap, click, or Enter', GAME_WIDTH / 2, 370);
  }
}

function isPointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}
