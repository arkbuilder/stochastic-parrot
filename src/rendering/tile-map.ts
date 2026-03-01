import { GAME_HEIGHT, GAME_WIDTH } from '../core/types';

export interface TileMapLayout {
  tileSize: number;
  width: number;
  height: number;
  rows: string[];
}

/* ── Base + variation colours per tile ── */
interface TilePalette {
  base: string;
  light: string;
  dark: string;
  detail: string;
}

const TILE_PALETTES: Record<string, TilePalette> = {
  W: { base: '#0d3b66', light: '#1a4a6e', dark: '#071e3d', detail: '#1e5f8a' },
  S: { base: '#d4a76a', light: '#e0be88', dark: '#b8934a', detail: '#c49a56' },
  G: { base: '#2d6a4f', light: '#40916c', dark: '#1b4332', detail: '#52b788' },
  D: { base: '#8b6f47', light: '#a68b5b', dark: '#6d5535', detail: '#926e3e' },
  C: { base: '#6d4c41', light: '#8d6e63', dark: '#4e342e', detail: '#5d4037' },
  T: { base: '#1a6e8a', light: '#2890aa', dark: '#0e4f66', detail: '#44b8d4' },  // Tide pools
  R: { base: '#5c5470', light: '#736b8a', dark: '#3d3655', detail: '#8e7faa' },  // Ruins stone
  V: { base: '#3a2520', light: '#5c3a30', dark: '#251510', detail: '#e85d3a' },  // Volcanic rock
  P: { base: '#2a5a6a', light: '#3a7a8a', dark: '#1a3a4a', detail: '#f472b6' },  // Reef pools
  M: { base: '#1e5040', light: '#2d7058', dark: '#0e3828', detail: '#6ecc9a' },  // Mossy stone
};

/* Simple seeded hash for per-tile deterministic variation */
function tileHash(x: number, y: number): number {
  let h = (x * 374761 + y * 668265) | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return ((h >> 16) ^ h) & 0xff;
}

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

  render(ctx: CanvasRenderingContext2D, cameraX = 0, cameraY = 0, t = 0): void {
    const { tileSize, rows } = this.layout;
    const ts = tileSize;

    for (let y = 0; y < rows.length; y += 1) {
      const row = rows[y] ?? '';
      for (let x = 0; x < row.length; x += 1) {
        const tile = row[x] ?? 'W';
        const palette = TILE_PALETTES[tile];
        if (!palette) continue;

        const drawX = x * ts - cameraX;
        const drawY = y * ts - cameraY;

        if (drawX + ts < 0 || drawY + ts < 0 || drawX > GAME_WIDTH || drawY > GAME_HEIGHT) {
          continue;
        }

        const hash = tileHash(x, y);

        // Base fill
        ctx.fillStyle = palette.base;
        ctx.fillRect(drawX, drawY, ts, ts);

        // Per-tile variation: light or dark patch
        if (hash < 80) {
          ctx.fillStyle = palette.light;
          const px = drawX + (hash % 5);
          const py = drawY + ((hash >> 3) % 5);
          const pw = 4 + (hash % 4);
          const ph = 3 + ((hash >> 2) % 4);
          ctx.fillRect(px, py, pw, ph);
        } else if (hash < 140) {
          ctx.fillStyle = palette.dark;
          ctx.fillRect(drawX + (hash % 4), drawY + ((hash >> 2) % 4), 3 + (hash % 3), 3);
        }

        // Tile-type-specific detail
        if (tile === 'W') {
          // Water: animated multi-layer wave effect
          // Wave swell band
          const wave1 = Math.sin((x * 0.7 + t * 1.8 + y * 0.4)) * 0.14 + 0.06;
          ctx.fillStyle = `rgba(60,160,210,${wave1.toFixed(3)})`;
          const wy = drawY + 2 + Math.sin(x * 0.5 + t * 1.2 + y * 0.3) * 2;
          ctx.fillRect(drawX, wy, ts, 3);

          // Secondary crest
          const wave2 = Math.sin((x * 1.1 + t * 2.2 + y * 0.7)) * 0.10 + 0.04;
          ctx.fillStyle = `rgba(100,190,230,${wave2.toFixed(3)})`;
          ctx.fillRect(drawX, drawY + 6 + (hash % 3), ts, 1);

          // Foam dot (deterministic per tile, animated visibility)
          const foamPhase = Math.sin(t * 1.5 + x * 0.8 + y * 1.2);
          if (hash < 60 && foamPhase > 0.3) {
            ctx.fillStyle = `rgba(220,240,255,${(foamPhase * 0.25).toFixed(2)})`;
            ctx.fillRect(drawX + (hash % 6) + 2, drawY + ((hash >> 2) % 5) + 1, 2, 1);
          }

          // Sparkle (rare per tile)
          if (hash > 220) {
            const sparkle = Math.sin(t * 3 + hash) * 0.5 + 0.5;
            if (sparkle > 0.7) {
              ctx.fillStyle = `rgba(255,255,255,${((sparkle - 0.7) * 1.0).toFixed(2)})`;
              ctx.fillRect(drawX + (hash % 8) + 3, drawY + ((hash >> 3) % 6) + 2, 1, 1);
            }
          }
        } else if (tile === 'S') {
          // Sand: grain dots
          ctx.fillStyle = palette.detail;
          if (hash & 1) ctx.fillRect(drawX + 2, drawY + 3, 1, 1);
          if (hash & 2) ctx.fillRect(drawX + 6, drawY + 1, 1, 1);
          if (hash & 4) ctx.fillRect(drawX + 4, drawY + 6, 1, 1);
        } else if (tile === 'G') {
          // Grass: tuft marks
          ctx.fillStyle = palette.detail;
          if (hash & 1) {
            ctx.fillRect(drawX + 1, drawY + 2, 1, 2);
            ctx.fillRect(drawX + 2, drawY + 1, 1, 1);
          }
          if (hash & 2) {
            ctx.fillRect(drawX + 5, drawY + 4, 1, 2);
            ctx.fillRect(drawX + 6, drawY + 3, 1, 1);
          }
        } else if (tile === 'D' || tile === 'C') {
          // Dock / cobble: plank / stone lines
          ctx.strokeStyle = palette.dark;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(drawX, drawY + ts / 2);
          ctx.lineTo(drawX + ts, drawY + ts / 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        } else if (tile === 'T') {
          // Tide pools: animated shimmer + bubbles
          const shimmer = Math.sin(t * 2.2 + x * 0.8 + y * 0.5) * 0.12 + 0.06;
          ctx.fillStyle = `rgba(68,184,212,${shimmer.toFixed(3)})`;
          ctx.fillRect(drawX + 1, drawY + 2, ts - 2, ts - 4);
          if (hash < 80) {
            const bubbleY = drawY + ((hash + t * 12) % ts);
            ctx.fillStyle = 'rgba(200,240,255,0.35)';
            ctx.beginPath();
            ctx.arc(drawX + (hash % 7) + 2, bubbleY, 1, 0, Math.PI * 2);
            ctx.fill();
          }
          if (hash & 1) {
            ctx.fillStyle = palette.detail;
            ctx.fillRect(drawX + 3, drawY + 5, 1, 1);
          }
        } else if (tile === 'R') {
          // Ruins stone: cracked flagstone pattern
          ctx.strokeStyle = palette.dark;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(drawX + ts / 2, drawY);
          ctx.lineTo(drawX + ts / 2 + (hash % 3) - 1, drawY + ts);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(drawX, drawY + ts / 2);
          ctx.lineTo(drawX + ts, drawY + ts / 2 + (hash % 3) - 1);
          ctx.stroke();
          ctx.lineWidth = 1;
          // Rune glow
          if (hash > 200) {
            const glow = Math.sin(t * 1.5 + hash) * 0.15 + 0.15;
            ctx.fillStyle = `rgba(142,127,170,${glow.toFixed(3)})`;
            ctx.fillRect(drawX + 3, drawY + 3, 2, 2);
          }
        } else if (tile === 'V') {
          // Volcanic rock: ember glow + cracks
          ctx.strokeStyle = palette.dark;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(drawX + (hash % 4), drawY + 2);
          ctx.lineTo(drawX + ts - (hash % 5), drawY + ts - 1);
          ctx.stroke();
          ctx.lineWidth = 1;
          // Ember glow in cracks
          const ember = Math.sin(t * 1.8 + hash * 0.5) * 0.2 + 0.25;
          ctx.fillStyle = `rgba(232,93,58,${ember.toFixed(3)})`;
          if (hash & 1) ctx.fillRect(drawX + 2, drawY + 4, 2, 1);
          if (hash & 2) ctx.fillRect(drawX + 5, drawY + 2, 1, 2);
        } else if (tile === 'P') {
          // Reef pools: water with coral specks
          const poolShimmer = Math.sin(t * 1.6 + x * 0.6 + y * 0.9) * 0.08 + 0.04;
          ctx.fillStyle = `rgba(58,122,138,${poolShimmer.toFixed(3)})`;
          ctx.fillRect(drawX, drawY + 1, ts, ts - 2);
          // Coral specks
          const colors = ['#f472b6', '#fb923c', '#a78bfa'];
          if (hash & 1) {
            ctx.fillStyle = colors[hash % 3]!;
            ctx.fillRect(drawX + 2, drawY + 5, 1, 1);
          }
          if (hash & 4) {
            ctx.fillStyle = colors[(hash >> 2) % 3]!;
            ctx.fillRect(drawX + 6, drawY + 2, 1, 1);
          }
        } else if (tile === 'M') {
          // Mossy stone: stone base + green patches
          ctx.fillStyle = palette.detail;
          if (hash & 1) {
            ctx.fillRect(drawX + 1, drawY + 1, 3, 2);
          }
          if (hash & 2) {
            ctx.fillRect(drawX + 5, drawY + 5, 2, 2);
          }
          // Stone cracks
          ctx.strokeStyle = palette.dark;
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(drawX + 1, drawY + ts / 2);
          ctx.lineTo(drawX + ts - 1, drawY + ts / 2 + 1);
          ctx.stroke();
          ctx.lineWidth = 1;
        }

        // Edges: darken borders adjacent to different tiles
        const above = y > 0 ? (rows[y - 1]?.[x] ?? 'W') : tile;
        const left = x > 0 ? (row[x - 1] ?? 'W') : tile;
        if (above !== tile) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(drawX, drawY, ts, 1);
        }
        if (left !== tile) {
          ctx.fillStyle = 'rgba(0,0,0,0.10)';
          ctx.fillRect(drawX, drawY, 1, ts);
        }
      }
    }
  }
}
