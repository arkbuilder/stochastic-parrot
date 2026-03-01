/**
 * Campaign Select Scene — Horizontal Carousel
 *
 * Intermediate screen between main menu and gameplay.
 * Shows available campaigns (base game + DLC packs) in a horizontal
 * carousel — one large card at a time with left/right navigation.
 * Supports 4+ campaigns comfortably.
 *
 * Navigation: ←→ arrows to browse, tap card / Enter to launch,
 *             tap left/right edges or BACK to return.
 */

import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { drawSkyGradient, drawOceanGradient, drawStars, drawVignette, drawButton, roundRect, rgba, drawShip } from '../rendering/draw';
import { listDlcManifests } from '../dlc/dlc-registry';
import type { DlcManifest } from '../dlc/types';

// ── Public types ─────────────────────────────────────────────

/** Represents a selectable campaign in the carousel */
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

export interface Rect { x: number; y: number; w: number; h: number }

const BACK_BUTTON: Rect = { x: 8, y: 8, w: 52, h: 24 };

/** The single visible card in the carousel (centred, large) */
export const CARD_RECT: Rect = { x: 28, y: 100, w: 184, h: 200 };

/** Touch region for the left arrow */
export const ARROW_LEFT_RECT: Rect = { x: 0, y: 160, w: 28, h: 80 };

/** Touch region for the right arrow */
export const ARROW_RIGHT_RECT: Rect = { x: 212, y: 160, w: 28, h: 80 };

/** Dot indicator area (centred row below card) */
const DOT_Y = 320;
const DOT_RADIUS = 4;
const DOT_GAP = 14;

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
 * Compute the x-offset for each dot indicator, centred horizontally.
 */
export function computeDotPositions(count: number): number[] {
  const totalWidth = (count - 1) * DOT_GAP;
  const startX = GAME_WIDTH / 2 - totalWidth / 2;
  const dots: number[] = [];
  for (let i = 0; i < count; i++) {
    dots.push(startX + i * DOT_GAP);
  }
  return dots;
}

// ── Scene ────────────────────────────────────────────────────

export class CampaignSelectScene implements Scene {
  private elapsed = 0;
  private selectedIndex = 0;
  private campaigns: CampaignOption[] = [];

  constructor(private readonly deps: CampaignSelectDeps) {}

  enter(_context: SceneContext): void {
    this.elapsed = 0;
    this.selectedIndex = 0;
    this.campaigns = buildCampaignList();
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
        if (action.dx !== 0 && this.campaigns.length > 0) {
          this.selectedIndex = mod(this.selectedIndex + Math.sign(action.dx), this.campaigns.length);
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

        // Left arrow tap
        if (isHit(action, ARROW_LEFT_RECT) && this.campaigns.length > 1) {
          this.selectedIndex = mod(this.selectedIndex - 1, this.campaigns.length);
          continue;
        }

        // Right arrow tap
        if (isHit(action, ARROW_RIGHT_RECT) && this.campaigns.length > 1) {
          this.selectedIndex = mod(this.selectedIndex + 1, this.campaigns.length);
          continue;
        }

        // Card tap — select current campaign
        if (isHit(action, CARD_RECT)) {
          this.activateSelected();
          return;
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

    // Current campaign card (single, large)
    const campaign = this.campaigns[this.selectedIndex];
    if (campaign) {
      this.renderCard(ctx, CARD_RECT, campaign, t);
    }

    // Left / right arrows (only when more than 1 campaign)
    if (this.campaigns.length > 1) {
      this.renderArrow(ctx, 'left', t);
      this.renderArrow(ctx, 'right', t);
    }

    // Dot indicators
    this.renderDots(ctx);

    // Input hint
    ctx.fillStyle = TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('\u2190 \u2192 to browse \u00b7 Tap to play', GAME_WIDTH / 2, GAME_HEIGHT - 14);
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
    t: number,
  ): void {
    // Card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();

    // Pulsing accent border
    const pulse = 0.7 + Math.sin(t * 3) * 0.3;
    ctx.strokeStyle = rgba(campaign.color, pulse);
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Accent bar on top
    ctx.fillStyle = rgba(campaign.color, 0.9);
    roundRect(ctx, rect.x, rect.y, rect.w, 4, 2);
    ctx.fill();

    // Campaign icon area (colour circle)
    const iconCx = rect.x + rect.w / 2;
    const iconCy = rect.y + 40;
    ctx.beginPath();
    ctx.arc(iconCx, iconCy, 18, 0, Math.PI * 2);
    ctx.fillStyle = rgba(campaign.color, 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(iconCx, iconCy, 12, 0, Math.PI * 2);
    ctx.fillStyle = campaign.color;
    ctx.fill();

    // Title
    ctx.fillStyle = campaign.color;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText(campaign.title, rect.x + rect.w / 2, rect.y + 80);

    // Subtitle (wrapped at ~28 chars for 184px width)
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(campaign.subtitle, rect.x + rect.w / 2, rect.y + 100);

    // Divider line
    ctx.strokeStyle = rgba(campaign.color, 0.3);
    ctx.beginPath();
    ctx.moveTo(rect.x + 20, rect.y + 115);
    ctx.lineTo(rect.x + rect.w - 20, rect.y + 115);
    ctx.stroke();

    // Stats
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.fillText(`${campaign.islandCount} islands`, rect.x + rect.w / 2, rect.y + 140);
    ctx.fillText(`${campaign.conceptCount} concepts`, rect.x + rect.w / 2, rect.y + 158);

    // "SET SAIL ▶" prompt at bottom of card
    const sailPulse = 0.6 + Math.sin(t * 2.5) * 0.4;
    ctx.fillStyle = rgba(campaign.color, sailPulse);
    ctx.font = TOKENS.fontMedium;
    ctx.fillText('SET SAIL \u25B6', rect.x + rect.w / 2, rect.y + 186);
  }

  private renderArrow(
    ctx: CanvasRenderingContext2D,
    direction: 'left' | 'right',
    t: number,
  ): void {
    const campaign = this.campaigns[this.selectedIndex];
    const color = campaign?.color ?? '#22d3ee';
    const bob = Math.sin(t * 2) * 2;
    const x = direction === 'left' ? 14 : GAME_WIDTH - 14;
    const y = 200 + bob;
    const arrow = direction === 'left' ? '\u25C0' : '\u25B6';

    ctx.fillStyle = rgba(color, 0.7);
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText(arrow, x, y);
  }

  private renderDots(ctx: CanvasRenderingContext2D): void {
    const count = this.campaigns.length;
    if (count <= 1) return;

    const dotXs = computeDotPositions(count);
    for (let i = 0; i < count; i++) {
      const active = i === this.selectedIndex;
      const campaign = this.campaigns[i]!;
      ctx.beginPath();
      ctx.arc(dotXs[i]!, DOT_Y, active ? DOT_RADIUS : DOT_RADIUS - 1, 0, Math.PI * 2);
      ctx.fillStyle = active ? campaign.color : 'rgba(255,255,255,0.25)';
      ctx.fill();
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
