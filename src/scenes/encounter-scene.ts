import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import { renderHud } from '../rendering/hud';
import { ParticleSystem } from '../rendering/particles';
import { TOKENS } from '../rendering/tokens';
import { drawLandmark, drawVignette, drawProgressDots, rgba, roundRect } from '../rendering/draw';
import type { AudioManager } from '../audio/audio-manager';
import { AudioEvent } from '../audio/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import { ENCOUNTERS } from '../data/encounters';
import { createFogThreat } from '../entities/threat';
import type { LandmarkEntity } from '../entities/landmark';
import {
  answerRecall,
  calculateBasePoints,
  createRecallState,
  tickRecallState,
  type RecallPrompt,
} from '../systems/recall-system';
import { applyRecallOutcomeToThreat, updateThreatSystem } from '../systems/threat-system';
import { computeIslandScore, computeMaxPromptScore, gradeFromRatio } from '../systems/scoring-system';
import type { EncounterStartData, RewardData } from './flow-types';

interface EncounterSceneDeps {
  onResolved: (reward: RewardData) => void;
  telemetry: TelemetryClient;
  audio: AudioManager;
  onPause?: () => void;
  isReducedMotionEnabled?: () => boolean;
}

const STORM_FLASH_BASE_MS = 550;
const DEFAULT_RETRY_COOLDOWN_MS = 1500;
const PAUSE_BUTTON = { x: 206, y: 8, w: 24, h: 22 };

export class EncounterScene implements Scene {
  private readonly threat = createFogThreat();
  private readonly particles = new ParticleSystem();
  private readonly landmarks: LandmarkEntity[];
  private readonly recallState;
  private readonly encounterTemplate;
  private readonly upgrades: Set<string>;

  private elapsedMs = 0;
  private retryCooldownMs = 0;
  private promptFailStreak = 0;
  private assistLandmarkId: string | null = null;
  private expertEligible = true;
  private comboPeak = 1;
  private resolved = false;

  private stormFlashMsRemaining = STORM_FLASH_BASE_MS;
  private stormNextFlashInMs = 900;

  private battleEnemyHealthRatio = 1;
  private battleHitsTaken = 0;

  private squidTotalFailures = 0;
  private squidAutoReleaseUsed = false;

  constructor(private readonly data: EncounterStartData, private readonly deps: EncounterSceneDeps) {
    this.landmarks = data.landmarks;
    this.upgrades = new Set(data.activeUpgrades);

    const prompts = data.placedConceptIds.map((conceptId) => {
      const targetLandmark = this.landmarks.find((landmark) => landmark.state.conceptId === conceptId);
      const originIsland = data.conceptOriginIsland?.[conceptId];
      return {
        id: `prompt_${conceptId}`,
        conceptId,
        correctLandmarkId:
          this.data.encounterType === 'squid' ? (originIsland ?? targetLandmark?.id ?? '') : (targetLandmark?.id ?? ''),
      } satisfies RecallPrompt;
    });

    this.encounterTemplate =
      ENCOUNTERS.find((entry) => entry.type === data.encounterType) ?? ENCOUNTERS.find((entry) => entry.type === 'fog')!;

    const promptWindowMs = this.encounterTemplate.timeWindowMs + (this.upgrades.has('golden_compass') ? 2_000 : 0);
    this.recallState = createRecallState(prompts, promptWindowMs);
  }

  enter(context: SceneContext): void {
    void context;
    this.elapsedMs = 0;
    this.promptFailStreak = 0;
    this.retryCooldownMs = 0;

    this.deps.audio.setMusicLayers(['base', 'tension']);
    this.deps.telemetry.emit(TELEMETRY_EVENTS.encounterStarted, {
      island_id: this.data.islandId,
      encounter_type: this.data.encounterType,
      prompt_count: this.recallState.prompts.length,
    });
    this.emitPromptedTelemetry();
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    const dtMs = dt * 1000;
    this.elapsedMs += dtMs;
    this.particles.update(dt);

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

    if (this.retryCooldownMs > 0) {
      this.retryCooldownMs -= dtMs;
      return;
    }

    if (this.data.encounterType === 'storm') {
      this.updateStormCycle(dtMs);
    } else if (this.data.encounterType === 'fog') {
      const threatResult = updateThreatSystem(this.threat, dt);
      if (threatResult.failed) {
        this.handleEncounterFail('fog_engulf');
        return;
      }
    }

    tickRecallState(this.recallState, dtMs);
    if (this.recallState.timedOut) {
      this.deps.audio.play(AudioEvent.RecallTimeout);
      this.deps.telemetry.emit(TELEMETRY_EVENTS.recallTimeout, {
        prompt_id: this.currentPrompt?.id,
        elapsed_ms: this.recallState.promptMaxTimeMs,
      });
      this.handleWrongAttempt();
      return;
    }

    const selectAction = actions.find(
      (action): action is Extract<InputAction, { type: 'primary' }> => action.type === 'primary' && action.y < 320,
    );
    if (!selectAction || !this.currentPrompt) {
      return;
    }

    if (this.data.encounterType === 'storm' && !this.isStormFlashActive) {
      return;
    }

    const selectedLandmark = this.pickLandmarkFromAction(selectAction);
    if (!selectedLandmark) {
      return;
    }

    const promptId = this.currentPrompt.id;
    const attemptNumber = this.recallState.attemptsForCurrentPrompt + 1;
    const responseMs = this.recallState.promptMaxTimeMs - this.recallState.promptTimeRemainingMs;
    const result = answerRecall(this.recallState, selectedLandmark.id, responseMs);

    this.deps.telemetry.emit(TELEMETRY_EVENTS.recallAnswered, {
      prompt_id: promptId,
      landmark_selected: selectedLandmark.id,
      correct: result.correct,
      response_ms: responseMs,
      attempt: attemptNumber,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.encounterPromptAnswered, {
      prompt_id: promptId,
      correct: result.correct,
      response_ms: responseMs,
      attempt: attemptNumber,
    });

    if (result.correct) {
      this.handleCorrectAnswer(result, promptId, attemptNumber, selectedLandmark);
      return;
    }

    if (this.promptFailStreak === 0) {
      this.deps.telemetry.emit(TELEMETRY_EVENTS.firstFail, {
        cause: 'wrong_landmark',
        prompt_id: promptId,
      });
    }

    this.deps.audio.play(AudioEvent.RecallIncorrect);
    if (this.data.encounterType === 'fog') {
      this.deps.audio.play(AudioEvent.FogAdvance);
    }
    this.handleWrongAttempt();
  }

  debugForceWinEncounter(): void {
    while (!this.recallState.completed && this.currentPrompt) {
      const result = answerRecall(this.recallState, this.currentPrompt.correctLandmarkId, 1_500);
      this.comboPeak = Math.max(this.comboPeak, result.comboMultiplier);
    }

    this.resolveEncounter();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const reducedMotion = this.deps.isReducedMotionEnabled?.() ?? false;
    const shakeOffsetX = this.threat.state.shakeFrames > 0 && !reducedMotion ? (Math.random() - 0.5) * 4 : 0;
    const shakeOffsetY = this.threat.state.shakeFrames > 0 && !reducedMotion ? (Math.random() - 0.5) * 4 : 0;

    ctx.save();
    ctx.translate(shakeOffsetX, shakeOffsetY);

    const t = this.elapsedMs / 1000;

    if (this.data.encounterType === 'storm') {
      this.renderStorm(ctx, t);
    } else if (this.data.encounterType === 'battle') {
      this.renderBattle(ctx, t);
    } else if (this.data.encounterType === 'ruins') {
      this.renderRuins(ctx, t);
    } else if (this.data.encounterType === 'squid') {
      this.renderSquid(ctx, t);
    } else {
      this.renderFog(ctx, t);
    }

    this.particles.render(ctx);

    renderHud(ctx, {
      phase: 'recall',
      conceptCards: [],
      landmarks: this.landmarks,
      timerRatio: this.recallState.promptTimeRemainingMs / this.recallState.promptMaxTimeMs,
      healthRatio: this.threat.state.healthRatio,
      score: this.recallState.totalScore,
      attemptsUsed: Math.min(3, this.promptFailStreak),
    });

    this.renderPromptHint(ctx, t);

    // Pause button
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

    ctx.restore();
  }

  private get currentPrompt() {
    return this.recallState.prompts[this.recallState.currentPromptIndex];
  }

  private get isStormFlashActive(): boolean {
    return this.stormFlashMsRemaining > 0;
  }

  private pickLandmarkFromAction(action: Extract<InputAction, { type: 'primary' }>): LandmarkEntity | undefined {
    return this.landmarks.find((landmark) => {
      const left = landmark.position.x - landmark.bounds.w / 2;
      const top = landmark.position.y - landmark.bounds.h / 2;
      return pointInRect(action.x, action.y, left, top, landmark.bounds.w, landmark.bounds.h);
    });
  }

  private updateStormCycle(dtMs: number): void {
    this.stormNextFlashInMs -= dtMs;
    this.stormFlashMsRemaining = Math.max(0, this.stormFlashMsRemaining - dtMs);

    if (this.stormNextFlashInMs <= 0) {
      this.stormFlashMsRemaining = this.getStormFlashWindowMs();
      this.stormNextFlashInMs = Math.max(900, 2_000 - this.recallState.currentPromptIndex * 250);
    }
  }

  private getStormFlashWindowMs(): number {
    if (this.promptFailStreak >= 2) {
      return STORM_FLASH_BASE_MS + 2_000;
    }
    return STORM_FLASH_BASE_MS;
  }

  private emitPromptedTelemetry(): void {
    this.deps.telemetry.emit(TELEMETRY_EVENTS.recallPrompted, {
      island_id: this.data.islandId,
      prompt_id: this.currentPrompt?.id,
      threat_type: this.data.encounterType,
    });
  }

  private handleCorrectAnswer(
    result: ReturnType<typeof answerRecall>,
    promptId: string,
    attemptNumber: number,
    selectedLandmark: LandmarkEntity,
  ): void {
    this.promptFailStreak = 0;
    this.assistLandmarkId = null;

    if (this.data.encounterType === 'storm') {
      this.threat.state.healthRatio = Math.min(1, this.threat.state.healthRatio + 0.08);
    } else if (this.data.encounterType === 'battle') {
      this.battleEnemyHealthRatio = Math.max(0, this.battleEnemyHealthRatio - 0.34);
    } else if (this.data.encounterType === 'squid') {
      this.threat.state.fogDepth = Math.max(0, this.threat.state.fogDepth - 0.18);
      this.threat.state.healthRatio = Math.max(0, 1 - this.threat.state.fogDepth);
    } else if (this.data.encounterType === 'fog') {
      applyRecallOutcomeToThreat(this.threat, true);
      this.deps.audio.play(AudioEvent.FogPushBack);
    }

    this.deps.audio.play(AudioEvent.RecallCorrect);
    this.particles.emitSparkle(selectedLandmark.position.x, selectedLandmark.position.y);
    this.comboPeak = Math.max(this.comboPeak, result.comboMultiplier);

    this.deps.telemetry.emit(TELEMETRY_EVENTS.scorePromptEarned, {
      prompt_id: promptId,
      base_points: calculateBasePoints(attemptNumber),
      speed_multiplier: result.speedMultiplier,
      combo_multiplier: result.comboMultiplier,
      total: result.scoreAwarded,
    });

    if (result.sequenceComplete) {
      this.resolveEncounter();
    } else {
      this.emitPromptedTelemetry();
    }
  }

  private handleWrongAttempt(): void {
    this.promptFailStreak += 1;
    this.expertEligible = false;

    if (this.data.encounterType === 'storm') {
      const stormHitBudget = this.upgrades.has('ironclad_hull') ? 5 : 4;
      this.threat.state.healthRatio = Math.max(0, this.threat.state.healthRatio - 1 / stormHitBudget);
      this.threat.state.shakeFrames = 3;
      if (this.threat.state.healthRatio <= 0) {
        this.handleEncounterFail('storm_damage');
        return;
      }
    } else if (this.data.encounterType === 'battle') {
      const battleHitBudget = this.upgrades.has('enchanted_cannon') ? 4 : 3;
      this.battleHitsTaken += 1;
      this.threat.state.healthRatio = Math.max(0, 1 - this.battleHitsTaken / battleHitBudget);
      this.threat.state.shakeFrames = 3;
      if (this.battleHitsTaken >= battleHitBudget) {
        this.handleEncounterFail('battle_sunk');
        return;
      }
    } else if (this.data.encounterType === 'ruins') {
      this.recallState.currentPromptIndex = 0;
      this.recallState.attemptsForCurrentPrompt = 0;
      this.recallState.firstAttemptStreak = 0;
      this.recallState.promptTimeRemainingMs = this.recallState.promptMaxTimeMs;
      this.recallState.timedOut = false;
      this.enableAssistIfNeeded();
      this.emitPromptedTelemetry();
      return;
    } else if (this.data.encounterType === 'squid') {
      this.squidTotalFailures += 1;
      this.threat.state.fogDepth = Math.min(1, this.threat.state.fogDepth + 0.12);
      this.threat.state.healthRatio = Math.max(0, 1 - this.threat.state.fogDepth);
      if (this.squidTotalFailures >= 4 && !this.squidAutoReleaseUsed) {
        this.squidAutoReleaseUsed = true;
        this.recallState.currentPromptIndex = Math.min(
          this.recallState.prompts.length - 1,
          this.recallState.currentPromptIndex + 2,
        );
        this.deps.telemetry.emit(TELEMETRY_EVENTS.encounterAssistTriggered, {
          prompt_id: this.currentPrompt?.id,
          assist_type: 'tentacle_auto_release',
        });
      }
      this.retryCooldownMs = 600;
    } else {
      applyRecallOutcomeToThreat(this.threat, false);
    }

    this.recallState.promptTimeRemainingMs = this.recallState.promptMaxTimeMs;
    this.recallState.timedOut = false;

    this.enableAssistIfNeeded();
  }

  private handleEncounterFail(reason: 'fog_engulf' | 'storm_damage' | 'battle_sunk'): void {
    this.retryCooldownMs = DEFAULT_RETRY_COOLDOWN_MS;
    this.deps.audio.play(AudioEvent.RecallTimeout);
    this.deps.telemetry.emit(TELEMETRY_EVENTS.retryStart, {
      island_id: this.data.islandId,
      reason,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.encounterFailed, {
      island_id: this.data.islandId,
      encounter_type: this.data.encounterType,
      fail_prompt_id: this.currentPrompt?.id,
      total_failures: this.promptFailStreak,
    });

    this.threat.state.fogDepth = 0.35;
    this.threat.state.healthRatio = 0.65;
    this.battleHitsTaken = 1;
  }

  private enableAssistIfNeeded(): void {
    if (this.promptFailStreak >= this.encounterTemplate.noviceAssistThreshold && this.currentPrompt) {
      this.assistLandmarkId = this.currentPrompt.correctLandmarkId;
      this.deps.audio.play(AudioEvent.BitChirp);
      this.deps.telemetry.emit(TELEMETRY_EVENTS.encounterAssistTriggered, {
        prompt_id: this.currentPrompt.id,
        assist_type: this.data.encounterType === 'storm' ? 'longer_flash' : 'landmark_highlight',
      });
    }
  }

  private renderFog(ctx: CanvasRenderingContext2D, t: number): void {
    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Landmarks with proper icons (scaled up for encounter visibility)
    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      const isAssist = this.assistLandmarkId === landmark.id;
      const glow = isTarget ? 0.8 : isAssist ? 1.0 : 0;
      drawLandmark(ctx, landmark.position.x, landmark.position.y, landmark.id, false, glow, t, 1.4);

      // "TAP HERE" pulsing indicator on target
      if (isTarget) {
        const pulse = 0.5 + Math.sin(t * 5) * 0.3;
        ctx.fillStyle = rgba('#22d3ee', pulse);
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('TAP', landmark.position.x, landmark.position.y + 20);
      }
    }

    // Fog wall with gradient
    const fogHeight = Math.min(320, this.threat.state.fogDepth * 320);
    const fogGrad = ctx.createLinearGradient(0, 0, 0, fogHeight);
    fogGrad.addColorStop(0, 'rgba(88, 28, 135, 0.85)');
    fogGrad.addColorStop(0.7, 'rgba(40, 30, 60, 0.6)');
    fogGrad.addColorStop(1, 'rgba(40, 30, 60, 0.15)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, fogHeight);

    // Fog edge particles
    for (let i = 0; i < 3; i += 1) {
      this.particles.emitFogEdge(Math.random() * GAME_WIDTH, fogHeight + Math.random() * 4);
    }

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.35);
  }

  private renderStorm(ctx: CanvasRenderingContext2D, t: number): void {
    const flashAlpha = this.isStormFlashActive ? 1 : 0.15;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Rain effect
    ctx.strokeStyle = rgba('#94a3b8', 0.3);
    ctx.lineWidth = 1;
    for (let index = 0; index < 32; index += 1) {
      const x = (index * 8 + (this.elapsedMs / 28) % 16) % GAME_WIDTH;
      const y = (index * 13 + (this.elapsedMs / 12) % 24) % 320;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 12);
      ctx.stroke();
    }

    // Landmarks (scaled up for encounter visibility)
    for (const landmark of this.landmarks) {
      const showLandmark = this.isStormFlashActive || this.assistLandmarkId === landmark.id;
      const glow = showLandmark ? 0.9 : 0.15;
      drawLandmark(ctx, landmark.position.x, landmark.position.y, landmark.id, false, glow, t, 1.4);
    }

    // Lightning flash
    if (this.isStormFlashActive) {
      ctx.fillStyle = rgba('#e2e8f0', 0.12 + flashAlpha * 0.1);
      ctx.fillRect(0, 0, GAME_WIDTH, 320);

      ctx.strokeStyle = rgba('#f8fafc', 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 0);
      ctx.lineTo(134, 65);
      ctx.lineTo(114, 72);
      ctx.lineTo(130, 155);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Flash hint
      ctx.fillStyle = rgba('#facc15', 0.8);
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('RECALL NOW!', GAME_WIDTH / 2, 295);
    }
  }

  private renderBattle(ctx: CanvasRenderingContext2D, t: number): void {
    // Ocean battle scene
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.4, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Player ship
    ctx.fillStyle = '#f59e0b';
    roundRect(ctx, 28, 248, 56, 28, 4);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    roundRect(ctx, 28, 248, 56, 28, 4);
    ctx.stroke();
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(56, 228); ctx.lineTo(70, 245); ctx.lineTo(56, 248);
    ctx.closePath();
    ctx.fill();

    // Enemy ship
    ctx.fillStyle = '#ef4444';
    roundRect(ctx, 156, 98, 56, 28, 4);
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    roundRect(ctx, 156, 98, 56, 28, 4);
    ctx.stroke();
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(184, 78); ctx.lineTo(198, 95); ctx.lineTo(184, 98);
    ctx.closePath();
    ctx.fill();

    // Health bars with labels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 14, 96, 12);
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.fillRect(8, 14, Math.max(0, this.threat.state.healthRatio * 96), 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(136, 14, 96, 12);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(136, 14, Math.max(0, this.battleEnemyHealthRatio * 96), 12);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('YOU', 56, 12);
    ctx.fillText('ENEMY', 184, 12);

    // Landmarks as targets (scaled up for encounter visibility)
    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      const isAssist = this.assistLandmarkId === landmark.id;
      const glow = isTarget ? 0.9 : isAssist ? 1 : 0.2;
      drawLandmark(ctx, landmark.position.x, landmark.position.y, landmark.id, false, glow, t, 1.4);
    }
  }

  private renderRuins(ctx: CanvasRenderingContext2D, t: number): void {
    // Temple interior
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(1, '#0f0e2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stone archway
    ctx.fillStyle = '#334155';
    ctx.fillRect(16, 64, 208, 8);
    ctx.fillRect(16, 64, 8, 160);
    ctx.fillRect(216, 64, 8, 160);
    ctx.fillStyle = '#475569';
    ctx.fillRect(16, 64, 208, 4);

    // Puzzle slots
    const slots = this.recallState.prompts.length;
    const slotWidth = 44;
    const totalW = slots * (slotWidth + 8) - 8;
    const startX = (GAME_WIDTH - totalW) / 2;
    for (let index = 0; index < slots; index += 1) {
      const sx = startX + index * (slotWidth + 8);
      const solved = index < this.recallState.currentPromptIndex;
      const active = index === this.recallState.currentPromptIndex;

      ctx.fillStyle = solved ? '#78350f' : '#1e293b';
      roundRect(ctx, sx, 108, slotWidth, 34, 4);
      ctx.fill();

      ctx.strokeStyle = active ? TOKENS.colorCyan400 : solved ? TOKENS.colorYellow400 : '#475569';
      ctx.lineWidth = active ? 2 : 1;
      roundRect(ctx, sx, 108, slotWidth, 34, 4);
      ctx.stroke();
      ctx.lineWidth = 1;

      if (solved) {
        ctx.fillStyle = TOKENS.colorYellow400;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓', sx + slotWidth / 2, 130);
      } else if (active) {
        const pulse = 0.5 + Math.sin(t * 4) * 0.3;
        ctx.fillStyle = rgba('#22d3ee', pulse);
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', sx + slotWidth / 2, 130);
      }
    }

    // Landmarks (scaled up for encounter visibility)
    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      const isAssist = this.assistLandmarkId === landmark.id;
      const glow = isTarget ? 0.9 : isAssist ? 1 : 0.2;
      drawLandmark(ctx, landmark.position.x, landmark.position.y, landmark.id, false, glow, t, 1.4);
    }
  }

  private renderSquid(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Kraken body
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(120, 42, 28, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(110, 38, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(130, 38, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(110, 38, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(130, 38, 2, 0, Math.PI * 2); ctx.fill();

    // Tentacles (animated)
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const baseX = 88 + i * 16;
      ctx.beginPath();
      ctx.moveTo(baseX, 60);
      for (let seg = 0; seg < 4; seg++) {
        const sy = 60 + seg * 20;
        const sx = baseX + Math.sin(t * 2 + i + seg) * 12;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Landmarks as island fragments (scaled up for encounter visibility)
    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      const isAssist = this.assistLandmarkId === landmark.id;
      const glow = isTarget ? 1 : isAssist ? 1 : 0.3;
      drawLandmark(ctx, landmark.position.x, landmark.position.y, landmark.id, false, glow, t, 1.4);
    }

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.5);
  }

  private renderPromptHint(ctx: CanvasRenderingContext2D, t: number): void {
    if (!this.currentPrompt) {
      return;
    }

    // Mode label
    const modeLabel =
      this.data.encounterType === 'storm'
        ? 'STORM FLASH'
        : this.data.encounterType === 'battle'
          ? 'NULL DUEL'
          : this.data.encounterType === 'ruins'
            ? 'RUINS CHAIN'
            : this.data.encounterType === 'squid'
              ? 'KRAKEN RECALL'
              : 'FOG RECALL';

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText(modeLabel, 8, 338);

    // Progress dots
    drawProgressDots(ctx, GAME_WIDTH / 2, 352, this.recallState.currentPromptIndex, this.recallState.prompts.length);

    // Find the correct landmark to show its icon in the prompt card
    const targetLandmark = this.landmarks.find(
      (lm) => lm.state.conceptId === this.currentPrompt!.conceptId,
    );
    const targetLandmarkId = targetLandmark?.id ?? '';

    const cardX = 134;
    const cardY = 326;
    const cardW = 98;
    const cardH = 32;
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, cardX, cardY, cardW, cardH, 5);
    ctx.fill();
    const pulse = 0.7 + Math.sin(t * 4) * 0.2;
    ctx.strokeStyle = rgba('#22d3ee', pulse);
    ctx.lineWidth = 1.5;
    roundRect(ctx, cardX, cardY, cardW, cardH, 5);
    ctx.stroke();
    ctx.lineWidth = 1;

    // "WHERE?" label
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText('WHERE?', cardX + 6, cardY + 14);

    // Draw mini landmark icon in the prompt card
    if (targetLandmarkId) {
      drawLandmark(ctx, cardX + cardW - 20, cardY + cardH / 2, targetLandmarkId, false, 0.4, t, 0.9);
    }

    // Instruction on first prompt
    if (this.recallState.currentPromptIndex === 0 && this.elapsedMs < 4000) {
      const hintAlpha = Math.min(1, Math.max(0, 1 - (this.elapsedMs - 2000) / 2000));
      if (hintAlpha > 0) {
        ctx.fillStyle = rgba('#facc15', hintAlpha * 0.8);
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('Tap the landmark where you placed it!', GAME_WIDTH / 2, 300);
      }
    }
  }

  private resolveEncounter(): void {
    if (this.resolved) {
      return;
    }

    this.resolved = true;
    const maxPossible = computeMaxPromptScore(this.recallState.prompts.length) + 500;
    const deadReckonerBonus = this.data.encounterType === 'squid' && this.expertEligible ? 2000 : 0;
    const score = computeIslandScore(this.recallState.totalScore, 0, this.expertEligible) + deadReckonerBonus;
    const grade = gradeFromRatio(score / maxPossible);

    this.deps.telemetry.emit(TELEMETRY_EVENTS.recallPhaseComplete, {
      island_id: this.data.islandId,
      correct_count: this.recallState.prompts.length,
      total_recall_ms: this.elapsedMs,
      bonus_earned: this.expertEligible,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.islandEncounterComplete, {
      island_id: this.data.islandId,
      encounter_type: this.data.encounterType,
      result: 'success',
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.encounterCompleted, {
      island_id: this.data.islandId,
      encounter_type: this.data.encounterType,
      prompts_correct: this.recallState.prompts.length,
      total_ms: this.elapsedMs,
      expert_bonus: this.expertEligible,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.scoreIslandComplete, {
      island_id: this.data.islandId,
      island_score: score,
      expert_bonus: this.expertEligible,
      grade,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.beatCompleted, {
      beat_id: this.data.encounterType,
      island_id: this.data.islandId,
    });

    if (this.expertEligible) {
      this.deps.telemetry.emit(TELEMETRY_EVENTS.secretFound, {
        island_id: this.data.islandId,
        secret_type: this.data.encounterType === 'squid' ? 'dead_reckoner' : 'expert_bonus',
      });
    }

    this.deps.onResolved({
      islandId: this.data.islandId,
      islandScore: score,
      grade,
      expertBonus: this.expertEligible,
      comboPeak: this.comboPeak,
      encounterType: this.data.encounterType,
    });
  }
}

function pointInRect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}
