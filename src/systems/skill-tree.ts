/**
 * Skill Tree System — persistent upgrade path unlocked through combat and learning.
 *
 * Players earn skill points by:
 *   - Defeating enemies in combat (+1 SP)
 *   - Placing concepts at landmarks (+1 SP)
 *
 * Skills are arranged in two branches:
 *   Offence:  Sharp Cutlass → Swift Charge → Thunder Strike
 *                           → Plunder (branch)
 *   Defence:  Iron Hull → Sea Legs
 *
 * Each skill has a max level and a per-level cost.
 * Prerequisites must be met before a skill can be unlocked.
 *
 * Pure state module — no DOM, no canvas. Rendering is handled by the island scene.
 */

// ── Skill IDs ────────────────────────────────────────────────

export type SkillId =
  | 'sharp_cutlass'
  | 'iron_hull'
  | 'swift_charge'
  | 'thunder_strike'
  | 'plunder'
  | 'sea_legs';

export const ALL_SKILL_IDS: readonly SkillId[] = [
  'sharp_cutlass', 'iron_hull', 'swift_charge', 'thunder_strike', 'plunder', 'sea_legs',
] as const;

// ── Skill point rewards ──────────────────────────────────────

/** Skill points awarded per enemy defeated */
export const SP_PER_ENEMY_KILL = 1;

/** Skill points awarded per concept placed at a landmark */
export const SP_PER_CONCEPT_PLACED = 1;

// ── Skill definitions ────────────────────────────────────────

export interface SkillPrerequisite {
  skillId: SkillId;
  level: number;
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  /** Single-character icon or emoji for rendering */
  icon: string;
  /** Short description of what 1 level does */
  description: string;
  maxLevel: number;
  /** Skill points required to unlock each level */
  costPerLevel: number;
  /** Must reach this skill + level before unlocking */
  prerequisite?: SkillPrerequisite;
}

export const SKILL_DEFINITIONS: readonly SkillDefinition[] = [
  {
    id: 'sharp_cutlass',
    name: 'Sharp Cutlass',
    icon: '\u2694',      // ⚔
    description: '+20% attack',
    maxLevel: 3,
    costPerLevel: 1,
  },
  {
    id: 'iron_hull',
    name: 'Iron Hull',
    icon: '\u26E8',      // ⛨ (shield)
    description: '-20% damage taken',
    maxLevel: 3,
    costPerLevel: 1,
  },
  {
    id: 'swift_charge',
    name: 'Swift Charge',
    icon: '\u26A1',      // ⚡
    description: '+20% charge speed',
    maxLevel: 2,
    costPerLevel: 2,
    prerequisite: { skillId: 'sharp_cutlass', level: 1 },
  },
  {
    id: 'thunder_strike',
    name: 'Thunder Strike',
    icon: '\uD83C\uDF29', // 🌩
    description: '+0.5 max charge',
    maxLevel: 2,
    costPerLevel: 2,
    prerequisite: { skillId: 'swift_charge', level: 1 },
  },
  {
    id: 'plunder',
    name: 'Plunder',
    icon: '\uD83D\uDCB0', // 💰
    description: '+50 victory pts',
    maxLevel: 2,
    costPerLevel: 2,
    prerequisite: { skillId: 'sharp_cutlass', level: 2 },
  },
  {
    id: 'sea_legs',
    name: 'Sea Legs',
    icon: '\u2764',      // ❤
    description: '+10% max HP',
    maxLevel: 3,
    costPerLevel: 1,
    prerequisite: { skillId: 'iron_hull', level: 1 },
  },
] as const;

// ── State type ───────────────────────────────────────────────

export interface SkillTreeState {
  /** Available (unspent) skill points */
  skillPoints: number;
  /** Current level for each skill (0 = locked) */
  skills: Record<SkillId, number>;
}

// ── Aggregated bonuses for combat ────────────────────────────

export interface SkillBonuses {
  /** Multiplied with BASE_ATTACK_DAMAGE (1.0 = no change) */
  attackMultiplier: number;
  /** Multiplied with charge fill rate: >1 = faster charging */
  chargeSpeedMultiplier: number;
  /** Added to CHARGE_MAX_MULTIPLIER */
  chargeMaxBonus: number;
  /** Fraction of enemy damage absorbed (0..1) */
  damageReduction: number;
  /** Added to VICTORY_BONUS */
  victoryBonusAdd: number;
  /** Added to starting playerHp (base = 1.0) */
  startingHpBonus: number;
}

// ── Public API ───────────────────────────────────────────────

/** Create a fresh (empty) skill tree */
export function createSkillTree(): SkillTreeState {
  return {
    skillPoints: 0,
    skills: {
      sharp_cutlass: 0,
      iron_hull: 0,
      swift_charge: 0,
      thunder_strike: 0,
      plunder: 0,
      sea_legs: 0,
    },
  };
}

/** Look up a skill definition by ID */
export function getSkillDefinition(skillId: SkillId): SkillDefinition {
  const def = SKILL_DEFINITIONS.find((s) => s.id === skillId);
  if (!def) throw new Error(`Unknown skill: ${skillId}`);
  return def;
}

/** Check whether a skill can be upgraded (has points + meets prereqs) */
export function canUnlockSkill(state: SkillTreeState, skillId: SkillId): boolean {
  const def = getSkillDefinition(skillId);
  const currentLevel = state.skills[skillId];
  if (currentLevel >= def.maxLevel) return false;
  if (state.skillPoints < def.costPerLevel) return false;
  if (def.prerequisite) {
    if (state.skills[def.prerequisite.skillId] < def.prerequisite.level) return false;
  }
  return true;
}

/** Spend points and upgrade a skill. Returns true on success. */
export function unlockSkill(state: SkillTreeState, skillId: SkillId): boolean {
  if (!canUnlockSkill(state, skillId)) return false;
  const def = getSkillDefinition(skillId);
  state.skills[skillId] += 1;
  state.skillPoints -= def.costPerLevel;
  return true;
}

/** Award skill points (e.g. after combat victory or concept placement) */
export function addSkillPoints(state: SkillTreeState, points: number): void {
  state.skillPoints += points;
}

/** List all skills currently eligible for upgrade */
export function getAvailableSkills(state: SkillTreeState): SkillId[] {
  return SKILL_DEFINITIONS
    .filter((def) => canUnlockSkill(state, def.id))
    .map((def) => def.id);
}

/** Total skill points ever earned (spent + available) */
export function getTotalPointsSpent(state: SkillTreeState): number {
  let total = 0;
  for (const def of SKILL_DEFINITIONS) {
    total += state.skills[def.id] * def.costPerLevel;
  }
  return total;
}

/**
 * Compute aggregate combat bonuses from current skill levels.
 * Each skill contributes a flat bonus per level.
 */
export function getSkillBonuses(state: SkillTreeState): SkillBonuses {
  return {
    attackMultiplier:       1 + state.skills.sharp_cutlass * 0.20,
    chargeSpeedMultiplier:  1 + state.skills.swift_charge * 0.20,
    chargeMaxBonus:         state.skills.thunder_strike * 0.50,
    damageReduction:        Math.min(0.80, state.skills.iron_hull * 0.20),
    victoryBonusAdd:        state.skills.plunder * 50,
    startingHpBonus:        state.skills.sea_legs * 0.10,
  };
}

/** Default (no bonuses) — used when skill tree is absent or empty */
export function getDefaultBonuses(): SkillBonuses {
  return {
    attackMultiplier: 1,
    chargeSpeedMultiplier: 1,
    chargeMaxBonus: 0,
    damageReduction: 0,
    victoryBonusAdd: 0,
    startingHpBonus: 0,
  };
}
