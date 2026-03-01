/**
 * Tests for overworld-layout-validator.ts
 *
 * Validates that every node set (base game, Rocket Science DLC,
 * Cybersecurity DLC) passes all layout constraints:
 *   - Nodes fit within the chart bounds
 *   - No two nodes overlap
 *
 * Also unit-tests the individual validator functions with synthetic data.
 */

import { describe, expect, it } from 'vitest';
import {
  validateOverworldLayout,
  isNodeInBounds,
  nodesOverlap,
  nodeCenterDistance,
  nodeExtent,
  CHART_TOP,
  CHART_BOTTOM,
  CHART_LEFT,
  CHART_RIGHT,
  GLOW_RADIUS,
  NODE_RADIUS,
  GRADE_OFFSET_Y,
  GRADE_TEXT_H,
  MIN_NODE_SEPARATION,
} from '../../../src/data/overworld-layout-validator';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import { CYBERSECURITY_PACK } from '../../../src/dlc/packs/cybersecurity-pack';
import type { OverworldNodeConfig } from '../../../src/data/progression';

// ── Helper ──────────────────────────────────────────────────

function makeNode(overrides: Partial<OverworldNodeConfig> & { islandId: string }): OverworldNodeConfig {
  return { name: overrides.islandId, x: 120, y: 200, ...overrides };
}

// ── Constants sanity ────────────────────────────────────────

describe('layout constants', () => {
  it('chart area has positive height', () => {
    expect(CHART_BOTTOM - CHART_TOP).toBeGreaterThan(100);
  });

  it('minimum separation is at least two glow radii', () => {
    expect(MIN_NODE_SEPARATION).toBeGreaterThanOrEqual(GLOW_RADIUS * 2);
  });

  it('chart bounds match game dimensions', () => {
    expect(CHART_RIGHT).toBe(240);
    expect(CHART_TOP).toBe(84);
    expect(CHART_BOTTOM).toBe(320);
  });
});

// ── nodeExtent ──────────────────────────────────────────────

describe('nodeExtent', () => {
  it('computes extent from glow radius and grade text', () => {
    const node = makeNode({ islandId: 'test', x: 100, y: 200 });
    const ext = nodeExtent(node);
    expect(ext.top).toBe(200 - GLOW_RADIUS);
    expect(ext.bottom).toBe(200 + GRADE_OFFSET_Y + GRADE_TEXT_H);
    expect(ext.left).toBe(100 - GLOW_RADIUS);
    expect(ext.right).toBe(100 + GLOW_RADIUS);
  });
});

// ── isNodeInBounds ──────────────────────────────────────────

describe('isNodeInBounds', () => {
  it('accepts a well-centered node', () => {
    const node = makeNode({ islandId: 'ok', x: 120, y: 200 });
    expect(isNodeInBounds(node)).toBe(true);
  });

  it('rejects node too close to chart top', () => {
    // Glow radius of 20 means minimum y = CHART_TOP + GLOW_RADIUS
    const node = makeNode({ islandId: 'high', x: 120, y: CHART_TOP + GLOW_RADIUS - 1 });
    expect(isNodeInBounds(node)).toBe(false);
  });

  it('rejects node too close to chart bottom', () => {
    // Grade text extends GRADE_OFFSET_Y + GRADE_TEXT_H below center
    const maxY = CHART_BOTTOM - GRADE_OFFSET_Y - GRADE_TEXT_H;
    const node = makeNode({ islandId: 'low', x: 120, y: maxY + 1 });
    expect(isNodeInBounds(node)).toBe(false);
  });

  it('rejects node too close to left edge', () => {
    const node = makeNode({ islandId: 'left', x: GLOW_RADIUS - 1, y: 200 });
    expect(isNodeInBounds(node)).toBe(false);
  });

  it('rejects node too close to right edge', () => {
    const node = makeNode({ islandId: 'right', x: CHART_RIGHT - GLOW_RADIUS + 1, y: 200 });
    expect(isNodeInBounds(node)).toBe(false);
  });

  it('accepts node at exact boundary limits', () => {
    const minX = GLOW_RADIUS;
    const maxX = CHART_RIGHT - GLOW_RADIUS;
    const minY = CHART_TOP + GLOW_RADIUS;
    const maxY = CHART_BOTTOM - GRADE_OFFSET_Y - GRADE_TEXT_H;
    expect(isNodeInBounds(makeNode({ islandId: 'tl', x: minX, y: minY }))).toBe(true);
    expect(isNodeInBounds(makeNode({ islandId: 'br', x: maxX, y: maxY }))).toBe(true);
  });
});

// ── nodeCenterDistance ───────────────────────────────────────

describe('nodeCenterDistance', () => {
  it('returns 0 for identical positions', () => {
    const a = makeNode({ islandId: 'a', x: 100, y: 200 });
    const b = makeNode({ islandId: 'b', x: 100, y: 200 });
    expect(nodeCenterDistance(a, b)).toBe(0);
  });

  it('computes correct Euclidean distance', () => {
    const a = makeNode({ islandId: 'a', x: 0, y: 0 });
    const b = makeNode({ islandId: 'b', x: 3, y: 4 });
    expect(nodeCenterDistance(a, b)).toBe(5);
  });
});

// ── nodesOverlap ────────────────────────────────────────────

describe('nodesOverlap', () => {
  it('detects overlapping nodes', () => {
    const a = makeNode({ islandId: 'a', x: 100, y: 200 });
    const b = makeNode({ islandId: 'b', x: 100 + MIN_NODE_SEPARATION - 1, y: 200 });
    expect(nodesOverlap(a, b)).toBe(true);
  });

  it('allows nodes at exactly the minimum separation', () => {
    const a = makeNode({ islandId: 'a', x: 100, y: 200 });
    const b = makeNode({ islandId: 'b', x: 100 + MIN_NODE_SEPARATION, y: 200 });
    expect(nodesOverlap(a, b)).toBe(false);
  });

  it('allows well-separated nodes', () => {
    const a = makeNode({ islandId: 'a', x: 40, y: 200 });
    const b = makeNode({ islandId: 'b', x: 200, y: 200 });
    expect(nodesOverlap(a, b)).toBe(false);
  });
});

// ── validateOverworldLayout (synthetic) ─────────────────────

describe('validateOverworldLayout', () => {
  it('returns empty array for valid layout', () => {
    const nodes = [
      makeNode({ islandId: 'n1', x: 60, y: 150 }),
      makeNode({ islandId: 'n2', x: 180, y: 250 }),
    ];
    expect(validateOverworldLayout(nodes)).toEqual([]);
  });

  it('reports out-of-bounds nodes', () => {
    const nodes = [
      makeNode({ islandId: 'bad', x: 5, y: 90 }), // left edge violation
    ];
    const errors = validateOverworldLayout(nodes);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.type).toBe('out_of_bounds');
    expect(errors[0]!.nodeIds).toContain('bad');
  });

  it('reports overlapping pair', () => {
    const nodes = [
      makeNode({ islandId: 'a', x: 100, y: 200 }),
      makeNode({ islandId: 'b', x: 110, y: 200 }),
    ];
    const errors = validateOverworldLayout(nodes);
    const overlaps = errors.filter((e) => e.type === 'overlap');
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]!.nodeIds).toContain('a');
    expect(overlaps[0]!.nodeIds).toContain('b');
  });

  it('reports multiple overlap pairs independently', () => {
    const nodes = [
      makeNode({ islandId: 'a', x: 60, y: 200 }),
      makeNode({ islandId: 'b', x: 70, y: 200 }),
      makeNode({ islandId: 'c', x: 80, y: 200 }),
    ];
    const overlaps = validateOverworldLayout(nodes).filter((e) => e.type === 'overlap');
    // a–b overlap, b–c overlap, a–c overlap (all within 20px)
    expect(overlaps.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty node array', () => {
    expect(validateOverworldLayout([])).toEqual([]);
  });

  it('handles single node in bounds', () => {
    expect(validateOverworldLayout([makeNode({ islandId: 'solo', x: 120, y: 200 })])).toEqual([]);
  });
});

// ── Live data: Base game nodes ──────────────────────────────

describe('base game overworld layout', () => {
  const baseNodes = OVERWORLD_NODES;

  it('has the expected number of nodes (5 + hidden reef)', () => {
    expect(baseNodes.length).toBe(6);
  });

  it('all base nodes are within chart bounds', () => {
    const errors = validateOverworldLayout(baseNodes).filter((e) => e.type === 'out_of_bounds');
    expect(errors).toEqual([]);
  });

  it('no base node pairs overlap', () => {
    const errors = validateOverworldLayout(baseNodes).filter((e) => e.type === 'overlap');
    expect(errors).toEqual([]);
  });

  it('passes full validation with zero errors', () => {
    expect(validateOverworldLayout(baseNodes)).toEqual([]);
  });
});

// ── Live data: Rocket Science DLC nodes ─────────────────────

describe('Rocket Science DLC overworld layout', () => {
  const rocketNodes = ROCKET_SCIENCE_PACK.content.overworldNodes as OverworldNodeConfig[];

  it('has 5 nodes', () => {
    expect(rocketNodes).toHaveLength(5);
  });

  it('all rocket nodes are within chart bounds', () => {
    const errors = validateOverworldLayout(rocketNodes).filter((e) => e.type === 'out_of_bounds');
    expect(errors).toEqual([]);
  });

  it('no rocket node pairs overlap', () => {
    const errors = validateOverworldLayout(rocketNodes).filter((e) => e.type === 'overlap');
    expect(errors).toEqual([]);
  });

  it('passes full validation with zero errors', () => {
    expect(validateOverworldLayout(rocketNodes)).toEqual([]);
  });
});

// ── Live data: Cybersecurity DLC nodes ──────────────────────

describe('Cybersecurity DLC overworld layout', () => {
  const cipherNodes = CYBERSECURITY_PACK.content.overworldNodes as OverworldNodeConfig[];

  it('has 2 nodes', () => {
    expect(cipherNodes).toHaveLength(2);
  });

  it('all cipher nodes are within chart bounds', () => {
    const errors = validateOverworldLayout(cipherNodes).filter((e) => e.type === 'out_of_bounds');
    expect(errors).toEqual([]);
  });

  it('no cipher node pairs overlap', () => {
    const errors = validateOverworldLayout(cipherNodes).filter((e) => e.type === 'overlap');
    expect(errors).toEqual([]);
  });

  it('passes full validation with zero errors', () => {
    expect(validateOverworldLayout(cipherNodes)).toEqual([]);
  });
});

// ── Cross-campaign: combined nodes should not overlap ────────
// (not strictly required since campaigns display separately, but
//  guards against future "show all campaigns" features)

describe('combined all-campaigns layout', () => {
  const allNodes = [
    ...OVERWORLD_NODES,
    ...(ROCKET_SCIENCE_PACK.content.overworldNodes as OverworldNodeConfig[]),
    ...(CYBERSECURITY_PACK.content.overworldNodes as OverworldNodeConfig[]),
  ];

  it('all nodes from all campaigns are individually within bounds', () => {
    const errors = validateOverworldLayout(allNodes).filter((e) => e.type === 'out_of_bounds');
    expect(errors).toEqual([]);
  });
});
