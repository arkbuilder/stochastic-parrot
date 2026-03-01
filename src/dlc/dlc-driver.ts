/**
 * DLC Driver — loads a DLC pack's content into merged game data arrays.
 *
 * The driver takes the base-game data collections and a DLC pack, then
 * produces new merged arrays that include the DLC content. It validates
 * the pack for ID collisions and structural integrity before merging.
 *
 * Pure functions — no mutation, no side effects.
 * Returns new arrays; callers decide whether to adopt them.
 *
 * Layering: dlc/ → may import from data/ types only.
 */

import type { IslandConfig } from '../data/islands';
import type { ConceptDefinition } from '../data/concepts';
import type { EncounterTemplate } from '../data/encounters';
import type { OverworldNodeConfig } from '../data/progression';
import type { BestiaryEntry } from '../data/bestiary';
import type { ConceptMinigame } from '../data/concept-minigames';
import type { DlcPack } from './types';

// ── Validation errors ────────────────────────────────────────

export interface DlcValidationError {
  field: string;
  message: string;
}

// ── Merged game data snapshot ────────────────────────────────

export interface MergedGameData {
  islands: IslandConfig[];
  concepts: ConceptDefinition[];
  encounters: EncounterTemplate[];
  overworldNodes: OverworldNodeConfig[];
  bestiary: BestiaryEntry[];
  minigames: ConceptMinigame[];
}

// ── Validation ───────────────────────────────────────────────

/**
 * Validate a DLC pack against existing base data for:
 *   - ID collisions (islands, concepts, encounters, overworld nodes, bestiary)
 *   - Internal consistency (concepts reference DLC islands, landmarks match)
 *   - Non-empty content
 *
 * Returns an empty array if valid.
 */
export function validateDlcPack(
  pack: DlcPack,
  baseData: MergedGameData,
): DlcValidationError[] {
  const errors: DlcValidationError[] = [];
  const c = pack.content;

  // ── Non-empty checks ──
  if (c.islands.length === 0) {
    errors.push({ field: 'islands', message: 'DLC must contain at least one island.' });
  }
  if (c.concepts.length === 0) {
    errors.push({ field: 'concepts', message: 'DLC must contain at least one concept.' });
  }

  // ── Island ID collisions ──
  const existingIslandIds = new Set(baseData.islands.map((i) => i.id));
  for (const island of c.islands) {
    if (existingIslandIds.has(island.id)) {
      errors.push({ field: 'islands', message: `Island ID "${island.id}" already exists in base data.` });
    }
  }

  // ── Concept ID collisions ──
  const existingConceptIds = new Set(baseData.concepts.map((co) => co.id));
  for (const concept of c.concepts) {
    if (existingConceptIds.has(concept.id)) {
      errors.push({ field: 'concepts', message: `Concept ID "${concept.id}" already exists in base data.` });
    }
  }

  // ── Encounter type collisions (only for new types) ──
  const existingEncounterTypes = new Set(baseData.encounters.map((e) => e.type));
  const dlcEncounterIds = new Set<string>();
  for (const enc of c.encounters) {
    if (dlcEncounterIds.has(enc.id)) {
      errors.push({ field: 'encounters', message: `Duplicate encounter ID "${enc.id}" within DLC.` });
    }
    dlcEncounterIds.add(enc.id);
  }

  // ── Overworld node collisions ──
  const existingNodeIds = new Set(baseData.overworldNodes.map((n) => n.islandId));
  for (const node of c.overworldNodes) {
    if (existingNodeIds.has(node.islandId)) {
      errors.push({ field: 'overworldNodes', message: `Overworld node for "${node.islandId}" already exists.` });
    }
  }

  // ── Bestiary ID collisions ──
  const existingBestiaryIds = new Set(baseData.bestiary.map((b) => b.id));
  for (const entry of c.bestiary) {
    if (existingBestiaryIds.has(entry.id)) {
      errors.push({ field: 'bestiary', message: `Bestiary ID "${entry.id}" already exists.` });
    }
  }

  // ── Internal consistency: concepts reference DLC islands ──
  const dlcIslandIds = new Set(c.islands.map((i) => i.id));
  const allIslandIds = new Set([...existingIslandIds, ...dlcIslandIds]);
  for (const concept of c.concepts) {
    if (!allIslandIds.has(concept.islandId)) {
      errors.push({
        field: 'concepts',
        message: `Concept "${concept.id}" references unknown island "${concept.islandId}".`,
      });
    }
  }

  // ── Internal consistency: island conceptIds valid ──
  const dlcConceptIds = new Set(c.concepts.map((co) => co.id));
  const allConceptIds = new Set([...existingConceptIds, ...dlcConceptIds]);
  for (const island of c.islands) {
    for (const cid of island.conceptIds) {
      if (!allConceptIds.has(cid)) {
        errors.push({
          field: 'islands',
          message: `Island "${island.id}" references unknown concept "${cid}".`,
        });
      }
    }
    // Landmarks must reference valid concepts
    for (const lm of island.landmarks) {
      if (!allConceptIds.has(lm.conceptId)) {
        errors.push({
          field: 'islands',
          message: `Landmark "${lm.id}" on island "${island.id}" references unknown concept "${lm.conceptId}".`,
        });
      }
    }
  }

  // ── Minigame coverage: every DLC concept should have a minigame ──
  const minigameConceptIds = new Set(c.minigames.map((m) => m.conceptId));
  for (const concept of c.concepts) {
    if (!minigameConceptIds.has(concept.id)) {
      errors.push({
        field: 'minigames',
        message: `Missing minigame for DLC concept "${concept.id}".`,
      });
    }
  }

  return errors;
}

// ── Merge ────────────────────────────────────────────────────

/**
 * Merge a validated DLC pack into existing game data.
 * Returns new arrays (does NOT mutate the originals).
 *
 * Call `validateDlcPack` first — this function does NOT re-validate.
 */
export function mergeDlcContent(
  pack: DlcPack,
  baseData: MergedGameData,
): MergedGameData {
  return {
    islands: [...baseData.islands, ...pack.content.islands],
    concepts: [...baseData.concepts, ...pack.content.concepts],
    encounters: mergeEncounters(baseData.encounters, pack.content.encounters),
    overworldNodes: [...baseData.overworldNodes, ...pack.content.overworldNodes],
    bestiary: [...baseData.bestiary, ...pack.content.bestiary],
    minigames: [...baseData.minigames, ...pack.content.minigames],
  };
}

/**
 * Merge encounters: DLC encounters with the same type as base ones
 * are de-duplicated (DLC version replaces base if same ID).
 */
function mergeEncounters(
  base: EncounterTemplate[],
  dlc: EncounterTemplate[],
): EncounterTemplate[] {
  const result = [...base];
  for (const enc of dlc) {
    const existingIdx = result.findIndex((e) => e.id === enc.id);
    if (existingIdx >= 0) {
      result[existingIdx] = enc; // DLC overrides same-ID encounter
    } else {
      result.push(enc);
    }
  }
  return result;
}
