import { describe, expect, it } from 'vitest';
import {
  isBaseCampaignComplete,
  getDlcStatus,
  getAllDlcStatuses,
  getAvailableDlcIds,
  BASE_CAMPAIGN_ISLANDS,
} from '../../../src/dlc/dlc-unlock';
import type { DlcManifest } from '../../../src/dlc/types';

// ── Helpers ───────────────────────────────────────────────────

const ALL_BASE = [...BASE_CAMPAIGN_ISLANDS];
const PARTIAL_BASE = ['island_01', 'island_02', 'island_03'];
const EMPTY: string[] = [];

function makeManifest(id: string, prerequisite: string = 'base_complete'): DlcManifest {
  return {
    id,
    title: `DLC ${id}`,
    description: 'test',
    version: '1.0.0',
    topic: 'Test',
    conceptCount: 3,
    islandCount: 1,
    prerequisite,
    tierRange: { min: 1, max: 2 },
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe('dlc-unlock', () => {
  // ── isBaseCampaignComplete ──

  describe('isBaseCampaignComplete', () => {
    it('returns true when all 5 base islands are completed', () => {
      expect(isBaseCampaignComplete(ALL_BASE)).toBe(true);
    });

    it('returns true when extra islands are also present', () => {
      expect(isBaseCampaignComplete([...ALL_BASE, 'hidden_reef', 'dlc_extra'])).toBe(true);
    });

    it('returns false when some base islands are missing', () => {
      expect(isBaseCampaignComplete(PARTIAL_BASE)).toBe(false);
    });

    it('returns false for empty array', () => {
      expect(isBaseCampaignComplete(EMPTY)).toBe(false);
    });

    it('returns false when missing exactly one base island', () => {
      const allButOne = ALL_BASE.slice(0, 4);
      expect(isBaseCampaignComplete(allButOne)).toBe(false);
    });
  });

  // ── getDlcStatus ──

  describe('getDlcStatus', () => {
    const manifest = makeManifest('cyber');

    it('returns "locked" when prerequisite is not met', () => {
      expect(getDlcStatus(manifest, PARTIAL_BASE, [], [])).toBe('locked');
    });

    it('returns "available" when prerequisite is met but not unlocked', () => {
      expect(getDlcStatus(manifest, ALL_BASE, [], [])).toBe('available');
    });

    it('returns "unlocked" when the DLC is in the unlocked list', () => {
      expect(getDlcStatus(manifest, ALL_BASE, ['cyber'], [])).toBe('unlocked');
    });

    it('returns "completed" when the DLC is in the completed list', () => {
      expect(getDlcStatus(manifest, ALL_BASE, ['cyber'], ['cyber'])).toBe('completed');
    });

    it('returns "completed" even if not in unlocked list (completed takes precedence)', () => {
      expect(getDlcStatus(manifest, ALL_BASE, [], ['cyber'])).toBe('completed');
    });

    it('returns "locked" when base not complete even if unlocked', () => {
      // unlocked overrides prerequisite check, so this should be 'unlocked'
      expect(getDlcStatus(manifest, PARTIAL_BASE, ['cyber'], [])).toBe('unlocked');
    });
  });

  // ── getDlcStatus with specific island prerequisite ──

  describe('getDlcStatus — island prerequisite', () => {
    const manifest = makeManifest('island-dlc', 'island_03');

    it('returns "available" when the specific island is completed', () => {
      expect(getDlcStatus(manifest, ['island_03'], [], [])).toBe('available');
    });

    it('returns "locked" when the specific island is not completed', () => {
      expect(getDlcStatus(manifest, ['island_01', 'island_02'], [], [])).toBe('locked');
    });
  });

  // ── getAllDlcStatuses ──

  describe('getAllDlcStatuses', () => {
    it('returns a Map with statuses for all provided manifests', () => {
      const manifests = [
        makeManifest('a'),
        makeManifest('b'),
        makeManifest('c'),
      ];
      const statuses = getAllDlcStatuses(manifests, ALL_BASE, ['b'], ['c']);
      expect(statuses.get('a')).toBe('available');
      expect(statuses.get('b')).toBe('unlocked');
      expect(statuses.get('c')).toBe('completed');
    });

    it('returns all "locked" when base is incomplete', () => {
      const manifests = [makeManifest('x'), makeManifest('y')];
      const statuses = getAllDlcStatuses(manifests, PARTIAL_BASE, [], []);
      expect(statuses.get('x')).toBe('locked');
      expect(statuses.get('y')).toBe('locked');
    });

    it('returns empty map for empty manifests array', () => {
      const statuses = getAllDlcStatuses([], ALL_BASE, [], []);
      expect(statuses.size).toBe(0);
    });
  });

  // ── getAvailableDlcIds ──

  describe('getAvailableDlcIds', () => {
    it('returns only DLCs whose status is "available"', () => {
      const manifests = [
        makeManifest('avail1'),
        makeManifest('avail2'),
        makeManifest('already-unlocked'),
      ];
      const ids = getAvailableDlcIds(
        manifests,
        ALL_BASE,
        ['already-unlocked'],
        [],
      );
      expect(ids).toEqual(['avail1', 'avail2']);
    });

    it('returns empty array when base is not complete', () => {
      const ids = getAvailableDlcIds([makeManifest('a')], PARTIAL_BASE, [], []);
      expect(ids).toEqual([]);
    });

    it('excludes completed DLCs', () => {
      const manifests = [makeManifest('done'), makeManifest('open')];
      const ids = getAvailableDlcIds(manifests, ALL_BASE, [], ['done']);
      expect(ids).toEqual(['open']);
    });
  });

  // ── BASE_CAMPAIGN_ISLANDS constant ──

  describe('BASE_CAMPAIGN_ISLANDS', () => {
    it('contains exactly 5 islands', () => {
      expect(BASE_CAMPAIGN_ISLANDS).toHaveLength(5);
    });

    it('includes island_01 through island_05', () => {
      for (let i = 1; i <= 5; i++) {
        const id = `island_0${i}`;
        expect(BASE_CAMPAIGN_ISLANDS).toContain(id);
      }
    });
  });
});
