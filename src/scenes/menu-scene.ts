import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';

type Rect = { x: number; y: number; w: number; h: number };

const START_BUTTON: Rect = {
  x: 64,
  y: 280,
  w: 112,
  h: 34,
};

const LEADERBOARD_BUTTON: Rect = {
  x: 64,
  y: 322,
  w: 112,
  h: 30,
};

export class MenuScene implements Scene {
  constructor(
    private readonly onStart: () => void,
    private readonly onLeaderboard: () => void,
  ) {}

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

      if (isPointInRect(action.x, action.y, LEADERBOARD_BUTTON)) {
        this.onLeaderboard();
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

    ctx.fillStyle = TOKENS.colorPanel;
    ctx.fillRect(LEADERBOARD_BUTTON.x, LEADERBOARD_BUTTON.y, LEADERBOARD_BUTTON.w, LEADERBOARD_BUTTON.h);

    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(LEADERBOARD_BUTTON.x, LEADERBOARD_BUTTON.y, LEADERBOARD_BUTTON.w, LEADERBOARD_BUTTON.h);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('LEADERBOARD', GAME_WIDTH / 2, LEADERBOARD_BUTTON.y + LEADERBOARD_BUTTON.h / 2 + 1);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('Tap, click, or Enter', GAME_WIDTH / 2, 374);
  }
}

function isPointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}
