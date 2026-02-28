import { GAME_WIDTH } from '../core/types';
import type { ConceptCard } from '../entities/concept-card';
import type { LandmarkEntity } from '../entities/landmark';
import { TOKENS } from './tokens';
import { roundRect, rgba, drawConceptCard } from './draw';

export interface HudRenderState {
  phase: 'encoding' | 'recall' | 'reward';
  conceptCards: ConceptCard[];
  landmarks: LandmarkEntity[];
  timerRatio: number;
  healthRatio: number;
  score: number;
  attemptsUsed: number;
}

export function renderHud(ctx: CanvasRenderingContext2D, state: HudRenderState): void {
  renderTopBar(ctx, state);
  renderBottomPanel(ctx, state);
}

function renderTopBar(ctx: CanvasRenderingContext2D, state: HudRenderState): void {
  // Frosted panel background
  const grad = ctx.createLinearGradient(0, 0, 0, 56);
  grad.addColorStop(0, 'rgba(5,10,20,0.7)');
  grad.addColorStop(1, 'rgba(5,10,20,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, 56);

  // Minimap panel
  const miniMapX = 6;
  const miniMapY = 6;
  const miniMapW = 60;
  const miniMapH = 44;

  ctx.fillStyle = 'rgba(13,59,102,0.5)';
  roundRect(ctx, miniMapX, miniMapY, miniMapW, miniMapH, 4);
  ctx.fill();
  ctx.strokeStyle = rgba(TOKENS.colorCyan400, 0.5);
  ctx.lineWidth = 1;
  roundRect(ctx, miniMapX, miniMapY, miniMapW, miniMapH, 4);
  ctx.stroke();

  for (const landmark of state.landmarks) {
    const x = miniMapX + 3 + (landmark.position.x / 240) * (miniMapW - 6);
    const y = miniMapY + 3 + (landmark.position.y / 400) * (miniMapH - 6);
    const placed = !!landmark.state.placedConceptId;
    ctx.fillStyle = placed ? TOKENS.colorYellow400 : rgba(TOKENS.colorCyan400, 0.7);
    ctx.beginPath();
    ctx.arc(x, y, placed ? 2.5 : 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Health bar
  ctx.fillStyle = TOKENS.colorTextMuted;
  ctx.font = TOKENS.fontSmall;
  ctx.textAlign = 'left';
  ctx.fillText('HULL', 82, 14);
  renderRoundedBar(ctx, 82, 18, 120, 10, state.healthRatio, TOKENS.colorGreen400, TOKENS.colorRed400);

  // Score display
  ctx.fillStyle = TOKENS.colorYellow400;
  ctx.font = TOKENS.fontSmall;
  ctx.textAlign = 'left';
  ctx.fillText(`★ ${Math.floor(state.score)}`, 82, 44);
}

function renderBottomPanel(ctx: CanvasRenderingContext2D, state: HudRenderState): void {
  const panelY = 320;
  const panelHeight = 80;

  // Frosted panel bg
  const grad = ctx.createLinearGradient(0, panelY, 0, panelY + panelHeight);
  grad.addColorStop(0, 'rgba(5,10,20,0.45)');
  grad.addColorStop(1, 'rgba(5,10,20,0.75)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, panelY, GAME_WIDTH, panelHeight);

  // Timer bar with glow when low
  const timerGlow = state.timerRatio < 0.25;
  renderRoundedBar(ctx, 8, panelY + 6, GAME_WIDTH - 16, 6, state.timerRatio, TOKENS.colorCyan400, TOKENS.colorRed400);
  if (timerGlow) {
    ctx.fillStyle = rgba(TOKENS.colorRed400, 0.15);
    ctx.fillRect(0, panelY, GAME_WIDTH, panelHeight);
  }

  // Score + attempts row
  ctx.fillStyle = TOKENS.colorTextMuted;
  ctx.font = TOKENS.fontSmall;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${Math.floor(state.score)}`, 8, panelY + 26);

  // Attempt pips
  ctx.fillText('TRY', 170, panelY + 26);
  for (let i = 0; i < 3; i += 1) {
    const cx = 201 + i * 12;
    const cy = panelY + 22;
    if (i < state.attemptsUsed) {
      ctx.fillStyle = TOKENS.colorRed400;
    } else {
      ctx.fillStyle = '#334155';
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba('#e2e8f0', 0.2);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Concept tray (encoding phase only)
  if (state.phase === 'encoding') {
    renderConceptTray(ctx, state.conceptCards, panelY + 36);
  }
}

function renderConceptTray(ctx: CanvasRenderingContext2D, cards: ConceptCard[], y: number): void {
  // Tray background
  ctx.fillStyle = 'rgba(10,15,30,0.6)';
  roundRect(ctx, 2, y, GAME_WIDTH - 4, 42, 4);
  ctx.fill();

  for (const card of cards) {
    if (card.state.placed || card.state.dragging) {
      continue;
    }

    drawConceptCard(
      ctx,
      card.position.x, card.position.y,
      card.bounds.w, card.bounds.h,
      card.state.iconGlyph,
      card.state.label ?? '',
      false,
    );
  }
}

function renderRoundedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  ratio: number,
  goodColor: string,
  criticalColor: string,
): void {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const r = height / 2;

  // Track
  ctx.fillStyle = 'rgba(31,41,55,0.8)';
  roundRect(ctx, x, y, width, height, r);
  ctx.fill();

  // Fill
  if (clampedRatio > 0.01) {
    const fillW = Math.max(height, width * clampedRatio);
    const fillColor = clampedRatio < 0.25 ? criticalColor : goodColor;

    const grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, rgba(fillColor, 0.7));
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, fillW, height, r);
    ctx.fill();

    // Shine highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, x + 1, y + 1, fillW - 2, height / 2 - 1, r);
    ctx.fill();
  }

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, x, y, width, height, r);
  ctx.stroke();
}
