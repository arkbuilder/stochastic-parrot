import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import { ISLANDS } from '../data/islands';
import { CONCEPTS } from '../data/concepts';
import { createConceptCard, type ConceptCard, createLandmark, type LandmarkEntity, createParrot, createPlayer } from '../entities';
import { createEnemy, updateEnemy, type EnemyEntity } from '../entities/enemy';
import { createPowerup, type PowerupEntity, type PowerupKind } from '../entities/powerup';
import type { InputAction } from '../input/types';
import { renderHud } from '../rendering/hud';
import { ParticleSystem } from '../rendering/particles';
import { TileMap, type TileMapLayout } from '../rendering/tile-map';
import { TOKENS } from '../rendering/tokens';
import { drawPlayer, drawParrot, drawLandmark, drawConceptCard, drawPulsingArrow, drawHintBubble, drawVignette, rgba, roundRect, drawEnemy, drawPowerup, drawStunEffect } from '../rendering/draw';
import { updateAnimationSystem } from '../systems/animation-system';
import { type EncodeRuntimeState, updateEncodeSystem } from '../systems/encode-system';
import { updateMovementSystem } from '../systems/movement-system';
import { AudioEvent } from '../audio/types';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import type { EncounterStartData } from './flow-types';
import { distance } from '../utils/math';

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
}

type IslandPhase = 'island_arrive' | 'exploring' | 'encoding' | 'threat_triggered';

const PAUSE_BUTTON = { x: 206, y: 8, w: 24, h: 22 };
const ASSET_LOAD_TIMEOUT_MS = 10_000;

export class IslandScene implements Scene {
  private readonly island: (typeof ISLANDS)[number];
  private readonly player = createPlayer(24, 332);
  private readonly parrot = createParrot(18, 320);
  private readonly landmarks: LandmarkEntity[];
  private readonly conceptCards: ConceptCard[];
  private readonly enemies: EnemyEntity[];
  private readonly powerups: PowerupEntity[];
  private readonly particles = new ParticleSystem();
  private readonly encodeRuntime: EncodeRuntimeState = { heldCardId: null };

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

  constructor(private readonly deps: IslandSceneDeps) {
    const island = ISLANDS.find((entry) => entry.id === deps.islandId);
    if (!island) {
      throw new Error(`Island configuration missing: ${deps.islandId}`);
    }

    this.island = island;

    this.landmarks = this.island.landmarks.map((landmark) =>
      createLandmark(landmark.id, landmark.conceptId, landmark.x, landmark.y),
    );

    this.conceptCards = this.island.conceptIds.map((conceptId, index) => {
      const concept = CONCEPTS.find((entry) => entry.id === conceptId);
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
    void this.loadLayout();

    this.deps.telemetry.emit(TELEMETRY_EVENTS.onboardingStart, { island_id: this.island.id });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.islandArrived, { island_id: this.island.id });
    this.deps.audio.setMusicLayers(['base', 'rhythm']);
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
      // Still update enemies and powerups visually
      for (const enemy of this.enemies) updateEnemy(enemy, dt);
      for (const pu of this.powerups) pu.state.animationTime += dt;
      updateAnimationSystem(this.player, this.parrot, this.landmarks, this.conceptCards, dt);
      this.particles.update(dt);
      return;
    }

    // Update speed/shield timers
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

    updateMovementSystem(this.player, this.parrot, actions, dt);
    this.unlockConceptCardsByProximity();

    // Update enemies and check collisions
    for (const enemy of this.enemies) {
      updateEnemy(enemy, dt);
      if (enemy.state.stunCooldown <= 0 && this.checkCollision(this.player, enemy)) {
        if (this.playerShielded) {
          this.playerShielded = false;
          this.shieldTimer = 0;
          enemy.state.stunCooldown = 3;
          this.particles.emitSparkle(this.player.position.x, this.player.position.y - 8);
          this.deps.audio.play(AudioEvent.BitChirp);
        } else {
          this.playerStunTimer = 1.0;
          enemy.state.stunCooldown = 2;
          this.deps.audio.play(AudioEvent.RecallIncorrect);
          this.particles.emitSparkle(this.player.position.x, this.player.position.y);
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

    if (this.conceptCards.every((card) => card.state.placed)) {
      this.triggerThreat();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.nowMs / 1000;
    this.tileMap.render(ctx, 0, 0, t);

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
      const concept = CONCEPTS.find((c) => c.id === card.state.conceptId);
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
      drawEnemy(ctx, enemy.position.x, enemy.position.y, enemy.state.kind, t);
    }

    // Draw powerups
    for (const pu of this.powerups) {
      if (!pu.state.collected) {
        drawPowerup(ctx, pu.position.x, pu.position.y, pu.state.kind, t);
      }
    }

    this.particles.render(ctx);

    renderHud(ctx, {
      phase: 'encoding',
      conceptCards: this.conceptCards.filter((card) => card.state.unlocked),
      landmarks: this.landmarks,
      timerRatio: 1,
      healthRatio: 1,
      score: 0,
      attemptsUsed: 0,
    });

    // ── ONBOARDING HINTS ──
    this.renderOnboardingHints(ctx, t);

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

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.25);
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

  private unlockConceptCardsByProximity(): void {
    if (this.minigameActive) return;

    const nextCard = this.conceptCards.find((card) => !card.state.unlocked);
    if (!nextCard) {
      return;
    }

    const targetLandmark = this.landmarks.find((landmark) => landmark.state.conceptId === nextCard.state.conceptId);
    if (!targetLandmark) {
      return;
    }

    if (distance(this.player.position, targetLandmark.position) <= 40) {
      if (this.deps.onMinigameLaunch) {
        this.minigameActive = true;
        this.deps.onMinigameLaunch(
          nextCard.state.conceptId,
          targetLandmark.id,
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

  private spawnEnemies(): EnemyEntity[] {
    const lms = this.island.landmarks;
    const enemies: EnemyEntity[] = [];

    // One crab patrols between first two landmarks
    if (lms.length >= 2) {
      const midY1 = (lms[0]!.y + lms[1]!.y) / 2;
      enemies.push(createEnemy(
        `enemy_crab_0`,
        'crab',
        lms[0]!.x + 20, midY1,
        lms[1]!.x - 20, midY1 + 10,
        24,
      ));
    }

    // One jellyfish patrols between second and third landmarks (if >2)
    if (lms.length >= 3) {
      const midY2 = (lms[1]!.y + lms[2]!.y) / 2;
      enemies.push(createEnemy(
        `enemy_jelly_0`,
        'jellyfish',
        lms[1]!.x, midY2 - 15,
        lms[2]!.x - 10, midY2 + 15,
        20,
      ));
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

    return powerups;
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
    } else {
      this.playerShielded = true;
      this.shieldTimer = 8;
    }
  }
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
