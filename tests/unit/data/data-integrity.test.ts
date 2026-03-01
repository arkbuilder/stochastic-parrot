/**
 * Data Integrity — progression.ts & prompts.ts
 *
 * Tests:
 * - OVERWORLD_NODES count and structure
 * - All node coordinates within playable bounds
 * - ISLAND_UPGRADE_REWARDS references valid island IDs
 * - RECALL_PROMPTS count (1 per concept)
 * - Every prompt has valid structure (id, conceptId, iconHints)
 * - No duplicate prompt IDs or concept IDs
 */
import { describe, it, expect } from 'vitest';
import { OVERWORLD_NODES, ISLAND_UPGRADE_REWARDS } from '../../../src/data/progression';
import { RECALL_PROMPTS } from '../../../src/data/prompts';

// ── OVERWORLD_NODES ─────────────────────────────────────────

describe('OVERWORLD_NODES data integrity', () => {
  it('has 6 nodes (5 islands + hidden_reef)', () => {
    expect(OVERWORLD_NODES).toHaveLength(6);
  });

  it('every node has required fields', () => {
    for (const node of OVERWORLD_NODES) {
      expect(node.islandId).toBeTruthy();
      expect(node.name).toBeTruthy();
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
    }
  });

  it('no duplicate islandIds', () => {
    const ids = OVERWORLD_NODES.map((n) => n.islandId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all nodes have x in [0, 240]', () => {
    for (const node of OVERWORLD_NODES) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(240);
    }
  });

  it('all nodes have y in [0, 400]', () => {
    for (const node of OVERWORLD_NODES) {
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(400);
    }
  });

  it('hidden_reef node has secret: true', () => {
    const reef = OVERWORLD_NODES.find((n) => n.islandId === 'hidden_reef');
    expect(reef).toBeDefined();
    expect(reef!.secret).toBe(true);
  });

  it('non-secret nodes do not have secret: true', () => {
    const nonSecret = OVERWORLD_NODES.filter((n) => n.islandId !== 'hidden_reef');
    for (const node of nonSecret) {
      expect(node.secret).toBeFalsy();
    }
  });

  it('island_01 through island_05 all present', () => {
    for (let i = 1; i <= 5; i++) {
      const id = `island_0${i}`;
      expect(OVERWORLD_NODES.find((n) => n.islandId === id)).toBeDefined();
    }
  });
});

// ── ISLAND_UPGRADE_REWARDS ──────────────────────────────────

describe('ISLAND_UPGRADE_REWARDS data integrity', () => {
  it('has 4 upgrade rewards (islands 1-4)', () => {
    expect(Object.keys(ISLAND_UPGRADE_REWARDS)).toHaveLength(4);
  });

  it('keys reference existing overworld node IDs', () => {
    const nodeIds = new Set(OVERWORLD_NODES.map((n) => n.islandId));
    for (const key of Object.keys(ISLAND_UPGRADE_REWARDS)) {
      expect(nodeIds.has(key), `${key} not in OVERWORLD_NODES`).toBe(true);
    }
  });

  it('no duplicate reward values', () => {
    const values = Object.values(ISLAND_UPGRADE_REWARDS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('reward names are non-empty strings', () => {
    for (const reward of Object.values(ISLAND_UPGRADE_REWARDS)) {
      expect(typeof reward).toBe('string');
      expect(reward.length).toBeGreaterThan(0);
    }
  });
});

// ── RECALL_PROMPTS ──────────────────────────────────────────

describe('RECALL_PROMPTS data integrity', () => {
  it('has 15 prompts (one per base concept)', () => {
    expect(RECALL_PROMPTS).toHaveLength(15);
  });

  it('every prompt has a non-empty id', () => {
    for (const prompt of RECALL_PROMPTS) {
      expect(prompt.id).toBeTruthy();
      expect(prompt.id.startsWith('prompt_')).toBe(true);
    }
  });

  it('no duplicate prompt IDs', () => {
    const ids = RECALL_PROMPTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate conceptIds', () => {
    const cids = RECALL_PROMPTS.map((p) => p.conceptId);
    expect(new Set(cids).size).toBe(cids.length);
  });

  it('every prompt has a non-empty promptStyle', () => {
    for (const prompt of RECALL_PROMPTS) {
      expect(prompt.promptStyle).toBeTruthy();
    }
  });

  it('every prompt has at least 2 iconHints', () => {
    for (const prompt of RECALL_PROMPTS) {
      expect(prompt.iconHints.length, `${prompt.id} has < 2 iconHints`).toBeGreaterThanOrEqual(2);
    }
  });

  it('iconHints are non-empty strings', () => {
    for (const prompt of RECALL_PROMPTS) {
      for (const hint of prompt.iconHints) {
        expect(typeof hint).toBe('string');
        expect(hint.length).toBeGreaterThan(0);
      }
    }
  });
});
