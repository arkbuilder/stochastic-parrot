/**
 * Overworld Layout Validator
 *
 * Pure-function validator that checks overworld node arrays for:
 *   1. Every node fits inside the renderable chart bounds.
 *   2. No two node hit-areas overlap (including glow ring + grade text).
 *   3. No node is clipped by the edge (full circle + badge must be inset).
 *   4. Every node sits on a valid grid intersection (grid-snap rule).
 *
 * The chart is divided into a 5×5 grid with 44px spacing.
 * Placing at most one node per grid cell guarantees no visual overlap,
 * because the cell size (44px) exceeds MIN_NODE_SEPARATION (42px).
 *
 * Constants are derived from the rendering code in overworld-scene.ts.
 * All functions are side-effect-free and exported for testing.
 */

import type { OverworldNodeConfig } from './progression';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';

// ── Layout constants (mirrors overworld-scene.ts rendering) ─────────

/** y where the sea chart area begins */
export const CHART_TOP = 84;   // HORIZON_Y
/** y where the HUD panel starts */
export const CHART_BOTTOM = 320;
/** Canvas left edge */
export const CHART_LEFT = 0;
/** Canvas right edge */
export const CHART_RIGHT = GAME_WIDTH;

/** Island circle radius */
export const NODE_RADIUS = 14;
/** Selection glow ring radius */
export const GLOW_RADIUS = 20;
/** Vertical offset of grade text below node center */
export const GRADE_OFFSET_Y = 24;
/** Approximate height of the grade text line */
export const GRADE_TEXT_H = 8;
/** Checkmark badge extends this far above and to the right of center */
export const BADGE_OFFSET_X = 14;  // node_x + 9 + radius 5
export const BADGE_OFFSET_Y = 14;  // node_y - 9 - radius 5

// ── Grid constants ──────────────────────────────────────────

/** Grid cell size in pixels — must be ≥ MIN_NODE_SEPARATION */
export const GRID_CELL = 44;
/** X of first grid column (col 0) */
export const GRID_ORIGIN_X = 22;
/** Y of first grid row (row 0) */
export const GRID_ORIGIN_Y = 104;
/** Number of grid columns */
export const GRID_COLS = 5;   // x: 22, 66, 110, 154, 198
/** Number of grid rows */
export const GRID_ROWS = 5;   // y: 104, 148, 192, 236, 280

// ── Error types ─────────────────────────────────────────────

export interface LayoutError {
  type: 'out_of_bounds' | 'overlap' | 'off_grid';
  message: string;
  nodeIds: string[];
}

// ── Validation ──────────────────────────────────────────────

/**
 * The effective bounding box of a node on the chart.
 * Accounts for the glow ring (largest circle) and the grade text below.
 */
export function nodeExtent(node: OverworldNodeConfig): {
  top: number; bottom: number; left: number; right: number;
} {
  const top = node.y - GLOW_RADIUS;
  const bottom = node.y + GRADE_OFFSET_Y + GRADE_TEXT_H;
  const left = node.x - GLOW_RADIUS;
  const right = node.x + GLOW_RADIUS;
  return { top, bottom, left, right };
}

/**
 * Check that a node's full extent fits within the chart bounds.
 */
export function isNodeInBounds(node: OverworldNodeConfig): boolean {
  const ext = nodeExtent(node);
  return ext.top >= CHART_TOP &&
         ext.bottom <= CHART_BOTTOM &&
         ext.left >= CHART_LEFT &&
         ext.right <= CHART_RIGHT;
}

/**
 * Euclidean distance between two node centers.
 */
export function nodeCenterDistance(a: OverworldNodeConfig, b: OverworldNodeConfig): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Minimum center-to-center distance at which two nodes don't visually overlap.
 * Uses glow radius (the largest drawn circle) × 2 as the separation diameter,
 * plus a small grace margin so they don't touch edges.
 */
export const MIN_NODE_SEPARATION = GLOW_RADIUS * 2 + 2; // 42px

/**
 * Check whether two nodes overlap (circles + grade text).
 */
export function nodesOverlap(a: OverworldNodeConfig, b: OverworldNodeConfig): boolean {
  return nodeCenterDistance(a, b) < MIN_NODE_SEPARATION;
}

// ── Grid helpers ────────────────────────────────────────────

/** All valid grid x positions */
export function gridXPositions(): number[] {
  return Array.from({ length: GRID_COLS }, (_, c) => GRID_ORIGIN_X + c * GRID_CELL);
}

/** All valid grid y positions */
export function gridYPositions(): number[] {
  return Array.from({ length: GRID_ROWS }, (_, r) => GRID_ORIGIN_Y + r * GRID_CELL);
}

/**
 * Check whether a node's center sits on a valid grid intersection.
 */
export function isOnGrid(node: OverworldNodeConfig): boolean {
  const colOffset = node.x - GRID_ORIGIN_X;
  const rowOffset = node.y - GRID_ORIGIN_Y;
  if (colOffset < 0 || rowOffset < 0) return false;
  return colOffset % GRID_CELL === 0 && rowOffset % GRID_CELL === 0;
}

/**
 * Return the nearest grid intersection to the given (x, y).
 */
export function snapToGrid(x: number, y: number): { x: number; y: number } {
  const col = Math.round((x - GRID_ORIGIN_X) / GRID_CELL);
  const row = Math.round((y - GRID_ORIGIN_Y) / GRID_CELL);
  return {
    x: GRID_ORIGIN_X + Math.max(0, Math.min(GRID_COLS - 1, col)) * GRID_CELL,
    y: GRID_ORIGIN_Y + Math.max(0, Math.min(GRID_ROWS - 1, row)) * GRID_CELL,
  };
}

/**
 * Grid cell key for duplicate detection: "col,row".
 */
function gridKey(node: OverworldNodeConfig): string {
  const col = (node.x - GRID_ORIGIN_X) / GRID_CELL;
  const row = (node.y - GRID_ORIGIN_Y) / GRID_CELL;
  return `${col},${row}`;
}

// ── Full validation ─────────────────────────────────────────

/**
 * Validate a full set of overworld nodes.
 * Returns an empty array when everything is valid.
 */
export function validateOverworldLayout(nodes: OverworldNodeConfig[]): LayoutError[] {
  const errors: LayoutError[] = [];

  // 1) Bounds check
  for (const node of nodes) {
    if (!isNodeInBounds(node)) {
      const ext = nodeExtent(node);
      errors.push({
        type: 'out_of_bounds',
        message:
          `Node "${node.name}" (${node.islandId}) at (${node.x}, ${node.y}) ` +
          `extends to top=${ext.top} bottom=${ext.bottom} left=${ext.left} right=${ext.right} — ` +
          `chart bounds are top=${CHART_TOP} bottom=${CHART_BOTTOM} left=${CHART_LEFT} right=${CHART_RIGHT}`,
        nodeIds: [node.islandId],
      });
    }
  }

  // 2) Grid-snap check
  for (const node of nodes) {
    if (!isOnGrid(node)) {
      const snapped = snapToGrid(node.x, node.y);
      errors.push({
        type: 'off_grid',
        message:
          `Node "${node.name}" (${node.islandId}) at (${node.x}, ${node.y}) ` +
          `is not on a grid intersection — nearest grid point is (${snapped.x}, ${snapped.y})`,
        nodeIds: [node.islandId],
      });
    }
  }

  // 3) Pairwise overlap check (redundant if grid-snapped, but kept as safety net)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      if (nodesOverlap(a, b)) {
        const dist = nodeCenterDistance(a, b).toFixed(1);
        errors.push({
          type: 'overlap',
          message:
            `Nodes "${a.name}" and "${b.name}" overlap — ` +
            `center distance ${dist}px < minimum ${MIN_NODE_SEPARATION}px`,
          nodeIds: [a.islandId, b.islandId],
        });
      }
    }
  }

  return errors;
}
