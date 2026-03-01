/**
 * Overworld Layout Validator
 *
 * Pure-function validator that checks overworld node arrays for:
 *   1. Every node fits inside the renderable chart bounds.
 *   2. No two node hit-areas overlap (including glow ring + grade text).
 *   3. No node is clipped by the edge (full circle + badge must be inset).
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

// ── Error types ─────────────────────────────────────────────

export interface LayoutError {
  type: 'out_of_bounds' | 'overlap';
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

  // 2) Pairwise overlap check
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
