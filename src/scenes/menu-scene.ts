import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { drawButton, drawOceanGradient, drawSkyGradient, drawStars, drawShip, drawVignette, rgba } from '../rendering/draw';

type Rect = { x: number; y: number; w: number; h: number };

type MenuItem = 'resume' | 'start' | 'leaderboard';

type MenuButton = {
  item: MenuItem;
  label: string;
  rect: Rect;
};

const RESUME_BUTTON: Rect = {
  x: 48,
  y: 238,
  w: 144,
  h: 38,
};

const START_BUTTON: Rect = {
  x: 48,
  y: 280,
  w: 144,
  h: 38,
};

const LEADERBOARD_BUTTON: Rect = {
  x: 48,
  y: 326,
  w: 144,
  h: 32,
};

export class MenuScene implements Scene {
  private selectedIndex = 0;
  private elapsed = 0;

  constructor(
    private readonly onStart: () => void,
    private readonly onLeaderboard: () => void,
    private readonly onResume?: () => void,
    private readonly hasResume?: () => boolean,
  ) {}

  enter(context: SceneContext): void {
    void context;
    this.elapsed = 0;
    this.selectedIndex = this.getButtons().findIndex((button) => button.item === 'start');
    if (this.selectedIndex < 0) {
      this.selectedIndex = 0;
    }
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsed += dt;

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
    const t = this.elapsed;

    // Sky gradient
    drawSkyGradient(ctx, GAME_WIDTH, '#0b1628', '#162844', 160);

    // Stars
    drawStars(ctx, GAME_WIDTH, GAME_HEIGHT, t, 50);

    // Ocean
    drawOceanGradient(ctx, GAME_WIDTH, 140, GAME_HEIGHT - 140, t);

    // Ship silhouette on the sea
    drawShip(ctx, 120, 180, t, false, false);

    // Vignette
    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.5);

    // Title glow
    const titleGlow = 0.4 + Math.sin(t * 1.5) * 0.15;
    ctx.fillStyle = rgba('#22d3ee', titleGlow);
    ctx.font = TOKENS.fontTitle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEAD RECKONING', GAME_WIDTH / 2, 80);

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.fillText('Memory Sea', GAME_WIDTH / 2, 102);

    // Subtitle
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('A Pirate AI Adventure', GAME_WIDTH / 2, 122);

    // Buttons
    const buttons = this.getButtons();
    for (let index = 0; index < buttons.length; index += 1) {
      const button = buttons[index];
      if (!button) continue;
      const selected = index === this.selectedIndex;
      const fontSize = button.item === 'leaderboard' ? 10 : 12;
      drawButton(ctx, button.rect.x, button.rect.y, button.rect.w, button.rect.h, button.label, selected, fontSize);
    }

    // Input hint
    ctx.fillStyle = TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('Tap / Click / Enter / Arrows', GAME_WIDTH / 2, GAME_HEIGHT - 18);
    ctx.textBaseline = 'alphabetic';
  }

  private getButtons(): MenuButton[] {
    const buttons: MenuButton[] = [];
    if (this.hasResume?.() && this.onResume) {
      buttons.push({ item: 'resume', label: 'RESUME', rect: RESUME_BUTTON });
    }

    buttons.push({ item: 'start', label: 'NEW VOYAGE', rect: START_BUTTON });
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
