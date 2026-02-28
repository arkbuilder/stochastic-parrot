import { GAME_WIDTH } from '../core/types';
import type { ConceptCard } from '../entities/concept-card';
import type { LandmarkEntity } from '../entities/landmark';
import { TOKENS } from './tokens';

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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, GAME_WIDTH, 56);

  ctx.fillStyle = TOKENS.colorText;
  ctx.font = TOKENS.fontSmall;
  ctx.textAlign = 'left';
  ctx.fillText('MINIMAP', 6, 12);

  const miniMapX = 6;
  const miniMapY = 16;
  const miniMapW = 60;
  const miniMapH = 36;
  ctx.strokeStyle = TOKENS.colorCyan400;
  ctx.strokeRect(miniMapX, miniMapY, miniMapW, miniMapH);

  for (const landmark of state.landmarks) {
    const x = miniMapX + (landmark.position.x / 240) * miniMapW;
    const y = miniMapY + (landmark.position.y / 400) * miniMapH;
    ctx.fillStyle = landmark.state.placedConceptId ? TOKENS.colorYellow400 : TOKENS.colorCyan400;
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  renderBar(ctx, 82, 18, 120, 10, state.healthRatio, TOKENS.colorGreen400, TOKENS.colorRed400);
  ctx.fillStyle = TOKENS.colorText;
  ctx.fillText('SHIP', 82, 12);
}

function renderBottomPanel(ctx: CanvasRenderingContext2D, state: HudRenderState): void {
  const panelY = 320;
  const panelHeight = 80;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, panelY, GAME_WIDTH, panelHeight);

  renderBar(ctx, 8, panelY + 8, GAME_WIDTH - 16, 8, state.timerRatio, TOKENS.colorCyan400, TOKENS.colorRed400);

  ctx.fillStyle = TOKENS.colorText;
  ctx.font = TOKENS.fontSmall;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${Math.floor(state.score)}`, 8, panelY + 30);

  ctx.fillText('TRY', 170, panelY + 30);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.attemptsUsed ? TOKENS.colorRed400 : '#4b5563';
    ctx.fillRect(198 + i * 10, panelY + 22, 8, 8);
  }

  if (state.phase === 'encoding') {
    renderConceptTray(ctx, state.conceptCards, panelY + 40);
  }
}

function renderConceptTray(ctx: CanvasRenderingContext2D, cards: ConceptCard[], y: number): void {
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, y, GAME_WIDTH, 40);

  for (const card of cards) {
    if (card.state.placed || card.state.dragging) {
      continue;
    }

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(card.position.x, card.position.y, card.bounds.w, card.bounds.h);
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(card.position.x, card.position.y, card.bounds.w, card.bounds.h);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText(card.state.iconGlyph, card.position.x + card.bounds.w / 2, card.position.y + 14);
  }
}

function renderBar(
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

  ctx.fillStyle = '#1f2937';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = clampedRatio < 0.25 ? criticalColor : goodColor;
  ctx.fillRect(x, y, width * clampedRatio, height);
}
