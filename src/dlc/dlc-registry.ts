/**
 * DLC Registry — central catalogue of all registered DLC packs.
 *
 * Pure data management: register packs, list them, look them up.
 * No side effects, no persistence, no upward imports.
 *
 * Layering: dlc/ → may import from data/ types only.
 */

import type { DlcPack, DlcManifest } from './types';

// ── Internal store ───────────────────────────────────────────

const packs = new Map<string, DlcPack>();

// ── Public API ───────────────────────────────────────────────

/**
 * Register a DLC pack. Throws if a pack with the same ID already exists.
 */
export function registerDlcPack(pack: DlcPack): void {
  if (packs.has(pack.manifest.id)) {
    throw new Error(`DLC pack "${pack.manifest.id}" is already registered.`);
  }
  packs.set(pack.manifest.id, pack);
}

/**
 * Unregister a DLC pack by ID. Returns true if it was removed.
 */
export function unregisterDlcPack(id: string): boolean {
  return packs.delete(id);
}

/**
 * Get a registered pack by ID, or undefined if not found.
 */
export function getDlcPack(id: string): DlcPack | undefined {
  return packs.get(id);
}

/**
 * List all registered pack manifests (lightweight — no content).
 */
export function listDlcManifests(): DlcManifest[] {
  return Array.from(packs.values()).map((p) => p.manifest);
}

/**
 * List all registered packs (full content included).
 */
export function listDlcPacks(): DlcPack[] {
  return Array.from(packs.values());
}

/**
 * Check whether a pack with the given ID is registered.
 */
export function isDlcRegistered(id: string): boolean {
  return packs.has(id);
}

/**
 * Get the total number of registered packs.
 */
export function getDlcCount(): number {
  return packs.size;
}

/**
 * Clear all registered packs. Useful for testing.
 */
export function clearDlcRegistry(): void {
  packs.clear();
}
