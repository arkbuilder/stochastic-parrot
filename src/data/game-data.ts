/**
 * Game Data — runtime-mutable merged data registry.
 *
 * Starts with base-game data. Call `mergeDlcIntoGameData()` to fold a
 * DLC pack's islands, concepts, overworld nodes, bestiary, and minigames
 * into the live game arrays.
 *
 * Every system that previously imported `ISLANDS`, `CONCEPTS`,
 * `OVERWORLD_NODES`, `BESTIARY`, etc. directly can now use the merged
 * getters here instead.  The originals are still exported from their
 * files for tests that only need base data.
 *
 * Layering: data/ — no upward imports.
 */

import { ISLANDS, type IslandConfig } from './islands';
import { CONCEPTS, type ConceptDefinition } from './concepts';
import { OVERWORLD_NODES, type OverworldNodeConfig } from './progression';
import { BESTIARY, type BestiaryEntry } from './bestiary';
import { getConceptMinigame, type ConceptMinigame } from './concept-minigames';
import type { DlcPack } from '../dlc/types';

/* ── Mutable merged arrays ── */

let allIslands: IslandConfig[] = [...ISLANDS];
let allConcepts: ConceptDefinition[] = [...CONCEPTS];
let allOverworldNodes: OverworldNodeConfig[] = [...OVERWORLD_NODES];
let allBestiary: BestiaryEntry[] = [...BESTIARY];
let allMinigames: ConceptMinigame[] = [];

/** DLC bestiary entries keyed by DLC manifest ID for filtered views */
const dlcBestiaryMap = new Map<string, BestiaryEntry[]>();

/** Set of DLC IDs that have been merged */
const mergedDlcIds = new Set<string>();

/* ── Public Getters ── */

export function getAllIslands(): readonly IslandConfig[] { return allIslands; }
export function getAllConcepts(): readonly ConceptDefinition[] { return allConcepts; }
export function getAllOverworldNodes(): readonly OverworldNodeConfig[] { return allOverworldNodes; }
export function getAllBestiary(): readonly BestiaryEntry[] { return allBestiary; }
export function getBaseBestiary(): readonly BestiaryEntry[] { return BESTIARY; }
export function getDlcBestiary(dlcId: string): readonly BestiaryEntry[] {
  return dlcBestiaryMap.get(dlcId) ?? [];
}
export function getMergedDlcIds(): readonly string[] { return [...mergedDlcIds]; }

/**
 * Find an island by ID across base + all merged DLCs.
 */
export function findIsland(islandId: string): IslandConfig | undefined {
  return allIslands.find((i) => i.id === islandId);
}

/**
 * Find a concept by ID across base + all merged DLCs.
 */
export function findConcept(conceptId: string): ConceptDefinition | undefined {
  return allConcepts.find((c) => c.id === conceptId);
}

/**
 * Find a minigame by concept ID — searches base data then DLC minigames.
 */
export function findMinigameByConceptId(conceptId: string): ConceptMinigame | undefined {
  const base = getConceptMinigame(conceptId);
  if (base) return base;
  return allMinigames.find((m) => m.conceptId === conceptId);
}

/* ── Merge DLC ── */

/**
 * Merge a DLC pack's content into the live game data.
 * Idempotent — calling again with the same pack ID is a no-op.
 */
export function mergeDlcIntoGameData(pack: DlcPack): void {
  if (mergedDlcIds.has(pack.manifest.id)) return;
  mergedDlcIds.add(pack.manifest.id);

  allIslands = [...allIslands, ...pack.content.islands];
  allConcepts = [...allConcepts, ...pack.content.concepts];
  allOverworldNodes = [...allOverworldNodes, ...pack.content.overworldNodes];
  allBestiary = [...allBestiary, ...pack.content.bestiary];
  allMinigames = [...allMinigames, ...pack.content.minigames];
  dlcBestiaryMap.set(pack.manifest.id, pack.content.bestiary);
}

/* ── Reset (for tests) ── */

export function resetGameData(): void {
  allIslands = [...ISLANDS];
  allConcepts = [...CONCEPTS];
  allOverworldNodes = [...OVERWORLD_NODES];
  allBestiary = [...BESTIARY];
  allMinigames = [];
  dlcBestiaryMap.clear();
  mergedDlcIds.clear();
}
