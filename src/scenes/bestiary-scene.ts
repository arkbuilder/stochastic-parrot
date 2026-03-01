/**
 * Bestiary Scene — Monster Library
 *
 * A browseable catalogue of every creature and threat in the Memory Sea.
 * Two tabs: "CRITTERS" (island enemies) and "THREATS" (encounter hazards).
 * Selecting an entry shows a detail panel with animated preview, flavour
 * text, behaviour description, danger rating, and habitat list.
 *
 * Navigation: tap/click items, arrow keys, or tap "BACK" to return to menu.
 */

import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { type BestiaryEntry } from '../data/bestiary';
import {
  getAllBestiary, getBaseBestiary, getDlcBestiary, getMergedDlcIds,
} from '../data/game-data';
import { drawSkyGradient, drawVignette, drawStars, drawButton, roundRect, rgba, drawEnemy, drawOceanGradient, drawFlora, drawTerrain } from '../rendering/draw';

type ViewMode = 'list' | 'detail';
type Tab = 'critters' | 'threats' | 'flora' | 'terrain';
/** 'all' = merged, 'base' = base game only, or a DLC manifest ID */
type BestiarySource = 'all' | 'base' | string;

interface Rect { x: number; y: number; w: number; h: number }

const BACK_BUTTON: Rect = { x: 8, y: 8, w: 52, h: 24 };
const SOURCE_BUTTON: Rect = { x: 140, y: 8, w: 92, h: 24 };
const TAB_CRITTERS: Rect = { x: 8, y: 40, w: 54, h: 24 };
const TAB_THREATS: Rect = { x: 65, y: 40, w: 54, h: 24 };
const TAB_FLORA: Rect = { x: 122, y: 40, w: 54, h: 24 };
const TAB_TERRAIN: Rect = { x: 179, y: 40, w: 54, h: 24 };

const LIST_TOP = 72;
const LIST_ROW_H = 32;
const LIST_VISIBLE_ROWS = 9;
const LIST_LEFT = 12;
const LIST_WIDTH = 216;

const DETAIL_BACK: Rect = { x: 8, y: 8, w: 52, h: 24 };
const DETAIL_PREVIEW_Y = 80;
const DETAIL_TEXT_TOP = 170;

export class BestiaryScene implements Scene {
  private elapsed = 0;
  private mode: ViewMode = 'list';
  private tab: Tab = 'critters';
  private source: BestiarySource = 'all';
  private selectedIndex = 0;
  private scrollOffset = 0;
  private detailEntry: BestiaryEntry | null = null;

  constructor(private readonly onBack: () => void) {}

  enter(_context: SceneContext): void {
    this.elapsed = 0;
    this.mode = 'list';
    this.tab = 'critters';
    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.detailEntry = null;
  }

  exit(): void {}

  // ── Update ──────────────────────────────────────────────────

  update(dt: number, actions: InputAction[]): void {
    this.elapsed += dt;

    for (const action of actions) {
      if (this.mode === 'list') {
        this.updateList(action);
      } else {
        this.updateDetail(action);
      }
    }
  }

  private updateList(action: InputAction): void {
    if (action.type === 'move') {
      if (action.dy !== 0) {
        const entries = this.currentEntries();
        if (entries.length > 0) {
          this.selectedIndex = mod(this.selectedIndex + Math.sign(action.dy), entries.length);
          this.ensureVisible();
        }
      }
      return;
    }

    if (action.type === 'secondary') {
      this.onBack();
      return;
    }

    if (action.type !== 'primary') return;

    // Tap-based navigation
    if (!Number.isNaN(action.x)) {
      if (isHit(action, BACK_BUTTON)) { this.onBack(); return; }
      if (isHit(action, SOURCE_BUTTON)) { this.cycleSource(); return; }
      if (isHit(action, TAB_CRITTERS)) { this.switchTab('critters'); return; }
      if (isHit(action, TAB_THREATS)) { this.switchTab('threats'); return; }
      if (isHit(action, TAB_FLORA)) { this.switchTab('flora'); return; }
      if (isHit(action, TAB_TERRAIN)) { this.switchTab('terrain'); return; }

      // Check row hits
      const entries = this.currentEntries();
      for (let i = 0; i < Math.min(LIST_VISIBLE_ROWS, entries.length); i++) {
        const rowY = LIST_TOP + i * LIST_ROW_H;
        const rowRect: Rect = { x: LIST_LEFT, y: rowY, w: LIST_WIDTH, h: LIST_ROW_H - 2 };
        if (isHit(action, rowRect)) {
          this.selectedIndex = this.scrollOffset + i;
          this.openDetail();
          return;
        }
      }
      return;
    }

    // Keyboard enter → open detail
    this.openDetail();
  }

  private updateDetail(action: InputAction): void {
    if (action.type === 'secondary') {
      this.closeDetail();
      return;
    }

    if (action.type === 'move') {
      // Left/right to browse prev/next entry
      if (action.dx && action.dx !== 0) {
        const entries = this.currentEntries();
        if (entries.length > 0) {
          this.selectedIndex = mod(this.selectedIndex + Math.sign(action.dx), entries.length);
          this.detailEntry = entries[this.selectedIndex] ?? null;
        }
      }
      return;
    }

    if (action.type !== 'primary') return;

    if (!Number.isNaN(action.x)) {
      if (isHit(action, DETAIL_BACK)) { this.closeDetail(); return; }
      // Tap left/right halves to browse
      if (action.x < GAME_WIDTH / 2 - 20) { this.browseDetail(-1); return; }
      if (action.x > GAME_WIDTH / 2 + 20) { this.browseDetail(1); return; }
      return;
    }

    // Keyboard enter → go back to list
    this.closeDetail();
  }

  // ── Render ──────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;

    // Background
    drawSkyGradient(ctx, GAME_WIDTH, '#0b1628', '#162844', 160);
    drawStars(ctx, GAME_WIDTH, 160, t, 30);
    drawOceanGradient(ctx, GAME_WIDTH, 160, GAME_HEIGHT - 160, t);
    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.4);

    if (this.mode === 'list') {
      this.renderList(ctx, t);
    } else {
      this.renderDetail(ctx, t);
    }
  }

  private renderList(ctx: CanvasRenderingContext2D, t: number): void {
    // Back button
    drawButton(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 'BACK', false, 8);

    // Source toggle (only show if DLC content exists)
    if (getMergedDlcIds().length > 0) {
      const sourceLabel = this.getSourceLabel();
      drawButton(ctx, SOURCE_BUTTON.x, SOURCE_BUTTON.y, SOURCE_BUTTON.w, SOURCE_BUTTON.h, sourceLabel, true, 8);
    }

    // Tabs
    this.renderTab(ctx, TAB_CRITTERS, 'CRITTERS', this.tab === 'critters');
    this.renderTab(ctx, TAB_THREATS, 'THREATS', this.tab === 'threats');
    this.renderTab(ctx, TAB_FLORA, 'FLORA', this.tab === 'flora');
    this.renderTab(ctx, TAB_TERRAIN, 'GROUND', this.tab === 'terrain');

    // Entry rows
    const entries = this.currentEntries();
    const visibleCount = Math.min(LIST_VISIBLE_ROWS, entries.length - this.scrollOffset);

    if (entries.length === 0) {
      ctx.fillStyle = TOKENS.colorTextMuted;
      ctx.font = TOKENS.fontMedium;
      ctx.textAlign = 'center';
      ctx.fillText('No entries yet', GAME_WIDTH / 2, LIST_TOP + 40);
      return;
    }

    for (let i = 0; i < visibleCount; i++) {
      const entryIdx = this.scrollOffset + i;
      const entry = entries[entryIdx]!;
      const y = LIST_TOP + i * LIST_ROW_H;
      const selected = entryIdx === this.selectedIndex;

      // Row background
      ctx.fillStyle = selected ? 'rgba(34,211,238,0.12)' : 'rgba(15,23,42,0.5)';
      roundRect(ctx, LIST_LEFT, y, LIST_WIDTH, LIST_ROW_H - 2, 4);
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = TOKENS.colorCyan400;
        ctx.lineWidth = 1;
        roundRect(ctx, LIST_LEFT, y, LIST_WIDTH, LIST_ROW_H - 2, 4);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // Mini sprite preview
      if (entry.category === 'critter') {
        drawEnemy(ctx, LIST_LEFT + 14, y + 15, entry.renderHint, t);
      } else if (entry.category === 'flora') {
        drawFlora(ctx, LIST_LEFT + 14, y + 15, entry.renderHint, t, 0.8);
      } else if (entry.category === 'terrain') {
        drawTerrain(ctx, LIST_LEFT + 14, y + 15, entry.renderHint, t, 0.8);
      } else {
        this.drawThreatIcon(ctx, LIST_LEFT + 14, y + 15, entry.renderHint, t);
      }

      // Name
      ctx.fillStyle = selected ? TOKENS.colorCyan300 : TOKENS.colorText;
      ctx.font = TOKENS.fontMedium;
      ctx.textAlign = 'left';
      ctx.fillText(entry.name, LIST_LEFT + 32, y + 13);

      // Danger pips
      this.drawDangerPips(ctx, LIST_LEFT + 32, y + 22, entry.danger);

      // Chevron
      if (selected) {
        ctx.fillStyle = TOKENS.colorCyan400;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'right';
        ctx.fillText('>', LIST_LEFT + LIST_WIDTH - 8, y + 15);
      }
    }

    // Scroll indicators
    if (this.scrollOffset > 0) {
      ctx.fillStyle = TOKENS.colorTextMuted;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('▲', GAME_WIDTH / 2, LIST_TOP - 4);
    }
    if (this.scrollOffset + LIST_VISIBLE_ROWS < entries.length) {
      ctx.fillStyle = TOKENS.colorTextMuted;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('▼', GAME_WIDTH / 2, LIST_TOP + LIST_VISIBLE_ROWS * LIST_ROW_H + 6);
    }

    // Input hint
    ctx.fillStyle = TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('Tap entry or ↑↓ + Enter', GAME_WIDTH / 2, GAME_HEIGHT - 14);
  }

  private renderDetail(ctx: CanvasRenderingContext2D, t: number): void {
    if (!this.detailEntry) return;
    const entry = this.detailEntry;

    // Back button
    drawButton(ctx, DETAIL_BACK.x, DETAIL_BACK.y, DETAIL_BACK.w, DETAIL_BACK.h, 'BACK', false, 8);

    // Title
    ctx.fillStyle = TOKENS.colorCyan300;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText(entry.name, GAME_WIDTH / 2, 52);

    // Category badge
    const badgeColor = entry.category === 'critter'
      ? TOKENS.colorGreen400
      : entry.category === 'flora'
        ? TOKENS.colorCyan400
        : entry.category === 'terrain'
          ? TOKENS.colorYellow400
          : TOKENS.colorRed400;
    const badgeLabel = entry.category === 'critter'
      ? 'ISLAND CRITTER'
      : entry.category === 'flora'
        ? 'ISLAND FLORA'
        : entry.category === 'terrain'
          ? 'GROUND TILE'
          : 'SEA THREAT';
    ctx.fillStyle = badgeColor;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(badgeLabel, GAME_WIDTH / 2, 66);

    // Animated preview (larger)
    ctx.save();
    if (entry.category === 'critter') {
      const scale = 2.5;
      ctx.translate(GAME_WIDTH / 2, DETAIL_PREVIEW_Y);
      ctx.scale(scale, scale);
      drawEnemy(ctx, 0, 0, entry.renderHint, t);
      ctx.restore();
    } else if (entry.category === 'flora') {
      drawFlora(ctx, GAME_WIDTH / 2, DETAIL_PREVIEW_Y, entry.renderHint, t, 2.5);
      ctx.restore();
    } else if (entry.category === 'terrain') {
      drawTerrain(ctx, GAME_WIDTH / 2, DETAIL_PREVIEW_Y, entry.renderHint, t, 3);
      ctx.restore();
    } else {
      this.drawThreatPreview(ctx, entry.renderHint, t);
    }

    // Danger rating
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('DANGER', GAME_WIDTH / 2, DETAIL_PREVIEW_Y + 44);
    this.drawDangerPips(ctx, GAME_WIDTH / 2 - entry.danger * 5, DETAIL_PREVIEW_Y + 50, entry.danger);

    // Flavour text (italic feel via muted color)
    ctx.fillStyle = TOKENS.colorYellow300;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    wrapText(ctx, `"${entry.flavour}"`, GAME_WIDTH / 2, DETAIL_TEXT_TOP, GAME_WIDTH - 24, 11);

    // Behaviour
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    const behaviourY = DETAIL_TEXT_TOP + 28;
    wrapText(ctx, entry.behaviour, GAME_WIDTH / 2, behaviourY, GAME_WIDTH - 24, 11);

    // Habitat
    const habitatY = behaviourY + 30;
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('HABITAT', GAME_WIDTH / 2, habitatY);
    ctx.fillStyle = TOKENS.colorGreen400;
    const habitatStr = entry.habitat.join(', ');
    wrapText(ctx, habitatStr, GAME_WIDTH / 2, habitatY + 12, GAME_WIDTH - 24, 11);

    // Browse arrows
    const entries = this.currentEntries();
    if (entries.length > 1) {
      const arrowPulse = 0.5 + Math.sin(t * 3) * 0.3;
      ctx.fillStyle = rgba(TOKENS.colorCyan400, arrowPulse);
      ctx.font = TOKENS.fontLarge;
      ctx.textAlign = 'center';
      ctx.fillText('◀', 18, DETAIL_PREVIEW_Y);
      ctx.fillText('▶', GAME_WIDTH - 18, DETAIL_PREVIEW_Y);
    }

    // Counter
    ctx.fillStyle = TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText(
      `${this.selectedIndex + 1} / ${entries.length}`,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 14,
    );
  }

  // ── Helpers ─────────────────────────────────────────────────

  private currentEntries(): BestiaryEntry[] {
    const pool = this.getSourcePool();
    if (this.tab === 'critters') return pool.filter((e) => e.category === 'critter');
    if (this.tab === 'threats') return pool.filter((e) => e.category === 'threat');
    if (this.tab === 'flora') return pool.filter((e) => e.category === 'flora');
    return pool.filter((e) => e.category === 'terrain');
  }

  /** Get the bestiary pool based on the current source selector */
  private getSourcePool(): readonly BestiaryEntry[] {
    if (this.source === 'all') return getAllBestiary();
    if (this.source === 'base') return getBaseBestiary();
    return getDlcBestiary(this.source);
  }

  /** Cycle source: all → base → dlc1 → dlc2 → ... → all */
  private cycleSource(): void {
    const dlcIds = getMergedDlcIds();
    const sources: BestiarySource[] = ['all', 'base', ...dlcIds];
    const currentIdx = sources.indexOf(this.source);
    this.source = sources[(currentIdx + 1) % sources.length] ?? 'all';
    this.selectedIndex = 0;
    this.scrollOffset = 0;
  }

  /** Human-readable label for the current source */
  private getSourceLabel(): string {
    if (this.source === 'all') return '▸ ALL';
    if (this.source === 'base') return '▸ BASE';
    // DLC ID → short display name (e.g. 'rocket-science' → 'ROCKET')
    return '▸ ' + this.source.split('-')[0]!.toUpperCase();
  }

  private switchTab(tab: Tab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.selectedIndex = 0;
    this.scrollOffset = 0;
  }

  private openDetail(): void {
    const entries = this.currentEntries();
    if (entries.length === 0) return;
    this.detailEntry = entries[this.selectedIndex] ?? null;
    if (this.detailEntry) this.mode = 'detail';
  }

  private closeDetail(): void {
    this.mode = 'list';
    this.detailEntry = null;
  }

  private browseDetail(dir: number): void {
    const entries = this.currentEntries();
    if (entries.length === 0) return;
    this.selectedIndex = mod(this.selectedIndex + dir, entries.length);
    this.detailEntry = entries[this.selectedIndex] ?? null;
    this.ensureVisible();
  }

  private ensureVisible(): void {
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + LIST_VISIBLE_ROWS) {
      this.scrollOffset = this.selectedIndex - LIST_VISIBLE_ROWS + 1;
    }
  }

  private renderTab(ctx: CanvasRenderingContext2D, rect: Rect, label: string, active: boolean): void {
    ctx.fillStyle = active ? 'rgba(34,211,238,0.15)' : 'rgba(15,23,42,0.6)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 4);
    ctx.fill();

    if (active) {
      ctx.strokeStyle = TOKENS.colorCyan400;
      ctx.lineWidth = 1;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 4);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = active ? TOKENS.colorCyan300 : TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 3);
  }

  private drawDangerPips(ctx: CanvasRenderingContext2D, x: number, y: number, level: number): void {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < level ? TOKENS.colorRed400 : 'rgba(100,100,100,0.3)';
      ctx.beginPath();
      ctx.arc(x + i * 10, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Small icon for threats (encounter types) in the list view */
  private drawThreatIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, hint: string, t: number): void {
    const pulse = Math.sin(t * 3) * 0.5;
    switch (hint) {
      case 'fog':
        ctx.fillStyle = rgba('#7c3aed', 0.5 + pulse * 0.15);
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba('#a78bfa', 0.3);
        ctx.beginPath(); ctx.arc(cx + 3, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'storm':
        ctx.strokeStyle = TOKENS.colorYellow400;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 3, cy - 1); ctx.lineTo(cx - 1, cy); ctx.lineTo(cx + 2, cy + 6); ctx.stroke();
        ctx.lineWidth = 1;
        break;
      case 'battle':
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx, cy + 2); ctx.lineTo(cx - 5, cy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(cx - 1, cy - 7, 2, 4);
        break;
      case 'ruins':
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 5, cy - 4, 2, 8);
        ctx.fillRect(cx + 3, cy - 4, 2, 8);
        ctx.fillRect(cx - 6, cy - 5, 12, 2);
        break;
      case 'squid':
        ctx.fillStyle = '#be185d';
        ctx.beginPath(); ctx.ellipse(cx, cy - 2, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(cx - 3 + i * 3, cy + 2);
          ctx.lineTo(cx - 3 + i * 3 + Math.sin(t * 2 + i) * 2, cy + 7);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        break;
    }
  }

  /** Larger preview for threat detail view */
  private drawThreatPreview(ctx: CanvasRenderingContext2D, hint: string, t: number): void {
    const cx = GAME_WIDTH / 2;
    const cy = DETAIL_PREVIEW_Y;

    switch (hint) {
      case 'fog': {
        // Animated fog bank
        const fogGrad = ctx.createLinearGradient(cx - 40, cy - 25, cx + 40, cy + 25);
        fogGrad.addColorStop(0, 'rgba(124, 58, 237, 0.6)');
        fogGrad.addColorStop(0.5, 'rgba(88, 28, 135, 0.4)');
        fogGrad.addColorStop(1, 'rgba(40, 30, 60, 0.3)');
        ctx.fillStyle = fogGrad;
        ctx.beginPath(); ctx.ellipse(cx + Math.sin(t) * 5, cy, 40, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.beginPath(); ctx.ellipse(cx - 10 + Math.sin(t * 0.7) * 8, cy - 5, 25, 12, 0, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'storm': {
        // Lightning bolt
        ctx.strokeStyle = TOKENS.colorYellow400;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 25);
        ctx.lineTo(cx + 8, cy - 5);
        ctx.lineTo(cx - 4, cy);
        ctx.lineTo(cx + 6, cy + 25);
        ctx.stroke();
        ctx.lineWidth = 1;
        // Rain
        ctx.strokeStyle = rgba('#94a3b8', 0.4);
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const rx = cx - 30 + i * 9 + Math.sin(t * 2 + i) * 3;
          const ry = cy - 20 + ((t * 40 + i * 17) % 50);
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 1, ry + 6); ctx.stroke();
        }
        ctx.lineWidth = 1;
        break;
      }
      case 'battle': {
        // Enemy ship
        ctx.fillStyle = '#ef4444';
        roundRect(ctx, cx - 20, cy - 10, 40, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#1f2937';
        ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 10, cy - 8); ctx.lineTo(cx, cy - 6); ctx.closePath(); ctx.fill();
        // Skull
        ctx.fillStyle = '#f5f5f4';
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(cx - 2, cy - 1, 1.5, 1.5);
        ctx.fillRect(cx + 0.5, cy - 1, 1.5, 1.5);
        break;
      }
      case 'ruins': {
        // Stone archway
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 30, cy - 20, 6, 40);
        ctx.fillRect(cx + 24, cy - 20, 6, 40);
        ctx.fillRect(cx - 32, cy - 22, 64, 6);
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 32, cy - 22, 64, 3);
        // Glow inside
        const glowAlpha = 0.3 + Math.sin(t * 2) * 0.15;
        ctx.fillStyle = rgba('#facc15', glowAlpha);
        ctx.fillRect(cx - 22, cy - 14, 44, 32);
        break;
      }
      case 'squid': {
        // Mini kraken
        const bodyY = cy - 5 + Math.sin(t * 0.8) * 2;
        ctx.fillStyle = '#be185d';
        ctx.beginPath(); ctx.ellipse(cx, bodyY, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9d174d';
        ctx.beginPath(); ctx.arc(cx - 8, bodyY - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, bodyY + 2, 2.5, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(cx - 6, bodyY - 1, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 6, bodyY - 1, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath(); ctx.arc(cx - 5.5, bodyY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 6.5, bodyY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
        // Tentacles
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(cx - 16 + i * 8, bodyY + 12);
          for (let s = 1; s <= 3; s++) {
            ctx.lineTo(
              cx - 16 + i * 8 + Math.sin(t * 2 + i + s) * 6,
              bodyY + 12 + s * 8,
            );
          }
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        break;
      }
    }
  }
}

// ── Standalone helpers ───────────────────────────────────────

function isHit(action: InputAction, rect: Rect): boolean {
  if (action.type !== 'primary' || Number.isNaN(action.x)) return false;
  return action.x >= rect.x && action.y >= rect.y && action.x <= rect.x + rect.w && action.y <= rect.y + rect.h;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
}
