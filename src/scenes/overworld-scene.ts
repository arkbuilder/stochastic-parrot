import type { Scene, SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import { TOKENS } from '../rendering/tokens';
import type { OverworldProgress } from './flow-types';

interface OverworldSceneDeps {
  progress: OverworldProgress;
  fromIslandId?: string;
  telemetry: TelemetryClient;
  audio: AudioManager;
  onIslandArrive: (islandId: string) => void;
}

type OverworldPhase = 'chart_visible' | 'node_selected' | 'sailing';

type NodeDefinition = {
  islandId: string;
  name: string;
  x: number;
  y: number;
};

const NODES: NodeDefinition[] = [
  { islandId: 'island_01', name: 'Bay of Learning', x: 72, y: 224 },
  { islandId: 'island_02', name: 'Driftwood Shallows', x: 168, y: 156 },
];

const SAIL_BUTTON = { x: 74, y: 352, w: 92, h: 30 };

export class OverworldScene implements Scene {
  private phase: OverworldPhase = 'chart_visible';
  private selectedNodeId: string | null = null;
  private sailFromNodeId: string | null = null;
  private sailProgress = 0;
  private sailDurationMs = 12_000;
  private sightingShown = false;

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
    if (this.phase === 'sailing' && this.selectedNodeId) {
      const dtMs = dt * 1000;
      this.sailProgress = Math.min(1, this.sailProgress + dtMs / this.sailDurationMs);

      if (!this.sightingShown && this.sailProgress >= 0.45 && this.sailProgress <= 0.72) {
        this.sightingShown = true;
        this.deps.telemetry.emit(TELEMETRY_EVENTS.sightingShown, {
          sighting_type: this.selectedNodeId === 'island_02' ? 'storm_front' : 'open_sea',
          route_id: this.currentRouteId,
        });
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
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, 240, 400);

    this.renderHorizon(ctx);
    this.renderSeaChart(ctx);
    this.renderShip(ctx);
    this.renderBottomHud(ctx);
  }

  private renderHorizon(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#11213c';
    ctx.fillRect(0, 0, 240, 84);
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 68, 240, 16);

    if (this.phase === 'sailing' && this.selectedNodeId === 'island_02' && this.sailProgress >= 0.45) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.fillRect(172, 18, 44, 22);
      ctx.fillStyle = 'rgba(248, 250, 252, 0.6)';
      ctx.fillRect(190, 22, 2, 16);
    }
  }

  private renderSeaChart(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#123153';
    ctx.fillRect(0, 84, 240, 236);

    const node1 = NODES[0];
    const node2 = NODES[1];
    if (node1 && node2) {
      const routeVisible = this.isIslandUnlocked(node2.islandId);
      if (routeVisible) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.65)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    for (const node of NODES) {
      const unlocked = this.isIslandUnlocked(node.islandId);
      const completed = this.deps.progress.completedIslands.includes(node.islandId);
      const selected = node.islandId === this.selectedNodeId;
      const result = this.deps.progress.islandResults.find((entry) => entry.islandId === node.islandId);

      ctx.fillStyle = unlocked ? '#0f172a' : 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(node.x - 12, node.y - 12, 24, 24);

      ctx.strokeStyle = completed ? TOKENS.colorYellow400 : unlocked ? TOKENS.colorCyan400 : '#334155';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(node.x - 12, node.y - 12, 24, 24);
      ctx.lineWidth = 1;

      if (selected && this.phase !== 'sailing') {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.strokeRect(node.x - 16, node.y - 16, 32, 32);
      }

      if (result) {
        ctx.fillStyle = TOKENS.colorText;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText(result.grade, node.x, node.y + 24);
      }

      if (!unlocked) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
        ctx.fillRect(node.x - 14, node.y - 14, 28, 28);
      }
    }

    const island2Unlocked = this.isIslandUnlocked('island_02');
    if (!island2Unlocked) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.68)';
      ctx.beginPath();
      ctx.arc(168, 156, 50, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderShip(ctx: CanvasRenderingContext2D): void {
    const shipPoint = this.getShipPoint();

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.fillRect(shipPoint.x - 5, shipPoint.y - 4, 10, 8);

    ctx.strokeStyle = TOKENS.colorText;
    ctx.beginPath();
    ctx.moveTo(shipPoint.x, shipPoint.y - 4);
    ctx.lineTo(shipPoint.x, shipPoint.y - (this.deps.progress.shipUpgrades.includes('reinforced_mast') ? 15 : 11));
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(shipPoint.x, shipPoint.y - 13, 7, 5);
  }

  private renderBottomHud(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 320, 240, 80);

    const fragmentCount = this.deps.progress.completedIslands.length;

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText(`FRAG ${fragmentCount}/5`, 12, 342);

    const heading = this.selectedNodeId === 'island_02' ? 'ESE' : 'WNW';
    ctx.fillText(`HEAD ${heading}`, 12, 360);

    if (this.deps.progress.shipUpgrades.includes('reinforced_mast')) {
      ctx.fillStyle = '#4ade80';
      ctx.fillText('MAST +20% SAIL', 12, 378);
    }

    const canSail = this.phase !== 'sailing' && this.selectedNodeId && this.selectedNodeId !== this.sailFromNodeId;
    ctx.fillStyle = canSail ? '#1f2937' : '#111827';
    ctx.fillRect(SAIL_BUTTON.x, SAIL_BUTTON.y, SAIL_BUTTON.w, SAIL_BUTTON.h);
    ctx.strokeStyle = canSail ? TOKENS.colorCyan400 : '#334155';
    ctx.strokeRect(SAIL_BUTTON.x, SAIL_BUTTON.y, SAIL_BUTTON.w, SAIL_BUTTON.h);

    ctx.fillStyle = TOKENS.colorText;
    ctx.textAlign = 'center';
    ctx.fillText(this.phase === 'sailing' ? 'SAILING…' : 'SAIL', SAIL_BUTTON.x + SAIL_BUTTON.w / 2, 371);
  }

  private getDefaultSelectedNode(): NodeDefinition | undefined {
    if (this.deps.fromIslandId) {
      return NODES.find((node) => node.islandId === this.deps.fromIslandId);
    }

    return NODES.find((node) => this.isIslandUnlocked(node.islandId));
  }

  private get currentRouteId(): string {
    return `${this.sailFromNodeId ?? 'start'}_${this.selectedNodeId ?? 'none'}`;
  }

  private getShipPoint(): { x: number; y: number } {
    const fromNode = NODES.find((node) => node.islandId === this.sailFromNodeId) ?? NODES[0];
    const toNode = NODES.find((node) => node.islandId === this.selectedNodeId) ?? fromNode;

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

  private pickNode(x: number, y: number): NodeDefinition | undefined {
    return NODES.find((node) => pointInRect(x, y, { x: node.x - 14, y: node.y - 14, w: 28, h: 28 }));
  }

  private isIslandUnlocked(islandId: string): boolean {
    return this.deps.progress.unlockedIslands.includes(islandId);
  }
}

function pointInRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
