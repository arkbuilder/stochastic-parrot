import type { Scene, SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { renderHud } from '../rendering/hud';
import { ParticleSystem } from '../rendering/particles';
import { TOKENS } from '../rendering/tokens';
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
}

const STORM_FLASH_BASE_MS = 550;
const DEFAULT_RETRY_COOLDOWN_MS = 1500;

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
    const shakeOffsetX = this.threat.state.shakeFrames > 0 ? (Math.random() - 0.5) * 4 : 0;
    const shakeOffsetY = this.threat.state.shakeFrames > 0 ? (Math.random() - 0.5) * 4 : 0;

    ctx.save();
    ctx.translate(shakeOffsetX, shakeOffsetY);

    if (this.data.encounterType === 'storm') {
      this.renderStorm(ctx);
    } else if (this.data.encounterType === 'battle') {
      this.renderBattle(ctx);
    } else if (this.data.encounterType === 'ruins') {
      this.renderRuins(ctx);
    } else if (this.data.encounterType === 'squid') {
      this.renderSquid(ctx);
    } else {
      this.renderFog(ctx);
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

    this.renderPromptHint(ctx);

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

  private renderFog(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 240, 400);

    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      ctx.fillStyle = isTarget ? '#22d3ee' : '#64748b';
      ctx.fillRect(landmark.position.x - 10, landmark.position.y - 10, 20, 20);

      if (this.assistLandmarkId === landmark.id) {
        ctx.strokeStyle = '#4ade80';
        ctx.strokeRect(landmark.position.x - 14, landmark.position.y - 14, 28, 28);
      }
    }

    const fogHeight = Math.min(320, this.threat.state.fogDepth * 320);
    ctx.fillStyle = 'rgba(40, 30, 60, 0.78)';
    ctx.fillRect(0, 0, 240, fogHeight);

    for (let i = 0; i < 3; i += 1) {
      this.particles.emitFogEdge(Math.random() * 240, fogHeight + Math.random() * 4);
    }
  }

  private renderStorm(ctx: CanvasRenderingContext2D): void {
    const flashAlpha = this.isStormFlashActive ? 1 : 0.2;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 240, 400);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    for (let index = 0; index < 28; index += 1) {
      const x = (index * 9 + (this.elapsedMs / 32) % 9) % 240;
      const y = (index * 14 + (this.elapsedMs / 14) % 24) % 320;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 10);
      ctx.stroke();
    }

    for (const landmark of this.landmarks) {
      const showLandmark = this.isStormFlashActive || this.assistLandmarkId === landmark.id;
      ctx.fillStyle = showLandmark ? 'rgba(34, 211, 238, 0.9)' : 'rgba(71, 85, 105, 0.35)';
      if (this.assistLandmarkId === landmark.id) {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.95)';
      }
      ctx.fillRect(landmark.position.x - 10, landmark.position.y - 10, 20, 20);
    }

    if (this.isStormFlashActive) {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.2 + flashAlpha * 0.2})`;
      ctx.fillRect(0, 0, 240, 320);
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
      ctx.beginPath();
      ctx.moveTo(120, 0);
      ctx.lineTo(136, 70);
      ctx.lineTo(112, 70);
      ctx.lineTo(128, 160);
      ctx.stroke();
    }
  }

  private renderBattle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 240, 400);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(36, 250, 44, 24);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(164, 104, 48, 24);

    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(12, 18, this.threat.state.healthRatio * 88, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(140, 18, this.battleEnemyHealthRatio * 88, 6);

    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      ctx.fillStyle = isTarget ? '#22d3ee' : '#64748b';
      ctx.fillRect(landmark.position.x - 10, landmark.position.y - 10, 20, 20);
      if (this.assistLandmarkId === landmark.id) {
        ctx.strokeStyle = '#4ade80';
        ctx.strokeRect(landmark.position.x - 14, landmark.position.y - 14, 28, 28);
      }
    }
  }

  private renderRuins(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, 240, 400);

    ctx.fillStyle = '#334155';
    ctx.fillRect(24, 80, 192, 128);

    const slots = this.recallState.prompts.length;
    const slotWidth = 40;
    for (let index = 0; index < slots; index += 1) {
      const x = 48 + index * 52;
      const solved = index < this.recallState.currentPromptIndex;
      ctx.strokeStyle = solved ? '#facc15' : '#94a3b8';
      ctx.strokeRect(x, 120, slotWidth, 30);
      if (solved) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x + 6, 126, slotWidth - 12, 18);
      }
    }

    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      ctx.fillStyle = isTarget ? '#22d3ee' : '#64748b';
      ctx.fillRect(landmark.position.x - 10, landmark.position.y - 10, 20, 20);
      if (this.assistLandmarkId === landmark.id) {
        ctx.strokeStyle = '#4ade80';
        ctx.strokeRect(landmark.position.x - 14, landmark.position.y - 14, 28, 28);
      }
    }
  }

  private renderSquid(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 240, 400);

    ctx.fillStyle = '#ec4899';
    ctx.fillRect(96, 32, 48, 24);

    for (const landmark of this.landmarks) {
      const isTarget = this.currentPrompt?.correctLandmarkId === landmark.id;
      ctx.fillStyle = isTarget ? '#f472b6' : '#7c3aed';
      ctx.fillRect(landmark.position.x - 12, landmark.position.y - 28, 24, 56);

      if (this.assistLandmarkId === landmark.id) {
        ctx.strokeStyle = '#4ade80';
        ctx.strokeRect(landmark.position.x - 16, landmark.position.y - 32, 32, 64);
      }
    }
  }

  private renderPromptHint(ctx: CanvasRenderingContext2D): void {
    if (!this.currentPrompt) {
      return;
    }

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
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
    ctx.fillText(
      `${modeLabel} ${this.recallState.currentPromptIndex + 1}/${this.recallState.prompts.length}`,
      8,
      340,
    );

    const glyph = this.currentPrompt.conceptId
      .split('_')
      .map((part) => part[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(164, 332, 68, 18);
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(164, 332, 68, 18);
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.textAlign = 'center';
    ctx.fillText(glyph, 198, 345);
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
