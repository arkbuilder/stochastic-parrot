/**
 * Island Combat System — turn-based tactical combat overlay for enemy encounters.
 *
 * Three player actions:
 *   ATTACK        — instant hit, deals base damage (34% of enemy HP)
 *   CHARGE        — hold to charge meter, release for up to 2× damage at full
 *   DEFEND        — brace for impact, halves incoming enemy damage this turn
 *
 * Tactical depth:
 *   - Critical hits: releasing charge between 90-100% deals 1.5× bonus crit damage
 *   - Enemy escalation: enemy damage increases 10% per turn (gets scarier over time)
 *   - Defend/brace: skip your attack to halve the next enemy hit
 *   - On defeat: RETRY restarts the fight, POWER UP converts points to bonus damage
 *
 * Pure state module — no DOM, no canvas. Rendering is done by the island scene.
 */

import type { SkillBonuses } from './skill-tree';
import { getDefaultBonuses } from './skill-tree';

// ── Constants (exported for testing) ──────────────────────────

/** Seconds to fully charge the double-attack meter */
export const CHARGE_FILL_SECONDS = 1.2;

/** Base damage of a normal attack (fraction of enemy max HP) */
export const BASE_ATTACK_DAMAGE = 0.34;

/** Maximum multiplier at full charge */
export const CHARGE_MAX_MULTIPLIER = 2.0;

/** Damage the enemy deals per turn (fraction of player max HP) */
export const ENEMY_DAMAGE = 0.15;

/** Enemy damage escalation per combat turn (10% more each turn) */
export const ENEMY_ESCALATION_PER_TURN = 0.10;

/** Seconds the enemy "winds up" before hitting back */
export const ENEMY_TURN_DURATION = 0.6;

/** Bonus points awarded on victory */
export const VICTORY_BONUS = 100;

/** Seconds to show the victory flash before closing */
export const VICTORY_DISPLAY_DURATION = 0.8;

/** Seconds to show the defeat screen before player can act */
export const DEFEAT_DISPLAY_DURATION = 1.0;

/** Charge threshold for a critical hit (90%+) */
export const CRIT_THRESHOLD = 0.90;

/** Bonus damage multiplier on a critical hit */
export const CRIT_MULTIPLIER = 1.5;

/** Points cost to purchase a damage power-up on defeat */
export const POINT_POWERUP_COST = 50;

/** Bonus damage fraction added by the power-up (stacks) */
export const POINT_POWERUP_DAMAGE_BONUS = 0.20;

/** Damage reduction when defending (50%) */
export const DEFEND_REDUCTION = 0.50;

// ── Enemy display info ───────────────────────────────────────

/** Human-readable display names for enemy kinds */
export const ENEMY_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  crab:         'Crab',
  fire_crab:    'Fire Crab',
  jellyfish:    'Jellyfish',
  shadow_jelly: 'Shadow Jelly',
  burrower:     'Burrower',
  sand_wyrm:    'Sand Wyrm',
  urchin:       'Urchin',
  ray:          'Manta Ray',
};

/** Get a human-readable display name for an enemy kind */
export function getEnemyDisplayName(kind: string): string {
  return ENEMY_DISPLAY_NAMES[kind] ?? kind;
}

// ── State types ──────────────────────────────────────────────

export type CombatPhase =
  | 'player_turn'     // Waiting for player input
  | 'charging'        // Player is holding the charge button
  | 'player_attack'   // Attack animation playing (brief flash)
  | 'enemy_turn'      // Enemy retaliates
  | 'victory'         // Enemy defeated — show result
  | 'defeat';         // Player KO'd — show retry/powerup options

export interface CombatState {
  phase: CombatPhase;
  playerHp: number;     // 0..maxPlayerHp
  maxPlayerHp: number;  // starting cap (1 + Sea Legs bonus, capped at 2)
  enemyHp: number;      // 0..1
  charge: number;        // 0..1 (meter fill ratio)
  phaseTimer: number;    // seconds remaining in timed phases
  elapsed: number;       // total seconds since combat started
  lastDamageDealt: number; // for hit flash display
  enemyKind: string;     // for rendering the correct enemy sprite
  /** Combat turn counter — enemy escalates each turn */
  turnCount: number;
  /** Whether the player chose DEFEND this turn (halves next incoming damage) */
  defending: boolean;
  /** Whether the last attack was a critical hit */
  lastCrit: boolean;
  /** Stacked bonus damage from point power-ups (fraction, e.g. 0.20) */
  bonusDamage: number;
  /** Number of times the player has retried this combat */
  retryCount: number;
  /** Damage dealt to player on the last enemy turn (for visual feedback) */
  lastDamageToPlayer: number;
}

// ── Public API ───────────────────────────────────────────────

/** Create a fresh combat state for an enemy encounter */
export function createCombatState(enemyKind: string, bonuses?: SkillBonuses): CombatState {
  const b = bonuses ?? getDefaultBonuses();
  const maxHp = Math.min(2, 1 + b.startingHpBonus); // cap at 2×
  return {
    phase: 'player_turn',
    playerHp: maxHp,
    maxPlayerHp: maxHp,
    enemyHp: 1,
    charge: 0,
    phaseTimer: 0,
    elapsed: 0,
    lastDamageDealt: 0,
    enemyKind,
    turnCount: 0,
    defending: false,
    lastCrit: false,
    bonusDamage: 0,
    retryCount: 0,
    lastDamageToPlayer: 0,
  };
}

/**
 * Restart combat after defeat — resets HP and enemy, preserves bonusDamage/retryCount.
 * The player keeps any power-ups purchased between attempts.
 */
export function restartCombat(state: CombatState, bonuses?: SkillBonuses): void {
  const b = bonuses ?? getDefaultBonuses();
  const maxHp = Math.min(2, 1 + b.startingHpBonus);
  state.phase = 'player_turn';
  state.playerHp = maxHp;
  state.maxPlayerHp = maxHp;
  state.enemyHp = 1;
  state.charge = 0;
  state.phaseTimer = 0;
  state.elapsed = 0;
  state.lastDamageDealt = 0;
  state.turnCount = 0;
  state.defending = false;
  state.lastCrit = false;
  state.retryCount += 1;
  state.lastDamageToPlayer = 0;
}

/**
 * Apply a point power-up: adds bonus damage to the combat state.
 * Returns true if the power-up was applied.
 */
export function applyPointPowerup(state: CombatState): boolean {
  state.bonusDamage += POINT_POWERUP_DAMAGE_BONUS;
  return true;
}

export interface CombatInput {
  /** Player tapped the "ATTACK" button */
  attackTapped: boolean;
  /** Player started holding the "CHARGE" button */
  chargeStarted: boolean;
  /** Player is currently holding the "CHARGE" button */
  chargeHeld: boolean;
  /** Player released the "CHARGE" button */
  chargeReleased: boolean;
  /** Player tapped the "DEFEND" button */
  defendTapped: boolean;
}

export type CombatResult = {
  /** Combat is still ongoing */
  done: false;
} | {
  /** Combat finished */
  done: true;
  victory: boolean;
  bonusPoints: number;
};

/**
 * Advance combat by `dt` seconds given player input.
 * Returns whether combat is finished and any rewards.
 * Pass skill bonuses to modify damage / charge / defence.
 */
export function updateCombat(state: CombatState, dt: number, input: CombatInput, bonuses?: SkillBonuses): CombatResult {
  const b = bonuses ?? getDefaultBonuses();
  state.elapsed += dt;

  switch (state.phase) {
    case 'player_turn':
      return handlePlayerTurn(state, input, b);

    case 'charging':
      return handleCharging(state, dt, input, b);

    case 'player_attack':
      return handlePlayerAttack(state, dt);

    case 'enemy_turn':
      return handleEnemyTurn(state, dt, b);

    case 'victory':
      return handleVictory(state, dt, b);

    case 'defeat':
      return handleDefeat(state, dt);
  }
}

/**
 * Compute the button layout rects for combat UI.
 * Returns three rects for ATTACK, CHARGE, and DEFEND buttons.
 */
export function getCombatButtonRects(): { attack: Rect; charge: Rect; defend: Rect } {
  return {
    attack:  { x: 10,  y: 330, w: 68, h: 34 },
    charge:  { x: 86,  y: 330, w: 68, h: 34 },
    defend:  { x: 162, y: 330, w: 68, h: 34 },
  };
}

/**
 * Button layout rects for the defeat screen (RETRY and POWER UP).
 */
export function getDefeatButtonRects(): { retry: Rect; powerup: Rect } {
  return {
    retry:   { x: 20,  y: 280, w: 90, h: 34 },
    powerup: { x: 130, y: 280, w: 90, h: 34 },
  };
}

export interface Rect { x: number; y: number; w: number; h: number }

// ── Phase handlers (pure) ────────────────────────────────────

function handlePlayerTurn(state: CombatState, input: CombatInput, b: SkillBonuses): CombatResult {
  // Reset per-turn flags
  state.lastCrit = false;
  state.lastDamageToPlayer = 0;

  if (input.attackTapped) {
    // Instant attack — boosted by Sharp Cutlass + bonusDamage
    state.defending = false;
    const damage = BASE_ATTACK_DAMAGE * b.attackMultiplier * (1 + state.bonusDamage);
    state.enemyHp = Math.max(0, state.enemyHp - damage);
    state.lastDamageDealt = damage;
    state.phase = 'player_attack';
    state.phaseTimer = 0.3;
    return { done: false };
  }

  if (input.chargeStarted || input.chargeHeld) {
    state.defending = false;
    state.phase = 'charging';
    state.charge = 0;
    return { done: false };
  }

  if (input.defendTapped) {
    // DEFEND — skip attack, brace for impact (halves next enemy damage)
    state.defending = true;
    state.phase = 'enemy_turn';
    state.phaseTimer = ENEMY_TURN_DURATION;
    return { done: false };
  }

  return { done: false };
}

function handleCharging(state: CombatState, dt: number, input: CombatInput, b: SkillBonuses): CombatResult {
  if (input.chargeHeld) {
    // Swift Charge increases fill rate
    state.charge = Math.min(1, state.charge + (dt / CHARGE_FILL_SECONDS) * b.chargeSpeedMultiplier);
    return { done: false };
  }

  if (input.chargeReleased || !input.chargeHeld) {
    // Release — compute charged damage with Thunder Strike bonus + bonusDamage
    const maxMult = CHARGE_MAX_MULTIPLIER + b.chargeMaxBonus;
    const multiplier = 1 + state.charge * (maxMult - 1);
    // Critical hit when charge >= 90%
    const critMult = state.charge >= CRIT_THRESHOLD ? CRIT_MULTIPLIER : 1;
    state.lastCrit = critMult > 1;
    const damage = BASE_ATTACK_DAMAGE * b.attackMultiplier * multiplier * critMult * (1 + state.bonusDamage);
    state.enemyHp = Math.max(0, state.enemyHp - damage);
    state.lastDamageDealt = damage;
    state.phase = 'player_attack';
    state.phaseTimer = 0.3;
    state.charge = 0;
    return { done: false };
  }

  return { done: false };
}

function handlePlayerAttack(state: CombatState, dt: number): CombatResult {
  state.phaseTimer -= dt;
  if (state.phaseTimer <= 0) {
    if (state.enemyHp <= 0) {
      state.phase = 'victory';
      state.phaseTimer = VICTORY_DISPLAY_DURATION;
      state.playerHp = state.maxPlayerHp; // Refill HP on victory (respects Sea Legs bonus)
      return { done: false };
    }
    state.phase = 'enemy_turn';
    state.phaseTimer = ENEMY_TURN_DURATION;
  }
  return { done: false };
}

function handleEnemyTurn(state: CombatState, dt: number, b: SkillBonuses): CombatResult {
  state.phaseTimer -= dt;
  if (state.phaseTimer <= 0) {
    // Escalation: enemy gets 10% stronger each turn
    const escalation = 1 + state.turnCount * ENEMY_ESCALATION_PER_TURN;
    // Iron Hull reduces incoming damage
    let damage = ENEMY_DAMAGE * escalation * (1 - b.damageReduction);
    // Defend halves incoming damage
    if (state.defending) {
      damage *= (1 - DEFEND_REDUCTION);
      state.defending = false;
    }
    state.lastDamageToPlayer = damage;
    state.playerHp = Math.max(0, state.playerHp - damage);
    state.turnCount += 1;
    if (state.playerHp <= 0) {
      state.phase = 'defeat';
      state.phaseTimer = DEFEAT_DISPLAY_DURATION;
      return { done: false };
    }
    state.phase = 'player_turn';
  }
  return { done: false };
}

function handleVictory(state: CombatState, dt: number, b: SkillBonuses): CombatResult {
  state.phaseTimer -= dt;
  if (state.phaseTimer <= 0) {
    return { done: true, victory: true, bonusPoints: VICTORY_BONUS + b.victoryBonusAdd };
  }
  return { done: false };
}

/**
 * Defeat phase — counts down a display timer, then waits for
 * the scene layer to call restartCombat() or dismiss.
 * Returns done:true only after the display timer expires so the
 * scene can render the retry/powerup UI.
 */
function handleDefeat(state: CombatState, dt: number): CombatResult {
  if (state.phaseTimer > 0) {
    state.phaseTimer -= dt;
    return { done: false };
  }
  // Timer expired — scene should now show retry/powerup buttons.
  // We stay in defeat phase (done: false) until the scene calls
  // restartCombat() or decides to end combat externally.
  return { done: false };
}
