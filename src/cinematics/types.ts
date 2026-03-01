import type { AudioEvent } from '../audio/types';

/**
 * Cinematic Engine — Types
 *
 * A cinematic is a sequence of **beats** (slides). Each beat has:
 *   - A procedural renderer (sky style, characters, props)
 *   - Optional typewriter caption (icon-based text, kept minimal)
 *   - A duration or tap-to-advance rule
 *
 * Cinematics play as a standalone Scene (CinematicScene) that
 * calls `onDone()` when the sequence finishes.
 */

// ── Visual layer descriptors ─────────────────────────────────

/** Background atmosphere preset */
export type SkyPreset =
  | 'dawn'        // warm sunrise gradient
  | 'day'         // bright blue sky
  | 'dusk'        // orange / purple twilight
  | 'night'       // dark starfield
  | 'storm'       // dark grey with lightning flashes
  | 'dark_sea';   // deep indigo + fog

/** A character that can appear on screen */
export type CharacterId = 'nemo' | 'bit' | 'null' | 'kraken' | 'ship_loci' | 'ship_overfit' | 'space_kraken';

export interface CharacterPlacement {
  id: CharacterId;
  x: number;           // 0..240 virtual coords
  y: number;           // 0..400 virtual coords
  scale?: number;      // default 1
  flipX?: boolean;
  /** Simple animation hint for the renderer */
  anim?: 'idle' | 'walk' | 'wave' | 'fist_shake' | 'celebrate' | 'sink' | 'emerge' | 'launch' | 'orbit' | 'descend';
}

/** A prop or environmental detail */
export interface PropPlacement {
  kind: 'island_silhouette' | 'fog_wall' | 'lightning' | 'tentacle'
      | 'chart_fragment' | 'golden_chart' | 'wreckage' | 'sunrise' | 'cannon_flash'
      | 'rocket' | 'exhaust_plume' | 'asteroid' | 'nebula_cloud' | 'star_chart' | 'orbit_ring'
      | 'reentry_flame' | 'parachute' | 'splash';
  x: number;
  y: number;
  scale?: number;
}

// ── Beat definition ──────────────────────────────────────────

export interface CinematicBeat {
  /** Unique id for telemetry / testing */
  id: string;
  /** How long this beat displays (seconds). Player can tap to skip. */
  durationS: number;
  /** Sky / atmosphere */
  sky: SkyPreset;
  /** Characters on screen */
  characters?: CharacterPlacement[];
  /** Environmental props */
  props?: PropPlacement[];
  /** Optional caption line (short, icon-flavoured). Appears at bottom. */
  caption?: string;
  /** Screen-wide tint overlay rgba */
  tint?: string;
  /** Camera shake intensity 0..1 */
  shake?: number;
  /** If true, wait for tap instead of auto-advancing after durationS */
  waitForTap?: boolean;
  /** Optional SFX event to play when this beat starts */
  sfxEvent?: AudioEvent;
  /** Optional encounter music preset key to apply when this beat starts */
  musicPreset?: string;
  /** Optional song ID to start playing when this beat begins */
  songId?: string;
}

// ── Cinematic sequence ───────────────────────────────────────

export interface CinematicSequence {
  /** Unique id for this cinematic (e.g. 'island_01_intro') */
  id: string;
  /** Ordered list of beats */
  beats: CinematicBeat[];
}

// ── Per-island cinematic map ─────────────────────────────────

export interface IslandCinematics {
  intro: CinematicSequence;
  outro: CinematicSequence;
}
