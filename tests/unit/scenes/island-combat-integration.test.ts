import { describe, expect, it, vi } from 'vitest';
import { IslandScene } from '../../../src/scenes/island-scene';
import type { EnemyEntity, EnemyKind } from '../../../src/entities/enemy';
import type { InputAction } from '../../../src/input/types';
import {
  BASE_ATTACK_DAMAGE,
  CHARGE_FILL_SECONDS,
  CHARGE_MAX_MULTIPLIER,
  CRIT_MULTIPLIER,
  CRIT_THRESHOLD,
  DEFEND_REDUCTION,
  DEFEAT_DISPLAY_DURATION,
  ENEMY_DAMAGE,
  ENEMY_ESCALATION_PER_TURN,
  ENEMY_TURN_DURATION,
  POINT_POWERUP_COST,
  POINT_POWERUP_DAMAGE_BONUS,
  VICTORY_BONUS,
  VICTORY_DISPLAY_DURATION,
  getCombatButtonRects,
  getDefeatButtonRects,
  getEnemyDisplayName,
} from '../../../src/systems/island-combat';

// ── Helpers ──────────────────────────────────────────────────

function stubDeps(islandId: string) {
  return {
    islandId,
    onThreatTriggered: vi.fn(),
    telemetry: { send: vi.fn(), emit: vi.fn() } as any,
    audio: { play: vi.fn(), setMusicLayers: vi.fn(), resume: vi.fn(), playSong: vi.fn(), selectIslandTheme: vi.fn(), playFanfare: vi.fn(), applyEncounterPreset: vi.fn(), stopSong: vi.fn() } as any,
    onPause: vi.fn(),
    onConceptPlaced: vi.fn(),
    onConceptDiscovered: vi.fn(),
    onMinigameLaunch: vi.fn(),
    onEnemyQuiz: vi.fn(),
  };
}

function getEnemies(scene: IslandScene): EnemyEntity[] {
  return (scene as any).enemies;
}

function getCombatState(scene: IslandScene) {
  return (scene as any).combatState;
}

function getScorePopups(scene: IslandScene): Array<{ x: number; y: number; text: string; timer: number }> {
  return (scene as any).scorePopups;
}

function getPlayerStunTimer(scene: IslandScene): number {
  return (scene as any).playerStunTimer;
}

function getPlayer(scene: IslandScene) {
  return (scene as any).player;
}

/** Move player to the enemy position to trigger collision */
function movePlayerToEnemy(scene: IslandScene, enemy: EnemyEntity): void {
  const player = getPlayer(scene);
  player.position.x = enemy.position.x;
  player.position.y = enemy.position.y;
}

/** Create a scene on an island that has enemies */
function createSceneWithEnemies(islandId = 'island_02') {
  const deps = stubDeps(islandId);
  const scene = new IslandScene(deps);
  scene.enter({} as any);
  return { scene, deps };
}

/** Simulate a tap at the given coordinates */
function tapAction(x: number, y: number): InputAction {
  return { type: 'primary', x, y } as InputAction;
}

/** Simulate releasing a touch */
function tapEndAction(): InputAction {
  return { type: 'primary_end', x: 0, y: 0 } as InputAction;
}

/** Get the center of a button rect */
function centerOf(rect: { x: number; y: number; w: number; h: number }) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

/** Skip the arrival overlay phase */
function skipArrival(scene: IslandScene): void {
  scene.update(1.0, []); // arrival duration is 0.7s
}

/** Trigger combat by forcing a collision with the first enemy */
function triggerCombat(scene: IslandScene): EnemyEntity {
  const enemies = getEnemies(scene);
  const enemy = enemies[0]!;
  enemy.state.stunCooldown = 0;
  movePlayerToEnemy(scene, enemy);
  skipArrival(scene);
  scene.update(0.016, []); // collision check step
  return enemy;
}

/** Tap the ATTACK button */
function tapAttack(): InputAction[] {
  const btns = getCombatButtonRects();
  const c = centerOf(btns.attack);
  return [tapAction(c.x, c.y)];
}

/** Tap the CHARGE button, hold, then release */
function chargeSequence(scene: IslandScene): void {
  const btns = getCombatButtonRects();
  const c = centerOf(btns.charge);
  // Start charge
  scene.update(0.016, [tapAction(c.x, c.y)]);
  // Hold for full charge
  scene.update(CHARGE_FILL_SECONDS, []);
  // Release
  scene.update(0.016, [tapEndAction()]);
}

/**
 * Do a full attack cycle: tap ATTACK → wait for animation → wait for enemy turn
 */
function doFullAttackCycle(scene: IslandScene): void {
  scene.update(0.016, tapAttack());            // attack tapped → player_attack
  scene.update(0.4, []);                        // animation finishes → enemy_turn
  scene.update(ENEMY_TURN_DURATION + 0.1, []);  // enemy attacks → player_turn
}

/** Kill the enemy via 3 basic attacks and finish victory display */
function killEnemyFull(scene: IslandScene): void {
  doFullAttackCycle(scene);
  doFullAttackCycle(scene);
  scene.update(0.016, tapAttack());
  scene.update(0.4, []);   // → victory
  scene.update(VICTORY_DISPLAY_DURATION + 0.1, []); // victory finishes → combat done
}

/** Tap the DEFEND button */
function tapDefend(): InputAction[] {
  const btns = getCombatButtonRects();
  const c = centerOf(btns.defend);
  return [tapAction(c.x, c.y)];
}

/** Force combat into the defeat phase and advance past the display timer */
function forceDefeatReady(scene: IslandScene): void {
  getCombatState(scene).playerHp = 0.01;
  scene.update(0.016, tapAttack());            // player_attack
  scene.update(0.4, []);                        // → enemy_turn
  scene.update(ENEMY_TURN_DURATION + 0.1, []);  // → defeat
  scene.update(DEFEAT_DISPLAY_DURATION + 0.5, []); // past display timer
}

/** Get the scene's internal score */
function getScore(scene: IslandScene): number {
  return (scene as any).score;
}

/** Set the scene's internal score */
function setScore(scene: IslandScene, value: number): void {
  (scene as any).score = value;
}

/**
 * Create a mock canvas context that tracks fillText calls for visual verification.
 * Returns { ctx, fillTextCalls } where fillTextCalls is an array of [text, x, y].
 */
function createTrackingCtx() {
  const fillTextCalls: Array<[string, number, number]> = [];
  const fillRectCalls: Array<[number, number, number, number]> = [];
  const base: Record<string, any> = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    canvas: { width: 240, height: 400 },
  };
  const noop = () => {};
  const ctx = new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'fillText') return (text: string, x: number, y: number) => {
        fillTextCalls.push([text, x, y]);
      };
      if (prop === 'fillRect') return (x: number, y: number, w: number, h: number) => {
        fillRectCalls.push([x, y, w, h]);
      };
      if (prop === 'measureText') return () => ({ width: 50 });
      if (prop === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
        return () => ({ addColorStop: noop });
      if (prop === 'createPattern') return () => ({});
      if (prop === 'canvas') return { width: 240, height: 400 };
      return noop;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, fillTextCalls, fillRectCalls };
}

// All island IDs that have enemies
const ISLANDS_WITH_ENEMIES = ['island_02', 'island_03', 'island_04', 'island_05', 'hidden_reef'];

// ══════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════

describe('Island combat integration', () => {

  // ── Combat trigger ─────────────────────────────────────────

  describe('combat triggers on enemy collision', () => {
    it('combat state is created when player touches an enemy', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(getCombatState(scene)).not.toBeNull();
    });

    it('combat state records the correct enemy kind', () => {
      const { scene } = createSceneWithEnemies('island_02');
      const enemy = triggerCombat(scene);
      expect(getCombatState(scene).enemyKind).toBe(enemy.state.kind);
    });

    it('enemy is frozen (high stunCooldown) during combat', () => {
      const { scene } = createSceneWithEnemies();
      const enemy = triggerCombat(scene);
      expect(enemy.state.stunCooldown).toBe(99);
    });

    it('BitChirp audio plays on combat start', () => {
      const { scene, deps } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(deps.audio.play).toHaveBeenCalledWith(expect.stringContaining('bit_chirp'));
    });

    it('does not start a second combat while one is active', () => {
      const { scene } = createSceneWithEnemies('island_03');
      triggerCombat(scene);
      const cs1 = getCombatState(scene);
      // Force another enemy collision
      const enemies = getEnemies(scene);
      if (enemies.length > 1) {
        enemies[1]!.state.stunCooldown = 0;
        movePlayerToEnemy(scene, enemies[1]!);
        scene.update(0.016, []);
        // Still same combat state
        expect(getCombatState(scene)).toBe(cs1);
      }
    });
  });

  // ── Every island's enemies trigger combat ─────────────────

  describe('all island enemies trigger combat', () => {
    it.each(ISLANDS_WITH_ENEMIES)('%s: every enemy triggers combat on collision', (islandId) => {
      const deps = stubDeps(islandId);
      const scene = new IslandScene(deps);
      scene.enter({} as any);
      skipArrival(scene);

      const enemies = getEnemies(scene);
      expect(enemies.length).toBeGreaterThan(0);

      for (const enemy of enemies) {
        // Reset for next test
        (scene as any).combatState = null;
        (scene as any).combatEnemyId = '';
        enemy.state.stunCooldown = 0;
        enemy.state.defeated = false;
        enemy.visible = true;
        // Burrowers start hidden — force them to be active for collision
        if (enemy.state.burrowPhase === 'hidden') {
          enemy.state.burrowPhase = 'chasing';
        }

        movePlayerToEnemy(scene, enemy);
        scene.update(0.016, []);
        expect(
          getCombatState(scene),
          `Enemy ${enemy.id} (${enemy.state.kind}) on ${islandId} should trigger combat`,
        ).not.toBeNull();
        expect(getCombatState(scene).enemyKind).toBe(enemy.state.kind);
      }
    });

    it.each(ISLANDS_WITH_ENEMIES)('%s: enemy kinds are valid EnemyKind values', (islandId) => {
      const scene = new IslandScene(stubDeps(islandId));
      const enemies = getEnemies(scene);
      const validKinds: EnemyKind[] = ['crab', 'fire_crab', 'jellyfish', 'shadow_jelly', 'burrower', 'sand_wyrm', 'urchin', 'ray'];
      for (const enemy of enemies) {
        expect(validKinds, `${enemy.state.kind} not in valid kinds`).toContain(enemy.state.kind);
      }
    });
  });

  // ── Combat overlay blocks normal input ────────────────────

  describe('combat overlay blocks normal game flow', () => {
    it('update returns early when combat is active (no player movement)', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const player = getPlayer(scene);
      const startX = player.position.x;
      const startY = player.position.y;
      // Move input should not move the player
      scene.update(0.5, [{ type: 'move', dx: 50, dy: 50 } as any]);
      // Player position should be roughly the same (no movement processing)
      expect(player.position.x).toBeCloseTo(startX, 0);
      expect(player.position.y).toBeCloseTo(startY, 0);
    });
  });

  // ── Attack button interaction ─────────────────────────────

  describe('attack button within combat overlay', () => {
    it('tapping ATTACK changes combat phase to player_attack', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(getCombatState(scene).phase).toBe('player_turn');

      scene.update(0.016, tapAttack());
      expect(getCombatState(scene).phase).toBe('player_attack');
    });

    it('attack deals BASE_ATTACK_DAMAGE to enemy HP', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack());
      expect(getCombatState(scene).enemyHp).toBeCloseTo(1 - BASE_ATTACK_DAMAGE, 2);
    });
  });

  // ── Charge button interaction ─────────────────────────────

  describe('charge button within combat overlay', () => {
    it('tapping CHARGE button enters charging phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      const c = centerOf(btns.charge);
      scene.update(0.016, [tapAction(c.x, c.y)]);
      expect(getCombatState(scene).phase).toBe('charging');
    });

    it('releasing after holding applies charged damage (crit at full charge)', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      chargeSequence(scene);
      // Should now be in player_attack with charged damage dealt
      expect(getCombatState(scene).phase).toBe('player_attack');
      // Full charge + crit: BASE × MAX_MULT × CRIT_MULT = 1.02 → enemy dead
      const expectedDmg = BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER;
      expect(getCombatState(scene).enemyHp).toBeCloseTo(Math.max(0, 1 - expectedDmg), 2);
    });
  });

  // ── Victory outcome ───────────────────────────────────────

  describe('victory outcome', () => {
    it('enemy is marked defeated and invisible after victory', () => {
      const { scene } = createSceneWithEnemies();
      const enemy = triggerCombat(scene);
      killEnemyFull(scene);
      expect(enemy.state.defeated).toBe(true);
      expect(enemy.visible).toBe(false);
    });

    it('combat state is cleared after victory', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      expect(getCombatState(scene)).toBeNull();
    });

    it('RecallCorrect audio plays on victory', () => {
      const { scene, deps } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      expect(deps.audio.play).toHaveBeenCalledWith(expect.stringContaining('recall_correct'));
    });

    it('floating score popup is created on victory', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      const popups = getScorePopups(scene);
      expect(popups.length).toBeGreaterThanOrEqual(1);
      // Victory creates both a bonus-points popup and an SP popup
      const bonusPopup = popups.find((p) => p.text === `+${VICTORY_BONUS}`);
      expect(bonusPopup).toBeDefined();
      expect(bonusPopup!.timer).toBeGreaterThan(0);
    });
  });

  // ── Defeat outcome ────────────────────────────────────────

  describe('defeat outcome', () => {
    it('combat enters defeat phase when player HP drops to 0', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      // Force player HP low so next enemy turn kills them
      getCombatState(scene).playerHp = 0.01;
      // advance to enemy turn
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      // combat should stay active in defeat phase (retry/powerup UI)
      expect(getCombatState(scene)).not.toBeNull();
      expect(getCombatState(scene).phase).toBe('defeat');
    });

    it('defeat shows retry/powerup after display timer', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      getCombatState(scene).playerHp = 0.01;
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      // Advance past display timer
      scene.update(2.0, []);
      expect(getCombatState(scene)).not.toBeNull();
      expect(getCombatState(scene).phase).toBe('defeat');
      expect(getCombatState(scene).phaseTimer).toBeLessThanOrEqual(0);
    });
  });

  // ── Score popups ──────────────────────────────────────────

  describe('floating score popups', () => {
    it('popup floats upward over time', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);

      const popups = getScorePopups(scene);
      expect(popups.length).toBeGreaterThan(0);
      const popup = popups[popups.length - 1]!;
      const startY = popup.y;

      // Advance time — popup should float up
      scene.update(0.5, []);
      expect(popup.y).toBeLessThan(startY);
    });

    it('popup is removed after timer expires', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      expect(getScorePopups(scene).length).toBeGreaterThan(0);

      // Advance past the popup's timer
      scene.update(2.0, []);
      expect(getScorePopups(scene).length).toBe(0);
    });

    it('popup text contains the bonus value', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      const popup = getScorePopups(scene).find((p) => p.text.includes('100'));
      expect(popup).toBeDefined();
    });
  });

  // ── Combat reset on re-enter ──────────────────────────────

  describe('scene re-entry resets combat state', () => {
    it('combatState is null after re-enter', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(getCombatState(scene)).not.toBeNull();
      scene.enter({} as any);
      expect(getCombatState(scene)).toBeNull();
    });

    it('scorePopups are cleared on re-enter', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      expect(getScorePopups(scene).length).toBeGreaterThan(0);
      scene.enter({} as any);
      expect(getScorePopups(scene).length).toBe(0);
    });

    it('combatChargeHeld is reset on re-enter', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      (scene as any).combatChargeHeld = true;
      scene.enter({} as any);
      expect((scene as any).combatChargeHeld).toBe(false);
    });
  });

  // ── Shield blocks combat ──────────────────────────────────

  describe('shield absorbs enemy hit instead of combat', () => {
    it('shielded player does not enter combat (shield consumed)', () => {
      const { scene } = createSceneWithEnemies();
      skipArrival(scene);
      (scene as any).playerShielded = true;
      (scene as any).shieldTimer = 5;

      const enemy = getEnemies(scene)[0]!;
      enemy.state.stunCooldown = 0;
      movePlayerToEnemy(scene, enemy);
      scene.update(0.016, []);

      // Shield was consumed, no combat started
      expect((scene as any).playerShielded).toBe(false);
      expect(getCombatState(scene)).toBeNull();
    });
  });

  // ── Defeated enemy does not re-trigger ────────────────────

  describe('defeated enemy does not re-trigger combat', () => {
    it('walking over a defeated enemy does nothing', () => {
      const { scene } = createSceneWithEnemies();
      const enemy = triggerCombat(scene);
      killEnemyFull(scene);
      expect(enemy.state.defeated).toBe(true);

      // Walk over the dead enemy
      movePlayerToEnemy(scene, enemy);
      scene.update(0.016, []);
      expect(getCombatState(scene)).toBeNull();
    });
  });

  // ── Rendering does not throw ──────────────────────────────

  describe('rendering during combat does not throw', () => {
    it('render() succeeds with combat overlay active', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      const canvas = { getContext: () => createMockCtx() } as any;
      const ctx = canvas.getContext('2d');
      expect(() => scene.render(ctx)).not.toThrow();
    });

    it('render() succeeds during charging phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      const c = centerOf(btns.charge);
      scene.update(0.016, [tapAction(c.x, c.y)]);

      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });

    it('render() succeeds during victory phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      doFullAttackCycle(scene);
      doFullAttackCycle(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      // Now in victory phase
      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });

    it('render() succeeds with floating score popups', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);

      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });

    it('render() succeeds during enemy_turn phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      // Now in enemy_turn
      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });
  });

  // ── Full combat lifecycle per island ──────────────────────

  describe('full combat lifecycle per island', () => {
    it.each(ISLANDS_WITH_ENEMIES)('%s: can start and finish combat with first enemy', (islandId) => {
      const { scene } = createSceneWithEnemies(islandId);
      const enemy = triggerCombat(scene);
      expect(getCombatState(scene)).not.toBeNull();

      killEnemyFull(scene);
      expect(getCombatState(scene)).toBeNull();
      expect(enemy.state.defeated).toBe(true);
      expect(getScorePopups(scene).length).toBeGreaterThan(0);
    });
  });

  // ── Defend button interaction ─────────────────────────────

  describe('defend button within combat overlay', () => {
    it('tapping DEF transitions to enemy_turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(getCombatState(scene).phase).toBe('player_turn');

      scene.update(0.016, tapDefend());
      expect(getCombatState(scene).phase).toBe('enemy_turn');
    });

    it('tapping DEF sets defending flag', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapDefend());
      expect(getCombatState(scene).defending).toBe(true);
    });

    it('defending halves incoming enemy damage', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const hpBefore = getCombatState(scene).playerHp;

      scene.update(0.016, tapDefend());
      scene.update(ENEMY_TURN_DURATION + 0.1, []);

      const expectedDmg = ENEMY_DAMAGE * (1 - DEFEND_REDUCTION);
      expect(getCombatState(scene).playerHp).toBeCloseTo(hpBefore - expectedDmg, 2);
    });

    it('defending flag resets after enemy turn resolves', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapDefend());
      expect(getCombatState(scene).defending).toBe(true);
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      expect(getCombatState(scene).defending).toBe(false);
    });

    it('DEF button does nothing during charging phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      const chargeCenter = centerOf(btns.charge);
      scene.update(0.016, [tapAction(chargeCenter.x, chargeCenter.y)]);
      expect(getCombatState(scene).phase).toBe('charging');

      // Tap defend — should stay in charging
      scene.update(0.016, tapDefend());
      expect(getCombatState(scene).phase).toBe('charging');
    });
  });

  // ── Defeat screen interaction ─────────────────────────────

  describe('defeat screen interaction', () => {
    it('tapping RETRY restarts combat to player_turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      forceDefeatReady(scene);
      expect(getCombatState(scene).phase).toBe('defeat');

      const dbtns = getDefeatButtonRects();
      const retryCenter = centerOf(dbtns.retry);
      scene.update(0.016, [tapAction(retryCenter.x, retryCenter.y)]);
      expect(getCombatState(scene).phase).toBe('player_turn');
    });

    it('RETRY restores player HP to max', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const maxHp = getCombatState(scene).maxPlayerHp;
      forceDefeatReady(scene);

      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.retry).x, centerOf(dbtns.retry).y)]);
      expect(getCombatState(scene).playerHp).toBeCloseTo(maxHp, 5);
    });

    it('RETRY resets enemy HP to 1', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      forceDefeatReady(scene);

      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.retry).x, centerOf(dbtns.retry).y)]);
      expect(getCombatState(scene).enemyHp).toBe(1);
    });

    it('RETRY increments retryCount', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(getCombatState(scene).retryCount).toBe(0);
      forceDefeatReady(scene);

      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.retry).x, centerOf(dbtns.retry).y)]);
      expect(getCombatState(scene).retryCount).toBe(1);
    });

    it('RETRY plays RetryBootUp audio', () => {
      const { scene, deps } = createSceneWithEnemies();
      triggerCombat(scene);
      forceDefeatReady(scene);

      deps.audio.play.mockClear();
      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.retry).x, centerOf(dbtns.retry).y)]);
      expect(deps.audio.play).toHaveBeenCalledWith(expect.stringContaining('retry_boot_up'));
    });

    it('POWER UP deducts score and adds bonusDamage', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 200);
      forceDefeatReady(scene);

      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.powerup).x, centerOf(dbtns.powerup).y)]);
      expect(getScore(scene)).toBe(200 - POINT_POWERUP_COST);
      expect(getCombatState(scene).bonusDamage).toBeCloseTo(POINT_POWERUP_DAMAGE_BONUS, 5);
    });

    it('POWER UP creates a score popup', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 100);
      forceDefeatReady(scene);

      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.powerup).x, centerOf(dbtns.powerup).y)]);
      const popups = getScorePopups(scene);
      const powerUpPopup = popups.find((p) => p.text.includes('POWER UP'));
      expect(powerUpPopup).toBeDefined();
    });

    it('POWER UP with insufficient score does nothing', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 10); // less than POINT_POWERUP_COST
      forceDefeatReady(scene);

      const scoreBefore = getScore(scene);
      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.powerup).x, centerOf(dbtns.powerup).y)]);
      expect(getScore(scene)).toBe(scoreBefore);
      expect(getCombatState(scene).bonusDamage).toBe(0);
    });

    it('multiple POWER UPs stack bonusDamage', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 500);
      forceDefeatReady(scene);

      const dbtns = getDefeatButtonRects();
      const pc = centerOf(dbtns.powerup);
      scene.update(0.016, [tapAction(pc.x, pc.y)]);
      scene.update(0.016, [tapAction(pc.x, pc.y)]);
      scene.update(0.016, [tapAction(pc.x, pc.y)]);
      expect(getCombatState(scene).bonusDamage).toBeCloseTo(POINT_POWERUP_DAMAGE_BONUS * 3, 5);
      expect(getScore(scene)).toBe(500 - POINT_POWERUP_COST * 3);
    });

    it('bonusDamage persists across retries', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 200);
      forceDefeatReady(scene);

      // Buy a power-up then retry
      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.powerup).x, centerOf(dbtns.powerup).y)]);
      expect(getCombatState(scene).bonusDamage).toBeCloseTo(POINT_POWERUP_DAMAGE_BONUS, 5);

      scene.update(0.016, [tapAction(centerOf(dbtns.retry).x, centerOf(dbtns.retry).y)]);
      expect(getCombatState(scene).bonusDamage).toBeCloseTo(POINT_POWERUP_DAMAGE_BONUS, 5);
    });
  });

  // ── Keyboard shortcuts ────────────────────────────────────

  describe('keyboard shortcuts in combat', () => {
    it('left arrow triggers attack', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, [{ type: 'move', dx: -1, dy: 0 } as InputAction]);
      expect(getCombatState(scene).phase).toBe('player_attack');
    });

    it('right arrow starts charging', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, [{ type: 'move', dx: 1, dy: 0 } as InputAction]);
      expect(getCombatState(scene).phase).toBe('charging');
    });

    it('down arrow triggers defend', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, [{ type: 'move', dx: 0, dy: 1 } as InputAction]);
      expect(getCombatState(scene).phase).toBe('enemy_turn');
      expect(getCombatState(scene).defending).toBe(true);
    });
  });

  // ── Animation timing ──────────────────────────────────────

  describe('combat animation timing', () => {
    it('player_attack phase lasts ~0.3s before transitioning', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack());
      expect(getCombatState(scene).phase).toBe('player_attack');

      // After 0.29s still in player_attack
      scene.update(0.2, []);
      expect(getCombatState(scene).phase).toBe('player_attack');

      // After another 0.15s should have transitioned to enemy_turn
      scene.update(0.15, []);
      expect(getCombatState(scene).phase).toBe('enemy_turn');
    });

    it('enemy_turn phase lasts ENEMY_TURN_DURATION before resolving', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.35, []); // → enemy_turn

      // Halfway through — still enemy_turn
      scene.update(ENEMY_TURN_DURATION * 0.4, []);
      expect(getCombatState(scene).phase).toBe('enemy_turn');

      // Past duration — should be back to player_turn
      scene.update(ENEMY_TURN_DURATION * 0.7, []);
      expect(getCombatState(scene).phase).toBe('player_turn');
    });

    it('victory display lasts VICTORY_DISPLAY_DURATION', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      // Kill via repeated attacks
      doFullAttackCycle(scene);
      doFullAttackCycle(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.4, []); // → victory

      expect(getCombatState(scene)?.phase).toBe('victory');

      // Halfway through — still in victory
      scene.update(VICTORY_DISPLAY_DURATION * 0.5, []);
      expect(getCombatState(scene)).not.toBeNull();

      // Past duration — combat done
      scene.update(VICTORY_DISPLAY_DURATION * 0.6, []);
      expect(getCombatState(scene)).toBeNull();
    });

    it('defeat display timer counts down to 0', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      getCombatState(scene).playerHp = 0.01;
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      expect(getCombatState(scene).phase).toBe('defeat');

      const timerBefore = getCombatState(scene).phaseTimer;
      expect(timerBefore).toBeGreaterThan(0);

      scene.update(DEFEAT_DISPLAY_DURATION + 0.5, []);
      expect(getCombatState(scene).phaseTimer).toBeLessThanOrEqual(0);
    });

    it('charge meter fills over CHARGE_FILL_SECONDS', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      const c = centerOf(btns.charge);
      scene.update(0.016, [tapAction(c.x, c.y)]);
      expect(getCombatState(scene).phase).toBe('charging');

      // Charge for half the fill time
      scene.update(CHARGE_FILL_SECONDS / 2, []);
      expect(getCombatState(scene).charge).toBeCloseTo(0.5, 1);

      // Charge to full
      scene.update(CHARGE_FILL_SECONDS / 2 + 0.1, []);
      expect(getCombatState(scene).charge).toBeCloseTo(1.0, 1);
    });

    it('full attack→enemy→player cycle completes in correct sequence', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      // Step 1: player_turn
      expect(getCombatState(scene).phase).toBe('player_turn');

      // Step 2: attack → player_attack
      scene.update(0.016, tapAttack());
      expect(getCombatState(scene).phase).toBe('player_attack');

      // Step 3: animation ends → enemy_turn
      scene.update(0.35, []);
      expect(getCombatState(scene).phase).toBe('enemy_turn');

      // Step 4: enemy resolves → player_turn
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      expect(getCombatState(scene).phase).toBe('player_turn');
    });
  });

  // ── Enemy escalation ──────────────────────────────────────

  describe('enemy escalation in combat', () => {
    it('turnCount increments after each enemy turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(getCombatState(scene).turnCount).toBe(0);

      doFullAttackCycle(scene);
      expect(getCombatState(scene).turnCount).toBe(1);

      doFullAttackCycle(scene);
      expect(getCombatState(scene).turnCount).toBe(2);
    });

    it('enemy damage increases with turnCount', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      // Turn 0: standard damage
      const hp0 = getCombatState(scene).playerHp;
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      const dmg0 = hp0 - getCombatState(scene).playerHp;

      // Turn 1: escalated damage
      const hp1 = getCombatState(scene).playerHp;
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      const dmg1 = hp1 - getCombatState(scene).playerHp;

      // Second turn should deal more damage
      expect(dmg1).toBeGreaterThan(dmg0);
      expect(dmg1).toBeCloseTo(dmg0 * (1 + ENEMY_ESCALATION_PER_TURN), 2);
    });

    it('defend + escalation interact correctly', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const hpBefore = getCombatState(scene).playerHp;

      // Defend on turn 0
      scene.update(0.016, tapDefend());
      scene.update(ENEMY_TURN_DURATION + 0.1, []);

      // Damage should be ENEMY_DAMAGE * escalation(turn=0) * (1 - DEFEND_REDUCTION)
      const expectedDmg = ENEMY_DAMAGE * 1 * (1 - DEFEND_REDUCTION);
      expect(getCombatState(scene).playerHp).toBeCloseTo(hpBefore - expectedDmg, 2);
    });
  });

  // ── Critical hit integration ──────────────────────────────

  describe('critical hit integration', () => {
    it('full charge triggers lastCrit flag', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      chargeSequence(scene);
      expect(getCombatState(scene)?.lastCrit).toBe(true);
    });

    it('partial charge below threshold does not trigger crit', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      const c = centerOf(btns.charge);
      scene.update(0.016, [tapAction(c.x, c.y)]); // start charge
      scene.update(CHARGE_FILL_SECONDS * 0.5, []); // charge to ~50%
      scene.update(0.016, [tapEndAction()]); // release early

      expect(getCombatState(scene).lastCrit).toBe(false);
    });

    it('crit deals extra damage compared to normal full charge', () => {
      // Normal attack damage
      const normalDmg = BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER;
      // Crit damage
      const critDmg = BASE_ATTACK_DAMAGE * CHARGE_MAX_MULTIPLIER * CRIT_MULTIPLIER;
      expect(critDmg).toBeGreaterThan(normalDmg);

      // Verify in scene
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      chargeSequence(scene);
      // Full charge = crit: expected damage = BASE * MAX_MULT * CRIT_MULT
      expect(getCombatState(scene).enemyHp).toBeCloseTo(
        Math.max(0, 1 - critDmg), 2,
      );
    });
  });

  // ── Layout / positioning ──────────────────────────────────

  describe('combat UI layout and positioning', () => {
    it('all 3 combat buttons fit within 240×400 canvas', () => {
      const btns = getCombatButtonRects();
      for (const [name, rect] of Object.entries(btns)) {
        expect(rect.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
        expect(rect.y, `${name} top edge`).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w, `${name} right edge`).toBeLessThanOrEqual(240);
        expect(rect.y + rect.h, `${name} bottom edge`).toBeLessThanOrEqual(400);
      }
    });

    it('defeat buttons fit within 240×400 canvas', () => {
      const dbtns = getDefeatButtonRects();
      for (const [name, rect] of Object.entries(dbtns)) {
        expect(rect.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
        expect(rect.y, `${name} top edge`).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w, `${name} right edge`).toBeLessThanOrEqual(240);
        expect(rect.y + rect.h, `${name} bottom edge`).toBeLessThanOrEqual(400);
      }
    });

    it('combat buttons do not overlap each other', () => {
      const btns = getCombatButtonRects();
      const rects = [btns.attack, btns.charge, btns.defend];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]!;
          const b = rects[j]!;
          const overlap = !(a.x + a.w <= b.x || b.x + b.w <= a.x ||
                           a.y + a.h <= b.y || b.y + b.h <= a.y);
          expect(overlap, `buttons ${i} and ${j} should not overlap`).toBe(false);
        }
      }
    });

    it('defeat buttons do not overlap each other', () => {
      const dbtns = getDefeatButtonRects();
      const a = dbtns.retry;
      const b = dbtns.powerup;
      const overlap = !(a.x + a.w <= b.x || b.x + b.w <= a.x ||
                       a.y + a.h <= b.y || b.y + b.h <= a.y);
      expect(overlap).toBe(false);
    });

    it('combat buttons are in the lower third of the screen (portrait-first)', () => {
      const btns = getCombatButtonRects();
      const lowerThirdStart = Math.floor(400 * 2 / 3); // ~266
      for (const [name, rect] of Object.entries(btns)) {
        expect(rect.y, `${name} should be in lower third`).toBeGreaterThanOrEqual(lowerThirdStart);
      }
    });

    it('defeat buttons are positioned in the action zone', () => {
      const dbtns = getDefeatButtonRects();
      // Should be above the combat buttons but still in the lower half
      expect(dbtns.retry.y).toBeGreaterThanOrEqual(200);
      expect(dbtns.retry.y).toBeLessThan(400);
      expect(dbtns.powerup.y).toBeGreaterThanOrEqual(200);
      expect(dbtns.powerup.y).toBeLessThan(400);
    });
  });

  // ── Rendering visual correctness ──────────────────────────

  describe('rendering visual correctness', () => {
    it('renders "COMBAT!" title text', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const titles = fillTextCalls.map(c => c[0]);
      expect(titles).toContain('COMBAT!');
    });

    it('renders "ATK", "CHG", "DEF" button labels', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('ATK');
      expect(texts).toContain('CHG');
      expect(texts).toContain('DEF');
    });

    it('renders "CRITICAL!" during crit player_attack', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      chargeSequence(scene);
      // Now in player_attack with lastCrit = true

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('CRITICAL!');
    });

    it('renders "DEFENDING" indicator during defend + enemy turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapDefend());
      // Now in enemy_turn with defending = true

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts.some(t => t.includes('DEFENDING'))).toBe(true);
    });

    it('renders "VICTORY!" during victory phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      doFullAttackCycle(scene);
      doFullAttackCycle(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      // Now in victory phase

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('VICTORY!');
    });

    it('renders "DEFEATED!" during defeat phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      getCombatState(scene).playerHp = 0.01;
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      scene.update(ENEMY_TURN_DURATION + 0.1, []);
      // Now in defeat phase

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('DEFEATED!');
    });

    it('renders "CHARGING..." during charge phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      scene.update(0.016, [tapAction(centerOf(btns.charge).x, centerOf(btns.charge).y)]);
      scene.update(0.3, []); // charge a bit

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('CHARGING...');
    });

    it('renders "Enemy attacks!" during enemy_turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.35, []); // → enemy_turn

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts.some(t => t.includes('Enemy attacks!'))).toBe(true);
    });

    it('renders turn counter with correct turn number', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('Turn 1');
    });

    it('renders turn counter after multiple turns', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      doFullAttackCycle(scene);
      doFullAttackCycle(scene);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('Turn 3');
    });

    it('renders bonus damage indicator after power-up', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 200);
      forceDefeatReady(scene);

      // Buy power-up
      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.powerup).x, centerOf(dbtns.powerup).y)]);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts.some(t => t.includes('+20%'))).toBe(true);
    });

    it('renders defeat RETRY and POWER UP buttons after timer', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 200);
      forceDefeatReady(scene);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('RETRY');
      expect(texts.some(t => t.includes(`${POINT_POWERUP_COST}pts`))).toBe(true);
    });

    it('renders "YOU" and "ENEMY" HP bar labels', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts).toContain('YOU');
      expect(texts).toContain('ENEMY');
    });

    it('renders attempt counter on retry', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      forceDefeatReady(scene);

      // Retry
      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.retry).x, centerOf(dbtns.retry).y)]);
      // Force defeat again
      forceDefeatReady(scene);

      const { ctx, fillTextCalls } = createTrackingCtx();
      scene.render(ctx);
      const texts = fillTextCalls.map(c => c[0]);
      expect(texts.some(t => t.includes('Attempt'))).toBe(true);
    });

    it('render() succeeds during defeat phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      forceDefeatReady(scene);

      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });

    it('render() succeeds while defending during enemy turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapDefend());

      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });

    it('render() succeeds with crit flash active', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      chargeSequence(scene);

      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });

    it('render() succeeds with bonus damage indicator active', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      getCombatState(scene).bonusDamage = 0.4;

      const ctx = createMockCtx();
      expect(() => scene.render(ctx)).not.toThrow();
    });
  });

  // ── Score tracking through combat ─────────────────────────

  describe('score tracking through combat', () => {
    it('score increases by VICTORY_BONUS on win', () => {
      const { scene } = createSceneWithEnemies();
      const scoreBefore = getScore(scene);
      triggerCombat(scene);
      killEnemyFull(scene);
      expect(getScore(scene)).toBe(scoreBefore + VICTORY_BONUS);
    });

    it('score does not change mid-combat before victory', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const scoreAtStart = getScore(scene);
      doFullAttackCycle(scene);
      expect(getScore(scene)).toBe(scoreAtStart);
    });

    it('power-up purchase reduces score during defeat', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      setScore(scene, 100);
      forceDefeatReady(scene);

      const dbtns = getDefeatButtonRects();
      scene.update(0.016, [tapAction(centerOf(dbtns.powerup).x, centerOf(dbtns.powerup).y)]);
      expect(getScore(scene)).toBe(100 - POINT_POWERUP_COST);
    });
  });

  // ── Skill tree blocked during combat ──────────────────────

  describe('skill tree blocked during combat', () => {
    it('cannot open skill tree while combat is active', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      // Tap where the skill tree button is (26, 18)
      scene.update(0.016, [tapAction(26, 18)]);
      expect((scene as any).skillTreeOpen).toBe(false);
    });

    it('combat takes priority over skill tree overlay', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);

      // Force skillTreeOpen — combat should still process
      (scene as any).skillTreeOpen = true;
      scene.update(0.016, tapAttack());
      // Combat state should have been updated, not skill tree
      expect(getCombatState(scene).phase).toBe('player_attack');
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  Combat Polish — Visual Feedback & Enemy Identity
  // ══════════════════════════════════════════════════════════════

  describe('enemy display names', () => {
    it('returns display name for known enemy kinds', () => {
      expect(getEnemyDisplayName('crab')).toBe('Crab');
      expect(getEnemyDisplayName('fire_crab')).toBe('Fire Crab');
      expect(getEnemyDisplayName('jellyfish')).toBe('Jellyfish');
      expect(getEnemyDisplayName('shadow_jelly')).toBe('Shadow Jelly');
      expect(getEnemyDisplayName('burrower')).toBe('Burrower');
      expect(getEnemyDisplayName('sand_wyrm')).toBe('Sand Wyrm');
      expect(getEnemyDisplayName('urchin')).toBe('Urchin');
      expect(getEnemyDisplayName('ray')).toBe('Manta Ray');
    });

    it('falls back to raw kind string for unknown kinds', () => {
      expect(getEnemyDisplayName('unknown_enemy')).toBe('unknown_enemy');
    });
  });

  describe('lastDamageToPlayer tracking', () => {
    it('is zero initially', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      expect(getCombatState(scene).lastDamageToPlayer).toBe(0);
    });

    it('is set after enemy turn deals damage', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack()); // player_attack
      scene.update(0.4, []);             // → enemy_turn
      scene.update(ENEMY_TURN_DURATION + 0.1, []); // enemy attacks → back to player_turn
      expect(getCombatState(scene).lastDamageToPlayer).toBeGreaterThan(0);
    });

    it('resets to zero when player taps attack next turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      doFullAttackCycle(scene); // enemy damages player → back to player_turn
      // Value persists until player acts again
      expect(getCombatState(scene).lastDamageToPlayer).toBeGreaterThan(0);
      // Start next attack → resets
      scene.update(0.016, tapAttack());
      expect(getCombatState(scene).lastDamageToPlayer).toBe(0);
    });
  });

  describe('floating damage texts', () => {
    function getDamageTexts(scene: IslandScene) {
      return (scene as any).combatDamageTexts as Array<{
        x: number; y: number; text: string; timer: number; color: string; dy: number;
      }>;
    }

    it('creates damage text when player attacks enemy', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack()); // player_attack
      const texts = getDamageTexts(scene);
      // Should have at least one floating text for the enemy damage
      expect(texts.length).toBeGreaterThanOrEqual(1);
      // Should be yellow/orange for enemy damage
      const enemyText = texts.find(t => t.dy < 0 && t.y < 200);
      expect(enemyText).toBeDefined();
    });

    it('creates red damage text when enemy attacks player', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack()); // player_attack
      scene.update(0.4, []);             // → enemy_turn
      scene.update(ENEMY_TURN_DURATION + 0.1, []); // enemy attacks
      const texts = getDamageTexts(scene);
      const playerText = texts.find(t => t.color === '#ef4444');
      expect(playerText).toBeDefined();
    });

    it('damage texts expire after their timer runs out', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack()); // creates damage texts
      expect(getDamageTexts(scene).length).toBeGreaterThan(0);
      // Wait long enough for texts to expire (timer is 0.8s)
      scene.update(1.0, []);
      scene.update(1.0, []);
      // After enough time, old texts should be filtered out
      const remaining = getDamageTexts(scene).filter(t => t.timer > 0);
      expect(remaining.length).toBe(getDamageTexts(scene).length);
    });

    it('damage texts are cleared on combat end', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack()); // creates texts
      killEnemyFull(scene); // kill resets everything
      // After combat ends, should be empty
      expect(getDamageTexts(scene)).toEqual([]);
    });
  });

  describe('combat screen shake', () => {
    function getShakeTimer(scene: IslandScene): number {
      return (scene as any).combatShakeTimer;
    }

    it('shake timer is triggered when player takes damage', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack()); // player_attack
      scene.update(0.4, []);             // → enemy_turn
      // Just before enemy turn resolves, shake should be 0
      expect(getShakeTimer(scene)).toBe(0);
      scene.update(ENEMY_TURN_DURATION + 0.1, []); // enemy attacks
      // Shake timer should be set
      expect(getShakeTimer(scene)).toBeGreaterThan(0);
    });

    it('shake timer decays over time', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.4, []);
      scene.update(ENEMY_TURN_DURATION + 0.1, []); // triggers shake
      const initial = getShakeTimer(scene);
      scene.update(0.05, []); // small tick
      expect(getShakeTimer(scene)).toBeLessThan(initial);
    });

    it('shake timer is zero after combat ends', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      expect(getShakeTimer(scene)).toBe(0);
    });
  });

  describe('post-combat immunity', () => {
    function getImmunityTimer(scene: IslandScene): number {
      return (scene as any).combatImmunityTimer;
    }

    it('grants immunity after combat victory', () => {
      const { scene } = createSceneWithEnemies();
      const enemy = triggerCombat(scene);
      killEnemyFull(scene);
      expect(getImmunityTimer(scene)).toBeGreaterThan(0);
    });

    it('immunity timer decays over time', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      killEnemyFull(scene);
      const initial = getImmunityTimer(scene);
      scene.update(0.1, []);
      expect(getImmunityTimer(scene)).toBeLessThan(initial);
    });

    it('no combat triggers while immunity is active', () => {
      const { scene } = createSceneWithEnemies();
      const enemies = getEnemies(scene);
      // Need a second un-defeated enemy
      const enemy1 = enemies[0]!;
      const enemy2 = enemies.length > 1 ? enemies[1]! : null;
      if (!enemy2) return; // skip if only one enemy

      triggerCombat(scene);
      killEnemyFull(scene);
      expect(getImmunityTimer(scene)).toBeGreaterThan(0);

      // Move to second enemy immediately — should NOT trigger combat
      enemy2.state.stunCooldown = 0;
      const player = getPlayer(scene);
      player.position.x = enemy2.position.x;
      player.position.y = enemy2.position.y;
      scene.update(0.016, []);
      expect(getCombatState(scene)).toBeNull();
    });
  });

  describe('victory sparkle burst', () => {
    it('emits 4 sparkle particles on victory', () => {
      const { scene } = createSceneWithEnemies();
      const particles = (scene as any).particles;
      const spy = vi.spyOn(particles, 'emitSparkle');
      triggerCombat(scene);
      killEnemyFull(scene);
      expect(spy).toHaveBeenCalledTimes(4);
      spy.mockRestore();
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  Combat Polish — Rendering Verification
  // ══════════════════════════════════════════════════════════════

  describe('combat overlay rendering (polish)', () => {
    function renderCombat(scene: IslandScene) {
      const { ctx, fillTextCalls, fillRectCalls } = createTrackingCtx();
      (scene as any).renderCombatOverlay(ctx);
      return { fillTextCalls, fillRectCalls };
    }

    it('renders enemy display name during combat', () => {
      const { scene } = createSceneWithEnemies();
      const enemy = triggerCombat(scene);
      const { fillTextCalls } = renderCombat(scene);
      const enemyName = getEnemyDisplayName(getCombatState(scene).enemyKind);
      const hasName = fillTextCalls.some(([text]) => text === enemyName);
      expect(hasName).toBe(true);
    });

    it('renders score display during combat', () => {
      const { scene } = createSceneWithEnemies();
      setScore(scene, 250);
      triggerCombat(scene);
      const { fillTextCalls } = renderCombat(scene);
      const hasScore = fillTextCalls.some(([text]) => text.includes('★') && text.includes('250'));
      expect(hasScore).toBe(true);
    });

    it('renders COMBAT! title', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const { fillTextCalls } = renderCombat(scene);
      const hasTitle = fillTextCalls.some(([text]) => text === 'COMBAT!');
      expect(hasTitle).toBe(true);
    });

    it('renders turn counter', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const { fillTextCalls } = renderCombat(scene);
      const hasTurn = fillTextCalls.some(([text]) => text.startsWith('Turn'));
      expect(hasTurn).toBe(true);
    });

    it('renders CHARGING text during charge phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      const c = centerOf(btns.charge);
      scene.update(0.016, [tapAction(c.x, c.y)]); // start charging
      const { fillTextCalls } = renderCombat(scene);
      const hasCharging = fillTextCalls.some(([text]) => text === 'CHARGING...');
      expect(hasCharging).toBe(true);
    });

    it('renders CRIT! label when charge exceeds threshold', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const btns = getCombatButtonRects();
      const c = centerOf(btns.charge);
      scene.update(0.016, [tapAction(c.x, c.y)]); // start charging
      scene.update(CHARGE_FILL_SECONDS * 0.95, []); // charge to ~95% (past crit)
      const { fillTextCalls } = renderCombat(scene);
      const hasCrit = fillTextCalls.some(([text]) => text === 'CRIT!');
      expect(hasCrit).toBe(true);
    });

    it('renders CRITICAL! text on crit hit', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      // Charge past crit threshold then release
      const btns = getCombatButtonRects();
      const cc = centerOf(btns.charge);
      scene.update(0.016, [tapAction(cc.x, cc.y)]); // start charging
      scene.update(CHARGE_FILL_SECONDS, []);          // full charge
      scene.update(0.016, [tapEndAction()]);           // release → player_attack
      const { fillTextCalls } = renderCombat(scene);
      const hasCritical = fillTextCalls.some(([text]) => text === 'CRITICAL!');
      expect(hasCritical).toBe(true);
    });

    it('renders Enemy attacks! text during enemy turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapAttack()); // → player_attack
      scene.update(0.4, []);             // → enemy_turn
      const { fillTextCalls } = renderCombat(scene);
      const hasAttack = fillTextCalls.some(([text]) => text === 'Enemy attacks!');
      expect(hasAttack).toBe(true);
    });

    it('renders 🛡 DEFENDING text when defending during enemy turn', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      scene.update(0.016, tapDefend()); // defend → enemy_turn
      const { fillTextCalls } = renderCombat(scene);
      const hasDefend = fillTextCalls.some(([text]) => text === '🛡 DEFENDING');
      expect(hasDefend).toBe(true);
    });

    it('renders VICTORY! on victory phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      doFullAttackCycle(scene);
      doFullAttackCycle(scene);
      scene.update(0.016, tapAttack());
      scene.update(0.4, []); // → victory
      const { fillTextCalls } = renderCombat(scene);
      const hasVictory = fillTextCalls.some(([text]) => text === 'VICTORY!');
      expect(hasVictory).toBe(true);
    });

    it('renders DEFEATED! and enemy name on defeat phase', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      const cs = getCombatState(scene);
      const enemyName = getEnemyDisplayName(cs.enemyKind);
      forceDefeatReady(scene);
      const { fillTextCalls } = renderCombat(scene);
      const hasDefeated = fillTextCalls.some(([text]) => text === 'DEFEATED!');
      const hasEnemyName = fillTextCalls.some(([text]) => text.includes(enemyName));
      expect(hasDefeated).toBe(true);
      expect(hasEnemyName).toBe(true);
    });

    it('renders floating damage texts when present', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      // Manually add a damage text
      (scene as any).combatDamageTexts = [
        { x: 120, y: 160, text: '34%', timer: 0.5, color: '#fbbf24', dy: -40 },
      ];
      const { fillTextCalls } = renderCombat(scene);
      const hasDmgNum = fillTextCalls.some(([text]) => text === '34%');
      expect(hasDmgNum).toBe(true);
    });
  });

  describe('combat fade-in', () => {
    it('background opacity increases over first 0.3 seconds', () => {
      const { scene } = createSceneWithEnemies();
      triggerCombat(scene);
      // Combat just started — elapsed is very small
      const cs = getCombatState(scene);
      expect(cs.elapsed).toBeLessThan(0.1);
      // After advancing, elapsed increases for fade computation
      scene.update(0.3, []);
      expect(getCombatState(scene).elapsed).toBeGreaterThanOrEqual(0.3);
    });
  });
});

// ── Canvas mock ──────────────────────────────────────────────

function createMockCtx(): CanvasRenderingContext2D {
  const noop = () => {};
  return new Proxy({} as any, {
    get(target, prop) {
      if (prop in target) return target[prop];
      // Return a no-op for methods, default values for common properties
      if (typeof prop === 'string') {
        if (prop === 'canvas') return { width: 240, height: 400 };
        if (prop === 'measureText') return () => ({ width: 10 });
        if (prop === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
        if (prop === 'createLinearGradient') return () => ({ addColorStop: noop });
        if (prop === 'createRadialGradient') return () => ({ addColorStop: noop });
        if (prop === 'createPattern') return () => ({});
      }
      return noop;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}
