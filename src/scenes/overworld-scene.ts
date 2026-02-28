import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import { TOKENS } from '../rendering/tokens';
import {
  drawSkyGradient, drawOceanGradient, drawStars, drawShip,
  drawVignette, drawButton, roundRect, rgba, drawPulsingArrow,
} from '../rendering/draw';
import type { OverworldProgress } from './flow-types';
import { OVERWORLD_NODES } from '../data/progression';

interface OverworldSceneDeps {
  progress: OverworldProgress;
  fromIslandId?: string;
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
  private sailProgress = 0;
  private sailDurationMs = 12_000;
  private sightingShown = false;
  private elapsed = 0;

  constructor(private readonly deps: OverworldSceneDeps) {}

  enter(context: SceneContext): void {
    void context;
    this.phase = 'chart_visible';
    this.sailProgress = 0;
    this.sightingShown = false;
    this.selectedNodeId = this.getDefaultSelectedNode()?.islandId ?? null;
    this.sailFromNodeId = this.deps.fromIslandId ?? null;

    this.deps.audio.setMusicLayers(['base', 'rhythm']);
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

      if (!this.sightingShown && this.sailProgress >= 0.46 && this.sailProgress <= 0.72) {
        this.sightingShown = true;
        this.emitSighting();
      }

      if (this.sailProgress >= 1) {
        const arrived = this.selectedNodeId;
        this.deps.telemetry.emit(TELEMETRY_EVENTS.islandArrived, {
          island_id: arrived,
        });
        this.deps.onIslandArrive(arrived);
      }
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

      this.deps.telemetry.emit(TELEMETRY_EVENTS.sailingStarted, {
        from_node: this.sailFromNodeId,
        to_node: this.selectedNodeId,
        route_id: this.currentRouteId,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;

    // Sky + stars
    drawSkyGradient(ctx, GAME_WIDTH, '#050d1a', '#11213c', HORIZON_Y);
    drawStars(ctx, GAME_WIDTH, HORIZON_Y, t, 30);

    // Ocean fills the rest
    drawOceanGradient(ctx, GAME_WIDTH, HORIZON_Y, GAME_HEIGHT - HORIZON_Y, t);

    // Horizon sighting during sailing
    this.renderHorizon(ctx, t);

    // Sea chart layer
    this.renderSeaChart(ctx, t);

    // Ship on chart
    this.renderShip(ctx, t);

    // Bottom HUD panel
    this.renderBottomHud(ctx, t);

    // Vignette
    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.35);
  }

  private renderHorizon(ctx: CanvasRenderingContext2D, t: number): void {
    // Horizon line glow
    ctx.fillStyle = rgba('#1e5f8a', 0.4);
    ctx.fillRect(0, HORIZON_Y - 2, GAME_WIDTH, 4);

    if (this.phase === 'sailing' && this.sailProgress >= 0.45) {
      if (this.deps.progress.completedIslands.includes('island_04')) {
        // Kraken silhouette
        ctx.fillStyle = rgba('#ec4899', 0.6);
        ctx.beginPath();
        ctx.arc(196, 40, 12, 0, Math.PI * 2);
        ctx.fill();
        // Tentacles
        for (let i = 0; i < 3; i++) {
          const tx = 180 + i * 12;
          const wave = Math.sin(t * 3 + i) * 4;
          ctx.strokeStyle = rgba('#ec4899', 0.4);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx, 52);
          ctx.quadraticCurveTo(tx + wave, 64, tx - 4, HORIZON_Y);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      } else if (this.deps.progress.completedIslands.includes('island_02')) {
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

  private renderSeaChart(ctx: CanvasRenderingContext2D, t: number): void {
    // Semi-transparent chart overlay
    ctx.fillStyle = rgba('#0a1e38', 0.35);
    ctx.fillRect(0, HORIZON_Y, GAME_WIDTH, 236);

    const visibleNodes = OVERWORLD_NODES.filter((node) =>
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

      ctx.strokeStyle = isActive ? rgba('#facc15', 0.7) : rgba('#7dd3fc', 0.4);
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

    // Wake trail while sailing
    if (this.phase === 'sailing') {
      ctx.strokeStyle = rgba('#67e8f9', 0.2);
      ctx.lineWidth = 1;
      const from = OVERWORLD_NODES.find((n) => n.islandId === this.sailFromNodeId) ?? OVERWORLD_NODES[0];
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
      const node = OVERWORLD_NODES.find((n) => n.islandId === this.selectedNodeId);
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
      return OVERWORLD_NODES.find((node) => node.islandId === this.deps.fromIslandId);
    }

    return OVERWORLD_NODES.find((node) => this.isIslandUnlocked(node.islandId));
  }

  private get currentRouteId(): string {
    return `${this.sailFromNodeId ?? 'start'}_${this.selectedNodeId ?? 'none'}`;
  }

  private getShipPoint(): { x: number; y: number } {
    const fromNode = OVERWORLD_NODES.find((node) => node.islandId === this.sailFromNodeId) ?? OVERWORLD_NODES[0];
    const toNode = OVERWORLD_NODES.find((node) => node.islandId === this.selectedNodeId) ?? fromNode;

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
    return OVERWORLD_NODES.find((node) =>
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
