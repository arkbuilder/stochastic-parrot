import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';

type Rect = { x: number; y: number; w: number; h: number };

type MenuItem = 'resume' | 'start' | 'leaderboard';

type MenuButton = {
  item: MenuItem;
  label: string;
  rect: Rect;
};

const RESUME_BUTTON: Rect = {
  x: 64,
  y: 238,
  w: 112,
  h: 34,
};

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
  private selectedIndex = 0;

  constructor(
    private readonly onStart: () => void,
    private readonly onLeaderboard: () => void,
    private readonly onResume?: () => void,
    private readonly hasResume?: () => boolean,
  ) {}

  enter(context: SceneContext): void {
    void context;
    this.selectedIndex = this.getButtons().findIndex((button) => button.item === 'start');
    if (this.selectedIndex < 0) {
      this.selectedIndex = 0;
    }
  }

  exit(): void {}

  update(_dt: number, actions: InputAction[]): void {
    for (const action of actions) {
      if (action.type === 'move') {
        const buttons = this.getButtons();
        if (buttons.length === 0 || action.dy === 0) {
          continue;
        }

        this.selectedIndex = mod(this.selectedIndex + Math.sign(action.dy), buttons.length);
        continue;
      }

      if (action.type !== 'primary') {
        continue;
      }

      const buttons = this.getButtons();
      const selected = Number.isNaN(action.x)
        ? buttons[this.selectedIndex]
        : buttons.find((button) => isPointInRect(action.x, action.y, button.rect));

      if (!selected) {
        continue;
      }

      this.selectedIndex = buttons.findIndex((button) => button.item === selected.item);

      if (selected.item === 'resume' && this.onResume) {
        this.onResume();
        return;
      }

      if (selected.item === 'start') {
        this.onStart();
        return;
      }

      if (selected.item === 'leaderboard') {
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
    const buttons = this.getButtons();
    for (let index = 0; index < buttons.length; index += 1) {
      const button = buttons[index];
      if (!button) {
        continue;
      }

      const selected = index === this.selectedIndex;
      ctx.fillStyle = TOKENS.colorPanel;
      ctx.fillRect(button.rect.x, button.rect.y, button.rect.w, button.rect.h);

      ctx.strokeStyle = selected ? TOKENS.colorYellow400 : TOKENS.colorCyan400;
      ctx.strokeRect(button.rect.x, button.rect.y, button.rect.w, button.rect.h);

      ctx.fillStyle = TOKENS.colorText;
      ctx.font = button.item === 'leaderboard' ? TOKENS.fontSmall : TOKENS.fontMedium;
      ctx.fillText(button.label, GAME_WIDTH / 2, button.rect.y + button.rect.h / 2 + (button.item === 'leaderboard' ? 1 : 0));
    }

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('Tap, click, or Enter/Arrows', GAME_WIDTH / 2, 374);
  }

  private getButtons(): MenuButton[] {
    const buttons: MenuButton[] = [];
    if (this.hasResume?.() && this.onResume) {
      buttons.push({ item: 'resume', label: 'RESUME', rect: RESUME_BUTTON });
    }

    buttons.push({ item: 'start', label: 'START', rect: START_BUTTON });
    buttons.push({ item: 'leaderboard', label: 'LEADERBOARD', rect: LEADERBOARD_BUTTON });
    return buttons;
  }
}

function isPointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

function mod(value: number, length: number): number {
  return ((value % length) + length) % length;
}
