import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import type { AudioManager } from '../audio/audio-manager';
import { AudioEvent } from '../audio/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import { TOKENS } from '../rendering/tokens';
import {
  drawSkyGradient, drawStars, drawShip,
  drawVignette, drawButton, roundRect, rgba, drawPulsingArrow,
} from '../rendering/draw';
import type { OverworldProgress } from './flow-types';
import { OVERWORLD_NODES, type OverworldNodeConfig } from '../data/progression';
import { createWeatherState, updateWeatherSystem, type WeatherState } from '../systems/weather-system';
import { renderWeatherForeground } from '../rendering/weather';

// ── Map themes ───────────────────────────────────────────────

export interface MapTheme {
  skyTop: string;
  skyBottom: string;
  /** Four ocean gradient stops (surface → deep) */
  ocean: [string, string, string, string];
  /** RGBA tint for wave bands */
  waveTint: string;
  /** RGBA tint for wave strokes */
  waveStroke: string;
  /** Chart overlay colour */
  chartOverlay: string;
  /** Route line colour (unlocked) */
  routeColor: string;
  /** Extra render pass drawn after the chart overlay */
  renderExtra?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
}

const THEME_BASE: MapTheme = {
  skyTop: '#050d1a',
  skyBottom: '#11213c',
  ocean: ['#1a5f8a', '#1a4a6e', '#0d3b66', '#041528'],
  waveTint: 'rgba(60,160,210,',
  waveStroke: 'rgba(100,190,230,0.14)',
  chartOverlay: '#0a1e38',
  routeColor: '#7dd3fc',
};

const THEME_ROCKET: MapTheme = {
  skyTop: '#0a0020',
  skyBottom: '#1a0a3a',
  ocean: ['#2a1a5e', '#1e1248', '#140e3a', '#08041c'],
  waveTint: 'rgba(130,80,220,',
  waveStroke: 'rgba(160,100,240,0.12)',
  chartOverlay: '#120a2e',
  routeColor: '#c084fc',
  renderExtra(ctx, w, _h, t) {
    // Distant nebula blobs
    for (let i = 0; i < 5; i++) {
      const nx = (30 + i * 50 + Math.sin(t * 0.15 + i * 2) * 12) % (w + 20) - 10;
      const ny = 20 + i * 12 + Math.sin(t * 0.3 + i) * 6;
      const r = 10 + (i % 3) * 5;
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
      grad.addColorStop(0, 'rgba(168,85,247,0.12)');
      grad.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

const THEME_CIPHER: MapTheme = {
  skyTop: '#000c0c',
  skyBottom: '#0a1e1a',
  ocean: ['#0a3a2e', '#082e24', '#06221a', '#020e0a'],
  waveTint: 'rgba(40,200,160,',
  waveStroke: 'rgba(52,211,153,0.12)',
  chartOverlay: '#061a16',
  routeColor: '#34d399',
  renderExtra(ctx, w, h, t) {
    // Vertical scan-lines (digital feel)
    ctx.strokeStyle = 'rgba(52,211,153,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 84);
      ctx.lineTo(x, 84 + h);
      ctx.stroke();
    }
    // Horizontal scan sweep
    const sweepY = 84 + ((t * 18) % (h + 40)) - 20;
    ctx.fillStyle = 'rgba(52,211,153,0.05)';
    ctx.fillRect(0, sweepY, w, 2);
    // Floating hex characters
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(16,185,129,0.10)';
    for (let i = 0; i < 10; i++) {
      const hx = (i * 26 + Math.floor(t * 4 + i * 7) * 3) % w;
      const hy = 90 + ((i * 37 + t * 14) % (h - 10));
      const hex = ((i * 0xAB + Math.floor(t * 2)) & 0xFF).toString(16).padStart(2, '0');
      ctx.fillText(hex, hx, hy);
    }
    ctx.lineWidth = 1;
  },
};

/** Lookup theme by campaign ID */
export const MAP_THEMES: Record<string, MapTheme> = {
  base: THEME_BASE,
  'rocket-science': THEME_ROCKET,
  'cybersecurity': THEME_CIPHER,
};

interface OverworldSceneDeps {
  progress: OverworldProgress;
  fromIslandId?: string;
  /** Optional override for which nodes to show (DLC vs base). Defaults to base OVERWORLD_NODES. */
  nodes?: OverworldNodeConfig[];
  /** Visual theme for the map. Defaults to base ocean theme. */
  theme?: MapTheme;
  telemetry: TelemetryClient;
  audio: AudioManager;
  onIslandArrive: (islandId: string) => void;
}

type OverworldPhase = 'chart_visible' | 'node_selected' | 'sailing';

const SAIL_BUTTON = { x: 48, y: 352, w: 144, h: 34 };
const HORIZON_Y = 84;

export class OverworldScene implements Scene {
  private phase: OverworldPhase = 'chart_visible';
  private selectedNodeId: string | null = null;
  private sailFromNodeId: string | null = null;

  /** Nodes to display — DLC override or base OVERWORLD_NODES */
  private get nodes(): OverworldNodeConfig[] {
    return this.deps.nodes ?? OVERWORLD_NODES;
  }

  /** Active visual theme */
  private get theme(): MapTheme {
    return this.deps.theme ?? THEME_BASE;
  }
  private sailProgress = 0;
  private sailDurationMs = 12_000;
  private sightingShown = false;
  private elapsed = 0;

  // Storm-sky lightning state
  private lightningFlash = 0;          // brightness 0..1, decays fast
  private lightningCooldown = 0;       // seconds until next bolt
  private lightningBoltX = 120;        // x of current bolt
  private lightningBoltSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  // Ambient ocean weather (visible during sailing for atmospheric rain/motes)
  private overworldWeather: WeatherState = createWeatherState('storm');

  constructor(private readonly deps: OverworldSceneDeps) {}

  enter(context: SceneContext): void {
    void context;
    this.phase = 'chart_visible';
    this.sailProgress = 0;
    this.sightingShown = false;
    this.selectedNodeId = this.getDefaultSelectedNode()?.islandId ?? null;
    this.sailFromNodeId = this.deps.fromIslandId ?? null;

    this.deps.audio.setMusicLayers(['base', 'rhythm']);
    this.deps.audio.playSong('overworld');
    this.deps.telemetry.emit(TELEMETRY_EVENTS.overworldEntered, {
      from_island_id: this.deps.fromIslandId ?? 'menu',
    });
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsed += dt;

    if (this.phase === 'sailing' && this.selectedNodeId) {
      const dtMs = dt * 1000;
      this.sailProgress = Math.min(1, this.sailProgress + dtMs / this.sailDurationMs);

      // Storm lightning timing
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 4.5);
      this.lightningCooldown -= dt;
      if (this.lightningCooldown <= 0) {
        this.lightningFlash = 1;
        this.lightningBoltX = 20 + Math.random() * (GAME_WIDTH - 40);
        this.lightningBoltSegments = this.generateBolt(this.lightningBoltX);
        this.lightningCooldown = 0.7 + Math.random() * 1.8;
      }

      if (!this.sightingShown && this.sailProgress >= 0.46 && this.sailProgress <= 0.72) {
        this.sightingShown = true;
        this.emitSighting();
      }

      if (this.sailProgress >= 1) {
        const arrived = this.selectedNodeId;
        this.deps.audio.play(AudioEvent.AnchorDrop);
        this.deps.telemetry.emit(TELEMETRY_EVENTS.islandArrived, {
          island_id: arrived,
        });
        this.deps.onIslandArrive(arrived);
      }

      // Update ocean weather particles during sailing
      updateWeatherSystem(this.overworldWeather, dt, 'storm');
      return;
    }

    const primary = actions.find((action) => action.type === 'primary');
    if (!primary) {
      return;
    }

    const selectedNode = this.pickNode(primary.x, primary.y);
    if (selectedNode && this.isIslandUnlocked(selectedNode.islandId)) {
      this.selectedNodeId = selectedNode.islandId;
      this.phase = 'node_selected';
      this.deps.telemetry.emit(TELEMETRY_EVENTS.nodeSelected, {
        destination_island_id: selectedNode.islandId,
      });
      return;
    }

    const keyboardConfirm = Number.isNaN(primary.x) && this.phase === 'node_selected';
    const pointerConfirm = pointInRect(primary.x, primary.y, SAIL_BUTTON);

    if ((keyboardConfirm || pointerConfirm) && this.selectedNodeId && this.selectedNodeId !== this.sailFromNodeId) {
      const sailSpeedMultiplier = this.deps.progress.shipUpgrades.includes('reinforced_mast') ? 1.2 : 1;
      this.sailDurationMs = Math.max(10_000, Math.floor(12_000 / sailSpeedMultiplier));
      this.sailProgress = 0;
      this.phase = 'sailing';
      this.sightingShown = false;
      this.lightningFlash = 0;
      this.lightningCooldown = 0.3 + Math.random() * 0.5; // first bolt arrives quickly
      this.deps.audio.play(AudioEvent.SailUnfurl);

      this.deps.telemetry.emit(TELEMETRY_EVENTS.sailingStarted, {
        from_node: this.sailFromNodeId,
        to_node: this.selectedNodeId,
        route_id: this.currentRouteId,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;
    const th = this.theme;

    // Sky + stars
    drawSkyGradient(ctx, GAME_WIDTH, th.skyTop, th.skyBottom, HORIZON_Y);
    drawStars(ctx, GAME_WIDTH, HORIZON_Y, t, 30);

    // Storm clouds & lightning while sailing
    if (this.phase === 'sailing') {
      this.renderStormSky(ctx, t);
    }

    // Ocean fills the rest (themed)
    this.renderThemedOcean(ctx, t);

    // Theme-specific extra layer (nebula blobs, scan-lines, etc.)
    if (th.renderExtra) {
      th.renderExtra(ctx, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y, t);
    }

    // Horizon sighting during sailing
    this.renderHorizon(ctx, t);

    // Sea chart layer
    this.renderSeaChart(ctx, t);

    // Ship on chart
    this.renderShip(ctx, t);

    // Ocean weather particles (rain/drops during sailing)
    if (this.phase === 'sailing') {
      renderWeatherForeground(ctx, this.overworldWeather, GAME_WIDTH, GAME_HEIGHT);
    }

    // Bottom HUD panel
    this.renderBottomHud(ctx, t);

    // Vignette
    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.35);
  }

  /** Dark rolling clouds with periodic lightning flashes during sailing */
  private renderStormSky(ctx: CanvasRenderingContext2D, t: number): void {
    // ── Dark cloud bank ──
    // Multiple overlapping cloud blobs that drift slowly
    const cloudBaseY = HORIZON_Y - 28;
    const cloudAlpha = 0.15 + this.sailProgress * 0.25;  // builds as we sail
    for (let i = 0; i < 7; i++) {
      const cx = (35 + i * 34 + Math.sin(t * 0.3 + i * 1.6) * 14) % (GAME_WIDTH + 30) - 15;
      const cy = cloudBaseY - 6 + Math.sin(t * 0.5 + i * 2.3) * 8;
      const rx = 22 + (i % 3) * 6;
      const ry = 9 + (i % 2) * 4;
      ctx.fillStyle = rgba('#1e293b', cloudAlpha + (i % 2) * 0.06);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lower cloud strip just above the horizon
    for (let i = 0; i < 5; i++) {
      const cx = (20 + i * 52 + Math.sin(t * 0.4 + i * 3.1) * 10) % (GAME_WIDTH + 20) - 10;
      ctx.fillStyle = rgba('#0f172a', cloudAlpha * 0.8);
      ctx.beginPath();
      ctx.ellipse(cx, HORIZON_Y - 6, 28, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Lightning flash glow ──
    if (this.lightningFlash > 0.05) {
      // Full-sky white flash (subtle)
      ctx.fillStyle = rgba('#e0f2fe', this.lightningFlash * 0.12);
      ctx.fillRect(0, 0, GAME_WIDTH, HORIZON_Y);

      // Bolt segments
      ctx.strokeStyle = rgba('#f0f9ff', this.lightningFlash * 0.9);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#7dd3fc';
      ctx.shadowBlur = this.lightningFlash * 6;
      ctx.beginPath();
      for (const seg of this.lightningBoltSegments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;

      // Bright core (thinner, brighter)
      if (this.lightningFlash > 0.3) {
        ctx.strokeStyle = rgba('#ffffff', this.lightningFlash * 0.7);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (const seg of this.lightningBoltSegments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }

  /** Generate a jagged bolt from the top of the sky down to the cloud bank */
  private generateBolt(x: number): { x1: number; y1: number; x2: number; y2: number }[] {
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
    let cx = x;
    let cy = 2;
    const endY = HORIZON_Y - 10;
    while (cy < endY) {
      const nx = cx + (Math.random() - 0.5) * 18;
      const ny = Math.min(endY, cy + 6 + Math.random() * 10);
      segs.push({ x1: cx, y1: cy, x2: nx, y2: ny });
      // Occasional branch
      if (Math.random() < 0.3) {
        const bx = nx + (Math.random() - 0.5) * 14;
        const by = ny + 4 + Math.random() * 8;
        segs.push({ x1: nx, y1: ny, x2: bx, y2: Math.min(endY, by) });
      }
      cx = nx;
      cy = ny;
    }
    return segs;
  }

  /** Draw the ocean using the active theme palette */
  private renderThemedOcean(ctx: CanvasRenderingContext2D, t: number): void {
    const th = this.theme;
    const y = HORIZON_Y;
    const h = GAME_HEIGHT - HORIZON_Y;
    const w = GAME_WIDTH;

    // Deep-to-surface gradient (4 stops from theme)
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, th.ocean[0]);
    grad.addColorStop(0.15, th.ocean[1]);
    grad.addColorStop(0.4, th.ocean[2]);
    grad.addColorStop(1, th.ocean[3]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, w, h);

    // Undulating swell bands
    for (let band = 0; band < 4; band++) {
      const bandY = y + 6 + band * (h / 4);
      const alpha = 0.04 + band * 0.025;
      ctx.fillStyle = th.waveTint + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(0, bandY + 8);
      for (let px = 0; px <= w; px += 3) {
        const offset = Math.sin((px * 0.025) + t * 0.6 + band * 1.8) * 5
                     + Math.sin((px * 0.015) + t * 0.35 + band * 0.9) * 3;
        ctx.lineTo(px, bandY + offset);
      }
      ctx.lineTo(w, bandY + 20);
      ctx.lineTo(0, bandY + 20);
      ctx.closePath();
      ctx.fill();
    }

    // Wave strokes
    ctx.strokeStyle = th.waveStroke;
    ctx.lineWidth = 1;
    for (let row = 0; row < 8; row++) {
      const wy = y + 10 + row * (h / 8);
      ctx.beginPath();
      for (let px = 0; px < w; px += 2) {
        const offset = Math.sin((px + t * 38 + row * 32) * 0.055) * 3.5
                     + Math.sin((px * 0.12) + t * 1.2 + row * 0.7) * 1.5;
        if (px === 0) ctx.moveTo(px, wy + offset);
        else ctx.lineTo(px, wy + offset);
      }
      ctx.stroke();
    }

    // Foam caps
    ctx.fillStyle = 'rgba(220,240,255,0.18)';
    for (let fi = 0; fi < 12; fi++) {
      const fx = ((fi * 23 + t * 12) % (w + 20)) - 10;
      const fBand = fi % 5;
      const fy = y + 6 + fBand * (h / 5) + Math.sin(fx * 0.04 + t * 0.8 + fi) * 4;
      const foamSize = 1.2 + Math.sin(t * 2.5 + fi * 3) * 0.6;
      ctx.beginPath();
      ctx.arc(fx, fy, foamSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderHorizon(ctx: CanvasRenderingContext2D, t: number): void {
    // Horizon line glow
    ctx.fillStyle = rgba('#1e5f8a', 0.4);
    ctx.fillRect(0, HORIZON_Y - 2, GAME_WIDTH, 4);

    // Kraken emergence — phased puppeteered animation starting early
    if (this.phase === 'sailing' && this.sailProgress >= 0.25 &&
        this.deps.progress.completedIslands.includes('island_04')) {
      this.renderKrakenEmergence(ctx, t);
    }

    // Other horizon sightings (non-kraken)
    if (this.phase === 'sailing' && this.sailProgress >= 0.45 &&
        !this.deps.progress.completedIslands.includes('island_04')) {
      if (this.deps.progress.completedIslands.includes('island_02')) {
        // Ghost ship
        ctx.fillStyle = rgba('#ef4444', 0.5);
        roundRect(ctx, 178, 30, 36, 14, 3);
        ctx.fill();
        ctx.strokeStyle = rgba('#ef4444', 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(196, 30);
        ctx.lineTo(196, 14);
        ctx.stroke();
        ctx.fillStyle = rgba('#f87171', 0.4);
        ctx.fillRect(197, 16, 8, 10);
      } else if (this.selectedNodeId === 'island_02') {
        // Storm front
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = rgba('#94a3b8', 0.3 - i * 0.08);
          const cx = 188 + i * 6;
          ctx.beginPath();
          ctx.arc(cx, 34 + i * 4, 14 - i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  /** Kraken emerges from the waterline in phases: bubbles → tentacles → head → full presence */
  private renderKrakenEmergence(ctx: CanvasRenderingContext2D, t: number): void {
    const krakenX = 196;
    // Normalize: 0 at sailProgress 0.25, 1 at sailProgress 0.75
    const kp = Math.min(1, Math.max(0, (this.sailProgress - 0.25) / 0.50));

    // ── Phase 1: Bubbles & water disturbance (kp 0.0+) ──
    const bubbleAlpha = Math.min(0.5, kp * 0.7);
    ctx.fillStyle = rgba('#67e8f9', bubbleAlpha * 0.45);
    for (let b = 0; b < 6; b++) {
      const bx = krakenX - 16 + b * 6.5 + Math.sin(t * 4.5 + b * 1.7) * 3;
      const by = HORIZON_Y - 2 - Math.abs(Math.sin(t * 3.2 + b * 2.1)) * 8 * kp;
      const br = 1 + Math.sin(t * 5 + b) * 0.5;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Phase 2: Tentacles breach the surface (kp 0.15+) ──
    if (kp > 0.15) {
      const tentacleGrowth = Math.min(1, (kp - 0.15) / 0.45);
      const tentacleCount = 5;
      for (let i = 0; i < tentacleCount; i++) {
        const tx = krakenX - 16 + i * 8;
        const maxH = 12 + i % 2 * 8; // alternate short/tall
        const tentacleH = maxH * tentacleGrowth;
        const sway = Math.sin(t * 2.5 + i * 1.2) * (3 + tentacleGrowth * 5);
        const tipSway = Math.sin(t * 4 + i * 0.8) * 2;
        const alpha = 0.25 + tentacleGrowth * 0.4;

        ctx.strokeStyle = rgba('#ec4899', alpha);
        ctx.lineWidth = 1.5 + tentacleGrowth * 0.8;
        ctx.beginPath();
        ctx.moveTo(tx, HORIZON_Y);
        ctx.quadraticCurveTo(
          tx + sway, HORIZON_Y - tentacleH * 0.55,
          tx + tipSway, HORIZON_Y - tentacleH,
        );
        ctx.stroke();

        // Tentacle tip curls once sufficiently risen
        if (tentacleGrowth > 0.5) {
          const curlAlpha = (tentacleGrowth - 0.5) * 2 * alpha;
          ctx.strokeStyle = rgba('#f472b6', curlAlpha);
          ctx.lineWidth = 1;
          const tipX = tx + tipSway;
          const tipY = HORIZON_Y - tentacleH;
          ctx.beginPath();
          ctx.arc(tipX + (i % 2 === 0 ? 2 : -2), tipY, 2, Math.PI * 0.5, Math.PI * 1.5);
          ctx.stroke();
        }
      }
      ctx.lineWidth = 1;
    }

    // ── Phase 3: Head / body breaches (kp 0.45+) ──
    if (kp > 0.45) {
      const headRise = Math.min(1, (kp - 0.45) / 0.35);
      const headY = HORIZON_Y - 6 - headRise * 32;
      const headR = 7 + headRise * 7;
      const bodyAlpha = 0.25 + headRise * 0.4;

      // Body dome
      ctx.fillStyle = rgba('#ec4899', bodyAlpha);
      ctx.beginPath();
      ctx.ellipse(krakenX, headY + headR * 0.3, headR, headR * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Darker mantle ridge
      ctx.fillStyle = rgba('#be185d', bodyAlpha * 0.5);
      ctx.beginPath();
      ctx.ellipse(krakenX, headY, headR * 0.75, headR * 0.5, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // ── Phase 4: Glowing eyes (kp 0.65+) ──
      if (kp > 0.65) {
        const eyeFade = Math.min(1, (kp - 0.65) / 0.2);
        const eyePulse = 0.7 + Math.sin(t * 4) * 0.3;

        // Outer glow
        ctx.fillStyle = rgba('#fbbf24', eyeFade * eyePulse * 0.25);
        ctx.beginPath();
        ctx.arc(krakenX - 5, headY + 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(krakenX + 5, headY + 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright pupils
        ctx.fillStyle = rgba('#facc15', eyeFade * eyePulse);
        ctx.beginPath();
        ctx.arc(krakenX - 5, headY + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(krakenX + 5, headY + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Water splash spray at waterline ──
    if (kp > 0.3) {
      const splashI = Math.min(1, (kp - 0.3) / 0.3);
      ctx.fillStyle = rgba('#67e8f9', 0.12 + splashI * 0.18);
      for (let s = 0; s < 5; s++) {
        const sx = krakenX - 14 + s * 7 + Math.sin(t * 5.5 + s * 1.5) * 2;
        const splashH = 2 + Math.abs(Math.sin(t * 6 + s * 2)) * 5 * splashI;
        ctx.fillRect(sx - 0.5, HORIZON_Y - splashH, 1, splashH);
      }
    }
  }

  private renderSeaChart(ctx: CanvasRenderingContext2D, t: number): void {
    // Semi-transparent chart overlay
    ctx.fillStyle = rgba(this.theme.chartOverlay, 0.35);
    ctx.fillRect(0, HORIZON_Y, GAME_WIDTH, 236);

    const visibleNodes = this.nodes.filter((node) =>
      node.secret ? this.deps.progress.shipUpgrades.includes('ghostlight_lantern') : true,
    );

    // Draw route lines (dashed, animated)
    for (let index = 0; index < visibleNodes.length - 1; index += 1) {
      const from = visibleNodes[index];
      const to = visibleNodes[index + 1];
      if (!from || !to) continue;

      const routeVisible = this.isIslandUnlocked(to.islandId);
      if (!routeVisible) continue;

      const isActive = (from.islandId === this.sailFromNodeId && to.islandId === this.selectedNodeId) ||
                       (to.islandId === this.sailFromNodeId && from.islandId === this.selectedNodeId);

      ctx.strokeStyle = isActive ? rgba('#facc15', 0.7) : rgba(this.theme.routeColor, 0.4);
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -t * 10;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.lineWidth = 1;
    }

    // Draw island nodes
    for (const node of visibleNodes) {
      const unlocked = this.isIslandUnlocked(node.islandId);
      const completed = this.deps.progress.completedIslands.includes(node.islandId);
      const selected = node.islandId === this.selectedNodeId;
      const result = this.deps.progress.islandResults.find((entry) => entry.islandId === node.islandId);

      // Selection glow ring
      if (selected && this.phase !== 'sailing') {
        const glowPulse = 0.5 + Math.sin(t * 4) * 0.3;
        ctx.fillStyle = rgba('#facc15', glowPulse * 0.3);
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Island circle
      const grad = ctx.createRadialGradient(node.x - 2, node.y - 2, 2, node.x, node.y, 14);
      if (unlocked) {
        grad.addColorStop(0, completed ? '#78350f' : '#1e3a5f');
        grad.addColorStop(1, completed ? '#451a03' : '#0f2a4e');
      } else {
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#0a0a18');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Border
      const border = completed ? TOKENS.colorYellow400 : unlocked ? TOKENS.colorCyan400 : '#334155';
      ctx.strokeStyle = border;
      ctx.lineWidth = selected ? 2 : 1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Island icon inside
      if (unlocked) {
        ctx.fillStyle = completed ? '#fbbf24' : '#67e8f9';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = node.islandId === 'hidden_reef' ? '?' :
                      node.islandId.replace('island_0', '');
        ctx.fillText(label, node.x, node.y);
        ctx.textBaseline = 'alphabetic';
      }

      // Green checkmark badge for completed islands
      if (completed) {
        const cx = node.x + 9;
        const cy = node.y - 9;
        // Circle background
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        // Checkmark stroke
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 2.5, cy);
        ctx.lineTo(cx - 0.5, cy + 2);
        ctx.lineTo(cx + 3, cy - 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
      }

      // Grade below
      if (result) {
        ctx.fillStyle = TOKENS.colorYellow400;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText(result.grade, node.x, node.y + 24);
      }

      // Fog overlay on locked
      if (!unlocked) {
        ctx.fillStyle = rgba('#020617', 0.6);
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Lock icon
        ctx.fillStyle = '#475569';
        ctx.fillRect(node.x - 3, node.y - 1, 6, 5);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y - 3, 3, Math.PI, 0);
        ctx.stroke();
      }
    }

    // Secret area fog
    if (!this.deps.progress.shipUpgrades.includes('ghostlight_lantern')) {
      const fogGrad = ctx.createRadialGradient(34, 122, 8, 34, 122, 38);
      fogGrad.addColorStop(0, rgba('#020617', 0.5));
      fogGrad.addColorStop(1, rgba('#020617', 0));
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, HORIZON_Y, 80, 80);
    }
  }

  private renderShip(ctx: CanvasRenderingContext2D, t: number): void {
    const shipPoint = this.getShipPoint();
    const hasMast = this.deps.progress.shipUpgrades.includes('reinforced_mast');
    const hasLantern = this.deps.progress.shipUpgrades.includes('ghostlight_lantern');

    drawShip(ctx, shipPoint.x, shipPoint.y, t, hasMast, hasLantern);

    // Tiny player (Nemo) standing on the ship deck
    const bob = Math.sin(t * 2) * 2;
    const tilt = Math.sin(t * 1.5) * 0.08;
    ctx.save();
    ctx.translate(shipPoint.x, shipPoint.y + bob);
    ctx.rotate(tilt);
    // Micro body
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -8, 4, 5);
    // Micro head
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -10, 2, 0, Math.PI * 2);
    ctx.fill();
    // Micro bandana
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-2, -12, 4, 1);
    // Micro eyes
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-1, -10.5, 1, 1);
    ctx.fillRect(1, -10.5, 1, 1);
    ctx.restore();

    // Wake trail while sailing
    if (this.phase === 'sailing') {
      ctx.strokeStyle = rgba('#67e8f9', 0.2);
      ctx.lineWidth = 1;
      const from = this.nodes.find((n) => n.islandId === this.sailFromNodeId) ?? this.nodes[0];
      if (from) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(shipPoint.x, shipPoint.y);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
  }

  private renderBottomHud(ctx: CanvasRenderingContext2D, t: number): void {
    // Panel background gradient
    const grad = ctx.createLinearGradient(0, 320, 0, GAME_HEIGHT);
    grad.addColorStop(0, 'rgba(2,6,23,0.5)');
    grad.addColorStop(1, 'rgba(2,6,23,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 320, GAME_WIDTH, 80);

    // Separator line
    ctx.strokeStyle = rgba(TOKENS.colorCyan400, 0.2);
    ctx.beginPath();
    ctx.moveTo(8, 322);
    ctx.lineTo(GAME_WIDTH - 8, 322);
    ctx.stroke();

    const fragmentCount = this.deps.progress.completedIslands.filter((id) => id.startsWith('island_')).length;

    // Fragment count with dots
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText('FRAGMENTS', 12, 338);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < fragmentCount ? TOKENS.colorYellow400 : '#334155';
      ctx.beginPath();
      ctx.arc(14 + i * 10, 346, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heading compass
    const heading = this.selectedNodeId === 'hidden_reef' ? 'NW' : this.selectedNodeId === 'island_05' ? 'NE' : 'ESE';
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.textAlign = 'left';
    ctx.fillText(`HEADING ${heading}`, 80, 338);

    // Upgrades
    let upgradeY = 346;
    if (this.deps.progress.shipUpgrades.includes('reinforced_mast')) {
      ctx.fillStyle = TOKENS.colorGreen400;
      ctx.fillText('⛵ MAST+', 80, upgradeY);
      upgradeY += 10;
    }
    if (this.deps.progress.shipUpgrades.includes('ghostlight_lantern')) {
      ctx.fillStyle = TOKENS.colorPink400;
      ctx.fillText('🔮 LANTERN', 80, upgradeY);
    }

    // Sail button
    const canSail = this.phase !== 'sailing' && this.selectedNodeId && this.selectedNodeId !== this.sailFromNodeId;
    const label = this.phase === 'sailing' ? 'SAILING...' : 'SET SAIL';
    drawButton(ctx, SAIL_BUTTON.x, SAIL_BUTTON.y, SAIL_BUTTON.w, SAIL_BUTTON.h,
      label, !!canSail, 11);

    // Pulsing arrow on sail button when selectable
    if (canSail) {
      drawPulsingArrow(ctx, SAIL_BUTTON.x + SAIL_BUTTON.w / 2, SAIL_BUTTON.y - 6, t, 'down');
    }

    // Selected island name
    if (this.selectedNodeId && this.phase !== 'sailing') {
      const node = this.nodes.find((n) => n.islandId === this.selectedNodeId);
      if (node) {
        ctx.fillStyle = TOKENS.colorText;
        ctx.font = TOKENS.fontMedium;
        ctx.textAlign = 'center';
        ctx.fillText(node.name.toUpperCase(), GAME_WIDTH / 2, 332);
      }
    }
  }

  private emitSighting(): void {
    let sightingType = 'open_sea';
    if (this.deps.progress.completedIslands.includes('island_04')) {
      sightingType = 'kraken_tentacle';
    } else if (this.deps.progress.completedIslands.includes('island_02')) {
      sightingType = 'null_ship';
    } else if (this.selectedNodeId === 'island_02') {
      sightingType = 'storm_front';
    }

    this.deps.telemetry.emit(TELEMETRY_EVENTS.sightingShown, {
      sighting_type: sightingType,
      route_id: this.currentRouteId,
    });
  }

  private getDefaultSelectedNode() {
    if (this.deps.fromIslandId) {
      return this.nodes.find((node) => node.islandId === this.deps.fromIslandId);
    }

    return this.nodes.find((node) => this.isIslandUnlocked(node.islandId));
  }

  private get currentRouteId(): string {
    return `${this.sailFromNodeId ?? 'start'}_${this.selectedNodeId ?? 'none'}`;
  }

  private getShipPoint(): { x: number; y: number } {
    const fromNode = this.nodes.find((node) => node.islandId === this.sailFromNodeId) ?? this.nodes[0];
    const toNode = this.nodes.find((node) => node.islandId === this.selectedNodeId) ?? fromNode;

    if (!fromNode || !toNode) {
      return { x: 72, y: 224 };
    }

    if (this.phase !== 'sailing') {
      return { x: fromNode.x, y: fromNode.y };
    }

    return {
      x: fromNode.x + (toNode.x - fromNode.x) * this.sailProgress,
      y: fromNode.y + (toNode.y - fromNode.y) * this.sailProgress,
    };
  }

  private pickNode(x: number, y: number) {
    return this.nodes.find((node) =>
      pointInRect(x, y, { x: node.x - 14, y: node.y - 14, w: 28, h: 28 }) &&
      (!node.secret || this.deps.progress.shipUpgrades.includes('ghostlight_lantern')),
    );
  }

  private isIslandUnlocked(islandId: string): boolean {
    return this.deps.progress.unlockedIslands.includes(islandId);
  }
}

function pointInRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
