import type { Scene, SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import type { ApiClient, LeaderboardResponse } from '../persistence/api-client';
import type { LocalStore } from '../persistence/local-store';

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
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, 240, 400);

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h);
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h);
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('BACK', BACK_BUTTON.x + BACK_BUTTON.w / 2, 23);

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontMedium;
    ctx.fillText('LEADERBOARD', 120, 40);

    for (const board of BOARD_BUTTONS) {
      this.renderBoardToggle(ctx, board.rect, board.label, this.selectedBoard === board.type);
    }

    if (this.selectedBoard === 'island') {
      this.renderIslandSelector(ctx);
    }

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';

    const startY = 114;
    const visibleRows = this.rows.slice(0, 10);
    for (let index = 0; index < visibleRows.length; index += 1) {
      const row = visibleRows[index];
      if (!row) {
        continue;
      }

      const y = startY + index * 24;
      const isPlayer = row.playerId === this.deps.playerId;
      if (isPlayer) {
        ctx.strokeStyle = TOKENS.colorCyan400;
        ctx.strokeRect(10, y - 14, 220, 20);
      }

      ctx.fillStyle = TOKENS.colorText;
      ctx.fillText(`${index + 1}.`, 14, y);
      ctx.fillText(row.displayName.slice(0, 12), 40, y);
      ctx.textAlign = 'right';
      ctx.fillText(String(row.score), 186, y);
      ctx.fillText(row.grade, 226, y);
      ctx.textAlign = 'left';
    }

    const rankText = this.playerRank ? `YOUR RANK: ${this.playerRank}` : 'YOUR RANK: —';
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.fillText(rankText, 12, 372);

    if (this.loading) {
      ctx.fillStyle = TOKENS.colorText;
      ctx.fillText('SYNCING…', 168, 372);
    }
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
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(ISLAND_PREV.x, ISLAND_PREV.y, ISLAND_PREV.w, ISLAND_PREV.h);
    ctx.fillRect(ISLAND_NEXT.x, ISLAND_NEXT.y, ISLAND_NEXT.w, ISLAND_NEXT.h);

    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(ISLAND_PREV.x, ISLAND_PREV.y, ISLAND_PREV.w, ISLAND_PREV.h);
    ctx.strokeRect(ISLAND_NEXT.x, ISLAND_NEXT.y, ISLAND_NEXT.w, ISLAND_NEXT.h);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('<', ISLAND_PREV.x + 12, ISLAND_PREV.y + 14);
    ctx.fillText('>', ISLAND_NEXT.x + 12, ISLAND_NEXT.y + 14);

    const label = this.selectedIslandId.replace('island_', 'ISLAND ');
    ctx.fillText(label, 120, 99);
  }

  private renderBoardToggle(
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; w: number; h: number },
    label: string,
    active: boolean,
  ): void {
    ctx.fillStyle = active ? '#1f2937' : '#111827';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = active ? TOKENS.colorYellow400 : '#334155';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + 16);
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
