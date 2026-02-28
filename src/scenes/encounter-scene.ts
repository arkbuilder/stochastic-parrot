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

export class EncounterScene implements Scene {
  private readonly threat = createFogThreat();
  private readonly particles = new ParticleSystem();
  private readonly landmarks: LandmarkEntity[];
  private readonly recallState;
  private readonly encounterTemplate;

  private elapsedMs = 0;
  private retryCooldownMs = 0;
  private promptFailStreak = 0;
  private assistLandmarkId: string | null = null;
  private expertEligible = true;
  private comboPeak = 1;
  private resolved = false;

  private stormFlashMsRemaining = STORM_FLASH_BASE_MS;
  private stormNextFlashInMs = 900;

  constructor(private readonly data: EncounterStartData, private readonly deps: EncounterSceneDeps) {
    this.landmarks = data.landmarks;
    const prompts = data.placedConceptIds.map((conceptId) => {
      const targetLandmark = this.landmarks.find((landmark) => landmark.state.conceptId === conceptId);
      return {
        id: `prompt_${conceptId}`,
        conceptId,
        correctLandmarkId: targetLandmark?.id ?? '',
      } satisfies RecallPrompt;
    });

    this.encounterTemplate =
      ENCOUNTERS.find((entry) => entry.type === data.encounterType) ??
      ENCOUNTERS.find((entry) => entry.type === 'fog')!;

    this.recallState = createRecallState(prompts, this.encounterTemplate.timeWindowMs);
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
    } else {
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

    const selectedLandmark = this.landmarks.find((landmark) =>
      pointInRect(
        selectAction.x,
        selectAction.y,
        landmark.position.x - landmark.bounds.w / 2,
        landmark.position.y - landmark.bounds.h / 2,
        landmark.bounds.w,
        landmark.bounds.h,
      ),
    );

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
      this.promptFailStreak = 0;
      this.assistLandmarkId = null;

      if (this.data.encounterType === 'storm') {
        this.threat.state.healthRatio = Math.min(1, this.threat.state.healthRatio + 0.08);
      } else {
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

  private handleWrongAttempt(): void {
    this.promptFailStreak += 1;
    this.expertEligible = false;

    if (this.data.encounterType === 'storm') {
      this.threat.state.healthRatio = Math.max(0, this.threat.state.healthRatio - 0.25);
      this.threat.state.shakeFrames = 3;
      if (this.threat.state.healthRatio <= 0) {
        this.handleEncounterFail('storm_damage');
        return;
      }
    } else {
      applyRecallOutcomeToThreat(this.threat, false);
    }

    this.recallState.promptTimeRemainingMs = this.recallState.promptMaxTimeMs;
    this.recallState.timedOut = false;

    this.enableAssistIfNeeded();
  }

  private handleEncounterFail(reason: 'fog_engulf' | 'storm_damage'): void {
    this.retryCooldownMs = 1500;
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

  private renderPromptHint(ctx: CanvasRenderingContext2D): void {
    if (!this.currentPrompt) {
      return;
    }

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    const modeLabel = this.data.encounterType === 'storm' ? 'STORM FLASH' : 'FOG RECALL';
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
    const score = computeIslandScore(this.recallState.totalScore, 0, this.expertEligible);
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
      beat_id: this.data.islandId === 'island_01' ? 'B4' : 'I2_STORM',
      island_id: this.data.islandId,
    });

    if (this.expertEligible) {
      this.deps.telemetry.emit(TELEMETRY_EVENTS.secretFound, {
        island_id: this.data.islandId,
        secret_type: this.data.encounterType === 'storm' ? 'storm_relic' : 'expert_bonus_cave',
      });
    }

    this.deps.onResolved({
      islandId: this.data.islandId,
      islandScore: score,
      grade,
      expertBonus: this.expertEligible,
      comboPeak: this.comboPeak,
    });
  }
}

function pointInRect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}
