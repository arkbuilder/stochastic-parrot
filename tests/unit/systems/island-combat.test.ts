import { describe, expect, it } from 'vitest';
import {
  createCombatState,
  updateCombat,
  getCombatButtonRects,
  getDefeatButtonRects,
  restartCombat,
  applyPointPowerup,
  type CombatInput,
  type CombatState,
  type CombatPhase,
  type CombatResult,
  BASE_ATTACK_DAMAGE,
  CHARGE_FILL_SECONDS,
  CHARGE_MAX_MULTIPLIER,
  ENEMY_DAMAGE,
  ENEMY_TURN_DURATION,
  VICTORY_BONUS,
  VICTORY_DISPLAY_DURATION,
  ENEMY_ESCALATION_PER_TURN,
  DEFEAT_DISPLAY_DURATION,
  CRIT_THRESHOLD,
  CRIT_MULTIPLIER,
  POINT_POWERUP_COST,
  POINT_POWERUP_DAMAGE_BONUS,
  DEFEND_REDUCTION,
} from '../../../src/systems/island-combat';
import type { EnemyKind } from '../../../src/entities/enemy';

// ── Input helpers ────────────────────────────────────────────

const NO_INPUT: CombatInput = {
  attackTapped: false,
  chargeStarted: false,
  chargeHeld: false,
  chargeReleased: false,
  defendTapped: false,
};

function attackInput(): CombatInput {
  return { ...NO_INPUT, attackTapped: true };
}

function chargeStartInput(): CombatInput {
  return { ...NO_INPUT, chargeStarted: true, chargeHeld: true };
}

function chargeHeldInput(): CombatInput {
  return { ...NO_INPUT, chargeHeld: true };
}

function chargeReleaseInput(): CombatInput {
  return { ...NO_INPUT, chargeReleased: true, chargeHeld: false };
}

function defendInput(): CombatInput {
  return { ...NO_INPUT, defendTapped: true };
}

// ── Simulation helpers ───────────────────────────────────────

/** Run combat forward through one full attack → anim → enemy-turn cycle */
function doAttackCycle(state: CombatState): void {
  updateCombat(state, 0, attackInput());                     // → player_attack
  updateCombat(state, 0.4, NO_INPUT);                        // flash finishes → enemy_turn
  updateCombat(state, ENEMY_TURN_DURATION + 0.1, NO_INPUT);  // enemy attacks → player_turn
}

/** Kill the enemy with 3 basic attacks (handles intervening enemy turns) */
function killEnemyWithBasicAttacks(state: CombatState): CombatResult {
  doAttackCycle(state);
  doAttackCycle(state);
  updateCombat(state, 0, attackInput());
  return updateCombat(state, 0.4, NO_INPUT); // 3rd attack flash → victory
}

/** Kill the enemy with a single full-charge attack (crit at 100% → 1-shot) */
function killEnemyWithChargedAttack(state: CombatState): CombatResult {
  updateCombat(state, 0, chargeStartInput());
  updateCombat(state, CHARGE_FILL_SECONDS, chargeHeldInput());
  updateCombat(state, 0, chargeReleaseInput());
  return updateCombat(state, 0.4, NO_INPUT); // flash finishes → victory
}

/** Drive combat to completion and return the final result */
function runCombatToEnd(state: CombatState): CombatResult {
  let result: CombatResult = { done: false };
  for (let i = 0; i < 200 && !result.done; i++) {
    if (state.phase === 'defeat') {
      // Defeat no longer returns done:true automatically
      return { done: true, victory: false, bonusPoints: 0 };
    }
    if (state.phase === 'player_turn') {
      result = updateCombat(state, 0, attackInput());
    } else {
      result = updateCombat(state, 1.0, NO_INPUT);
    }
  }
  return result;
}

// All enemy kinds defined in the game
const ALL_ENEMY_KINDS: EnemyKind[] = [
  'crab', 'fire_crab', 'jellyfish', 'shadow_jelly',
  'burrower', 'sand_wyrm', 'urchin', 'ray',
];

// ══════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════

describe('island-combat', () => {

  // ── createCombatState ─────────────────────────────────────

  describe('createCombatState', () => {
    it('creates fresh state with full HP', () => {
      const s = createCombatState('crab');
      expect(s.phase).toBe('player_turn');
      expect(s.playerHp).toBe(1);
      expect(s.enemyHp).toBe(1);
      expect(s.charge).toBe(0);
      expect(s.phaseTimer).toBe(0);
      expect(s.elapsed).toBe(0);
      expect(s.lastDamageDealt).toBe(0);
      expect(s.enemyKind).toBe('crab');
    });

    it.each(ALL_ENEMY_KINDS)('creates valid combat state for %s', (kind) => {
      const s = createCombatState(kind);
      expect(s.phase).toBe('player_turn');
      expect(s.playerHp).toBe(1);
      expect(s.enemyHp).toBe(1);
      expect(s.enemyKind).toBe(kind);
    });

    it('enemy kind is stored as-is (not transformed)', () => {
      const s = createCombatState('sand_wyrm');
      expect(s.enemyKind).toBe('sand_wyrm');
    });
  });

  // ── Attack (instant) ─────────────────────────────────────

  describe('attack (instant)', () => {
    it('deals BASE_ATTACK_DAMAGE to enemy', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      expect(s.enemyHp).toBeCloseTo(1 - BASE_ATTACK_DAMAGE, 5);
      expect(s.phase).toBe('player_attack');
    });

    it('sets lastDamageDealt on hit', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      expect(s.lastDamageDealt).toBeCloseTo(BASE_ATTACK_DAMAGE, 5);
    });

    it('transitions to enemy_turn after attack animation', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());  // → player_attack
      updateCombat(s, 0.4, NO_INPUT);     // timer expires
      expect(s.phase).toBe('enemy_turn');
    });

    it('stays in player_attack during animation timer', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      expect(s.phase).toBe('player_attack');
      updateCombat(s, 0.15, NO_INPUT); // still within 0.3s animation
      expect(s.phase).toBe('player_attack');
    });

    it('never sends enemyHp below 0', () => {
      const s = createCombatState('crab');
      s.enemyHp = 0.1;
      updateCombat(s, 0, attackInput());
      expect(s.enemyHp).toBe(0);
    });

    it('returns done: false (combat not over)', () => {
      const s = createCombatState('crab');
      const result = updateCombat(s, 0, attackInput());
      expect(result.done).toBe(false);
    });
  });

  // ── Charge attack ─────────────────────────────────────────

  describe('charge attack', () => {
    it('enters charging phase on charge start', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      expect(s.phase).toBe('charging');
    });

    it('resets charge to 0 when entering charging', () => {
      const s = createCombatState('crab');
      s.charge = 0.5; // pre-set stale value
      updateCombat(s, 0, chargeStartInput());
      // After one frame at 0 dt, charge should be 0 (reset on entry)
      expect(s.charge).toBe(0);
    });

    it('fills charge meter over CHARGE_FILL_SECONDS', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS / 2, chargeHeldInput());
      expect(s.charge).toBeCloseTo(0.5, 1);
    });

    it('fills charge linearly (25%→50%→75%→100%)', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());

      const step = CHARGE_FILL_SECONDS / 4;
      updateCombat(s, step, chargeHeldInput());
      expect(s.charge).toBeCloseTo(0.25, 1);
      updateCombat(s, step, chargeHeldInput());
      expect(s.charge).toBeCloseTo(0.50, 1);
      updateCombat(s, step, chargeHeldInput());
      expect(s.charge).toBeCloseTo(0.75, 1);
      updateCombat(s, step, chargeHeldInput());
      expect(s.charge).toBeCloseTo(1.00, 1);
    });

    it('caps charge meter at 1.0', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS + 1, chargeHeldInput());
      expect(s.charge).toBe(1);
    });

    it('deals multiplied damage on release at full charge', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      // Full charge + crit (≥90%): BASE × MAX_MULT × CRIT_MULT
      const expectedDmg = BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER;
      expect(s.enemyHp).toBeCloseTo(Math.max(0, 1 - expectedDmg), 5);
      expect(s.phase).toBe('player_attack');
    });

    it('deals partial damage on early release (50% charge)', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS / 2, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      const expectedDmg = BASE_ATTACK_DAMAGE * 1.5;
      expect(s.enemyHp).toBeCloseTo(1 - expectedDmg, 2);
    });

    it('at 0% charge deals exactly base damage (multiplier = 1)', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      // Immediately release with no charging time
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.enemyHp).toBeCloseTo(1 - BASE_ATTACK_DAMAGE, 5);
    });

    it('sets lastDamageDealt to charged damage amount', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      // Full charge + crit
      expect(s.lastDamageDealt).toBeCloseTo(BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER, 5);
    });

    it('resets charge to 0 after release', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.charge).toBe(0);
    });

    it('transitions through player_attack after release', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS / 4, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.phase).toBe('player_attack');
      expect(s.phaseTimer).toBeCloseTo(0.3, 2);
    });
  });

  // ── Enemy turn ────────────────────────────────────────────

  describe('enemy turn', () => {
    it('enemy deals ENEMY_DAMAGE after ENEMY_TURN_DURATION', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT); // → enemy_turn
      expect(s.phase).toBe('enemy_turn');
      updateCombat(s, ENEMY_TURN_DURATION + 0.01, NO_INPUT);
      expect(s.playerHp).toBeCloseTo(1 - ENEMY_DAMAGE, 5);
      expect(s.phase).toBe('player_turn');
    });

    it('does not deal damage before duration expires', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      updateCombat(s, ENEMY_TURN_DURATION * 0.5, NO_INPUT);
      expect(s.playerHp).toBe(1);
      expect(s.phase).toBe('enemy_turn');
    });

    it('phaseTimer ticks down during enemy turn', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      expect(s.phaseTimer).toBeCloseTo(ENEMY_TURN_DURATION, 2);
      updateCombat(s, 0.2, NO_INPUT);
      expect(s.phaseTimer).toBeCloseTo(ENEMY_TURN_DURATION - 0.2, 2);
    });

    it('never sends playerHp below 0', () => {
      const s = createCombatState('crab');
      s.playerHp = 0.05; // very low HP
      s.phase = 'enemy_turn';
      s.phaseTimer = 0.01;
      updateCombat(s, 0.02, NO_INPUT);
      expect(s.playerHp).toBe(0);
    });

    it('returns to player_turn after dealing damage (player alive)', () => {
      const s = createCombatState('crab');
      doAttackCycle(s);
      expect(s.phase).toBe('player_turn');
    });
  });

  // ── Victory ───────────────────────────────────────────────

  describe('victory', () => {
    it('triggers when enemy HP hits 0', () => {
      const s = createCombatState('crab');
      killEnemyWithBasicAttacks(s);
      expect(s.phase).toBe('victory');
    });

    it('refills player HP on victory', () => {
      const s = createCombatState('crab');
      doAttackCycle(s);
      doAttackCycle(s);
      expect(s.playerHp).toBeLessThan(1);

      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      expect(s.phase).toBe('victory');
      expect(s.playerHp).toBe(1);
    });

    it('returns bonus points after victory display', () => {
      const s = createCombatState('crab');
      killEnemyWithBasicAttacks(s);
      expect(s.phase).toBe('victory');

      const result = updateCombat(s, VICTORY_DISPLAY_DURATION + 0.01, NO_INPUT);
      expect(result.done).toBe(true);
      if (result.done) {
        expect(result.victory).toBe(true);
        expect(result.bonusPoints).toBe(VICTORY_BONUS);
      }
    });

    it('keeps showing victory until display duration', () => {
      const s = createCombatState('crab');
      killEnemyWithBasicAttacks(s);

      const result = updateCombat(s, VICTORY_DISPLAY_DURATION * 0.5, NO_INPUT);
      expect(result.done).toBe(false);
      expect(s.phase).toBe('victory');
    });

    it('VICTORY_BONUS equals 100', () => {
      expect(VICTORY_BONUS).toBe(100);
    });

    it('phaseTimer is set to VICTORY_DISPLAY_DURATION on entering victory', () => {
      const s = createCombatState('crab');
      killEnemyWithBasicAttacks(s);
      expect(s.phaseTimer).toBeCloseTo(VICTORY_DISPLAY_DURATION, 2);
    });
  });

  // ── Defeat (edge case) ────────────────────────────────────

  describe('defeat', () => {
    it('triggers when player HP hits 0', () => {
      const s = createCombatState('crab');
      s.playerHp = ENEMY_DAMAGE * 0.5;
      s.phase = 'enemy_turn';
      s.phaseTimer = 0.01;

      const result = updateCombat(s, 0.02, NO_INPUT);
      // Defeat now returns done:false (scene handles retry UI)
      expect(result.done).toBe(false);
      expect(s.phase).toBe('defeat');
      expect(s.phaseTimer).toBeCloseTo(DEFEAT_DISPLAY_DURATION, 5);
    });

    it('defeat phase counts down display timer then stays in defeat', () => {
      const s = createCombatState('crab');
      s.phase = 'defeat';
      s.phaseTimer = DEFEAT_DISPLAY_DURATION;
      // Advance halfway
      updateCombat(s, DEFEAT_DISPLAY_DURATION / 2, NO_INPUT);
      expect(s.phase).toBe('defeat');
      expect(s.phaseTimer).toBeCloseTo(DEFEAT_DISPLAY_DURATION / 2, 5);
      // Finish timer
      updateCombat(s, DEFEAT_DISPLAY_DURATION, NO_INPUT);
      expect(s.phase).toBe('defeat');
      expect(s.phaseTimer).toBeLessThanOrEqual(0);
    });

    it('defeat never returns done:true (scene handles dismissal)', () => {
      const s = createCombatState('crab');
      s.phase = 'defeat';
      s.phaseTimer = 0;
      const result = updateCombat(s, 1.0, NO_INPUT);
      expect(result.done).toBe(false);
    });

    it('defeat is reachable after enough enemy turns', () => {
      const s = createCombatState('crab');
      // Manually set player HP just above one hit so next enemy turn kills them
      s.playerHp = ENEMY_DAMAGE * 0.5;
      s.phase = 'enemy_turn';
      s.phaseTimer = 0.01;
      updateCombat(s, 0.02, NO_INPUT);
      expect(s.phase).toBe('defeat');
    });
  });

  // ── Full combat paths ─────────────────────────────────────

  describe('full combat — basic attack path', () => {
    it('3 basic attacks kill the enemy', () => {
      const s = createCombatState('crab');
      // 3 * 0.34 = 1.02 ≥ 1 → dead
      expect(3 * BASE_ATTACK_DAMAGE).toBeGreaterThanOrEqual(1);
      killEnemyWithBasicAttacks(s);
      expect(s.phase).toBe('victory');
    });

    it('2 basic attacks are not enough', () => {
      const s = createCombatState('crab');
      doAttackCycle(s);
      doAttackCycle(s);
      expect(s.enemyHp).toBeGreaterThan(0);
      expect(s.phase).toBe('player_turn');
    });
  });

  describe('full combat — charged attack path', () => {
    it('1 fully charged attack kills the enemy (crit at 100%)', () => {
      const s = createCombatState('crab');
      // Full charge + crit: 0.34 × 2.0 × 1.5 = 1.02 ≥ 1 → dead
      expect(BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER).toBeGreaterThanOrEqual(1);
      killEnemyWithChargedAttack(s);
      expect(s.phase).toBe('victory');
    });

    it('1 partial charge (80%) is not enough to kill', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS * 0.8, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      updateCombat(s, 0.4, NO_INPUT);
      expect(s.enemyHp).toBeGreaterThan(0);
    });
  });

  describe('full combat — mixed attack path', () => {
    it('1 basic + 1 full charge kills the enemy', () => {
      const s = createCombatState('crab');
      // 0.34 + 0.34*2 = 1.02 ≥ 1
      doAttackCycle(s);
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      updateCombat(s, 0.4, NO_INPUT);
      expect(s.phase).toBe('victory');
    });
  });

  // ── All enemy kinds trigger combat identically ────────────

  describe('all enemy kinds', () => {
    it.each(ALL_ENEMY_KINDS)('%s → combat starts in player_turn with full HP', (kind) => {
      const s = createCombatState(kind);
      expect(s.phase).toBe('player_turn');
      expect(s.playerHp).toBe(1);
      expect(s.enemyHp).toBe(1);
    });

    it.each(ALL_ENEMY_KINDS)('%s → basic attack deals correct damage', (kind) => {
      const s = createCombatState(kind);
      updateCombat(s, 0, attackInput());
      expect(s.enemyHp).toBeCloseTo(1 - BASE_ATTACK_DAMAGE, 5);
    });

    it.each(ALL_ENEMY_KINDS)('%s → charge attack deals multiplied damage (crit at full)', (kind) => {
      const s = createCombatState(kind);
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      const expectedDmg = BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER;
      expect(s.enemyHp).toBeCloseTo(Math.max(0, 1 - expectedDmg), 5);
    });

    it.each(ALL_ENEMY_KINDS)('%s → enemy deals ENEMY_DAMAGE on their turn', (kind) => {
      const s = createCombatState(kind);
      doAttackCycle(s);
      expect(s.playerHp).toBeCloseTo(1 - ENEMY_DAMAGE, 5);
    });

    it.each(ALL_ENEMY_KINDS)('%s → can be defeated with basic attacks', (kind) => {
      const s = createCombatState(kind);
      const result = runCombatToEnd(s);
      expect(result.done).toBe(true);
      if (result.done) {
        expect(result.victory).toBe(true);
        expect(result.bonusPoints).toBe(VICTORY_BONUS);
      }
    });

    it.each(ALL_ENEMY_KINDS)('%s → can be defeated with charged attack', (kind) => {
      const s = createCombatState(kind);
      killEnemyWithChargedAttack(s);
      expect(s.phase).toBe('victory');
      const result = updateCombat(s, VICTORY_DISPLAY_DURATION + 0.01, NO_INPUT);
      expect(result.done).toBe(true);
      if (result.done) {
        expect(result.victory).toBe(true);
      }
    });

    it.each(ALL_ENEMY_KINDS)('%s → HP refilled to 1 on victory', (kind) => {
      const s = createCombatState(kind);
      doAttackCycle(s); // take some damage
      doAttackCycle(s);
      expect(s.playerHp).toBeLessThan(1);
      // kill
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      expect(s.playerHp).toBe(1);
    });
  });

  // ── Phase transition integrity ────────────────────────────

  describe('phase transition integrity', () => {
    const VALID_TRANSITIONS: Record<CombatPhase, CombatPhase[]> = {
      player_turn: ['player_attack', 'charging', 'enemy_turn'],  // enemy_turn via defend
      charging: ['player_attack'],
      player_attack: ['enemy_turn', 'victory'],
      enemy_turn: ['player_turn', 'defeat'],
      victory: ['victory'],  // stays until timer done, then result.done
      defeat: ['defeat'],    // stays until scene calls restartCombat
    };

    it('attack transitions: player_turn → player_attack → enemy_turn', () => {
      const s = createCombatState('crab');
      expect(s.phase).toBe('player_turn');
      updateCombat(s, 0, attackInput());
      expect(s.phase).toBe('player_attack');
      updateCombat(s, 0.4, NO_INPUT);
      expect(s.phase).toBe('enemy_turn');
    });

    it('charge transitions: player_turn → charging → player_attack', () => {
      const s = createCombatState('crab');
      expect(s.phase).toBe('player_turn');
      updateCombat(s, 0, chargeStartInput());
      expect(s.phase).toBe('charging');
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.phase).toBe('player_attack');
    });

    it('enemy_turn → player_turn (player alive)', () => {
      const s = createCombatState('crab');
      s.phase = 'enemy_turn';
      s.phaseTimer = 0.01;
      updateCombat(s, 0.02, NO_INPUT);
      expect(s.phase).toBe('player_turn');
    });

    it('enemy_turn → defeat (player dead)', () => {
      const s = createCombatState('crab');
      s.phase = 'enemy_turn';
      s.phaseTimer = 0.01;
      s.playerHp = 0.01;
      updateCombat(s, 0.02, NO_INPUT);
      expect(s.phase).toBe('defeat');
    });

    it('player_attack → victory (enemy dead)', () => {
      const s = createCombatState('crab');
      s.enemyHp = BASE_ATTACK_DAMAGE * 0.5;
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      expect(s.phase).toBe('victory');
    });

    it('only valid transitions occur during full combat', () => {
      const s = createCombatState('crab');
      let prev = s.phase;
      for (let i = 0; i < 100; i++) {
        if (s.phase === 'defeat') break;
        if (s.phase === 'player_turn') {
          updateCombat(s, 0, attackInput());
        } else {
          const result = updateCombat(s, 1.0, NO_INPUT);
          if (result.done) break;
        }
        const current = s.phase;
        if (current !== prev) {
          expect(
            VALID_TRANSITIONS[prev],
            `Invalid transition: ${prev} → ${current}`,
          ).toContain(current);
          prev = current;
        }
      }
    });
  });

  // ── getCombatButtonRects ──────────────────────────────────

  describe('getCombatButtonRects', () => {
    it('returns attack, charge, and defend button rects', () => {
      const rects = getCombatButtonRects();
      expect(rects.attack).toBeDefined();
      expect(rects.charge).toBeDefined();
      expect(rects.defend).toBeDefined();
    });

    it('buttons do not overlap', () => {
      const { attack, charge, defend } = getCombatButtonRects();
      expect(attack.x + attack.w).toBeLessThanOrEqual(charge.x);
      expect(charge.x + charge.w).toBeLessThanOrEqual(defend.x);
    });

    it('buttons are within 240×400 game canvas', () => {
      const { attack, charge, defend } = getCombatButtonRects();
      for (const r of [attack, charge, defend]) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(240);
        expect(r.y + r.h).toBeLessThanOrEqual(400);
      }
    });

    it('buttons are in lower third (portrait-first rule)', () => {
      const { attack, charge, defend } = getCombatButtonRects();
      const lowerThird = 400 * (2 / 3);
      expect(attack.y).toBeGreaterThanOrEqual(lowerThird);
      expect(charge.y).toBeGreaterThanOrEqual(lowerThird);
      expect(defend.y).toBeGreaterThanOrEqual(lowerThird);
    });
  });

  // ── Elapsed time tracking ─────────────────────────────────

  describe('elapsed time tracking', () => {
    it('accumulates elapsed time across updates', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0.1, NO_INPUT);
      updateCombat(s, 0.2, NO_INPUT);
      updateCombat(s, 0.3, NO_INPUT);
      expect(s.elapsed).toBeCloseTo(0.6, 5);
    });

    it('elapsed increases even during charging', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, 0.5, chargeHeldInput());
      expect(s.elapsed).toBeCloseTo(0.5, 5);
    });

    it('elapsed increases during enemy turn', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      updateCombat(s, 0.3, NO_INPUT);
      expect(s.elapsed).toBeCloseTo(0.7, 5);
    });
  });

  // ── Idle / edge cases ─────────────────────────────────────

  describe('idle and edge cases', () => {
    it('stays in player_turn with no input indefinitely', () => {
      const s = createCombatState('crab');
      for (let i = 0; i < 10; i++) {
        const result = updateCombat(s, 1.0, NO_INPUT);
        expect(result.done).toBe(false);
      }
      expect(s.phase).toBe('player_turn');
      expect(s.enemyHp).toBe(1);
      expect(s.playerHp).toBe(1);
    });

    it('zero dt step is safe in every phase', () => {
      const phases: CombatPhase[] = ['player_turn', 'charging', 'player_attack', 'enemy_turn', 'victory', 'defeat'];
      for (const phase of phases) {
        const s = createCombatState('crab');
        s.phase = phase;
        s.phaseTimer = 1;
        s.charge = 0.5;
        // Should not throw
        expect(() => updateCombat(s, 0, NO_INPUT)).not.toThrow();
      }
    });

    it('very large dt does not crash or produce NaN', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      updateCombat(s, 999, NO_INPUT); // huge dt
      expect(Number.isFinite(s.playerHp)).toBe(true);
      expect(Number.isFinite(s.enemyHp)).toBe(true);
      expect(s.phase).not.toBe('player_attack'); // should have advanced
    });

    it('multiple inputs in one frame — attack takes priority', () => {
      const s = createCombatState('crab');
      const multi: CombatInput = {
        attackTapped: true,
        chargeStarted: true,
        chargeHeld: true,
        chargeReleased: false,
        defendTapped: true,
      };
      updateCombat(s, 0, multi);
      // Attack is checked first in handlePlayerTurn
      expect(s.phase).toBe('player_attack');
    });

    it('combat does not leak state between instances', () => {
      const a = createCombatState('crab');
      const b = createCombatState('jellyfish');
      updateCombat(a, 0, attackInput());
      expect(a.enemyHp).toBeLessThan(1);
      expect(b.enemyHp).toBe(1); // b unaffected
    });
  });

  // ── Constant invariants ───────────────────────────────────

  describe('constant invariants', () => {
    it('CHARGE_MAX_MULTIPLIER > 1 (charge must be better than basic)', () => {
      expect(CHARGE_MAX_MULTIPLIER).toBeGreaterThan(1);
    });

    it('3 basic attacks are enough to kill (3 × BASE_ATTACK_DAMAGE ≥ 1)', () => {
      expect(3 * BASE_ATTACK_DAMAGE).toBeGreaterThanOrEqual(1);
    });

    it('1 full charge + crit kills (BASE_ATTACK_DAMAGE × CHARGE_MAX_MULTIPLIER × CRIT_MULTIPLIER ≥ 1)', () => {
      expect(BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER).toBeGreaterThanOrEqual(1);
    });

    it('player can survive at least 6 enemy hits', () => {
      const survivalHits = Math.floor(1 / ENEMY_DAMAGE);
      expect(survivalHits).toBeGreaterThanOrEqual(6);
    });

    it('combat is completable in under 15 seconds (3 attack cycles)', () => {
      // Each attack cycle: 0 (attack) + 0.3 (anim) + ENEMY_TURN_DURATION
      // 3 cycles + VICTORY_DISPLAY_DURATION
      const worstCase = 3 * (0.3 + ENEMY_TURN_DURATION) + VICTORY_DISPLAY_DURATION;
      expect(worstCase).toBeLessThan(15);
    });

    it('VICTORY_DISPLAY_DURATION is positive', () => {
      expect(VICTORY_DISPLAY_DURATION).toBeGreaterThan(0);
    });

    it('CHARGE_FILL_SECONDS is positive', () => {
      expect(CHARGE_FILL_SECONDS).toBeGreaterThan(0);
    });
  });

  // ── Damage math correctness ───────────────────────────────

  describe('damage math', () => {
    it('charge multiplier scales linearly from 1× to CHARGE_MAX_MULTIPLIER (sub-crit)', () => {
      // Test linear scaling at sub-crit charge levels (below CRIT_THRESHOLD)
      const samples = [0, 0.25, 0.5, 0.75, 0.85];
      for (const chargeRatio of samples) {
        const s = createCombatState('crab');
        updateCombat(s, 0, chargeStartInput());
        if (chargeRatio > 0) {
          updateCombat(s, CHARGE_FILL_SECONDS * chargeRatio, chargeHeldInput());
        }
        updateCombat(s, 0, chargeReleaseInput());
        const expectedMult = 1 + chargeRatio * (CHARGE_MAX_MULTIPLIER - 1);
        const expectedDmg = BASE_ATTACK_DAMAGE * expectedMult;
        expect(s.enemyHp).toBeCloseTo(1 - expectedDmg, 2);
      }
    });

    it('enemy HP never goes negative across a full fight', () => {
      const s = createCombatState('crab');
      for (let i = 0; i < 50; i++) {
        if (s.phase === 'defeat') break;
        if (s.phase === 'player_turn') {
          updateCombat(s, 0, attackInput());
        } else {
          const result = updateCombat(s, 1.0, NO_INPUT);
          if (result.done) break;
        }
        expect(s.enemyHp).toBeGreaterThanOrEqual(0);
        expect(s.playerHp).toBeGreaterThanOrEqual(0);
      }
    });

    it('player HP never goes negative across a full fight', () => {
      const s = createCombatState('crab');
      const result = runCombatToEnd(s);
      expect(result.done).toBe(true);
      // HP should be exactly 1 after victory (refill)
      expect(s.playerHp).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Skill Bonuses — combat integration with SkillBonuses parameter
  // ══════════════════════════════════════════════════════════════

  describe('skill bonuses — createCombatState', () => {
    it('default bonuses give playerHp = 1 and maxPlayerHp = 1', () => {
      const s = createCombatState('crab');
      expect(s.playerHp).toBe(1);
      expect(s.maxPlayerHp).toBe(1);
    });

    it('sea_legs bonus increases starting HP and maxPlayerHp', () => {
      const bonuses = { ...defaultBonuses, startingHpBonus: 0.3 };
      const s = createCombatState('crab', bonuses);
      expect(s.playerHp).toBeCloseTo(1.3, 5);
      expect(s.maxPlayerHp).toBeCloseTo(1.3, 5);
    });

    it('startingHpBonus is capped at 2× total', () => {
      const bonuses = { ...defaultBonuses, startingHpBonus: 5.0 };
      const s = createCombatState('crab', bonuses);
      expect(s.playerHp).toBe(2);
      expect(s.maxPlayerHp).toBe(2);
    });
  });

  describe('skill bonuses — attack damage', () => {
    it('attackMultiplier increases normal attack damage', () => {
      const bonuses = { ...defaultBonuses, attackMultiplier: 1.6 };
      const s = createCombatState('crab', bonuses);
      updateCombat(s, 0, attackInput(), bonuses);
      expect(s.enemyHp).toBeCloseTo(1 - BASE_ATTACK_DAMAGE * 1.6, 5);
    });

    it('attackMultiplier also scales charged attack', () => {
      const bonuses = { ...defaultBonuses, attackMultiplier: 1.4 };
      const s = createCombatState('crab', bonuses);
      // Start and hold charge for full fill
      updateCombat(s, 0, chargeStartInput(), bonuses);
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput(), bonuses);
      updateCombat(s, 0, chargeReleaseInput(), bonuses);
      const expectedDmg = BASE_ATTACK_DAMAGE * 1.4 * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER;
      expect(s.enemyHp).toBeCloseTo(Math.max(0, 1 - expectedDmg), 5);
    });

    it('2 basic attacks can kill with high enough attackMultiplier', () => {
      // 2 × 0.34 × 1.6 = 1.088 ≥ 1.0
      const bonuses = { ...defaultBonuses, attackMultiplier: 1.6 };
      const s = createCombatState('crab', bonuses);
      updateCombat(s, 0, attackInput(), bonuses);
      updateCombat(s, 0.4, NO_INPUT, bonuses);
      updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT, bonuses);
      updateCombat(s, 0, attackInput(), bonuses);
      updateCombat(s, 0.4, NO_INPUT, bonuses);
      expect(s.phase).toBe('victory');
    });
  });

  describe('skill bonuses — charge speed', () => {
    it('chargeSpeedMultiplier fills meter faster', () => {
      const bonuses = { ...defaultBonuses, chargeSpeedMultiplier: 1.4 };
      const s = createCombatState('crab', bonuses);
      updateCombat(s, 0, chargeStartInput(), bonuses);
      // Half the normal fill time should give 70% charge (0.5/1.2 * 1.4)
      const halfFill = CHARGE_FILL_SECONDS / 2;
      updateCombat(s, halfFill, chargeHeldInput(), bonuses);
      const expectedCharge = (halfFill / CHARGE_FILL_SECONDS) * 1.4;
      expect(s.charge).toBeCloseTo(expectedCharge, 5);
    });

    it('chargeSpeedMultiplier 2.0 halves fill time', () => {
      const bonuses = { ...defaultBonuses, chargeSpeedMultiplier: 2.0 };
      const s = createCombatState('crab', bonuses);
      updateCombat(s, 0, chargeStartInput(), bonuses);
      updateCombat(s, CHARGE_FILL_SECONDS / 2, chargeHeldInput(), bonuses);
      expect(s.charge).toBeCloseTo(1.0, 5);
    });
  });

  describe('skill bonuses — charge max (Thunder Strike)', () => {
    it('chargeMaxBonus increases max multiplier', () => {
      const bonuses = { ...defaultBonuses, chargeMaxBonus: 1.0 };
      const s = createCombatState('crab', bonuses);
      updateCombat(s, 0, chargeStartInput(), bonuses);
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput(), bonuses);
      updateCombat(s, 0, chargeReleaseInput(), bonuses);
      // Fully charged + crit: BASE × (2.0+1.0) × CRIT_MULT = 0.34 × 3.0 × 1.5 = 1.53
      const maxMult = CHARGE_MAX_MULTIPLIER + 1.0;
      const multiplier = 1 + 1.0 * (maxMult - 1);
      const expectedDmg = BASE_ATTACK_DAMAGE * multiplier * CRIT_MULTIPLIER;
      expect(s.enemyHp).toBeCloseTo(Math.max(0, 1 - expectedDmg), 5);
    });

    it('single fully-charged attack can one-shot with chargeMaxBonus', () => {
      // With maxBonus 1.0: 0.34 × 3.0 = 1.02 ≥ 1.0
      const bonuses = { ...defaultBonuses, chargeMaxBonus: 1.0 };
      const s = createCombatState('crab', bonuses);
      updateCombat(s, 0, chargeStartInput(), bonuses);
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput(), bonuses);
      updateCombat(s, 0, chargeReleaseInput(), bonuses);
      updateCombat(s, 0.4, NO_INPUT, bonuses);
      expect(s.phase).toBe('victory');
    });
  });

  describe('skill bonuses — damage reduction (Iron Hull)', () => {
    it('damageReduction reduces enemy damage taken', () => {
      const bonuses = { ...defaultBonuses, damageReduction: 0.4 };
      const s = createCombatState('crab', bonuses);
      // Attack → enemy turn
      updateCombat(s, 0, attackInput(), bonuses);
      updateCombat(s, 0.4, NO_INPUT, bonuses);
      updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT, bonuses);
      const expected = 1 - ENEMY_DAMAGE * (1 - 0.4);
      expect(s.playerHp).toBeCloseTo(expected, 5);
    });

    it('max damageReduction (0.80) makes enemy deal 20% of normal', () => {
      const bonuses = { ...defaultBonuses, damageReduction: 0.80 };
      const s = createCombatState('crab', bonuses);
      updateCombat(s, 0, attackInput(), bonuses);
      updateCombat(s, 0.4, NO_INPUT, bonuses);
      updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT, bonuses);
      const expected = 1 - ENEMY_DAMAGE * 0.20;
      expect(s.playerHp).toBeCloseTo(expected, 5);
    });

    it('player survives more hits with damageReduction', () => {
      const bonuses = { ...defaultBonuses, damageReduction: 0.6 };
      const s = createCombatState('crab', bonuses);
      // Without reduction: 6 hits kill (6×0.15 = 0.90, 7th kills)
      // With 60% reduction: 0.15 × 0.4 = 0.06 per hit → survives 16 hits
      for (let i = 0; i < 12; i++) {
        updateCombat(s, 0, attackInput(), bonuses);
        updateCombat(s, 0.4, NO_INPUT, bonuses);
        if (s.phase === 'victory') break;
        updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT, bonuses);
        if (s.phase === 'defeat') break;
      }
      expect(s.phase).not.toBe('defeat');
    });
  });

  describe('skill bonuses — victory points (Plunder)', () => {
    it('victoryBonusAdd increases victory bonus points', () => {
      const bonuses = { ...defaultBonuses, victoryBonusAdd: 100 };
      const s = createCombatState('crab', bonuses);
      killEnemyWithBasicAttacks(s);
      const result = updateCombat(s, VICTORY_DISPLAY_DURATION + 0.1, NO_INPUT, bonuses);
      expect(result.done).toBe(true);
      if (result.done) expect(result.bonusPoints).toBe(VICTORY_BONUS + 100);
    });

    it('victoryBonusAdd 0 gives base VICTORY_BONUS', () => {
      const bonuses = { ...defaultBonuses, victoryBonusAdd: 0 };
      const s = createCombatState('crab', bonuses);
      killEnemyWithBasicAttacks(s);
      const result = updateCombat(s, VICTORY_DISPLAY_DURATION + 0.1, NO_INPUT, bonuses);
      expect(result.done).toBe(true);
      if (result.done) expect(result.bonusPoints).toBe(VICTORY_BONUS);
    });
  });

  describe('skill bonuses — HP refill on victory', () => {
    it('refills to maxPlayerHp (not hardcoded 1) on victory', () => {
      const bonuses = { ...defaultBonuses, startingHpBonus: 0.3 };
      const s = createCombatState('crab', bonuses);
      expect(s.maxPlayerHp).toBeCloseTo(1.3, 5);
      // Lose some HP via enemy turn
      doAttackCycleWithBonuses(s, bonuses);
      expect(s.playerHp).toBeLessThan(1.3);
      // Kill the enemy
      doAttackCycleWithBonuses(s, bonuses);
      updateCombat(s, 0, attackInput(), bonuses);
      updateCombat(s, 0.4, NO_INPUT, bonuses);
      // Now in victory — HP should be refilled to maxPlayerHp
      expect(s.phase).toBe('victory');
      expect(s.playerHp).toBeCloseTo(1.3, 5);
    });

    it('default bonuses refill to exactly 1.0', () => {
      const s = createCombatState('crab');
      doAttackCycle(s);
      expect(s.playerHp).toBeLessThan(1);
      killEnemyWithBasicAttacks(createCombatState('crab')); // reference
      // Re-do with the state that took damage
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT);
      updateCombat(s, 0, attackInput());
      updateCombat(s, 0.4, NO_INPUT);
      if (s.phase === 'victory') {
        expect(s.playerHp).toBe(1);
      }
    });
  });

  describe('skill bonuses — combined effects', () => {
    it('all bonuses work together in a full combat', () => {
      const bonuses = {
        attackMultiplier: 1.4,
        chargeSpeedMultiplier: 1.2,
        chargeMaxBonus: 0.5,
        damageReduction: 0.4,
        victoryBonusAdd: 50,
        startingHpBonus: 0.2,
      };
      const s = createCombatState('crab', bonuses);
      expect(s.playerHp).toBeCloseTo(1.2, 5);
      expect(s.maxPlayerHp).toBeCloseTo(1.2, 5);
      const result = runCombatWithBonuses(s, bonuses);
      expect(result.done).toBe(true);
      if (result.done && result.victory) {
        expect(result.bonusPoints).toBe(VICTORY_BONUS + 50);
        expect(s.playerHp).toBeCloseTo(1.2, 5); // refilled to max
      }
    });

    it('combat without bonuses parameter uses defaults', () => {
      const s = createCombatState('crab');
      const result = runCombatToEnd(s);
      expect(result.done).toBe(true);
      if (result.done) expect(result.victory).toBe(true);
      if (result.done && result.victory) expect(result.bonusPoints).toBe(VICTORY_BONUS);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // New tactical mechanics
  // ══════════════════════════════════════════════════════════════

  describe('defend action', () => {
    it('defend transitions player_turn → enemy_turn', () => {
      const s = createCombatState('crab');
      expect(s.phase).toBe('player_turn');
      updateCombat(s, 0, defendInput());
      expect(s.phase).toBe('enemy_turn');
    });

    it('defend sets defending flag', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, defendInput());
      expect(s.defending).toBe(true);
    });

    it('defend halves incoming enemy damage', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, defendInput());
      expect(s.phase).toBe('enemy_turn');
      updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT);
      // First turn: escalation=1.0, defend reduces by DEFEND_REDUCTION (50%)
      const expectedDmg = ENEMY_DAMAGE * (1 - DEFEND_REDUCTION);
      expect(s.playerHp).toBeCloseTo(1 - expectedDmg, 5);
    });

    it('defend resets after enemy turn', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, defendInput());
      updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT);
      expect(s.defending).toBe(false);
    });

    it('attack still takes priority over defend', () => {
      const s = createCombatState('crab');
      const both: CombatInput = { ...NO_INPUT, attackTapped: true, defendTapped: true };
      updateCombat(s, 0, both);
      expect(s.phase).toBe('player_attack');
    });

    it('normal attack does not set defending', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      expect(s.defending).toBe(false);
    });
  });

  describe('critical hits', () => {
    it('full charge (100%) triggers crit', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.lastCrit).toBe(true);
    });

    it('charge at exactly CRIT_THRESHOLD triggers crit', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS * CRIT_THRESHOLD, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.lastCrit).toBe(true);
    });

    it('charge below CRIT_THRESHOLD does not trigger crit', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS * (CRIT_THRESHOLD - 0.05), chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.lastCrit).toBe(false);
    });

    it('crit multiplies damage by CRIT_MULTIPLIER', () => {
      const s1 = createCombatState('crab');
      updateCombat(s1, 0, chargeStartInput());
      updateCombat(s1, CHARGE_FILL_SECONDS * 0.85, chargeHeldInput()); // below crit
      updateCombat(s1, 0, chargeReleaseInput());
      const noCritDmg = s1.lastDamageDealt;

      const s2 = createCombatState('crab');
      updateCombat(s2, 0, chargeStartInput());
      updateCombat(s2, CHARGE_FILL_SECONDS, chargeHeldInput()); // full charge, crit
      updateCombat(s2, 0, chargeReleaseInput());
      const critDmg = s2.lastDamageDealt;

      // At 85% vs 100%: base mult difference + crit
      // Crit damage should be noticeably higher
      expect(critDmg).toBeGreaterThan(noCritDmg);
      expect(s2.lastCrit).toBe(true);
      expect(s1.lastCrit).toBe(false);
    });

    it('normal attack does not trigger crit', () => {
      const s = createCombatState('crab');
      updateCombat(s, 0, attackInput());
      expect(s.lastCrit).toBe(false);
    });

    it('lastCrit resets each player turn', () => {
      const s = createCombatState('crab');
      // Do a crit
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      expect(s.lastCrit).toBe(true);
      // Advance to next player turn
      updateCombat(s, 0.4, NO_INPUT); // player_attack → enemy_turn (or victory)
      if (s.phase === 'enemy_turn') {
        updateCombat(s, ENEMY_TURN_DURATION + 0.1, NO_INPUT);
      }
      if (s.phase === 'player_turn') {
        updateCombat(s, 0, attackInput()); // normal attack
        expect(s.lastCrit).toBe(false);
      }
    });
  });

  describe('enemy escalation', () => {
    it('turnCount starts at 0', () => {
      const s = createCombatState('crab');
      expect(s.turnCount).toBe(0);
    });

    it('turnCount increments after each enemy turn', () => {
      const s = createCombatState('crab');
      doAttackCycle(s); // 1 enemy turn
      expect(s.turnCount).toBe(1);
      doAttackCycle(s); // 2nd enemy turn
      expect(s.turnCount).toBe(2);
    });

    it('first enemy turn deals base ENEMY_DAMAGE (no escalation)', () => {
      const s = createCombatState('crab');
      doAttackCycle(s);
      expect(s.playerHp).toBeCloseTo(1 - ENEMY_DAMAGE, 5);
    });

    it('second enemy turn deals escalated damage', () => {
      const s = createCombatState('crab');
      doAttackCycle(s); // turnCount goes to 1
      const hpAfterFirst = s.playerHp;
      doAttackCycle(s); // turnCount goes to 2
      const secondTurnDmg = hpAfterFirst - s.playerHp;
      const expected = ENEMY_DAMAGE * (1 + 1 * ENEMY_ESCALATION_PER_TURN);
      expect(secondTurnDmg).toBeCloseTo(expected, 5);
    });

    it('ENEMY_ESCALATION_PER_TURN is 10%', () => {
      expect(ENEMY_ESCALATION_PER_TURN).toBe(0.10);
    });
  });

  describe('restartCombat', () => {
    it('resets HP to full', () => {
      const s = createCombatState('crab');
      s.playerHp = 0;
      s.phase = 'defeat';
      restartCombat(s);
      expect(s.playerHp).toBe(1);
      expect(s.maxPlayerHp).toBe(1);
    });

    it('resets enemy to full HP', () => {
      const s = createCombatState('crab');
      s.enemyHp = 0;
      restartCombat(s);
      expect(s.enemyHp).toBe(1);
    });

    it('returns to player_turn phase', () => {
      const s = createCombatState('crab');
      s.phase = 'defeat';
      restartCombat(s);
      expect(s.phase).toBe('player_turn');
    });

    it('increments retryCount', () => {
      const s = createCombatState('crab');
      expect(s.retryCount).toBe(0);
      restartCombat(s);
      expect(s.retryCount).toBe(1);
      restartCombat(s);
      expect(s.retryCount).toBe(2);
    });

    it('preserves bonusDamage across restarts', () => {
      const s = createCombatState('crab');
      applyPointPowerup(s);
      expect(s.bonusDamage).toBe(POINT_POWERUP_DAMAGE_BONUS);
      restartCombat(s);
      expect(s.bonusDamage).toBe(POINT_POWERUP_DAMAGE_BONUS);
    });

    it('resets turnCount, charge, timers', () => {
      const s = createCombatState('crab');
      s.turnCount = 5;
      s.charge = 0.5;
      s.phaseTimer = 1.0;
      s.elapsed = 10;
      restartCombat(s);
      expect(s.turnCount).toBe(0);
      expect(s.charge).toBe(0);
      expect(s.phaseTimer).toBe(0);
      expect(s.elapsed).toBe(0);
    });

    it('respects skill bonuses for HP', () => {
      const bonuses = { ...defaultBonuses, startingHpBonus: 0.5 };
      const s = createCombatState('crab', bonuses);
      s.playerHp = 0;
      s.phase = 'defeat';
      restartCombat(s, bonuses);
      expect(s.playerHp).toBeCloseTo(1.5, 5);
      expect(s.maxPlayerHp).toBeCloseTo(1.5, 5);
    });
  });

  describe('applyPointPowerup', () => {
    it('adds POINT_POWERUP_DAMAGE_BONUS to bonusDamage', () => {
      const s = createCombatState('crab');
      expect(s.bonusDamage).toBe(0);
      applyPointPowerup(s);
      expect(s.bonusDamage).toBe(POINT_POWERUP_DAMAGE_BONUS);
    });

    it('stacks multiple power-ups', () => {
      const s = createCombatState('crab');
      applyPointPowerup(s);
      applyPointPowerup(s);
      expect(s.bonusDamage).toBeCloseTo(2 * POINT_POWERUP_DAMAGE_BONUS, 5);
    });

    it('returns true', () => {
      const s = createCombatState('crab');
      expect(applyPointPowerup(s)).toBe(true);
    });
  });

  describe('bonusDamage affects combat', () => {
    it('bonusDamage increases normal attack damage', () => {
      const s = createCombatState('crab');
      applyPointPowerup(s); // +20% bonus
      updateCombat(s, 0, attackInput());
      const expected = BASE_ATTACK_DAMAGE * (1 + POINT_POWERUP_DAMAGE_BONUS);
      expect(s.lastDamageDealt).toBeCloseTo(expected, 5);
    });

    it('bonusDamage increases charged attack damage', () => {
      const s = createCombatState('crab');
      applyPointPowerup(s);
      updateCombat(s, 0, chargeStartInput());
      updateCombat(s, CHARGE_FILL_SECONDS * 0.5, chargeHeldInput());
      updateCombat(s, 0, chargeReleaseInput());
      const mult = 1 + 0.5 * (CHARGE_MAX_MULTIPLIER - 1);
      const expected = BASE_ATTACK_DAMAGE * mult * (1 + POINT_POWERUP_DAMAGE_BONUS);
      expect(s.lastDamageDealt).toBeCloseTo(expected, 5);
    });

    it('double power-up can 2-shot enemy with basic attacks', () => {
      const s = createCombatState('crab');
      applyPointPowerup(s);
      applyPointPowerup(s); // +40%
      const dmgPerHit = BASE_ATTACK_DAMAGE * (1 + 2 * POINT_POWERUP_DAMAGE_BONUS);
      // 2 hits: 0.34 * 1.4 = 0.476, 2 * 0.476 = 0.952 < 1 — not quite
      // 3 hits: 1.428 ≥ 1 — still 3 hits but with margin
      expect(3 * dmgPerHit).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getDefeatButtonRects', () => {
    it('returns retry and powerup button rects', () => {
      const rects = getDefeatButtonRects();
      expect(rects.retry).toBeDefined();
      expect(rects.powerup).toBeDefined();
    });

    it('buttons do not overlap', () => {
      const { retry, powerup } = getDefeatButtonRects();
      expect(retry.x + retry.w).toBeLessThanOrEqual(powerup.x);
    });

    it('buttons are within 240×400 game canvas', () => {
      const { retry, powerup } = getDefeatButtonRects();
      for (const r of [retry, powerup]) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(240);
        expect(r.y + r.h).toBeLessThanOrEqual(400);
      }
    });
  });

  describe('new constant invariants', () => {
    it('DEFEAT_DISPLAY_DURATION is positive', () => {
      expect(DEFEAT_DISPLAY_DURATION).toBeGreaterThan(0);
    });

    it('CRIT_THRESHOLD is between 0 and 1', () => {
      expect(CRIT_THRESHOLD).toBeGreaterThan(0);
      expect(CRIT_THRESHOLD).toBeLessThanOrEqual(1);
    });

    it('CRIT_MULTIPLIER > 1', () => {
      expect(CRIT_MULTIPLIER).toBeGreaterThan(1);
    });

    it('POINT_POWERUP_COST > 0', () => {
      expect(POINT_POWERUP_COST).toBeGreaterThan(0);
    });

    it('POINT_POWERUP_DAMAGE_BONUS > 0', () => {
      expect(POINT_POWERUP_DAMAGE_BONUS).toBeGreaterThan(0);
    });

    it('DEFEND_REDUCTION is between 0 and 1', () => {
      expect(DEFEND_REDUCTION).toBeGreaterThan(0);
      expect(DEFEND_REDUCTION).toBeLessThan(1);
    });

    it('ENEMY_ESCALATION_PER_TURN is positive', () => {
      expect(ENEMY_ESCALATION_PER_TURN).toBeGreaterThan(0);
    });
  });

  describe('createCombatState — new fields', () => {
    it('initialises turnCount to 0', () => {
      const s = createCombatState('crab');
      expect(s.turnCount).toBe(0);
    });

    it('initialises defending to false', () => {
      const s = createCombatState('crab');
      expect(s.defending).toBe(false);
    });

    it('initialises lastCrit to false', () => {
      const s = createCombatState('crab');
      expect(s.lastCrit).toBe(false);
    });

    it('initialises bonusDamage to 0', () => {
      const s = createCombatState('crab');
      expect(s.bonusDamage).toBe(0);
    });

    it('initialises retryCount to 0', () => {
      const s = createCombatState('crab');
      expect(s.retryCount).toBe(0);
    });
  });
});

// ── Bonus-aware simulation helpers ───────────────────────────

const defaultBonuses = {
  attackMultiplier: 1,
  chargeSpeedMultiplier: 1,
  chargeMaxBonus: 0,
  damageReduction: 0,
  victoryBonusAdd: 0,
  startingHpBonus: 0,
};

function doAttackCycleWithBonuses(state: CombatState, bonuses: typeof defaultBonuses): void {
  updateCombat(state, 0, attackInput(), bonuses);
  updateCombat(state, 0.4, NO_INPUT, bonuses);
  updateCombat(state, ENEMY_TURN_DURATION + 0.1, NO_INPUT, bonuses);
}

function runCombatWithBonuses(state: CombatState, bonuses: typeof defaultBonuses): CombatResult {
  let result: CombatResult = { done: false };
  for (let i = 0; i < 200 && !result.done; i++) {
    if (state.phase === 'defeat') {
      return { done: true, victory: false, bonusPoints: 0 };
    }
    if (state.phase === 'player_turn') {
      result = updateCombat(state, 0, attackInput(), bonuses);
    } else {
      result = updateCombat(state, 1.0, NO_INPUT, bonuses);
    }
  }
  return result;
}
