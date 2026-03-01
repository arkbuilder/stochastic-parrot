/**
 * Campaign Select Scene
 *
 * Intermediate screen between main menu and gameplay.
 * Shows available campaigns (base game + DLC packs) as selectable cards.
 * Tapping a campaign launches the corresponding overworld.
 *
 * Navigation: tap/click cards, arrow keys ↑↓ + Enter, or BACK to return.
 */

import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { drawSkyGradient, drawOceanGradient, drawStars, drawVignette, drawButton, roundRect, rgba, drawShip } from '../rendering/draw';
import { listDlcManifests } from '../dlc/dlc-registry';
import type { DlcManifest } from '../dlc/types';

// ── Public types ─────────────────────────────────────────────

/** Represents a selectable campaign in the campaign list */
export interface CampaignOption {
  /** 'base' for the main game or the DLC manifest ID */
  id: string;
  title: string;
  subtitle: string;
  islandCount: number;
  conceptCount: number;
  /** Accent color for the card (hex) */
  color: string;
}

export interface CampaignSelectDeps {
  onCampaignSelect: (campaignId: string) => void;
  onBack: () => void;
}

// ── Layout constants ─────────────────────────────────────────

interface Rect { x: number; y: number; w: number; h: number }

const BACK_BUTTON: Rect = { x: 8, y: 8, w: 52, h: 24 };
const CARD_X = 16;
const CARD_W = GAME_WIDTH - 32;
const CARD_H = 68;
const CARD_GAP = 8;
const FIRST_CARD_Y = 94;

const BASE_CAMPAIGN: CampaignOption = {
  id: 'base',
  title: 'Memory Sea',
  subtitle: 'The original AI/ML adventure',
  islandCount: 5,
  conceptCount: 15,
  color: '#22d3ee',
};

/** Color palette for DLC cards (cycles) */
const DLC_COLORS = ['#f97316', '#a855f7', '#10b981', '#f43f5e', '#6366f1'];

// ── Pure logic (exported for testing) ────────────────────────

/**
 * Build the list of available campaigns from the DLC registry.
 * Always includes the base campaign first, then registered DLCs.
 */
export function buildCampaignList(): CampaignOption[] {
  const campaigns: CampaignOption[] = [BASE_CAMPAIGN];

  const manifests: DlcManifest[] = listDlcManifests();
  for (let i = 0; i < manifests.length; i++) {
    const m = manifests[i]!;
    campaigns.push({
      id: m.id,
      title: m.title,
      subtitle: m.description,
      islandCount: m.islandCount,
      conceptCount: m.conceptCount,
      color: DLC_COLORS[i % DLC_COLORS.length]!,
    });
  }

  return campaigns;
}

/**
 * Compute card rects for the campaign list.
 */
export function computeCardRects(count: number): Rect[] {
  const rects: Rect[] = [];
  for (let i = 0; i < count; i++) {
    rects.push({
      x: CARD_X,
      y: FIRST_CARD_Y + i * (CARD_H + CARD_GAP),
      w: CARD_W,
      h: CARD_H,
    });
  }
  return rects;
}

// ── Scene ────────────────────────────────────────────────────

export class CampaignSelectScene implements Scene {
  private elapsed = 0;
  private selectedIndex = 0;
  private campaigns: CampaignOption[] = [];
  private rects: Rect[] = [];

  constructor(private readonly deps: CampaignSelectDeps) {}

  enter(_context: SceneContext): void {
    this.elapsed = 0;
    this.selectedIndex = 0;
    this.campaigns = buildCampaignList();
    this.rects = computeCardRects(this.campaigns.length);
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsed += dt;

    for (const action of actions) {
      if (action.type === 'secondary') {
        this.deps.onBack();
        return;
      }

      if (action.type === 'move') {
        if (action.dy !== 0 && this.campaigns.length > 0) {
          this.selectedIndex = mod(this.selectedIndex + Math.sign(action.dy), this.campaigns.length);
        }
        continue;
      }

      if (action.type !== 'primary') continue;

      // Touch / click
      if (!Number.isNaN(action.x)) {
        if (isHit(action, BACK_BUTTON)) {
          this.deps.onBack();
          return;
        }

        // Card hit test
        for (let i = 0; i < this.rects.length; i++) {
          if (isHit(action, this.rects[i]!)) {
            this.selectedIndex = i;
            this.activateSelected();
            return;
          }
        }
        continue;
      }

      // Keyboard enter
      this.activateSelected();
      return;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;

    // Background
    drawSkyGradient(ctx, GAME_WIDTH, '#0b1628', '#162844', 160);
    drawStars(ctx, GAME_WIDTH, GAME_HEIGHT, t, 40);
    drawOceanGradient(ctx, GAME_WIDTH, 140, GAME_HEIGHT - 140, t);
    drawShip(ctx, 120, 180, t, false, false);
    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.45);

    // Back button
    drawButton(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 'BACK', false, 8);

    // Header
    ctx.fillStyle = TOKENS.colorCyan300;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText('CHOOSE YOUR VOYAGE', GAME_WIDTH / 2, 52);

    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('Select a campaign to play', GAME_WIDTH / 2, 70);

    // Campaign cards
    for (let i = 0; i < this.campaigns.length; i++) {
      const campaign = this.campaigns[i]!;
      const rect = this.rects[i]!;
      const selected = i === this.selectedIndex;
      this.renderCard(ctx, rect, campaign, selected, t);
    }

    // Input hint
    ctx.fillStyle = TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('Tap card or ↑↓ + Enter', GAME_WIDTH / 2, GAME_HEIGHT - 14);
  }

  // ── Private ─────────────────────────────────────────────────

  private activateSelected(): void {
    const campaign = this.campaigns[this.selectedIndex];
    if (campaign) {
      this.deps.onCampaignSelect(campaign.id);
    }
  }

  private renderCard(
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    campaign: CampaignOption,
    selected: boolean,
    t: number,
  ): void {
    // Card background
    ctx.fillStyle = selected ? 'rgba(30, 45, 70, 0.85)' : 'rgba(15, 23, 42, 0.7)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
    ctx.fill();

    // Selection border
    if (selected) {
      const pulse = 0.7 + Math.sin(t * 3) * 0.3;
      ctx.strokeStyle = rgba(campaign.color, pulse);
      ctx.lineWidth = 2;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = rgba(campaign.color, 0.3);
      ctx.lineWidth = 1;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
      ctx.stroke();
    }

    // Accent bar on left
    ctx.fillStyle = rgba(campaign.color, selected ? 0.9 : 0.5);
    roundRect(ctx, rect.x, rect.y, 4, rect.h, 2);
    ctx.fill();

    // Title
    ctx.fillStyle = selected ? campaign.color : TOKENS.colorText;
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'left';
    ctx.fillText(campaign.title, rect.x + 14, rect.y + 20);

    // Subtitle
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(campaign.subtitle, rect.x + 14, rect.y + 35);

    // Stats line
    ctx.fillStyle = selected ? TOKENS.colorCyan400 : TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(
      `${campaign.islandCount} islands · ${campaign.conceptCount} concepts`,
      rect.x + 14,
      rect.y + 52,
    );

    // Arrow indicator when selected
    if (selected) {
      const arrowPulse = 0.5 + Math.sin(t * 3) * 0.3;
      ctx.fillStyle = rgba(campaign.color, arrowPulse);
      ctx.font = TOKENS.fontMedium;
      ctx.textAlign = 'right';
      ctx.fillText('▶', rect.x + rect.w - 10, rect.y + rect.h / 2 + 4);
    }
  }
}

// ── Utilities ────────────────────────────────────────────────

function isHit(action: InputAction, rect: Rect): boolean {
  if (action.type !== 'primary' || Number.isNaN(action.x)) return false;
  return action.x >= rect.x && action.y >= rect.y &&
    action.x <= rect.x + rect.w && action.y <= rect.y + rect.h;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
