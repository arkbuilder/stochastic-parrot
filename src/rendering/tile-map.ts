import { GAME_HEIGHT, GAME_WIDTH } from '../core/types';

export interface TileMapLayout {
  tileSize: number;
  width: number;
  height: number;
  rows: string[];
}

const TILE_COLORS: Record<string, string> = {
  W: '#0f3460',
  S: '#c89f5d',
  G: '#3a5a40',
  D: '#8d6e63',
  C: '#6d4c41',
};

export class TileMap {
  constructor(private readonly layout: TileMapLayout) {}

  static async load(layoutUrl: string): Promise<TileMap> {
    const response = await fetch(layoutUrl);
    if (!response.ok) {
      throw new Error(`Failed to load tile layout: ${layoutUrl}`);
    }

    const layout = (await response.json()) as TileMapLayout;
    return new TileMap(layout);
  }

  render(ctx: CanvasRenderingContext2D, cameraX = 0, cameraY = 0): void {
    const { tileSize, rows } = this.layout;

    for (let y = 0; y < rows.length; y += 1) {
      const row = rows[y] ?? '';
      for (let x = 0; x < row.length; x += 1) {
        const tile = row[x] ?? 'W';
        const color = TILE_COLORS[tile] ?? '#222';

        const drawX = x * tileSize - cameraX;
        const drawY = y * tileSize - cameraY;

        if (drawX + tileSize < 0 || drawY + tileSize < 0 || drawX > GAME_WIDTH || drawY > GAME_HEIGHT) {
          continue;
        }

        ctx.fillStyle = color;
        ctx.fillRect(drawX, drawY, tileSize, tileSize);
      }
    }
  }
}
