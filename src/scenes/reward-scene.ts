import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { ParticleSystem } from '../rendering/particles';
import type { AudioManager } from '../audio/audio-manager';
import { AudioEvent } from '../audio/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import type { RewardData } from './flow-types';
import {
  drawSkyGradient, drawVignette, drawStars, drawButton,
  roundRect, rgba, drawProgressDots,
} from '../rendering/draw';

interface RewardSceneDeps {
  onContinue: () => void;
  telemetry: TelemetryClient;
  audio: AudioManager;
}

const CONTINUE_BUTTON = { x: 48, y: 330, w: 144, h: 36 };

export class RewardScene implements Scene {
  private elapsedMs = 0;
  private displayedScore = 0;
  private readonly particles = new ParticleSystem();

  constructor(private readonly reward: RewardData, private readonly deps: RewardSceneDeps) {}

  enter(context: SceneContext): void {
    void context;
    this.elapsedMs = 0;
    this.displayedScore = 0;
    this.deps.audio.setMusicLayers(['base', 'resolution']);
    this.deps.audio.play(AudioEvent.ChartFragmentEarned);

    for (let index = 0; index < 18; index += 1) {
      this.particles.emitSparkle(120 + (Math.random() - 0.5) * 100, 130 + (Math.random() - 0.5) * 60);
    }

    this.deps.telemetry.emit(TELEMETRY_EVENTS.rewardSeen, {
      island_id: this.reward.islandId,
      score: this.reward.islandScore,
      grade: this.reward.grade,
    });
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsedMs += dt * 1000;
    this.particles.update(dt);
    const progress = Math.min(1, this.elapsedMs / 900);
    this.displayedScore = Math.floor(this.reward.islandScore * progress);

    const press = actions.find((action) => action.type === 'primary');
    if (!press) {
      return;
    }

    if (
      (press.type === 'primary' &&
        press.x >= CONTINUE_BUTTON.x &&
        press.x <= CONTINUE_BUTTON.x + CONTINUE_BUTTON.w &&
        press.y >= CONTINUE_BUTTON.y &&
        press.y <= CONTINUE_BUTTON.y + CONTINUE_BUTTON.h) ||
      Number.isNaN(press.x)
    ) {
      this.deps.telemetry.emit(TELEMETRY_EVENTS.rewardCollected, {
        island_id: this.reward.islandId,
        score: this.reward.islandScore,
      });
      this.deps.telemetry.emit(TELEMETRY_EVENTS.onboardingComplete, {
        island_id: this.reward.islandId,
      });
      this.deps.onContinue();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsedMs / 1000;

    // Background — deep ocean gradient with stars
    drawSkyGradient(ctx, GAME_WIDTH, '#050810', '#0b1a30', GAME_HEIGHT);
    drawStars(ctx, GAME_WIDTH, GAME_HEIGHT * 0.4, t, 35);

    // Title with glow
    const titleGlow = 0.3 + Math.sin(t * 2) * 0.15;
    ctx.fillStyle = rgba(TOKENS.colorYellow400, titleGlow);
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, 68, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText('CHART FRAGMENT', GAME_WIDTH / 2, 68);

    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('RECOVERED', GAME_WIDTH / 2, 82);

    // Fragment card (animated reveal)
    this.renderFragment(ctx, t);

    // Particles on top
    this.particles.render(ctx);

    // Score with count-up
    const scoreY = 210;
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE  ${this.displayedScore}`, GAME_WIDTH / 2, scoreY);

    // Grade with scale-in
    const gradeReveal = Math.min(1, this.elapsedMs / 600);
    const gradeScale = 0.6 + gradeReveal * 0.4;
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, scoreY + 22);
    ctx.scale(gradeScale, gradeScale);
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.fillText(`GRADE  ${this.reward.grade}`, 0, 0);
    ctx.restore();

    // Combo
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(`COMBO PEAK ×${this.reward.comboPeak.toFixed(1)}`, GAME_WIDTH / 2, scoreY + 44);

    // Bonus rows
    let bonusY = scoreY + 60;
    if (this.reward.expertBonus) {
      ctx.fillStyle = TOKENS.colorGreen400;
      ctx.font = TOKENS.fontSmall;
      ctx.fillText('★ EXPERT BONUS +500', GAME_WIDTH / 2, bonusY);
      bonusY += 16;

      // Gold bar
      ctx.fillStyle = TOKENS.colorYellow400;
      roundRect(ctx, GAME_WIDTH / 2 - 20, bonusY - 6, 40, 4, 2);
      ctx.fill();
      bonusY += 10;
    }

    if (this.reward.encounterType === 'squid' && this.reward.expertBonus) {
      ctx.fillStyle = TOKENS.colorPink400;
      ctx.fillText('⚓ DEAD RECKONER +2000', GAME_WIDTH / 2, bonusY);
      bonusY += 16;
    }

    // Fragment progress dots (how many of 5 collected)
    drawProgressDots(ctx, GAME_WIDTH / 2, bonusY + 4, 1, 5);

    // Continue button
    drawButton(ctx, CONTINUE_BUTTON.x, CONTINUE_BUTTON.y, CONTINUE_BUTTON.w, CONTINUE_BUTTON.h,
      'CONTINUE', true, 12);

    // Vignette
    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.45);
  }

  private renderFragment(ctx: CanvasRenderingContext2D, t: number): void {
    const cx = GAME_WIDTH / 2;
    const cy = 144;
    const w = 96;
    const h = 76;

    // Card glow pulse
    const glow = 0.2 + Math.sin(t * 3) * 0.1;
    ctx.fillStyle = rgba(TOKENS.colorYellow400, glow);
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fill();

    // Card background gradient
    const cardGrad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    cardGrad.addColorStop(0, '#1e3a5f');
    cardGrad.addColorStop(1, '#0f2a4e');
    ctx.fillStyle = cardGrad;
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 6);
    ctx.fill();

    // Card border
    ctx.strokeStyle = TOKENS.colorYellow400;
    ctx.lineWidth = 2;
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 6);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Map "ink" shapes inside card (abstract island shapes)
    ctx.fillStyle = rgba(TOKENS.colorYellow400, 0.6);
    roundRect(ctx, cx - w / 2 + 8, cy - h / 2 + 10, 30, 18, 3);
    ctx.fill();
    ctx.fillStyle = rgba(TOKENS.colorCyan400, 0.5);
    roundRect(ctx, cx + 4, cy - 4, 34, 22, 3);
    ctx.fill();
    ctx.fillStyle = rgba(TOKENS.colorYellow300, 0.4);
    roundRect(ctx, cx - 16, cy + 14, 36, 16, 3);
    ctx.fill();

    // Compass rose in corner
    ctx.strokeStyle = rgba(TOKENS.colorCyan400, 0.5);
    const cRose = { x: cx + w / 2 - 12, y: cy - h / 2 + 12 };
    ctx.beginPath();
    ctx.moveTo(cRose.x, cRose.y - 6);
    ctx.lineTo(cRose.x, cRose.y + 6);
    ctx.moveTo(cRose.x - 6, cRose.y);
    ctx.lineTo(cRose.x + 6, cRose.y);
    ctx.stroke();

    // N indicator
    ctx.fillStyle = rgba('#ef4444', 0.7);
    ctx.beginPath();
    ctx.moveTo(cRose.x, cRose.y - 6);
    ctx.lineTo(cRose.x + 2, cRose.y - 2);
    ctx.lineTo(cRose.x - 2, cRose.y - 2);
    ctx.closePath();
    ctx.fill();
  }
}
