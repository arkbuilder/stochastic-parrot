import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import { findIsland, findConcept as findConceptInGameData } from '../data/game-data';
import type { IslandConfig } from '../data/islands';
import { createConceptCard, type ConceptCard, createLandmark, type LandmarkEntity, createParrot, createPlayer } from '../entities';
import { createEnemy, updateEnemy, type EnemyEntity } from '../entities/enemy';
import { createPowerup, type PowerupEntity, type PowerupKind } from '../entities/powerup';
import type { InputAction } from '../input/types';
import { renderHud } from '../rendering/hud';
import { ParticleSystem } from '../rendering/particles';
import { TileMap, type TileMapLayout } from '../rendering/tile-map';
import { TOKENS } from '../rendering/tokens';
import { drawPlayer, drawParrot, drawLandmark, drawConceptCard, drawPulsingArrow, drawHintBubble, drawVignette, drawButton, rgba, roundRect, drawEnemy, drawPowerup, drawStunEffect, drawFreezeOverlay, drawRevealTrail, drawFlora } from '../rendering/draw';
import { updateAnimationSystem } from '../systems/animation-system';
import { type EncodeRuntimeState, updateEncodeSystem } from '../systems/encode-system';
import { updateMovementSystem } from '../systems/movement-system';
import { createWeatherState, updateWeatherSystem, type WeatherState } from '../systems/weather-system';
import { renderWeatherBackground, renderWeatherForeground } from '../rendering/weather';
import { AudioEvent } from '../audio/types';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import type { EncounterStartData } from './flow-types';
import { distance } from '../utils/math';
import {
  createCombatState, updateCombat, getCombatButtonRects, getDefeatButtonRects,
  restartCombat, applyPointPowerup, getEnemyDisplayName,
  type CombatState, type CombatInput, VICTORY_BONUS,
  POINT_POWERUP_COST, DEFEAT_DISPLAY_DURATION, CRIT_THRESHOLD,
} from '../systems/island-combat';
import {
  type SkillTreeState, type SkillBonuses, type SkillId,
  createSkillTree, getSkillBonuses, addSkillPoints, canUnlockSkill,
  unlockSkill, getAvailableSkills, getSkillDefinition, SKILL_DEFINITIONS,
  SP_PER_ENEMY_KILL, SP_PER_CONCEPT_PLACED, getDefaultBonuses,
} from '../systems/skill-tree';

/** Simple AABB hit test */
function hitTest(px: number, py: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

/** Snapshot of how well the player did on previous islands */
export interface PerformanceSnapshot {
  /** Average grade across completed islands: 'S'|'A'|'B'|'C'|'D', or null if first island */
  averageGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  /** Number of islands completed so far */
  completedCount: number;
  /** Whether the player earned expert bonus on the most recent island */
  lastExpertBonus: boolean;
}

interface IslandSceneDeps {
  islandId: string;
  onThreatTriggered: (data: EncounterStartData) => void;
  telemetry: TelemetryClient;
  audio: AudioManager;
  onPause?: () => void;
  onConceptPlaced?: (conceptId: string) => void;
  onConceptDiscovered?: (conceptId: string) => void;
  /** Launch a minigame for a concept. Call onComplete() when done to unlock the card. */
  onMinigameLaunch?: (conceptId: string, landmarkId: string, onComplete: () => void) => void;
  /** Launch a pop quiz when player touches an enemy. correct→true = enemy dies, false = stun */
  onEnemyQuiz?: (conceptId: string, landmarkId: string, onResult: (correct: boolean) => void) => void;
  /** Previous island performance for adaptive enemy spawning */
  performance?: PerformanceSnapshot;
  /** Persistent skill tree state (shared across islands) */
  skillTree?: SkillTreeState;
}

type IslandPhase = 'island_arrive' | 'exploring' | 'encoding' | 'threat_triggered';

const PAUSE_BUTTON = { x: 206, y: 8, w: 24, h: 22 };
const SKILL_BUTTON = { x: 8, y: 8, w: 36, h: 20 };
const SKILL_CLOSE_BUTTON = { x: 90, y: 370, w: 60, h: 22 };
const LEARN_BUTTON = { w: 52, h: 20 }; // positioned dynamically near the landmark
const LANDMARK_PROXIMITY = 40; // px distance to show the learn prompt
const ASSET_LOAD_TIMEOUT_MS = 10_000;

export class IslandScene implements Scene {
  private readonly island: IslandConfig;
  private readonly player = createPlayer(24, 332);
  private readonly parrot = createParrot(18, 320);
  private readonly landmarks: LandmarkEntity[];
  private readonly conceptCards: ConceptCard[];
  private readonly enemies: EnemyEntity[];
  private readonly powerups: PowerupEntity[];
  private readonly particles = new ParticleSystem();
  private readonly encodeRuntime: EncodeRuntimeState = { heldCardId: null };
  private readonly vegetationSprites: Array<{ x: number; y: number; kind: string; scale: number }>;

  private phase: IslandPhase = 'island_arrive';
  private nowMs = 0;
  private arrivalElapsed = 0;
  private firstPlaced = false;
  private firstInputSeen = false;
  private tileMap = new TileMap(fallbackLayout);
  private threatSent = false;
  private playerStunTimer = 0;
  private playerShielded = false;
  private playerSpeedBoost = false;
  private speedBoostTimer = 0;
  private shieldTimer = 0;
  private minigameActive = false;
  private quizActive = false;
  private quizEnemyId = '';
  private freezeTimer = 0;
  private revealTimer = 0;
  private revealTargetPos: { x: number; y: number } | null = null;
  /** ID of the landmark whose learn-prompt is visible (player within range) */
  private nearbyLandmarkId: string | null = null;
  private readonly weatherState: WeatherState;

  // ── Combat overlay state ──
  private combatState: CombatState | null = null;
  private combatEnemyId = '';
  private combatChargeHeld = false;
  /** Screen-shake timer for enemy hit feedback */
  private combatShakeTimer = 0;
  /** Floating damage numbers inside the combat overlay */
  private combatDamageTexts: Array<{ x: number; y: number; text: string; timer: number; color: string; dy: number }> = [];
  /** Post-combat immunity timer (prevents instant re-collision) */
  private combatImmunityTimer = 0;

  // ── Player score (earned from combat victories) ──
  private score = 0;

  // ── Floating score popup ──
  private scorePopups: Array<{ x: number; y: number; text: string; timer: number }> = [];

  // ── Skill tree ──
  private readonly skillTree: SkillTreeState;
  private skillTreeOpen = false;
  private skillBonuses: SkillBonuses;

  constructor(private readonly deps: IslandSceneDeps) {
    const island = findIsland(deps.islandId);
    if (!island) {
      throw new Error(`Island configuration missing: ${deps.islandId}`);
    }

    this.island = island;
    this.weatherState = createWeatherState(island.encounterType);

    this.landmarks = this.island.landmarks.map((landmark) =>
      createLandmark(landmark.id, landmark.conceptId, landmark.x, landmark.y),
    );

    this.conceptCards = this.island.conceptIds.map((conceptId, index) => {
      const concept = findConceptInGameData(conceptId);
      const name = concept?.name ?? conceptId;
      const iconGlyph = name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return createConceptCard(
        `card_${conceptId}`,
        conceptId,
        name,
        iconGlyph,
        12 + index * 76,
        352,
      );
    });

    // Spawn enemies patrolling between landmark areas
    this.enemies = this.spawnEnemies();

    // Spawn powerups in accessible locations
    this.powerups = this.spawnPowerups();

    // Generate decorative vegetation positions from island config
    this.vegetationSprites = this.buildVegetationSprites();

    // Skill tree — use shared state from deps or create a local one
    this.skillTree = deps.skillTree ?? createSkillTree();
    this.skillBonuses = getSkillBonuses(this.skillTree);
  }

  enter(context: SceneContext): void {
    void context;
    this.phase = 'island_arrive';
    this.arrivalElapsed = 0;
    this.nowMs = 0;
    this.firstPlaced = false;
    this.firstInputSeen = false;
    this.threatSent = false;
    this.playerStunTimer = 0;
    this.playerShielded = false;
    this.playerSpeedBoost = false;
    this.speedBoostTimer = 0;
    this.shieldTimer = 0;
    this.quizActive = false;
    this.quizEnemyId = '';
    this.freezeTimer = 0;
    this.revealTimer = 0;
    this.revealTargetPos = null;
    this.combatState = null;
    this.combatEnemyId = '';
    this.combatChargeHeld = false;
    this.combatShakeTimer = 0;
    this.combatDamageTexts = [];
    this.combatImmunityTimer = 0;
    this.scorePopups = [];
    this.skillBonuses = getSkillBonuses(this.skillTree); // refresh after potential cross-island upgrades
    void this.loadLayout();

    this.deps.telemetry.emit(TELEMETRY_EVENTS.onboardingStart, { island_id: this.island.id });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.islandArrived, { island_id: this.island.id });
    this.deps.audio.setMusicLayers(['base', 'rhythm']);
    this.deps.audio.selectIslandTheme(this.island.id);
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.nowMs += dt * 1000;

    const pauseAction = actions.find((action) => action.type === 'pause');
    const pauseTap = actions.find(
      (action): action is Extract<InputAction, { type: 'primary' }> =>
        action.type === 'primary' && action.x >= PAUSE_BUTTON.x && action.y >= PAUSE_BUTTON.y &&
        action.x <= PAUSE_BUTTON.x + PAUSE_BUTTON.w && action.y <= PAUSE_BUTTON.y + PAUSE_BUTTON.h,
    );

    if (pauseAction || pauseTap) {
      this.deps.onPause?.();
      return;
    }

    // ── Score popup fade ──
    for (const popup of this.scorePopups) {
      popup.timer -= dt;
      popup.y -= dt * 30; // float upward
    }
    this.scorePopups = this.scorePopups.filter((p) => p.timer > 0);

    // ── Combat overlay active? ──
    if (this.combatState) {
      this.updateCombatOverlay(dt, actions);
      return;
    }

    // ── Skill tree overlay active? ──
    if (this.skillTreeOpen) {
      this.updateSkillTreeOverlay(actions);
      return;
    }

    // ── Skill tree button tap ──
    for (const a of actions) {
      if (a.type === 'primary' && hitTest(a.x, a.y, SKILL_BUTTON)) {
        this.skillTreeOpen = true;
        this.deps.audio.play(AudioEvent.BitChirp);
        return;
      }
    }

    if (!this.firstInputSeen && actions.length > 0) {
      this.firstInputSeen = true;
      this.deps.telemetry.emit(TELEMETRY_EVENTS.firstInput, { input_count: actions.length });
    }

    if (this.phase === 'island_arrive') {
      this.arrivalElapsed += dt;
      if (this.arrivalElapsed >= 0.7) {
        this.phase = 'exploring';
      }
      return;
    }

    if (this.phase === 'threat_triggered') {
      return;
    }

    this.phase = 'encoding';

    // Update stun timer — player can't move or encode while stunned
    if (this.playerStunTimer > 0) {
      this.playerStunTimer = Math.max(0, this.playerStunTimer - dt);
      // Still update enemies and powerups visually (unless frozen)
      if (this.freezeTimer <= 0) {
        for (const enemy of this.enemies) updateEnemy(enemy, dt, this.player.position);
      }
      for (const pu of this.powerups) pu.state.animationTime += dt;
      updateAnimationSystem(this.player, this.parrot, this.landmarks, this.conceptCards, dt);
      this.particles.update(dt);
      return;
    }

    // Update speed/shield timers
    if (this.combatImmunityTimer > 0) this.combatImmunityTimer -= dt;
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) {
        this.playerSpeedBoost = false;
        this.player.state.speed = 64;
      }
    }
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) this.playerShielded = false;
    }
    // Update freeze timer
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
    }
    // Update reveal timer
    if (this.revealTimer > 0) {
      this.revealTimer -= dt;
      if (this.revealTimer <= 0) this.revealTargetPos = null;
    }

    updateMovementSystem(this.player, this.parrot, actions, dt);
    this.updateNearbyLandmark();
    this.handleLearnButtonTap(actions);

    // Update enemies and check collisions
    const frozen = this.freezeTimer > 0;
    for (const enemy of this.enemies) {
      if (enemy.state.defeated) continue;
      if (!frozen) {
        updateEnemy(enemy, dt, this.player.position);
      } else {
        // Still advance animation time for visual feedback
        enemy.state.animationTime += dt;
      }

      if (enemy.state.stunCooldown <= 0 && enemy.visible && this.combatImmunityTimer <= 0 && this.checkCollision(this.player, enemy)) {
        if (this.playerShielded) {
          this.playerShielded = false;
          this.shieldTimer = 0;
          enemy.state.stunCooldown = 3;
          this.particles.emitSparkle(this.player.position.x, this.player.position.y - 8);
          this.deps.audio.play(AudioEvent.ShieldBlock);
        } else {
          // Enemy touch → pop quiz!
          this.triggerEnemyQuiz(enemy);
        }
      }
    }

    // Update powerup animation and check collection
    for (const pu of this.powerups) {
      pu.state.animationTime += dt;
      if (!pu.state.collected && this.checkCollision(this.player, pu)) {
        pu.state.collected = true;
        pu.visible = false;
        this.deps.audio.play(AudioEvent.ConceptPlaced);
        this.particles.emitSparkle(pu.position.x, pu.position.y);
        this.applyPowerup(pu.state.kind);
      }
    }

    const encodeEvents = updateEncodeSystem(this.conceptCards, this.landmarks, actions, this.encodeRuntime);

    for (const event of encodeEvents) {
      if (event.type === 'concept_placed') {
        if (event.conceptId) {
          this.deps.onConceptPlaced?.(event.conceptId);
        }
        this.deps.audio.play(AudioEvent.ConceptPlaced);
        this.particles.emitSparkle(this.player.position.x, this.player.position.y - 8);

        // Award skill point for concept placement
        addSkillPoints(this.skillTree, SP_PER_CONCEPT_PLACED);
        this.skillBonuses = getSkillBonuses(this.skillTree);
        this.scorePopups.push({
          x: this.player.position.x,
          y: this.player.position.y - 30,
          text: `+${SP_PER_CONCEPT_PLACED} SP`,
          timer: 1.2,
        });

        this.deps.telemetry.emit(TELEMETRY_EVENTS.conceptPlaced, {
          island_id: this.island.id,
          concept_id: event.conceptId,
          landmark_id: event.landmarkId,
          encode_duration_ms: this.nowMs,
        });

        if (!this.firstPlaced) {
          this.firstPlaced = true;
          this.deps.telemetry.emit(TELEMETRY_EVENTS.firstSuccessCoreVerb, {
            core_verb: 'place',
            island_id: this.island.id,
          });
        }
      }
    }

    updateAnimationSystem(this.player, this.parrot, this.landmarks, this.conceptCards, dt);
    this.particles.update(dt);
    updateWeatherSystem(this.weatherState, dt, this.island.encounterType);

    if (this.conceptCards.every((card) => card.state.placed)) {
      this.triggerThreat();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.nowMs / 1000;
    this.tileMap.render(ctx, 0, 0, t);

    // Draw island vegetation decorations
    for (const veg of this.vegetationSprites) {
      drawFlora(ctx, veg.x, veg.y, veg.kind, t, veg.scale);
    }

    // Weather background layer (fog banks, darkening, lightning flash)
    renderWeatherBackground(ctx, this.weatherState, GAME_WIDTH, GAME_HEIGHT);

    // Draw landmarks with proper icons and glow
    for (const landmark of this.landmarks) {
      const filled = !!landmark.state.placedConceptId;
      const isNextTarget = !filled && this.getNextTargetLandmarkId() === landmark.id;
      const glow = isNextTarget ? 1.0 : landmark.state.lockTimer > 0 ? 0.6 : 0;
      drawLandmark(ctx, landmark.position.x, landmark.position.y, landmark.id, filled, glow, t);
    }

    // Draw concept cards being dragged
    for (const card of this.conceptCards) {
      if (!card.state.unlocked || card.state.placed || !card.state.dragging) {
        continue;
      }
      const concept = findConceptInGameData(card.state.conceptId);
      drawConceptCard(ctx, card.position.x, card.position.y, card.bounds.w, card.bounds.h,
        card.state.iconGlyph, concept?.name ?? card.state.conceptId, true);
    }

    // Draw player character + parrot
    drawPlayer(ctx, this.player.position.x, this.player.position.y, this.player.state.animationTime);
    drawParrot(ctx, this.parrot.position.x, this.parrot.position.y, this.parrot.state.animationTime);

    // Draw stun effect over player
    if (this.playerStunTimer > 0) {
      drawStunEffect(ctx, this.player.position.x, this.player.position.y, t);
    }

    // Draw shield indicator
    if (this.playerShielded) {
      const shieldAlpha = 0.2 + Math.sin(t * 3) * 0.1;
      ctx.strokeStyle = `rgba(56, 189, 248, ${shieldAlpha + 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.player.position.x, this.player.position.y - 4, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // Draw enemies
    for (const enemy of this.enemies) {
      if (enemy.state.defeated) continue;
      const frozen = this.freezeTimer > 0;
      if (frozen) {
        // Icy tint on frozen enemies
        ctx.globalAlpha = 0.6;
      }
      drawEnemy(ctx, enemy.position.x, enemy.position.y, enemy.state.kind, t,
        enemy.state.burrowPhase, enemy.state.burrowTimer, enemy.state.spikesOut);
      if (frozen) {
        // Frost ring around frozen enemy
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
    }

    // Freeze overlay
    if (this.freezeTimer > 0) {
      const fadeAlpha = Math.min(1, this.freezeTimer / 0.5);
      drawFreezeOverlay(ctx, GAME_WIDTH, GAME_HEIGHT, t, fadeAlpha);
    }

    // Reveal trail to next landmark
    if (this.revealTimer > 0 && this.revealTargetPos) {
      const fadeAlpha = Math.min(1, this.revealTimer / 0.5);
      drawRevealTrail(ctx, this.player.position.x, this.player.position.y - 4,
        this.revealTargetPos.x, this.revealTargetPos.y, t, fadeAlpha);
    }

    // Draw powerups
    for (const pu of this.powerups) {
      if (!pu.state.collected) {
        drawPowerup(ctx, pu.position.x, pu.position.y, pu.state.kind, t);
      }
    }

    this.particles.render(ctx);

    // Weather foreground layer (rain, ash, motes, lightning bolts)
    renderWeatherForeground(ctx, this.weatherState, GAME_WIDTH, GAME_HEIGHT);

    renderHud(ctx, {
      phase: 'encoding',
      conceptCards: this.conceptCards.filter((card) => card.state.unlocked),
      landmarks: this.landmarks,
      timerRatio: 1,
      healthRatio: 1,
      score: this.score,
      attemptsUsed: 0,
    });

    // ── ONBOARDING HINTS ──
    this.renderOnboardingHints(ctx, t);

    // ── LEARN BUTTON (tap to start minigame) ──
    this.renderLearnButton(ctx, t);

    // Island arrival overlay
    if (this.phase === 'island_arrive') {
      const arrivalAlpha = Math.max(0, 1 - this.arrivalElapsed / 0.7);
      ctx.fillStyle = rgba('#070b14', arrivalAlpha * 0.7);
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      const nameAlpha = Math.min(1, this.arrivalElapsed / 0.4);
      ctx.fillStyle = rgba('#facc15', nameAlpha);
      ctx.font = TOKENS.fontLarge;
      ctx.textAlign = 'center';
      ctx.fillText(this.island.name, GAME_WIDTH / 2, 180);

      ctx.fillStyle = rgba('#e2e8f0', nameAlpha * 0.7);
      ctx.font = TOKENS.fontSmall;
      ctx.fillText('Explore & place concepts at landmarks', GAME_WIDTH / 2, 200);
    }

    // Pause button (polished)
    ctx.fillStyle = TOKENS.colorPanel;
    roundRect(ctx, PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.w, PAUSE_BUTTON.h, 4);
    ctx.fill();
    ctx.strokeStyle = TOKENS.colorCyan400;
    roundRect(ctx, PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.w, PAUSE_BUTTON.h, 4);
    ctx.stroke();
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('II', PAUSE_BUTTON.x + 12, PAUSE_BUTTON.y + 15);

    // Skill tree button (top-left)
    const spCount = this.skillTree.skillPoints;
    drawButton(ctx, SKILL_BUTTON.x, SKILL_BUTTON.y, SKILL_BUTTON.w, SKILL_BUTTON.h,
      spCount > 0 ? `SK ${spCount}` : 'SK', spCount > 0, 8);

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.25);

    // ── Floating score popups ──
    this.renderScorePopups(ctx);

    // ── Combat overlay (renders on top of everything) ──
    this.renderCombatOverlay(ctx);

    // ── Skill tree overlay (on top of combat if open) ──
    this.renderSkillTreeOverlay(ctx);
  }

  /** Render step-by-step onboarding hints */
  private renderOnboardingHints(ctx: CanvasRenderingContext2D, t: number): void {
    if (this.phase === 'island_arrive') return;

    const placedCount = this.conceptCards.filter((c) => c.state.placed).length;
    const nextUnlocked = this.conceptCards.find((c) => c.state.unlocked && !c.state.placed && !c.state.dragging);
    const nextLocked = this.conceptCards.find((c) => !c.state.unlocked);

    if (placedCount === 0 && !nextUnlocked && nextLocked) {
      // Step 1: Walk to first landmark — show arrow pointing toward it
      const targetLandmark = this.landmarks.find((lm) => lm.state.conceptId === nextLocked.state.conceptId);
      if (targetLandmark) {
        drawPulsingArrow(ctx, targetLandmark.position.x, targetLandmark.position.y - 22, t, 'down');
        drawHintBubble(ctx, targetLandmark.position.x, targetLandmark.position.y - 36, 'walk', t);
      }
    } else if (nextUnlocked && placedCount === 0) {
      // Step 2: Card appeared — show drag hint toward landmark
      const targetLandmark = this.landmarks.find((lm) => lm.state.conceptId === nextUnlocked.state.conceptId);
      if (targetLandmark) {
        drawPulsingArrow(ctx, targetLandmark.position.x, targetLandmark.position.y - 22, t, 'down');
        drawHintBubble(ctx, nextUnlocked.position.x + nextUnlocked.bounds.w / 2, nextUnlocked.position.y - 16, 'drag', t);
      }
    }

    // Progress dots for placed concepts
    if (this.conceptCards.length > 0) {
      const dotX = GAME_WIDTH / 2;
      const dotY = 310;
      const total = this.conceptCards.length;
      const dotSpacing = 12;
      const startX = dotX - ((total - 1) * dotSpacing) / 2;
      for (let i = 0; i < total; i++) {
        const card = this.conceptCards[i];
        if (!card) continue;
        ctx.fillStyle = card.state.placed ? TOKENS.colorYellow400 :
                         card.state.unlocked ? TOKENS.colorCyan400 : '#334155';
        ctx.beginPath();
        const r = card.state.unlocked && !card.state.placed ? 3.5 : 2.5;
        ctx.arc(startX + i * dotSpacing, dotY, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private getNextTargetLandmarkId(): string | null {
    const nextCard = this.conceptCards.find((c) => !c.state.placed);
    if (!nextCard) return null;
    const lm = this.landmarks.find((l) => l.state.conceptId === nextCard.state.conceptId);
    return lm?.id ?? null;
  }

  /** Draw a tappable \"Learn\" button above the nearby landmark */
  private renderLearnButton(ctx: CanvasRenderingContext2D, t: number): void {
    if (!this.nearbyLandmarkId || this.minigameActive) return;

    const landmark = this.landmarks.find((lm) => lm.id === this.nearbyLandmarkId);
    if (!landmark) return;

    const btnX = landmark.position.x - LEARN_BUTTON.w / 2;
    const btnY = landmark.position.y - 38;

    // Subtle bounce animation
    const bounce = Math.sin(t * 4) * 1.5;
    drawButton(ctx, btnX, btnY + bounce, LEARN_BUTTON.w, LEARN_BUTTON.h, 'LEARN', true, 9);

    // Pulsing arrow pointing down toward the landmark
    drawPulsingArrow(ctx, landmark.position.x, btnY + LEARN_BUTTON.h + 3 + bounce, t, 'down');
  }

  /**
   * Track which landmark the player is near (for showing the learn button).
   * Does NOT auto-launch — the player must tap the button.
   */
  private updateNearbyLandmark(): void {
    if (this.minigameActive) {
      this.nearbyLandmarkId = null;
      return;
    }

    const nextCard = this.conceptCards.find((card) => !card.state.unlocked);
    if (!nextCard) {
      this.nearbyLandmarkId = null;
      return;
    }

    const targetLandmark = this.landmarks.find((lm) => lm.state.conceptId === nextCard.state.conceptId);
    if (!targetLandmark) {
      this.nearbyLandmarkId = null;
      return;
    }

    if (distance(this.player.position, targetLandmark.position) <= LANDMARK_PROXIMITY) {
      this.nearbyLandmarkId = targetLandmark.id;
    } else {
      this.nearbyLandmarkId = null;
    }
  }

  /** Launch minigame when the player taps the learn button near a landmark */
  private handleLearnButtonTap(actions: InputAction[]): void {
    if (!this.nearbyLandmarkId || this.minigameActive) return;

    const landmark = this.landmarks.find((lm) => lm.id === this.nearbyLandmarkId);
    if (!landmark) return;

    const btnX = landmark.position.x - LEARN_BUTTON.w / 2;
    const btnY = landmark.position.y - 38;

    const tap = actions.find(
      (a): a is Extract<InputAction, { type: 'primary' }> =>
        a.type === 'primary' &&
        a.x >= btnX && a.x <= btnX + LEARN_BUTTON.w &&
        a.y >= btnY && a.y <= btnY + LEARN_BUTTON.h,
    );
    if (!tap) return;

    const nextCard = this.conceptCards.find((card) => !card.state.unlocked);
    if (!nextCard) return;

    if (this.deps.onMinigameLaunch) {
      this.minigameActive = true;
      this.deps.onMinigameLaunch(
        nextCard.state.conceptId,
        landmark.id,
        () => {
          nextCard.state.unlocked = true;
          nextCard.state.appearedAtMs = this.nowMs;
          this.deps.onConceptDiscovered?.(nextCard.state.conceptId);
          this.minigameActive = false;
        },
      );
    } else {
      // Fallback: unlock immediately if no minigame handler
      nextCard.state.unlocked = true;
      nextCard.state.appearedAtMs = this.nowMs;
      this.deps.onConceptDiscovered?.(nextCard.state.conceptId);
    }
  }

  private async loadLayout(): Promise<void> {
    try {
      this.tileMap = await this.loadLayoutWithTimeout(`/layouts/${this.island.id}/layout.json`);
    } catch {
      this.tileMap = new TileMap(fallbackLayout);
    }
  }

  private async loadLayoutWithTimeout(path: string): Promise<TileMap> {
    let timeoutId = 0;
    const timeout = new Promise<TileMap>((_resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('layout_timeout'));
      }, ASSET_LOAD_TIMEOUT_MS);
    });

    try {
      return await Promise.race([TileMap.load(path), timeout]);
    } catch {
      this.deps.telemetry.emit(TELEMETRY_EVENTS.assetLoadTimeout, {
        asset_path: path,
        timeout_ms: ASSET_LOAD_TIMEOUT_MS,
      });
      throw new Error('layout_timeout');
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  debugForceCompleteEncoding(): void {
    for (const card of this.conceptCards) {
      card.state.unlocked = true;
      card.state.placed = true;
      card.state.dragging = false;

      const targetLandmark = this.landmarks.find((landmark) => landmark.state.conceptId === card.state.conceptId);
      if (!targetLandmark) {
        continue;
      }

      targetLandmark.state.placedConceptId = card.state.conceptId;
      targetLandmark.state.lockTimer = 0.5;
      card.position.x = targetLandmark.position.x - card.bounds.w / 2;
      card.position.y = targetLandmark.position.y + 10;
    }

    this.triggerThreat();
  }

  private triggerThreat(): void {
    if (this.threatSent) {
      return;
    }

    this.threatSent = true;
    this.phase = 'threat_triggered';
    this.deps.telemetry.emit(TELEMETRY_EVENTS.encodePhaseComplete, {
      island_id: this.island.id,
      concepts_count: this.conceptCards.length,
      total_encode_ms: this.nowMs,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.islandEncodingComplete, {
      island_id: this.island.id,
      concepts_placed: this.conceptCards.length,
      encode_total_ms: this.nowMs,
    });

    this.deps.onThreatTriggered({
      islandId: this.island.id,
      encounterType: this.island.encounterType,
      landmarks: this.landmarks.map((landmark) => ({
        ...landmark,
        state: { ...landmark.state },
        position: { ...landmark.position },
        bounds: { ...landmark.bounds },
      })),
      placedConceptIds: this.conceptCards.map((card) => card.state.conceptId),
      startedAtMs: this.nowMs,
      activeUpgrades: [],
    });
  }

  /**
   * Spawn enemies based on island progression AND player performance.
   *
   * Base pacing curve (per Design/IslandProgression.md):
   *   Island 1: No enemies — tutorial, pure exploration
   *   Island 2: Crab only — introduces enemy avoidance
   *   Island 3: Crab + Jelly — two patrol enemies, medium pressure
   *   Island 4: Crab + Burrower — introduces the complex burrower
   *   Island 5+: All three — full difficulty
   *
   * Performance modifiers:
   *   S/A avg grade → elite variants replace base enemies + extra spawns
   *   B/C avg grade → normal spawns (base curve)
   *   D avg grade or first play → fewer enemies (novice assist)
   */
  private spawnEnemies(): EnemyEntity[] {
    const lms = this.island.landmarks;
    const enemies: EnemyEntity[] = [];
    const id = this.island.id;
    const perf = this.deps.performance;
    const tier = getPerformanceTier(perf);

    // Island 1 — safe sandbox, no enemies during exploration
    if (id === 'island_01') return enemies;

    // ── Base enemies (progression curve) ─────────────────────

    // Crab patrols between the first two landmarks (Islands 2+)
    if (lms.length >= 2) {
      const midY1 = (lms[0]!.y + lms[1]!.y) / 2;
      const kind = tier === 'elite' ? 'fire_crab' as const : 'crab' as const;
      const speed = tier === 'elite' ? 32 : 24;
      enemies.push(createEnemy(
        `enemy_crab_0`,
        kind,
        lms[0]!.x + 20, midY1,
        lms[1]!.x - 20, midY1 + 10,
        speed,
      ));
    }

    // Jellyfish patrols between the second and third landmarks (Islands 3, 5+)
    if (lms.length >= 3 && id !== 'island_02' && id !== 'island_04') {
      const midY2 = (lms[1]!.y + lms[2]!.y) / 2;
      const kind = tier === 'elite' ? 'shadow_jelly' as const : 'jellyfish' as const;
      const speed = tier === 'elite' ? 24 : 20;
      enemies.push(createEnemy(
        `enemy_jelly_0`,
        kind,
        lms[1]!.x, midY2 - 15,
        lms[2]!.x - 10, midY2 + 15,
        speed,
      ));
    }

    // Burrower — hides underground, emerges near the player (Islands 4+)
    if (lms.length >= 2 && id !== 'island_02' && id !== 'island_03') {
      const cx = (lms[0]!.x + lms[lms.length - 1]!.x) / 2;
      const cy = (lms[0]!.y + lms[lms.length - 1]!.y) / 2;
      const kind = tier === 'elite' ? 'sand_wyrm' as const : 'burrower' as const;
      const speed = tier === 'elite' ? 38 : 32;
      enemies.push(createEnemy(
        `enemy_burrow_0`,
        kind,
        cx, cy,
        cx + 30, cy + 20,
        speed,
      ));
    }

    // ── Performance-based modifiers ──────────────────────────

    // Novice assist: remove the last enemy on D-tier
    if (tier === 'novice' && enemies.length > 1) {
      enemies.pop();
    }

    // Elite: add extra enemies for high performers
    if (tier === 'elite' && lms.length >= 2) {
      // Add a Reef Urchin near the second landmark (area denial)
      if (id !== 'island_02') {
        enemies.push(createEnemy(
          `enemy_urchin_0`,
          'urchin',
          lms[1]!.x + 15, lms[1]!.y + 25,
          lms[1]!.x + 15, lms[1]!.y + 25, // stationary — patrolA = patrolB
          0,
        ));
      }

      // Add a Phantom Ray on islands 4+ for elite players
      if (lms.length >= 3 && id !== 'island_02' && id !== 'island_03') {
        enemies.push(createEnemy(
          `enemy_ray_0`,
          'ray',
          lms[0]!.x + 10, lms[2]!.y,
          lms[2]!.x - 10, lms[0]!.y,
          36,
        ));
      }
    }

    return enemies;
  }

  private spawnPowerups(): PowerupEntity[] {
    const lms = this.island.landmarks;
    const powerups: PowerupEntity[] = [];

    // Speed boost near the path to the first landmark
    if (lms.length >= 1) {
      powerups.push(createPowerup('pu_speed_0', 'speed', lms[0]!.x + 35, lms[0]!.y + 20));
    }

    // Shield near the middle of the map
    if (lms.length >= 2) {
      const mx = (lms[0]!.x + lms[1]!.x) / 2;
      const my = (lms[0]!.y + lms[1]!.y) / 2 + 15;
      powerups.push(createPowerup('pu_shield_0', 'shield', mx, my));
    }

    // Freeze powerup — near the last landmark
    if (lms.length >= 3) {
      powerups.push(createPowerup('pu_freeze_0', 'freeze', lms[2]!.x - 25, lms[2]!.y + 15));
    }

    // Reveal powerup — between landmarks, offset
    if (lms.length >= 2) {
      const rx = lms[1]!.x + 30;
      const ry = lms[1]!.y - 20;
      powerups.push(createPowerup('pu_reveal_0', 'reveal', rx, ry));
    }

    return powerups;
  }

  /** Build deterministic vegetation decoration positions from island config */
  private buildVegetationSprites(): Array<{ x: number; y: number; kind: string; scale: number }> {
    const sprites: Array<{ x: number; y: number; kind: string; scale: number }> = [];
    const vegetation = this.island.vegetation;
    if (!vegetation || vegetation.length === 0) return sprites;

    // Place 4-6 vegetation sprites per kind in varied positions around the island
    // Use deterministic offsets derived from island id hash
    let hash = 0;
    for (let i = 0; i < this.island.id.length; i++) {
      hash = ((hash << 5) - hash + this.island.id.charCodeAt(i)) | 0;
    }

    for (const kind of vegetation) {
      const count = 4 + (Math.abs(hash) % 3); // 4-6 per kind
      for (let i = 0; i < count; i++) {
        // Spread around playable area (x: 10-230, y: 180-340)
        const seed = Math.abs(hash * (i + 1) * 7919) % 10000;
        const x = 14 + (seed % 212);
        const y = 180 + ((seed * 3) % 160);
        const scale = 0.7 + (seed % 5) * 0.1;
        sprites.push({ x, y, kind, scale });
      }
    }

    return sprites;
  }

  private checkCollision(a: { position: { x: number; y: number }; bounds: { w: number; h: number } },
                         b: { position: { x: number; y: number }; bounds: { w: number; h: number } }): boolean {
    const dx = Math.abs(a.position.x - b.position.x);
    const dy = Math.abs(a.position.y - b.position.y);
    return dx < (a.bounds.w + b.bounds.w) / 2 && dy < (a.bounds.h + b.bounds.h) / 2;
  }

  private applyPowerup(kind: PowerupKind): void {
    if (kind === 'speed') {
      this.playerSpeedBoost = true;
      this.player.state.speed = 128;
      this.speedBoostTimer = 5;
    } else if (kind === 'shield') {
      this.playerShielded = true;
      this.shieldTimer = 8;
    } else if (kind === 'freeze') {
      // Freeze all enemies for 3 seconds
      this.freezeTimer = 3;
      this.deps.audio.play(AudioEvent.FreezeBlast);
    } else if (kind === 'reveal') {
      // Show trail to next locked landmark for 5 seconds
      this.revealTimer = 5;
      const nextCard = this.conceptCards.find((c) => !c.state.unlocked);
      if (nextCard) {
        const lm = this.landmarks.find((l) => l.state.conceptId === nextCard.state.conceptId);
        if (lm) {
          this.revealTargetPos = { x: lm.position.x, y: lm.position.y };
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── Skill Tree overlay ──
  // ═══════════════════════════════════════════════════════════

  /** Handle taps inside the skill tree overlay */
  private updateSkillTreeOverlay(actions: InputAction[]): void {
    for (const a of actions) {
      if (a.type !== 'primary') continue;

      // Close button
      if (hitTest(a.x, a.y, SKILL_CLOSE_BUTTON)) {
        this.skillTreeOpen = false;
        this.deps.audio.play(AudioEvent.BitChirp);
        return;
      }

      // Tap on a skill node?
      const nodes = this.getSkillNodeRects();
      for (const node of nodes) {
        if (hitTest(a.x, a.y, node.rect)) {
          if (canUnlockSkill(this.skillTree, node.skillId)) {
            unlockSkill(this.skillTree, node.skillId);
            this.skillBonuses = getSkillBonuses(this.skillTree);
            this.deps.audio.play(AudioEvent.ConceptPlaced);
          } else {
            this.deps.audio.play(AudioEvent.RecallIncorrect);
          }
          return;
        }
      }
    }
  }

  /** Compute the layout rectangles for each skill node */
  private getSkillNodeRects(): Array<{ skillId: SkillId; rect: { x: number; y: number; w: number; h: number } }> {
    // 3×3 grid layout:
    //   Row 0: sharp_cutlass (col 0)    iron_hull (col 1)
    //   Row 1: swift_charge (col 0)     sea_legs (col 1)
    //   Row 2: thunder_strike (col 0)   plunder (col 1)
    const nodeW = 90;
    const nodeH = 42;
    const colX = [30, 120];
    const rowY = [80, 148, 216];

    const layout: Array<{ skillId: SkillId; col: number; row: number }> = [
      { skillId: 'sharp_cutlass',  col: 0, row: 0 },
      { skillId: 'iron_hull',      col: 1, row: 0 },
      { skillId: 'swift_charge',   col: 0, row: 1 },
      { skillId: 'sea_legs',       col: 1, row: 1 },
      { skillId: 'thunder_strike', col: 0, row: 2 },
      { skillId: 'plunder',        col: 1, row: 2 },
    ];

    return layout.map(({ skillId, col, row }) => ({
      skillId,
      rect: { x: colX[col] ?? 30, y: rowY[row] ?? 80, w: nodeW, h: nodeH },
    }));
  }

  /** Render the full-screen skill tree overlay */
  private renderSkillTreeOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.skillTreeOpen) return;

    const t = this.nowMs / 1000;

    // Dim background
    ctx.fillStyle = rgba('#070b14', 0.85);
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKILL TREE', GAME_WIDTH / 2, 30);

    // Skill points display
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.font = TOKENS.fontMedium;
    ctx.fillText(`SP: ${this.skillTree.skillPoints}`, GAME_WIDTH / 2, 52);

    // Draw connecting lines between prerequisite skills
    const nodes = this.getSkillNodeRects();
    ctx.strokeStyle = TOKENS.colorTextDark;
    ctx.lineWidth = 1;
    for (const def of SKILL_DEFINITIONS) {
      if (!def.prerequisite) continue;
      const fromNode = nodes.find((n) => n.skillId === def.prerequisite!.skillId);
      const toNode = nodes.find((n) => n.skillId === def.id);
      if (fromNode && toNode) {
        const fromCx = fromNode.rect.x + fromNode.rect.w / 2;
        const fromCy = fromNode.rect.y + fromNode.rect.h;
        const toCx = toNode.rect.x + toNode.rect.w / 2;
        const toCy = toNode.rect.y;
        // Glow the line if prerequisite is met
        const prereqMet = this.skillTree.skills[def.prerequisite.skillId] >= def.prerequisite.level;
        ctx.strokeStyle = prereqMet ? TOKENS.colorCyan600 : TOKENS.colorTextDark;
        ctx.beginPath();
        ctx.moveTo(fromCx, fromCy);
        ctx.lineTo(toCx, toCy);
        ctx.stroke();
      }
    }
    ctx.lineWidth = 1;

    // Draw each skill node
    for (const node of nodes) {
      const def = getSkillDefinition(node.skillId);
      const level = this.skillTree.skills[node.skillId];
      const available = canUnlockSkill(this.skillTree, node.skillId);
      const maxed = level >= def.maxLevel;

      const { x, y, w, h } = node.rect;

      // Node background
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      if (maxed) {
        grad.addColorStop(0, '#1a3a2e');
        grad.addColorStop(1, '#0c2a1e');
      } else if (available) {
        grad.addColorStop(0, '#1e3a5f');
        grad.addColorStop(1, '#0c2748');
      } else {
        grad.addColorStop(0, '#1f2937');
        grad.addColorStop(1, '#111827');
      }
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, w, h, 5);
      ctx.fill();

      // Border
      ctx.strokeStyle = maxed ? TOKENS.colorGreen400
        : available ? TOKENS.colorYellow400
        : level > 0 ? TOKENS.colorCyan400
        : TOKENS.colorTextDark;
      ctx.lineWidth = available ? 2 : 1;
      roundRect(ctx, x, y, w, h, 5);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Icon + name
      ctx.fillStyle = maxed ? TOKENS.colorGreen400
        : level > 0 ? TOKENS.colorCyan300
        : TOKENS.colorTextMuted;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText(`${def.icon} ${def.name}`, x + 4, y + 14);

      // Level pips
      const pipY = y + 28;
      for (let i = 0; i < def.maxLevel; i++) {
        const pipX = x + 4 + i * 10;
        ctx.fillStyle = i < level ? TOKENS.colorYellow400 : '#334155';
        ctx.beginPath();
        ctx.arc(pipX + 3, pipY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cost label (right-aligned)
      if (!maxed) {
        ctx.fillStyle = available ? TOKENS.colorYellow300 : TOKENS.colorTextDark;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'right';
        ctx.fillText(`${def.costPerLevel} SP`, x + w - 4, y + 14);
      } else {
        ctx.fillStyle = TOKENS.colorGreen400;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'right';
        ctx.fillText('MAX', x + w - 4, y + 14);
      }

      // Description
      ctx.fillStyle = TOKENS.colorTextMuted;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText(def.description, x + 4, y + 38);
    }

    // Bonus summary at bottom
    const b = this.skillBonuses;
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    const summaryY = 280;
    const summaryLines: string[] = [];
    if (b.attackMultiplier > 1) summaryLines.push(`ATK x${b.attackMultiplier.toFixed(1)}`);
    if (b.chargeSpeedMultiplier > 1) summaryLines.push(`CHG x${b.chargeSpeedMultiplier.toFixed(1)}`);
    if (b.chargeMaxBonus > 0) summaryLines.push(`MAX +${b.chargeMaxBonus.toFixed(1)}`);
    if (b.damageReduction > 0) summaryLines.push(`DEF -${(b.damageReduction * 100).toFixed(0)}%`);
    if (b.victoryBonusAdd > 0) summaryLines.push(`PTS +${b.victoryBonusAdd}`);
    if (b.startingHpBonus > 0) summaryLines.push(`HP +${(b.startingHpBonus * 100).toFixed(0)}%`);
    if (summaryLines.length > 0) {
      ctx.fillStyle = TOKENS.colorText;
      ctx.font = TOKENS.fontSmall;
      // Split into 2 rows of 3
      const row1 = summaryLines.slice(0, 3).join('  ');
      const row2 = summaryLines.slice(3).join('  ');
      ctx.fillText(row1, GAME_WIDTH / 2, summaryY);
      if (row2) ctx.fillText(row2, GAME_WIDTH / 2, summaryY + 14);
    }

    // Hint text
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('Tap a skill to unlock', GAME_WIDTH / 2, 340);

    // ── Close button ──
    drawButton(ctx, SKILL_CLOSE_BUTTON.x, SKILL_CLOSE_BUTTON.y,
      SKILL_CLOSE_BUTTON.w, SKILL_CLOSE_BUTTON.h, 'CLOSE', false, 10);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  /** When player touches an enemy, start a combat sequence */
  private triggerEnemyQuiz(enemy: EnemyEntity): void {
    if (this.combatState || this.quizActive) {
      // Already in combat
      return;
    }

    this.combatState = createCombatState(enemy.state.kind, this.skillBonuses);
    this.combatEnemyId = enemy.id;
    this.combatChargeHeld = false;
    enemy.state.stunCooldown = 99; // freeze enemy during combat
    this.deps.audio.play(AudioEvent.BitChirp);
  }

  /** Advance combat overlay each frame */
  private updateCombatOverlay(dt: number, actions: InputAction[]): void {
    if (!this.combatState) return;

    const cs = this.combatState;

    // ── Tick combat visual effects ──
    if (this.combatShakeTimer > 0) this.combatShakeTimer -= dt;
    for (const ft of this.combatDamageTexts) {
      ft.timer -= dt;
      ft.y += ft.dy * dt;
    }
    this.combatDamageTexts = this.combatDamageTexts.filter((ft) => ft.timer > 0);

    // ── Defeat screen interaction (retry / power-up) ──
    if (cs.phase === 'defeat' && cs.phaseTimer <= 0) {
      const dbtns = getDefeatButtonRects();
      for (const a of actions) {
        if (a.type === 'primary') {
          if (hitTest(a.x, a.y, dbtns.retry)) {
            restartCombat(cs, this.skillBonuses);
            this.combatDamageTexts = [];
            this.deps.audio.play(AudioEvent.RetryBootUp);
            return;
          }
          if (hitTest(a.x, a.y, dbtns.powerup) && this.score >= POINT_POWERUP_COST) {
            this.score -= POINT_POWERUP_COST;
            applyPointPowerup(cs);
            this.scorePopups.push({
              x: this.player.position.x,
              y: this.player.position.y - 20,
              text: `−${POINT_POWERUP_COST} ⚡POWER UP`,
              timer: 1.5,
            });
            this.deps.audio.play(AudioEvent.RecallCorrect);
            return;
          }
        }
      }
      // Still in defeat screen — advance timer but don't process combat input
      updateCombat(cs, dt, { attackTapped: false, chargeStarted: false, chargeHeld: false, chargeReleased: false, defendTapped: false }, this.skillBonuses);
      return;
    }

    const btns = getCombatButtonRects();

    // Determine which button was tapped / held
    const input: CombatInput = {
      attackTapped: false,
      chargeStarted: false,
      chargeHeld: this.combatChargeHeld,
      chargeReleased: false,
      defendTapped: false,
    };

    for (const a of actions) {
      if (a.type === 'primary') {
        if (hitTest(a.x, a.y, btns.attack)) {
          input.attackTapped = true;
        } else if (hitTest(a.x, a.y, btns.charge)) {
          input.chargeStarted = true;
          input.chargeHeld = true;
          this.combatChargeHeld = true;
        } else if (hitTest(a.x, a.y, btns.defend)) {
          input.defendTapped = true;
        }
      }
      if (a.type === 'primary_end') {
        if (this.combatChargeHeld) {
          input.chargeReleased = true;
          input.chargeHeld = false;
          this.combatChargeHeld = false;
        }
      }
    }

    // Keyboard shortcuts: left = attack, right = charge, down = defend
    for (const a of actions) {
      if (a.type === 'move' && a.dx < 0) {
        input.attackTapped = true;
      }
      if (a.type === 'move' && a.dx > 0 && !this.combatChargeHeld) {
        input.chargeStarted = true;
        input.chargeHeld = true;
        this.combatChargeHeld = true;
      }
      if (a.type === 'move' && a.dy > 0) {
        input.defendTapped = true;
      }
    }

    // ── Snapshot HP before update (for damage number popups) ──
    const prevEnemyHp = cs.enemyHp;
    const prevPlayerHp = cs.playerHp;

    const result = updateCombat(cs, dt, input, this.skillBonuses);

    // ── Spawn floating damage numbers on HP change ──
    const enemyDmg = prevEnemyHp - cs.enemyHp;
    if (enemyDmg > 0.005) {
      const pct = Math.round(enemyDmg * 100);
      const label = cs.lastCrit ? `⚡${pct}%` : `${pct}%`;
      this.deps.audio.play(cs.lastCrit ? AudioEvent.CritHit : AudioEvent.ComboHit);
      this.combatDamageTexts.push({
        x: GAME_WIDTH / 2 + (Math.sin(cs.elapsed * 17) * 14),
        y: 158,
        text: label,
        timer: 0.9,
        color: cs.lastCrit ? '#f97316' : '#fbbf24',
        dy: -35,
      });
    }
    const playerDmg = prevPlayerHp - cs.playerHp;
    if (playerDmg > 0.005) {
      const pct = Math.round(playerDmg * 100);
      this.deps.audio.play(AudioEvent.RecallIncorrect);
      this.combatDamageTexts.push({
        x: GAME_WIDTH / 2 + (Math.sin(cs.elapsed * 13) * 10),
        y: 262,
        text: `${pct}%`,
        timer: 0.9,
        color: '#ef4444',
        dy: 20,
      });
      this.combatShakeTimer = 0.18;
    }

    if (result.done) {
      const enemy = this.enemies.find((e) => e.id === this.combatEnemyId);
      if (result.victory) {
        // Enemy defeated
        if (enemy) {
          enemy.state.defeated = true;
          enemy.visible = false;
          // Victory celebration burst — extra sparkle particles
          for (let i = 0; i < 4; i++) {
            this.particles.emitSparkle(
              enemy.position.x + (Math.random() - 0.5) * 20,
              enemy.position.y - Math.random() * 16,
            );
          }
        }
        this.deps.audio.play(AudioEvent.RecallCorrect);

        // Award skill point for enemy kill
        addSkillPoints(this.skillTree, SP_PER_ENEMY_KILL);
        this.skillBonuses = getSkillBonuses(this.skillTree);

        // Add score
        this.score += result.bonusPoints;

        // Floating point popups
        this.scorePopups.push({
          x: this.player.position.x,
          y: this.player.position.y - 20,
          text: `+${result.bonusPoints}`,
          timer: 1.5,
        });
        this.scorePopups.push({
          x: this.player.position.x + 30,
          y: this.player.position.y - 30,
          text: `+${SP_PER_ENEMY_KILL} SP`,
          timer: 1.2,
        });
      } else {
        // Defeat (rare) — stun player
        this.playerStunTimer = 2.0;
        if (enemy) enemy.state.stunCooldown = 3;
        this.deps.audio.play(AudioEvent.RecallIncorrect);
      }
      this.combatState = null;
      this.combatEnemyId = '';
      this.combatDamageTexts = [];
      this.combatShakeTimer = 0;
      this.combatImmunityTimer = 0.5; // brief post-combat immunity
    }
  }

  /** Draw combat overlay on top of the island scene */
  private renderCombatOverlay(ctx: CanvasRenderingContext2D): void {
    const cs = this.combatState;
    if (!cs) return;

    const t = cs.elapsed;

    // ── Screen shake on enemy hit ──
    ctx.save();
    if (this.combatShakeTimer > 0) {
      const intensity = this.combatShakeTimer / 0.18 * 3;
      ctx.translate(
        Math.sin(t * 60) * intensity,
        Math.cos(t * 45) * intensity * 0.6,
      );
    }

    // Dim the background (fade in over first 0.3s)
    const fadeIn = Math.min(1, t / 0.3);
    ctx.fillStyle = rgba('#070b14', 0.70 * fadeIn);
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Score display (top-left) ──
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`★ ${Math.floor(this.score)}`, 10, 16);

    // ── Title ──
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText('COMBAT!', GAME_WIDTH / 2, 40);

    // ── Enemy sprite (large, centred) — shakes on hit ──
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 120);
    // Enemy recoil when hit
    if (cs.phase === 'player_attack' && cs.phaseTimer > 0.15) {
      const hitShake = Math.sin(t * 50) * 3;
      ctx.translate(hitShake, 0);
    }
    ctx.scale(2.5, 2.5);
    drawEnemy(ctx, 0, 0, cs.enemyKind, t);
    ctx.restore();

    // ── Enemy name + HP bar ──
    const barW = 120;
    const barH = 10;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = 170;

    // Enemy name label
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText(getEnemyDisplayName(cs.enemyKind), GAME_WIDTH / 2, barY - 16);

    // Enemy HP bar background
    ctx.fillStyle = '#1f2937';
    roundRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();
    // HP fill — flashes brighter when freshly damaged
    const hpW = Math.max(0, cs.enemyHp * barW);
    const recentHit = cs.phase === 'player_attack' && cs.phaseTimer > 0.2;
    ctx.fillStyle = recentHit ? '#ff6b6b'
      : cs.enemyHp > 0.3 ? TOKENS.colorRed400 : '#ef4444';
    if (hpW > 0) {
      roundRect(ctx, barX, barY, hpW, barH, 3);
      ctx.fill();
    }
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('ENEMY', GAME_WIDTH / 2, barY - 6);

    // ── Hit flash (yellow for normal, orange for crit) ──
    if (cs.phase === 'player_attack') {
      const flashAlpha = cs.phaseTimer / 0.3;
      const flashColor = cs.lastCrit ? '#f97316' : '#fbbf24';
      ctx.fillStyle = rgba(flashColor, flashAlpha * 0.4);
      ctx.fillRect(0, 60, GAME_WIDTH, 130);
    }

    // ── Player HP bar ──
    const pBarY = 270;
    ctx.fillStyle = '#1f2937';
    roundRect(ctx, barX, pBarY, barW, barH, 3);
    ctx.fill();
    const pHpRatio = cs.maxPlayerHp > 0 ? cs.playerHp / cs.maxPlayerHp : cs.playerHp;
    const pHpW = Math.max(0, Math.min(1, pHpRatio) * barW);
    // Color shifts: green → yellow → red as HP decreases
    const pBarColor = pHpRatio > 0.5 ? TOKENS.colorGreen400
      : pHpRatio > 0.25 ? TOKENS.colorYellow400 : TOKENS.colorRed400;
    ctx.fillStyle = pBarColor;
    if (pHpW > 0) {
      roundRect(ctx, barX, pBarY, pHpW, barH, 3);
      ctx.fill();
    }
    // Red tint flash when taking damage
    if (cs.lastDamageToPlayer > 0 && cs.phase === 'player_turn') {
      ctx.fillStyle = rgba('#ef4444', 0.2);
      ctx.fillRect(barX, pBarY, barW, barH);
    }
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('YOU', GAME_WIDTH / 2, pBarY - 6);

    // ── Enemy turn indicator ──
    if (cs.phase === 'enemy_turn') {
      const shake = Math.sin(t * 30) * 2;
      ctx.fillStyle = rgba('#ef4444', 0.6);
      ctx.font = TOKENS.fontMedium;
      ctx.fillText('Enemy attacks!', GAME_WIDTH / 2 + shake, 300);
    }

    // ── Charge meter (visible during charging) ──
    if (cs.phase === 'charging') {
      const meterX = 50;
      const meterY = 300;
      const meterW = 140;
      const meterH = 14;
      ctx.fillStyle = '#1f2937';
      roundRect(ctx, meterX, meterY, meterW, meterH, 4);
      ctx.fill();
      // Charge fill — cyan → yellow → green
      const fillW = cs.charge * meterW;
      const chargeColor = cs.charge < 0.5 ? TOKENS.colorCyan400
        : cs.charge < 0.85 ? TOKENS.colorYellow400 : TOKENS.colorGreen400;
      ctx.fillStyle = chargeColor;
      if (fillW > 0) {
        roundRect(ctx, meterX, meterY, fillW, meterH, 4);
        ctx.fill();
      }
      // ── Crit zone marker (golden line at CRIT_THRESHOLD) ──
      const critX = meterX + CRIT_THRESHOLD * meterW;
      ctx.strokeStyle = rgba('#facc15', 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(critX, meterY - 2);
      ctx.lineTo(critX, meterY + meterH + 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      // Crit zone label
      if (cs.charge >= CRIT_THRESHOLD) {
        ctx.fillStyle = rgba('#f97316', 0.6 + Math.sin(t * 8) * 0.4);
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('CRIT!', meterX + meterW / 2, meterY + meterH + 12);
      }
      // Pulsing "CHARGING..." text
      const pulse = 0.6 + Math.sin(t * 6) * 0.4;
      ctx.fillStyle = rgba('#facc15', pulse);
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('CHARGING...', GAME_WIDTH / 2, meterY - 6);
    }

    // ── Action buttons ──
    const btns = getCombatButtonRects();
    const isPlayerTurn = cs.phase === 'player_turn' || cs.phase === 'charging';
    const canAct = isPlayerTurn && cs.phase !== 'charging';
    drawButton(ctx, btns.attack.x, btns.attack.y, btns.attack.w, btns.attack.h,
      'ATK', canAct, 10);
    drawButton(ctx, btns.charge.x, btns.charge.y, btns.charge.w, btns.charge.h,
      'CHG', cs.phase === 'charging', 10);
    drawButton(ctx, btns.defend.x, btns.defend.y, btns.defend.w, btns.defend.h,
      'DEF', canAct, 10);
    // Dim buttons when it's not player's turn (greyed overlay)
    if (!isPlayerTurn && cs.phase !== 'victory' && cs.phase !== 'defeat') {
      ctx.fillStyle = rgba('#070b14', 0.45);
      ctx.fillRect(btns.attack.x, btns.attack.y, btns.defend.x + btns.defend.w - btns.attack.x, btns.attack.h);
    }

    // ── Turn counter + bonus damage indicator ──
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'right';
    ctx.fillText(`Turn ${cs.turnCount + 1}`, GAME_WIDTH - 12, 330);
    if (cs.bonusDamage > 0) {
      ctx.fillStyle = TOKENS.colorCyan400;
      ctx.fillText(`⚡+${Math.round(cs.bonusDamage * 100)}%`, GAME_WIDTH - 12, 344);
    }
    ctx.textAlign = 'center';

    // ── Critical hit flash ──
    if (cs.lastCrit && cs.phase === 'player_attack') {
      const critAlpha = cs.phaseTimer / 0.3;
      ctx.fillStyle = rgba('#f97316', critAlpha);
      ctx.font = TOKENS.fontTitle;
      ctx.fillText('CRITICAL!', GAME_WIDTH / 2, 250);
    }

    // ── Defending indicator ──
    if (cs.defending && cs.phase === 'enemy_turn') {
      ctx.fillStyle = rgba('#38bdf8', 0.8);
      ctx.font = TOKENS.fontMedium;
      ctx.fillText('🛡 DEFENDING', GAME_WIDTH / 2, 250);
    }

    // ── Floating damage numbers ──
    for (const ft of this.combatDamageTexts) {
      const alpha = Math.min(1, ft.timer / 0.3);
      ctx.fillStyle = rgba(ft.color, alpha);
      ctx.font = TOKENS.fontMedium;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    // ── Victory flash ──
    if (cs.phase === 'victory') {
      const vAlpha = Math.min(1, cs.phaseTimer / 0.3);
      ctx.fillStyle = rgba('#22c55e', vAlpha * 0.3);
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = rgba('#facc15', vAlpha);
      ctx.font = TOKENS.fontTitle;
      ctx.fillText('VICTORY!', GAME_WIDTH / 2, 200);
      ctx.font = TOKENS.fontMedium;
      ctx.fillStyle = rgba('#4ade80', vAlpha);
      ctx.fillText(`+${VICTORY_BONUS + this.skillBonuses.victoryBonusAdd} POINTS`, GAME_WIDTH / 2, 225);
    }

    // ── Defeat screen ──
    if (cs.phase === 'defeat') {
      const dAlpha = Math.min(1, (DEFEAT_DISPLAY_DURATION - cs.phaseTimer) / 0.3);
      ctx.fillStyle = rgba('#7f1d1d', dAlpha * 0.4);
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = rgba('#ef4444', dAlpha);
      ctx.font = TOKENS.fontTitle;
      ctx.fillText('DEFEATED!', GAME_WIDTH / 2, 195);
      // Show which enemy beat the player
      ctx.fillStyle = rgba('#fca5a5', dAlpha * 0.7);
      ctx.font = TOKENS.fontSmall;
      ctx.fillText(`by ${getEnemyDisplayName(cs.enemyKind)}`, GAME_WIDTH / 2, 215);

      if (cs.phaseTimer <= 0) {
        // Show action buttons after display timer
        const dbtns = getDefeatButtonRects();
        drawButton(ctx, dbtns.retry.x, dbtns.retry.y, dbtns.retry.w, dbtns.retry.h,
          'RETRY', true, 10);
        const canPowerup = this.score >= POINT_POWERUP_COST;
        drawButton(ctx, dbtns.powerup.x, dbtns.powerup.y, dbtns.powerup.w, dbtns.powerup.h,
          `⚡${POINT_POWERUP_COST}pts`, canPowerup, 10);

        ctx.font = TOKENS.fontSmall;
        ctx.fillStyle = rgba('#fbbf24', dAlpha);
        if (cs.retryCount > 0) {
          ctx.fillText(`Attempt ${cs.retryCount + 1}`, GAME_WIDTH / 2, 260);
        }
        if (cs.bonusDamage > 0) {
          ctx.fillStyle = rgba('#38bdf8', dAlpha);
          ctx.fillText(`Bonus: +${Math.round(cs.bonusDamage * 100)}% dmg`, GAME_WIDTH / 2, 320);
        }
      }
    }

    // ── Restore from screen shake ──
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  /** Draw floating score popups */
  private renderScorePopups(ctx: CanvasRenderingContext2D): void {
    for (const popup of this.scorePopups) {
      const alpha = Math.min(1, popup.timer / 0.5);
      ctx.fillStyle = rgba('#facc15', alpha);
      ctx.font = TOKENS.fontLarge;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }
}

/** Map player performance snapshot to a spawning tier */
function getPerformanceTier(perf?: PerformanceSnapshot): 'novice' | 'normal' | 'elite' {
  if (!perf || perf.completedCount === 0 || !perf.averageGrade) return 'normal';
  const g = perf.averageGrade;
  if (g === 'S' || g === 'A') return 'elite';
  if (g === 'D') return 'novice';
  return 'normal';
}

const fallbackLayout: TileMapLayout = {
  tileSize: 16,
  width: 15,
  height: 25,
  rows: Array.from({ length: 25 }, (_v, index) => {
    if (index < 3 || index > 22) {
      return 'WWWWWWWWWWWWWWW';
    }
    return 'WSSGGGGGGGGSSWW';
  }),
};
