import { describe, expect, it, beforeEach } from 'vitest';
import {
  registerDlcPack,
  unregisterDlcPack,
  getDlcPack,
  listDlcManifests,
  listDlcPacks,
  isDlcRegistered,
  getDlcCount,
  clearDlcRegistry,
} from '../../../src/dlc/dlc-registry';
import type { DlcPack } from '../../../src/dlc/types';

// ── Test fixtures ─────────────────────────────────────────────

function makePack(id: string, overrides: Partial<DlcPack['manifest']> = {}): DlcPack {
  return {
    manifest: {
      id,
      title: `Pack ${id}`,
      description: 'Test pack',
      version: '1.0.0',
      topic: 'Testing',
      conceptCount: 1,
      islandCount: 1,
      prerequisite: 'base_complete',
      tierRange: { min: 1, max: 1 },
      ...overrides,
    },
    content: {
      islands: [],
      concepts: [],
      encounters: [],
      overworldNodes: [],
      bestiary: [],
      minigames: [],
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe('dlc-registry', () => {
  beforeEach(() => {
    clearDlcRegistry();
  });

  // ── registerDlcPack ──

  it('registers a pack and retrieves it by ID', () => {
    const pack = makePack('alpha');
    registerDlcPack(pack);
    expect(getDlcPack('alpha')).toBe(pack);
  });

  it('throws when registering a duplicate ID', () => {
    registerDlcPack(makePack('alpha'));
    expect(() => registerDlcPack(makePack('alpha'))).toThrow(
      'DLC pack "alpha" is already registered.',
    );
  });

  it('allows registering multiple packs with different IDs', () => {
    registerDlcPack(makePack('a'));
    registerDlcPack(makePack('b'));
    registerDlcPack(makePack('c'));
    expect(getDlcCount()).toBe(3);
  });

  // ── unregisterDlcPack ──

  it('removes a registered pack and returns true', () => {
    registerDlcPack(makePack('alpha'));
    expect(unregisterDlcPack('alpha')).toBe(true);
    expect(getDlcPack('alpha')).toBeUndefined();
  });

  it('returns false when unregistering a non-existent pack', () => {
    expect(unregisterDlcPack('nonexistent')).toBe(false);
  });

  // ── getDlcPack ──

  it('returns undefined for an unknown ID', () => {
    expect(getDlcPack('ghost')).toBeUndefined();
  });

  // ── listDlcManifests ──

  it('returns an empty array when no packs are registered', () => {
    expect(listDlcManifests()).toEqual([]);
  });

  it('returns manifests (not content) for all packs', () => {
    const a = makePack('a', { topic: 'TopicA' });
    const b = makePack('b', { topic: 'TopicB' });
    registerDlcPack(a);
    registerDlcPack(b);
    const manifests = listDlcManifests();
    expect(manifests).toHaveLength(2);
    expect(manifests.map((m) => m.id)).toEqual(['a', 'b']);
    expect(manifests[0].topic).toBe('TopicA');
  });

  // ── listDlcPacks ──

  it('returns full packs including content', () => {
    const pack = makePack('full');
    registerDlcPack(pack);
    const packs = listDlcPacks();
    expect(packs).toHaveLength(1);
    expect(packs[0]).toBe(pack);
  });

  // ── isDlcRegistered ──

  it('returns true for a registered ID', () => {
    registerDlcPack(makePack('exists'));
    expect(isDlcRegistered('exists')).toBe(true);
  });

  it('returns false for an unregistered ID', () => {
    expect(isDlcRegistered('nope')).toBe(false);
  });

  // ── getDlcCount ──

  it('returns 0 when empty', () => {
    expect(getDlcCount()).toBe(0);
  });

  it('tracks count accurately across register and unregister', () => {
    registerDlcPack(makePack('a'));
    registerDlcPack(makePack('b'));
    expect(getDlcCount()).toBe(2);
    unregisterDlcPack('a');
    expect(getDlcCount()).toBe(1);
  });

  // ── clearDlcRegistry ──

  it('clears all registered packs', () => {
    registerDlcPack(makePack('a'));
    registerDlcPack(makePack('b'));
    clearDlcRegistry();
    expect(getDlcCount()).toBe(0);
    expect(listDlcPacks()).toEqual([]);
  });

  // ── Re-register after unregister ──

  it('allows re-registering a pack after it was unregistered', () => {
    const v1 = makePack('re', { version: '1.0.0' });
    registerDlcPack(v1);
    unregisterDlcPack('re');
    const v2 = makePack('re', { version: '2.0.0' });
    registerDlcPack(v2);
    expect(getDlcPack('re')?.manifest.version).toBe('2.0.0');
  });
});
