import type { Scene, SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { renderHud } from '../rendering/hud';
import { ParticleSystem } from '../rendering/particles';
import { TOKENS } from '../rendering/tokens';
import type { AudioManager } from '../audio/audio-manager';
import { AudioEvent } from '../audio/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import { createFogThreat } from '../entities/threat';
import type { LandmarkEntity } from '../entities/landmark';
import { answerRecall, createRecallState, tickRecallState, type RecallPrompt } from '../systems/recall-system';
import { applyRecallOutcomeToThreat, updateThreatSystem } from '../systems/threat-system';
import { computeIslandScore, gradeFromRatio } from '../systems/scoring-system';
import type { EncounterStartData, RewardData } from './flow-types';

interface EncounterSceneDeps {
  onResolved: (reward: RewardData) => void;
  telemetry: TelemetryClient;
  audio: AudioManager;
}

export class EncounterScene implements Scene {
  private readonly threat = createFogThreat();
  private readonly particles = new ParticleSystem();
  private readonly landmarks: LandmarkEntity[];
  private readonly recallState;

  private elapsedMs = 0;
  private promptStartedAtMs = 0;
  private retryCooldownMs = 0;
  private promptFailStreak = 0;
  private assistLandmarkId: string | null = null;
  private expertEligible = true;
  private comboPeak = 1;
  private resolved = false;

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

    this.recallState = createRecallState(prompts, 12_000);
  }

  enter(context: SceneContext): void {
    void context;
    this.elapsedMs = 0;
    this.promptStartedAtMs = 0;
    this.promptFailStreak = 0;

    this.deps.audio.setMusicLayers(['base', 'tension']);
    this.deps.telemetry.emit(TELEMETRY_EVENTS.recallPrompted, {
      island_id: this.data.islandId,
      prompt_id: this.currentPrompt?.id,
      threat_type: 'fog',
    });
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsedMs += dt * 1000;
    this.particles.update(dt);

    if (this.retryCooldownMs > 0) {
      this.retryCooldownMs -= dt * 1000;
      return;
    }

    const threatResult = updateThreatSystem(this.threat, dt);
    if (threatResult.failed) {
      this.retryCooldownMs = 1500;
      this.threat.state.fogDepth = 0.45;
      this.threat.state.healthRatio = 0.55;
      this.deps.audio.play(AudioEvent.RecallTimeout);
      this.deps.telemetry.emit(TELEMETRY_EVENTS.retryStart, {
        island_id: this.data.islandId,
        reason: 'fog_engulf',
      });
      return;
    }

    tickRecallState(this.recallState, dt * 1000);
    if (this.recallState.timedOut) {
      this.promptFailStreak += 1;
      this.expertEligible = false;
      this.deps.audio.play(AudioEvent.RecallTimeout);
      applyRecallOutcomeToThreat(this.threat, false);
      this.deps.telemetry.emit(TELEMETRY_EVENTS.recallTimeout, {
        prompt_id: this.currentPrompt?.id,
        elapsed_ms: this.recallState.promptMaxTimeMs,
      });

      this.recallState.promptTimeRemainingMs = this.recallState.promptMaxTimeMs;
      this.recallState.timedOut = false;
      this.enableAssistIfNeeded();
    }

    const selectAction = actions.find(
      (action): action is Extract<InputAction, { type: 'primary' }> => action.type === 'primary' && action.y < 320,
    );
    if (!selectAction) {
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

    if (!selectedLandmark || !this.currentPrompt) {
      return;
    }

    const responseMs = this.recallState.promptMaxTimeMs - this.recallState.promptTimeRemainingMs;
    const result = answerRecall(this.recallState, selectedLandmark.id, responseMs);

    this.deps.telemetry.emit(TELEMETRY_EVENTS.recallAnswered, {
      prompt_id: this.currentPrompt.id,
      landmark_selected: selectedLandmark.id,
      correct: result.correct,
      response_ms: responseMs,
      attempt: this.recallState.attemptsForCurrentPrompt,
    });

    if (result.correct) {
      this.promptFailStreak = 0;
      this.assistLandmarkId = null;
      applyRecallOutcomeToThreat(this.threat, true);
      this.deps.audio.play(AudioEvent.RecallCorrect);
      this.deps.audio.play(AudioEvent.FogPushBack);
      this.particles.emitSparkle(selectedLandmark.position.x, selectedLandmark.position.y);
      this.comboPeak = Math.max(this.comboPeak, result.comboMultiplier);

      if (result.sequenceComplete) {
        this.resolveEncounter();
      } else {
        this.deps.telemetry.emit(TELEMETRY_EVENTS.recallPrompted, {
          island_id: this.data.islandId,
          prompt_id: this.currentPrompt?.id,
          threat_type: 'fog',
        });
      }
      return;
    }

    this.promptFailStreak += 1;
    this.expertEligible = false;
    applyRecallOutcomeToThreat(this.threat, false);
    this.deps.audio.play(AudioEvent.RecallIncorrect);
    this.deps.audio.play(AudioEvent.FogAdvance);

    if (this.promptFailStreak === 1) {
      this.deps.telemetry.emit(TELEMETRY_EVENTS.firstFail, {
        cause: 'wrong_landmark',
        prompt_id: this.currentPrompt.id,
      });
    }

    this.enableAssistIfNeeded();
  }

  debugForceWinEncounter(): void {
    while (!this.recallState.completed && this.currentPrompt) {
      const result = answerRecall(this.recallState, this.currentPrompt.correctLandmarkId, 1_500);
      applyRecallOutcomeToThreat(this.threat, true);
      this.comboPeak = Math.max(this.comboPeak, result.comboMultiplier);
    }

    this.resolveEncounter();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const shakeOffsetX = this.threat.state.shakeFrames > 0 ? (Math.random() - 0.5) * 4 : 0;
    const shakeOffsetY = this.threat.state.shakeFrames > 0 ? (Math.random() - 0.5) * 4 : 0;

    ctx.save();
    ctx.translate(shakeOffsetX, shakeOffsetY);

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

  private enableAssistIfNeeded(): void {
    if (this.promptFailStreak >= 2 && this.currentPrompt) {
      this.assistLandmarkId = this.currentPrompt.correctLandmarkId;
      this.deps.audio.play(AudioEvent.BitChirp);
    }
  }

  private renderPromptHint(ctx: CanvasRenderingContext2D): void {
    if (!this.currentPrompt) {
      return;
    }

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText(`Prompt ${this.recallState.currentPromptIndex + 1}/3`, 8, 340);

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
    const maxPossible = 1400;
    const score = computeIslandScore(this.recallState.totalScore, 0, this.expertEligible);
    const grade = gradeFromRatio(score / maxPossible);

    this.deps.telemetry.emit(TELEMETRY_EVENTS.recallPhaseComplete, {
      island_id: this.data.islandId,
      correct_count: this.recallState.prompts.length,
      total_recall_ms: this.elapsedMs,
      bonus_earned: this.expertEligible,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.beatCompleted, {
      beat_id: 'B4',
      island_id: this.data.islandId,
    });

    if (this.expertEligible) {
      this.deps.telemetry.emit(TELEMETRY_EVENTS.secretFound, {
        island_id: this.data.islandId,
        secret_type: 'expert_bonus_cave',
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
