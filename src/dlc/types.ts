/**
 * DLC Extension Types
 *
 * Defines the shape of a downloadable content pack that adds new
 * topic islands to the game after the base AI/ML campaign is complete.
 *
 * Layering: dlc/ sits at the same level as data/ — zero upward imports.
 * It re-uses existing data types (IslandConfig, ConceptDefinition, etc.)
 * but never imports from systems/, scenes/, or rendering/.
 */

import type { IslandConfig } from '../data/islands';
import type { ConceptDefinition } from '../data/concepts';
import type { EncounterTemplate } from '../data/encounters';
import type { OverworldNodeConfig } from '../data/progression';
import type { BestiaryEntry } from '../data/bestiary';
import type { ConceptMinigame } from '../data/concept-minigames';

// ── DLC Lifecycle ────────────────────────────────────────────

/** Where this DLC is in the player's journey */
export type DlcStatus =
  | 'locked'       // base game not completed yet
  | 'available'    // unlockable but player hasn't opted in
  | 'unlocked'     // active — content merged into game data
  | 'completed';   // all DLC islands finished

// ── DLC Content Bundle ───────────────────────────────────────

/** Everything a DLC pack contributes to the game world */
export interface DlcContent {
  /** New islands introduced by this pack */
  islands: IslandConfig[];
  /** New AI/ML (or other topic) concepts */
  concepts: ConceptDefinition[];
  /** New or reused encounter templates for DLC islands */
  encounters: EncounterTemplate[];
  /** Overworld map nodes for the new islands */
  overworldNodes: OverworldNodeConfig[];
  /** Bestiary entries (critters, threats, flora, terrain) */
  bestiary: BestiaryEntry[];
  /** Socratic dialog + interactive challenges per concept */
  minigames: ConceptMinigame[];
}

// ── DLC Manifest ─────────────────────────────────────────────

/** Metadata describing a DLC pack (shown in menus, used for unlock checks) */
export interface DlcManifest {
  /** Unique pack identifier (kebab-case) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Short description (≤100 chars for UI) */
  description: string;
  /** Semantic version */
  version: string;
  /** Topic domain this DLC teaches */
  topic: string;
  /** Number of new concepts added */
  conceptCount: number;
  /** Number of new islands added */
  islandCount: number;
  /**
   * Base-game prerequisite.
   * 'base_complete' = all 5 main islands done.
   * A specific island ID = that island must be completed.
   */
  prerequisite: 'base_complete' | string;
  /** Tier range for concepts in this pack */
  tierRange: { min: 1 | 2 | 3; max: 1 | 2 | 3 };
}

// ── DLC Pack (the full bundle) ───────────────────────────────

/** A complete DLC pack: manifest + content */
export interface DlcPack {
  manifest: DlcManifest;
  content: DlcContent;
}
