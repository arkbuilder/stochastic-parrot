import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { drawButton, drawOceanGradient, drawSkyGradient, drawStars, drawShip, drawVignette, rgba } from '../rendering/draw';

// ── Public types (exported for testing) ──────────────────────

export type Rect = { x: number; y: number; w: number; h: number };

export type MenuItemId = 'resume' | 'play' | 'leaderboard' | 'bestiary';

export interface MenuItemConfig {
  id: MenuItemId;
  label: string;
  /** When true, button appears dimmed and activating it shows the hint instead of navigating */
  locked: boolean;
  /** Hint text shown when a locked item is activated (e.g. "Complete all 5 islands to unlock") */
  hint: string;
}

/**
 * Snapshot of game state needed to compute menu items.
 * Pure data — no callbacks, no side effects.
 */
export interface MenuState {
  hasResumableSession: boolean;
  hasBestiary: boolean;
}

/**
 * Dependencies injected into MenuScene — callbacks + state accessor.
 * Separating state from callbacks makes the pure logic testable.
 */
export interface MenuSceneDeps {
  /** Opens the campaign selection screen */
  onPlay: () => void;
  onResume: () => void;
  onLeaderboard: () => void;
  onBestiary: () => void;
  /** Optional voice bark for touched/clicked items */
  onSpeakMenuItem?: (label: string) => void;
  getMenuState: () => MenuState;
}

// ── Layout constants ─────────────────────────────────────────

const BUTTON_X = 48;
const BUTTON_W = 144;
const PRIMARY_H = 38;
const SECONDARY_H = 30;
const GAP = 4;
const FIRST_BUTTON_Y = 210;

const HINT_DURATION_S = 2.5;

// ── Pure logic (exported for unit testing) ───────────────────

/**
 * Compute the ordered list of menu items from current game state.
 * Pure function — no side effects, fully deterministic, easy to test.
 */
export function computeMenuItems(state: MenuState): MenuItemConfig[] {
  const items: MenuItemConfig[] = [];

  if (state.hasResumableSession) {
    items.push({ id: 'resume', label: 'RESUME', locked: false, hint: '' });
  }

  items.push({ id: 'play', label: 'PLAY', locked: false, hint: '' });

  items.push({ id: 'leaderboard', label: 'LEADERBOARD', locked: false, hint: '' });

  if (state.hasBestiary) {
    items.push({ id: 'bestiary', label: 'BESTIARY', locked: false, hint: '' });
  }

  return items;
}

/**
 * Compute pixel rects for a list of menu items.
 * Rects are centered horizontally, stacked vertically from FIRST_BUTTON_Y.
 * Primary items (resume, start) get taller buttons; secondary items get shorter ones.
 */
export function computeButtonRects(items: MenuItemConfig[]): Rect[] {
  let y = FIRST_BUTTON_Y;
  return items.map((item) => {
    const h = item.id === 'resume' || item.id === 'play' ? PRIMARY_H : SECONDARY_H;
    const rect: Rect = { x: BUTTON_X, y, w: BUTTON_W, h };
    y += h + GAP;
    return rect;
  });
}

// ── Scene ────────────────────────────────────────────────────

export class MenuScene implements Scene {
  private selectedIndex = 0;
  private elapsed = 0;
  private hintText = '';
  private hintTimer = 0;

  constructor(private readonly deps: MenuSceneDeps) {}

  enter(context: SceneContext): void {
    void context;
    this.elapsed = 0;
    this.hintText = '';
    this.hintTimer = 0;
    const items = computeMenuItems(this.deps.getMenuState());
    this.selectedIndex = items.findIndex((item) => item.id === 'play');
    if (this.selectedIndex < 0) {
      this.selectedIndex = 0;
    }
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsed += dt;

    if (this.hintTimer > 0) {
      this.hintTimer = Math.max(0, this.hintTimer - dt);
    }

    const items = computeMenuItems(this.deps.getMenuState());
    const rects = computeButtonRects(items);

    for (const action of actions) {
      if (action.type === 'move') {
        if (items.length === 0 || action.dy === 0) {
          continue;
        }

        this.selectedIndex = mod(this.selectedIndex + Math.sign(action.dy), items.length);
        continue;
      }

      if (action.type !== 'primary') {
        continue;
      }

      const selected = Number.isNaN(action.x)
        ? items[this.selectedIndex]
        : items.find((_, i) => {
            const r = rects[i];
            return r != null && isPointInRect(action.x, action.y, r);
          });

      if (!selected) {
        continue;
      }

      this.selectedIndex = items.findIndex((item) => item.id === selected.id);

      // Speak clicked/tapped item label in 80s voice (if wired)
      this.deps.onSpeakMenuItem?.(selected.label);

      // Locked items show hint instead of navigating
      if (selected.locked) {
        this.hintText = selected.hint;
        this.hintTimer = HINT_DURATION_S;
        continue;
      }

      this.activateItem(selected.id);
      return;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;
    const state = this.deps.getMenuState();
    const items = computeMenuItems(state);
    const rects = computeButtonRects(items);

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
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rect = rects[i];
      if (!item || !rect) continue;
      const selected = i === this.selectedIndex;
      const fontSize = item.id === 'leaderboard' ? 10 : 12;

      if (item.locked) {
        this.drawLockedButton(ctx, rect, item.label, selected, fontSize, t);
      } else {
        drawButton(ctx, rect.x, rect.y, rect.w, rect.h, item.label, selected, fontSize);
      }
    }

    // DLC hint toast
    if (this.hintTimer > 0 && this.hintText) {
      const alpha = Math.min(1, this.hintTimer / 0.3);
      ctx.fillStyle = rgba('#a78bfa', alpha * 0.85);
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.hintText, GAME_WIDTH / 2, FIRST_BUTTON_Y - 18);
    }

    // Input hint
    ctx.fillStyle = TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Tap / Click / Enter / Arrows', GAME_WIDTH / 2, GAME_HEIGHT - 18);
  }

  // ── Private helpers ──────────────────────────────────────

  private activateItem(id: MenuItemId): void {
    switch (id) {
      case 'resume':
        this.deps.onResume();
        break;
      case 'play':
        this.deps.onPlay();
        break;
      case 'leaderboard':
        this.deps.onLeaderboard();
        break;
      case 'bestiary':
        this.deps.onBestiary();
        break;
    }
  }

  private drawLockedButton(
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    label: string,
    selected: boolean,
    fontSize: number,
    t: number,
  ): void {
    // Dimmed background
    ctx.fillStyle = selected ? '#1a1a2e' : '#111118';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = selected ? '#7c3aed' : '#4c1d95';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = 1;

    // Lock icon + label
    const lockPulse = 0.5 + Math.sin(t * 2) * 0.15;
    ctx.fillStyle = rgba('#a78bfa', selected ? 0.9 : lockPulse);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`\u{1F512} ${label}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.textBaseline = 'alphabetic';
  }
}

// ── Utility (module-private) ─────────────────────────────────

function isPointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

function mod(value: number, length: number): number {
  return ((value % length) + length) % length;
}
