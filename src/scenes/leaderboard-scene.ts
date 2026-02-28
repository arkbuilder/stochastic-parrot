import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import type { ApiClient, LeaderboardResponse } from '../persistence/api-client';
import type { LocalStore } from '../persistence/local-store';
import {
  drawSkyGradient, drawVignette, drawButton, roundRect, rgba,
} from '../rendering/draw';

interface LeaderboardSceneDeps {
  telemetry: TelemetryClient;
  audio: AudioManager;
  apiClient: ApiClient;
  localStore: LocalStore;
  playerId: string;
  availableIslands: string[];
  onBack: () => void;
}

type BoardType = 'island' | 'total' | 'speed' | 'accuracy';

const BACK_BUTTON = { x: 8, y: 8, w: 52, h: 22 };
const BOARD_BUTTONS: Array<{ type: BoardType; rect: { x: number; y: number; w: number; h: number }; label: string }> = [
  { type: 'island', rect: { x: 8, y: 52, w: 52, h: 24 }, label: 'ISL' },
  { type: 'total', rect: { x: 66, y: 52, w: 52, h: 24 }, label: 'TTL' },
  { type: 'speed', rect: { x: 124, y: 52, w: 52, h: 24 }, label: 'SPD' },
  { type: 'accuracy', rect: { x: 182, y: 52, w: 52, h: 24 }, label: 'ACC' },
];
const ISLAND_PREV = { x: 22, y: 84, w: 24, h: 20 };
const ISLAND_NEXT = { x: 194, y: 84, w: 24, h: 20 };

export class LeaderboardScene implements Scene {
  private selectedBoard: BoardType = 'island';
  private selectedIslandIndex = 0;
  private rows: LeaderboardResponse['top10'] = [];
  private playerRank: number | null = null;
  private loading = false;

  constructor(private readonly deps: LeaderboardSceneDeps) {}

  enter(context: SceneContext): void {
    void context;
    this.deps.audio.setMusicLayers(['base']);
    this.fetchBoard();
  }

  exit(): void {}

  update(_dt: number, actions: InputAction[]): void {
    const primary = actions.find((action) => action.type === 'primary');
    if (!primary) {
      return;
    }

    if (Number.isNaN(primary.x) || pointInRect(primary.x, primary.y, BACK_BUTTON)) {
      this.deps.onBack();
      return;
    }

    for (const board of BOARD_BUTTONS) {
      if (!pointInRect(primary.x, primary.y, board.rect)) {
        continue;
      }

      this.selectedBoard = board.type;
      this.fetchBoard();
      return;
    }

    if (this.selectedBoard === 'island') {
      if (pointInRect(primary.x, primary.y, ISLAND_PREV)) {
        this.selectedIslandIndex =
          (this.selectedIslandIndex - 1 + this.availableIslandIds.length) % this.availableIslandIds.length;
        this.fetchBoard();
        return;
      }

      if (pointInRect(primary.x, primary.y, ISLAND_NEXT)) {
        this.selectedIslandIndex = (this.selectedIslandIndex + 1) % this.availableIslandIds.length;
        this.fetchBoard();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Background
    drawSkyGradient(ctx, GAME_WIDTH, '#050a14', '#0b1a30', GAME_HEIGHT);

    // Back button
    drawButton(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, '← BACK', false, 8);

    // Title
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText('LEADERBOARD', GAME_WIDTH / 2, 42);

    // Board type tabs
    for (const board of BOARD_BUTTONS) {
      this.renderBoardToggle(ctx, board.rect, board.label, this.selectedBoard === board.type);
    }

    // Island selector
    if (this.selectedBoard === 'island') {
      this.renderIslandSelector(ctx);
    }

    // Table header
    ctx.fillStyle = TOKENS.colorTextDark;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText('#', 14, 110);
    ctx.fillText('NAME', 34, 110);
    ctx.textAlign = 'right';
    ctx.fillText('SCORE', 182, 110);
    ctx.fillText('GRD', 224, 110);
    ctx.textAlign = 'left';

    // Separator
    ctx.strokeStyle = rgba(TOKENS.colorCyan400, 0.15);
    ctx.beginPath();
    ctx.moveTo(10, 114);
    ctx.lineTo(GAME_WIDTH - 10, 114);
    ctx.stroke();

    // Rows
    const startY = 128;
    const visibleRows = this.rows.slice(0, 10);
    for (let index = 0; index < visibleRows.length; index += 1) {
      const row = visibleRows[index];
      if (!row) continue;

      const y = startY + index * 22;
      const isPlayer = row.playerId === this.deps.playerId;

      // Row background
      if (isPlayer) {
        ctx.fillStyle = rgba(TOKENS.colorCyan400, 0.1);
        roundRect(ctx, 8, y - 12, GAME_WIDTH - 16, 20, 3);
        ctx.fill();
        ctx.strokeStyle = rgba(TOKENS.colorCyan400, 0.4);
        roundRect(ctx, 8, y - 12, GAME_WIDTH - 16, 20, 3);
        ctx.stroke();
      } else if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(8, y - 12, GAME_WIDTH - 16, 20);
      }

      // Rank
      ctx.fillStyle = index < 3 ? TOKENS.colorYellow400 : TOKENS.colorText;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText(`${index + 1}`, 14, y);

      // Name
      ctx.fillStyle = isPlayer ? TOKENS.colorCyan300 : TOKENS.colorText;
      ctx.fillText(row.displayName.slice(0, 12), 34, y);

      // Score + grade
      ctx.textAlign = 'right';
      ctx.fillStyle = TOKENS.colorText;
      ctx.fillText(String(row.score), 182, y);
      ctx.fillStyle = TOKENS.colorYellow400;
      ctx.fillText(row.grade, 224, y);
      ctx.textAlign = 'left';
    }

    // Empty state
    if (visibleRows.length === 0 && !this.loading) {
      ctx.fillStyle = TOKENS.colorTextMuted;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('NO SCORES YET', GAME_WIDTH / 2, 180);
    }

    // Bottom bar
    ctx.fillStyle = rgba('#020617', 0.6);
    ctx.fillRect(0, 360, GAME_WIDTH, 40);

    const rankText = this.playerRank ? `YOUR RANK: #${this.playerRank}` : 'YOUR RANK: —';
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText(rankText, 12, 380);

    if (this.loading) {
      ctx.fillStyle = TOKENS.colorTextMuted;
      ctx.textAlign = 'right';
      ctx.fillText('SYNCING...', GAME_WIDTH - 12, 380);
    }

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.3);
  }

  private get availableIslandIds(): string[] {
    if (this.deps.availableIslands.length > 0) {
      return this.deps.availableIslands;
    }
    return ['island_01'];
  }

  private get selectedIslandId(): string {
    return this.availableIslandIds[this.selectedIslandIndex] ?? 'island_01';
  }

  private renderIslandSelector(ctx: CanvasRenderingContext2D): void {
    drawButton(ctx, ISLAND_PREV.x, ISLAND_PREV.y, ISLAND_PREV.w, ISLAND_PREV.h, '<', false, 10);
    drawButton(ctx, ISLAND_NEXT.x, ISLAND_NEXT.y, ISLAND_NEXT.w, ISLAND_NEXT.h, '>', false, 10);

    const label = this.selectedIslandId.replace('island_', 'ISLAND ');
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.fillText(label, GAME_WIDTH / 2, 99);
  }

  private renderBoardToggle(
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; w: number; h: number },
    label: string,
    active: boolean,
  ): void {
    drawButton(ctx, rect.x, rect.y, rect.w, rect.h, label, active, 8);
  }

  private fetchBoard(): void {
    this.loading = true;
    const islandId = this.selectedBoard === 'island' ? this.selectedIslandId : undefined;
    const cacheKey = `${this.selectedBoard}:${islandId ?? 'all'}`;

    void this.deps.apiClient
      .getLeaderboard(this.selectedBoard, islandId, this.deps.playerId)
      .then((payload) => {
        this.rows = payload.top10;
        this.playerRank = payload.playerRank ?? null;
        this.deps.localStore.cacheLeaderboard(cacheKey, payload);
        this.deps.telemetry.emit(TELEMETRY_EVENTS.leaderboardViewed, {
          board_type: this.selectedBoard,
          island_id: islandId ?? null,
          player_rank: payload.playerRank ?? -1,
        });
      })
      .catch(() => {
        const cached = this.deps.localStore.readCachedLeaderboard(cacheKey);
        this.rows = cached?.top10 ?? [];
        this.playerRank = cached?.playerRank ?? null;
      })
      .finally(() => {
        this.loading = false;
      });
  }
}

function pointInRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
