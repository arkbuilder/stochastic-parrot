/**
 * Unit tests for the Skill Tree system.
 *
 * Covers: state creation, skill unlocking, prerequisites, point spending,
 * available skills, bonus calculations, edge cases, and all skill definitions.
 */
import { describe, it, expect } from 'vitest';
import {
  createSkillTree, canUnlockSkill, unlockSkill, addSkillPoints,
  getAvailableSkills, getSkillBonuses, getDefaultBonuses, getSkillDefinition,
  getTotalPointsSpent, SKILL_DEFINITIONS, ALL_SKILL_IDS,
  SP_PER_ENEMY_KILL, SP_PER_CONCEPT_PLACED,
  type SkillTreeState, type SkillId, type SkillBonuses,
} from '../../../src/systems/skill-tree';
import {
  createCombatState, updateCombat,
  BASE_ATTACK_DAMAGE, ENEMY_DAMAGE, VICTORY_BONUS,
} from '../../../src/systems/island-combat';

// ── Helper ──
function treeWith(points: number, overrides?: Partial<Record<SkillId, number>>): SkillTreeState {
  const tree = createSkillTree();
  tree.skillPoints = points;
  if (overrides) {
    for (const [id, level] of Object.entries(overrides)) {
      tree.skills[id as SkillId] = level!;
    }
  }
  return tree;
}

// ═══════════════════════════════════════════════════════════════
// §1 — State creation
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — createSkillTree', () => {
  it('returns zero skill points', () => {
    const tree = createSkillTree();
    expect(tree.skillPoints).toBe(0);
  });

  it('all skills start at level 0', () => {
    const tree = createSkillTree();
    for (const id of ALL_SKILL_IDS) {
      expect(tree.skills[id]).toBe(0);
    }
  });

  it('skills record has exactly 6 keys', () => {
    const tree = createSkillTree();
    expect(Object.keys(tree.skills)).toHaveLength(6);
  });
});

// ═══════════════════════════════════════════════════════════════
// §2 — Skill definitions
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — SKILL_DEFINITIONS', () => {
  it('contains exactly 6 skills', () => {
    expect(SKILL_DEFINITIONS).toHaveLength(6);
  });

  it('each skill has required fields', () => {
    for (const def of SKILL_DEFINITIONS) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.maxLevel).toBeGreaterThan(0);
      expect(def.costPerLevel).toBeGreaterThan(0);
    }
  });

  it('all IDs are unique', () => {
    const ids = SKILL_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ALL_SKILL_IDS matches SKILL_DEFINITIONS', () => {
    const defIds = SKILL_DEFINITIONS.map((d) => d.id).sort();
    const allIds = [...ALL_SKILL_IDS].sort();
    expect(allIds).toEqual(defIds);
  });

  it('prerequisites reference valid skill IDs', () => {
    for (const def of SKILL_DEFINITIONS) {
      if (def.prerequisite) {
        const prereqExists = SKILL_DEFINITIONS.some((d) => d.id === def.prerequisite!.skillId);
        expect(prereqExists).toBe(true);
      }
    }
  });

  it('prerequisite levels are within maxLevel of the referenced skill', () => {
    for (const def of SKILL_DEFINITIONS) {
      if (def.prerequisite) {
        const prereqDef = SKILL_DEFINITIONS.find((d) => d.id === def.prerequisite!.skillId)!;
        expect(def.prerequisite.level).toBeLessThanOrEqual(prereqDef.maxLevel);
      }
    }
  });

  it('no circular prerequisites', () => {
    for (const def of SKILL_DEFINITIONS) {
      const visited = new Set<SkillId>();
      let current: typeof def | undefined = def;
      while (current?.prerequisite) {
        expect(visited.has(current.id)).toBe(false);
        visited.add(current.id);
        current = SKILL_DEFINITIONS.find((d) => d.id === current!.prerequisite!.skillId);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// §3 — getSkillDefinition
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — getSkillDefinition', () => {
  it('returns definition for valid skill ID', () => {
    const def = getSkillDefinition('sharp_cutlass');
    expect(def.id).toBe('sharp_cutlass');
    expect(def.name).toBe('Sharp Cutlass');
  });

  it('throws for unknown skill ID', () => {
    expect(() => getSkillDefinition('bogus' as SkillId)).toThrow('Unknown skill');
  });
});

// ═══════════════════════════════════════════════════════════════
// §4 — SP rewards constants
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — reward constants', () => {
  it('SP_PER_ENEMY_KILL is 1', () => {
    expect(SP_PER_ENEMY_KILL).toBe(1);
  });

  it('SP_PER_CONCEPT_PLACED is 1', () => {
    expect(SP_PER_CONCEPT_PLACED).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// §5 — addSkillPoints
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — addSkillPoints', () => {
  it('increases skill points by given amount', () => {
    const tree = createSkillTree();
    addSkillPoints(tree, 3);
    expect(tree.skillPoints).toBe(3);
  });

  it('accumulates across multiple calls', () => {
    const tree = createSkillTree();
    addSkillPoints(tree, 2);
    addSkillPoints(tree, 5);
    expect(tree.skillPoints).toBe(7);
  });

  it('works with 0', () => {
    const tree = createSkillTree();
    addSkillPoints(tree, 0);
    expect(tree.skillPoints).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// §6 — canUnlockSkill
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — canUnlockSkill', () => {
  it('cannot unlock with 0 skill points', () => {
    const tree = treeWith(0);
    expect(canUnlockSkill(tree, 'sharp_cutlass')).toBe(false);
  });

  it('can unlock tier-1 skill with enough SP', () => {
    const tree = treeWith(1);
    expect(canUnlockSkill(tree, 'sharp_cutlass')).toBe(true);
  });

  it('can unlock iron_hull with 1 SP', () => {
    const tree = treeWith(1);
    expect(canUnlockSkill(tree, 'iron_hull')).toBe(true);
  });

  it('cannot unlock beyond max level', () => {
    const tree = treeWith(10, { sharp_cutlass: 3 });
    expect(canUnlockSkill(tree, 'sharp_cutlass')).toBe(false);
  });

  it('cannot unlock swift_charge without sharp_cutlass Lv1', () => {
    const tree = treeWith(5);
    expect(canUnlockSkill(tree, 'swift_charge')).toBe(false);
  });

  it('can unlock swift_charge with sharp_cutlass Lv1', () => {
    const tree = treeWith(5, { sharp_cutlass: 1 });
    expect(canUnlockSkill(tree, 'swift_charge')).toBe(true);
  });

  it('cannot unlock plunder without sharp_cutlass Lv2', () => {
    const tree = treeWith(5, { sharp_cutlass: 1 });
    expect(canUnlockSkill(tree, 'plunder')).toBe(false);
  });

  it('can unlock plunder with sharp_cutlass Lv2', () => {
    const tree = treeWith(5, { sharp_cutlass: 2 });
    expect(canUnlockSkill(tree, 'plunder')).toBe(true);
  });

  it('cannot unlock thunder_strike without swift_charge Lv1', () => {
    const tree = treeWith(5, { sharp_cutlass: 3 });
    expect(canUnlockSkill(tree, 'thunder_strike')).toBe(false);
  });

  it('can unlock thunder_strike with swift_charge Lv1', () => {
    const tree = treeWith(5, { sharp_cutlass: 1, swift_charge: 1 });
    expect(canUnlockSkill(tree, 'thunder_strike')).toBe(true);
  });

  it('cannot unlock sea_legs without iron_hull Lv1', () => {
    const tree = treeWith(5);
    expect(canUnlockSkill(tree, 'sea_legs')).toBe(false);
  });

  it('can unlock sea_legs with iron_hull Lv1', () => {
    const tree = treeWith(5, { iron_hull: 1 });
    expect(canUnlockSkill(tree, 'sea_legs')).toBe(true);
  });

  it('insufficient SP blocks even when prereqs met', () => {
    const tree = treeWith(1, { sharp_cutlass: 1 }); // swift_charge costs 2
    expect(canUnlockSkill(tree, 'swift_charge')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// §7 — unlockSkill
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — unlockSkill', () => {
  it('returns true and increments level on success', () => {
    const tree = treeWith(3);
    const result = unlockSkill(tree, 'sharp_cutlass');
    expect(result).toBe(true);
    expect(tree.skills.sharp_cutlass).toBe(1);
  });

  it('deducts costPerLevel from skillPoints', () => {
    const tree = treeWith(3);
    unlockSkill(tree, 'sharp_cutlass');
    expect(tree.skillPoints).toBe(2); // cost 1
  });

  it('returns false when cannot unlock', () => {
    const tree = treeWith(0);
    const result = unlockSkill(tree, 'sharp_cutlass');
    expect(result).toBe(false);
    expect(tree.skills.sharp_cutlass).toBe(0);
  });

  it('returns false and does not change state on failure', () => {
    const tree = treeWith(1);
    unlockSkill(tree, 'swift_charge'); // prereq not met
    expect(tree.skills.swift_charge).toBe(0);
    expect(tree.skillPoints).toBe(1);
  });

  it('can level up same skill multiple times to max', () => {
    const tree = treeWith(10);
    expect(unlockSkill(tree, 'sharp_cutlass')).toBe(true);
    expect(unlockSkill(tree, 'sharp_cutlass')).toBe(true);
    expect(unlockSkill(tree, 'sharp_cutlass')).toBe(true);
    expect(tree.skills.sharp_cutlass).toBe(3);
    expect(unlockSkill(tree, 'sharp_cutlass')).toBe(false); // max
    expect(tree.skillPoints).toBe(7); // 10 - 3
  });

  it('deducts correct cost for tier-2 skills', () => {
    const tree = treeWith(10, { sharp_cutlass: 1 });
    unlockSkill(tree, 'swift_charge'); // costs 2
    expect(tree.skillPoints).toBe(8);
    expect(tree.skills.swift_charge).toBe(1);
  });

  it('full offence tree unlock path', () => {
    const tree = treeWith(20);
    // sharp_cutlass Lv1 → Lv2 → Lv3 (3 SP)
    expect(unlockSkill(tree, 'sharp_cutlass')).toBe(true);
    expect(unlockSkill(tree, 'sharp_cutlass')).toBe(true);
    expect(unlockSkill(tree, 'sharp_cutlass')).toBe(true);
    // swift_charge Lv1 → Lv2 (4 SP)
    expect(unlockSkill(tree, 'swift_charge')).toBe(true);
    expect(unlockSkill(tree, 'swift_charge')).toBe(true);
    // thunder_strike Lv1 → Lv2 (4 SP)
    expect(unlockSkill(tree, 'thunder_strike')).toBe(true);
    expect(unlockSkill(tree, 'thunder_strike')).toBe(true);
    // plunder Lv1 → Lv2 (4 SP) — needs sharp_cutlass Lv2
    expect(unlockSkill(tree, 'plunder')).toBe(true);
    expect(unlockSkill(tree, 'plunder')).toBe(true);
    // Total: 3 + 4 + 4 + 4 = 15 SP
    expect(tree.skillPoints).toBe(5);
  });

  it('full defence tree unlock path', () => {
    const tree = treeWith(10);
    expect(unlockSkill(tree, 'iron_hull')).toBe(true);
    expect(unlockSkill(tree, 'iron_hull')).toBe(true);
    expect(unlockSkill(tree, 'iron_hull')).toBe(true);
    expect(unlockSkill(tree, 'sea_legs')).toBe(true);
    expect(unlockSkill(tree, 'sea_legs')).toBe(true);
    expect(unlockSkill(tree, 'sea_legs')).toBe(true);
    // Total: 3 + 3 = 6 SP
    expect(tree.skillPoints).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════
// §8 — getAvailableSkills
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — getAvailableSkills', () => {
  it('returns empty list with 0 SP', () => {
    const tree = treeWith(0);
    expect(getAvailableSkills(tree)).toEqual([]);
  });

  it('returns tier-1 skills with 1 SP', () => {
    const tree = treeWith(1);
    const avail = getAvailableSkills(tree);
    expect(avail).toContain('sharp_cutlass');
    expect(avail).toContain('iron_hull');
  });

  it('does not include tier-2 skills without prereqs', () => {
    const tree = treeWith(5);
    const avail = getAvailableSkills(tree);
    expect(avail).not.toContain('swift_charge');
    expect(avail).not.toContain('thunder_strike');
    expect(avail).not.toContain('plunder');
    expect(avail).not.toContain('sea_legs');
  });

  it('includes swift_charge once sharp_cutlass Lv1 is unlocked', () => {
    const tree = treeWith(5, { sharp_cutlass: 1 });
    const avail = getAvailableSkills(tree);
    expect(avail).toContain('swift_charge');
    expect(avail).toContain('sharp_cutlass'); // can still level up
  });

  it('includes plunder once sharp_cutlass Lv2 is unlocked', () => {
    const tree = treeWith(5, { sharp_cutlass: 2 });
    const avail = getAvailableSkills(tree);
    expect(avail).toContain('plunder');
  });

  it('excludes maxed-out skills', () => {
    const tree = treeWith(5, { sharp_cutlass: 3 });
    expect(getAvailableSkills(tree)).not.toContain('sharp_cutlass');
  });

  it('returns empty when all skills are maxed', () => {
    const tree = treeWith(5, {
      sharp_cutlass: 3, iron_hull: 3, swift_charge: 2,
      thunder_strike: 2, plunder: 2, sea_legs: 3,
    });
    expect(getAvailableSkills(tree)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// §9 — getTotalPointsSpent
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — getTotalPointsSpent', () => {
  it('returns 0 for fresh tree', () => {
    expect(getTotalPointsSpent(createSkillTree())).toBe(0);
  });

  it('returns correct total for mixed skill levels', () => {
    const tree = treeWith(0, { sharp_cutlass: 2, iron_hull: 1, swift_charge: 1 });
    // sharp_cutlass: 2 * 1 = 2, iron_hull: 1 * 1 = 1, swift_charge: 1 * 2 = 2
    expect(getTotalPointsSpent(tree)).toBe(5);
  });

  it('returns sum for fully maxed tree', () => {
    const tree = treeWith(0, {
      sharp_cutlass: 3, iron_hull: 3, swift_charge: 2,
      thunder_strike: 2, plunder: 2, sea_legs: 3,
    });
    // 3*1 + 3*1 + 2*2 + 2*2 + 2*2 + 3*1 = 3+3+4+4+4+3 = 21
    expect(getTotalPointsSpent(tree)).toBe(21);
  });
});

// ═══════════════════════════════════════════════════════════════
// §10 — getSkillBonuses
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — getSkillBonuses', () => {
  it('returns default bonuses for fresh tree', () => {
    const bonuses = getSkillBonuses(createSkillTree());
    expect(bonuses).toEqual(getDefaultBonuses());
  });

  it('sharp_cutlass Lv1 = 1.20 attackMultiplier', () => {
    const b = getSkillBonuses(treeWith(0, { sharp_cutlass: 1 }));
    expect(b.attackMultiplier).toBeCloseTo(1.20);
  });

  it('sharp_cutlass Lv3 = 1.60 attackMultiplier', () => {
    const b = getSkillBonuses(treeWith(0, { sharp_cutlass: 3 }));
    expect(b.attackMultiplier).toBeCloseTo(1.60);
  });

  it('iron_hull Lv1 = 0.20 damageReduction', () => {
    const b = getSkillBonuses(treeWith(0, { iron_hull: 1 }));
    expect(b.damageReduction).toBeCloseTo(0.20);
  });

  it('iron_hull Lv3 = 0.60 damageReduction (not capped)', () => {
    const b = getSkillBonuses(treeWith(0, { iron_hull: 3 }));
    expect(b.damageReduction).toBeCloseTo(0.60);
  });

  it('damageReduction is capped at 0.80', () => {
    // Force-set level to something above max to test cap
    const tree = treeWith(0);
    tree.skills.iron_hull = 5; // Would be 1.0 uncapped
    const b = getSkillBonuses(tree);
    expect(b.damageReduction).toBe(0.80);
  });

  it('swift_charge Lv1 = 1.20 chargeSpeedMultiplier', () => {
    const b = getSkillBonuses(treeWith(0, { swift_charge: 1 }));
    expect(b.chargeSpeedMultiplier).toBeCloseTo(1.20);
  });

  it('swift_charge Lv2 = 1.40 chargeSpeedMultiplier', () => {
    const b = getSkillBonuses(treeWith(0, { swift_charge: 2 }));
    expect(b.chargeSpeedMultiplier).toBeCloseTo(1.40);
  });

  it('thunder_strike Lv1 = 0.50 chargeMaxBonus', () => {
    const b = getSkillBonuses(treeWith(0, { thunder_strike: 1 }));
    expect(b.chargeMaxBonus).toBeCloseTo(0.50);
  });

  it('thunder_strike Lv2 = 1.00 chargeMaxBonus', () => {
    const b = getSkillBonuses(treeWith(0, { thunder_strike: 2 }));
    expect(b.chargeMaxBonus).toBeCloseTo(1.00);
  });

  it('plunder Lv1 = 50 victoryBonusAdd', () => {
    const b = getSkillBonuses(treeWith(0, { plunder: 1 }));
    expect(b.victoryBonusAdd).toBe(50);
  });

  it('plunder Lv2 = 100 victoryBonusAdd', () => {
    const b = getSkillBonuses(treeWith(0, { plunder: 2 }));
    expect(b.victoryBonusAdd).toBe(100);
  });

  it('sea_legs Lv1 = 0.10 startingHpBonus', () => {
    const b = getSkillBonuses(treeWith(0, { sea_legs: 1 }));
    expect(b.startingHpBonus).toBeCloseTo(0.10);
  });

  it('sea_legs Lv3 = 0.30 startingHpBonus', () => {
    const b = getSkillBonuses(treeWith(0, { sea_legs: 3 }));
    expect(b.startingHpBonus).toBeCloseTo(0.30);
  });

  it('fully maxed tree has all bonuses', () => {
    const tree = treeWith(0, {
      sharp_cutlass: 3, iron_hull: 3, swift_charge: 2,
      thunder_strike: 2, plunder: 2, sea_legs: 3,
    });
    const b = getSkillBonuses(tree);
    expect(b.attackMultiplier).toBeCloseTo(1.60);
    expect(b.chargeSpeedMultiplier).toBeCloseTo(1.40);
    expect(b.chargeMaxBonus).toBeCloseTo(1.00);
    expect(b.damageReduction).toBeCloseTo(0.60);
    expect(b.victoryBonusAdd).toBe(100);
    expect(b.startingHpBonus).toBeCloseTo(0.30);
  });
});

// ═══════════════════════════════════════════════════════════════
// §11 — getDefaultBonuses
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — getDefaultBonuses', () => {
  it('attackMultiplier is 1', () => {
    expect(getDefaultBonuses().attackMultiplier).toBe(1);
  });

  it('chargeSpeedMultiplier is 1', () => {
    expect(getDefaultBonuses().chargeSpeedMultiplier).toBe(1);
  });

  it('chargeMaxBonus is 0', () => {
    expect(getDefaultBonuses().chargeMaxBonus).toBe(0);
  });

  it('damageReduction is 0', () => {
    expect(getDefaultBonuses().damageReduction).toBe(0);
  });

  it('victoryBonusAdd is 0', () => {
    expect(getDefaultBonuses().victoryBonusAdd).toBe(0);
  });

  it('startingHpBonus is 0', () => {
    expect(getDefaultBonuses().startingHpBonus).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// §12 — Combat integration: skill bonuses affect combat
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — combat integration (bonuses affect createCombatState / updateCombat)', () => {

  const noInput = { attackTapped: false, chargeStarted: false, chargeHeld: false, chargeReleased: false };
  const attackInput = { attackTapped: true, chargeStarted: false, chargeHeld: false, chargeReleased: false };

  it('createCombatState with sea_legs bonus increases starting HP', () => {
    const bonuses = getSkillBonuses(treeWith(0, { sea_legs: 2, iron_hull: 1 }));
    const state = createCombatState('crab', bonuses);
    expect(state.playerHp).toBeCloseTo(1.20);
  });

  it('createCombatState without bonuses starts at 1.0 HP', () => {
    const state = createCombatState('crab');
    expect(state.playerHp).toBe(1);
  });

  it('starting HP capped at 2.0', () => {
    const tree = treeWith(0);
    tree.skills.sea_legs = 15; // would be 2.5 uncapped
    const bonuses = getSkillBonuses(tree);
    const state = createCombatState('crab', bonuses);
    expect(state.playerHp).toBe(2);
  });

  it('sharp_cutlass increases attack damage', () => {
    const bonuses = getSkillBonuses(treeWith(0, { sharp_cutlass: 2 }));
    const state = createCombatState('crab', bonuses);
    updateCombat(state, 0.016, attackInput, bonuses);
    // Expected damage: BASE_ATTACK_DAMAGE * 1.40
    const expectedDamage = BASE_ATTACK_DAMAGE * 1.40;
    expect(state.enemyHp).toBeCloseTo(1 - expectedDamage);
  });

  it('iron_hull reduces enemy damage', () => {
    const bonuses = getSkillBonuses(treeWith(0, { iron_hull: 2 }));
    const state = createCombatState('crab', bonuses);
    // Get to enemy turn
    state.phase = 'enemy_turn';
    state.phaseTimer = 0.01;
    updateCombat(state, 0.02, noInput, bonuses);
    // Expected: ENEMY_DAMAGE * (1 - 0.40)
    const expectedDamage = ENEMY_DAMAGE * 0.60;
    expect(state.playerHp).toBeCloseTo(1 - expectedDamage);
  });

  it('plunder increases victory bonus', () => {
    const bonuses = getSkillBonuses(treeWith(0, { sharp_cutlass: 2, plunder: 1 }));
    const state = createCombatState('crab', bonuses);
    state.phase = 'victory';
    state.phaseTimer = 0.01;
    const result = updateCombat(state, 0.02, noInput, bonuses);
    expect(result.done).toBe(true);
    if (result.done) {
      expect(result.bonusPoints).toBe(VICTORY_BONUS + 50);
    }
  });

  it('default bonuses produce standard combat values', () => {
    const state = createCombatState('crab');
    updateCombat(state, 0.016, attackInput);
    expect(state.enemyHp).toBeCloseTo(1 - BASE_ATTACK_DAMAGE);
  });
});

// ═══════════════════════════════════════════════════════════════
// §13 — Edge cases
// ═══════════════════════════════════════════════════════════════

describe('Skill Tree — edge cases', () => {
  it('unlocking a skill does not affect other skills', () => {
    const tree = treeWith(5);
    unlockSkill(tree, 'sharp_cutlass');
    expect(tree.skills.iron_hull).toBe(0);
    expect(tree.skills.swift_charge).toBe(0);
  });

  it('adding points then unlocking then checking balance', () => {
    const tree = createSkillTree();
    addSkillPoints(tree, 5);
    unlockSkill(tree, 'sharp_cutlass'); // -1
    unlockSkill(tree, 'sharp_cutlass'); // -1
    unlockSkill(tree, 'iron_hull');     // -1
    expect(tree.skillPoints).toBe(2);
    expect(tree.skills.sharp_cutlass).toBe(2);
    expect(tree.skills.iron_hull).toBe(1);
  });

  it('each skill definition has unique name', () => {
    const names = SKILL_DEFINITIONS.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('getSkillBonuses does not mutate state', () => {
    const tree = treeWith(5, { sharp_cutlass: 2 });
    const before = JSON.stringify(tree);
    getSkillBonuses(tree);
    expect(JSON.stringify(tree)).toBe(before);
  });

  it('canUnlockSkill does not mutate state', () => {
    const tree = treeWith(5);
    const before = JSON.stringify(tree);
    canUnlockSkill(tree, 'sharp_cutlass');
    expect(JSON.stringify(tree)).toBe(before);
  });

  it('getAvailableSkills does not mutate state', () => {
    const tree = treeWith(5, { sharp_cutlass: 1 });
    const before = JSON.stringify(tree);
    getAvailableSkills(tree);
    expect(JSON.stringify(tree)).toBe(before);
  });
});
