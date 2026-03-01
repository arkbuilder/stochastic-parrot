/**
 * DLC Unlock System — determines which DLCs a player can access
 * based on their base-game progression.
 *
 * Pure function — takes player progress, returns DLC status.
 * No side effects, no persistence, no upward imports.
 *
 * Layering: dlc/ → may import from data/ types only.
 */

import type { DlcManifest, DlcStatus } from './types';

// ── Base-game completion definition ──────────────────────────

/** The 5 main campaign islands that must be completed for 'base_complete' */
export const BASE_CAMPAIGN_ISLANDS = [
  'island_01',
  'island_02',
  'island_03',
  'island_04',
  'island_05',
] as const;

// ── Public API ───────────────────────────────────────────────

/**
 * Check whether the base campaign is fully completed.
 */
export function isBaseCampaignComplete(completedIslands: readonly string[]): boolean {
  return BASE_CAMPAIGN_ISLANDS.every((id) => completedIslands.includes(id));
}

/**
 * Determine the unlock status of a single DLC pack.
 *
 * @param manifest — The DLC pack's manifest (contains prerequisite)
 * @param completedIslands — Island IDs the player has finished
 * @param unlockedDlcIds — DLC IDs the player has explicitly unlocked
 * @param completedDlcIds — DLC IDs the player has fully completed
 */
export function getDlcStatus(
  manifest: DlcManifest,
  completedIslands: readonly string[],
  unlockedDlcIds: readonly string[],
  completedDlcIds: readonly string[],
): DlcStatus {
  // Already completed?
  if (completedDlcIds.includes(manifest.id)) {
    return 'completed';
  }

  // Already unlocked?
  if (unlockedDlcIds.includes(manifest.id)) {
    return 'unlocked';
  }

  // Check prerequisite
  const prereqMet = checkPrerequisite(manifest.prerequisite, completedIslands);
  return prereqMet ? 'available' : 'locked';
}

/**
 * Batch-query: get statuses for all provided manifests.
 */
export function getAllDlcStatuses(
  manifests: readonly DlcManifest[],
  completedIslands: readonly string[],
  unlockedDlcIds: readonly string[],
  completedDlcIds: readonly string[],
): Map<string, DlcStatus> {
  const result = new Map<string, DlcStatus>();
  for (const manifest of manifests) {
    result.set(
      manifest.id,
      getDlcStatus(manifest, completedIslands, unlockedDlcIds, completedDlcIds),
    );
  }
  return result;
}

/**
 * Get IDs of all DLCs that are currently available to unlock.
 */
export function getAvailableDlcIds(
  manifests: readonly DlcManifest[],
  completedIslands: readonly string[],
  unlockedDlcIds: readonly string[],
  completedDlcIds: readonly string[],
): string[] {
  return manifests
    .filter((m) => getDlcStatus(m, completedIslands, unlockedDlcIds, completedDlcIds) === 'available')
    .map((m) => m.id);
}

// ── Internal helpers ─────────────────────────────────────────

function checkPrerequisite(
  prerequisite: string,
  completedIslands: readonly string[],
): boolean {
  if (prerequisite === 'base_complete') {
    return isBaseCampaignComplete(completedIslands);
  }
  // Prerequisite is a specific island ID
  return completedIslands.includes(prerequisite);
}
