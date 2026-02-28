import type { Scene, SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import type { AudioManager } from '../audio/audio-manager';
import { AudioEvent } from '../audio/types';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import type { RewardData } from './flow-types';

interface RewardSceneDeps {
  onContinue: () => void;
  telemetry: TelemetryClient;
  audio: AudioManager;
}

const CONTINUE_BUTTON = { x: 68, y: 318, w: 104, h: 36 };

export class RewardScene implements Scene {
  constructor(private readonly reward: RewardData, private readonly deps: RewardSceneDeps) {}

  enter(context: SceneContext): void {
    void context;
    this.deps.audio.setMusicLayers(['base', 'resolution']);
    this.deps.audio.play(AudioEvent.ChartFragmentEarned);

    this.deps.telemetry.emit(TELEMETRY_EVENTS.rewardSeen, {
      island_id: this.reward.islandId,
      score: this.reward.islandScore,
      grade: this.reward.grade,
    });
  }

  exit(): void {}

  update(_dt: number, actions: InputAction[]): void {
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
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, 240, 400);

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.fillText('CHART FRAGMENT', 120, 76);

    this.renderFragment(ctx);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(`SCORE ${this.reward.islandScore}`, 120, 206);
    ctx.fillText(`GRADE ${this.reward.grade}`, 120, 224);
    ctx.fillText(`COMBO x${this.reward.comboPeak.toFixed(1)}`, 120, 242);

    if (this.reward.expertBonus) {
      ctx.fillStyle = '#4ade80';
      ctx.fillText('EXPERT BONUS +500', 120, 260);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(100, 268, 40, 4);
    }

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(CONTINUE_BUTTON.x, CONTINUE_BUTTON.y, CONTINUE_BUTTON.w, CONTINUE_BUTTON.h);
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(CONTINUE_BUTTON.x, CONTINUE_BUTTON.y, CONTINUE_BUTTON.w, CONTINUE_BUTTON.h);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontMedium;
    ctx.fillText('CONTINUE', 120, 339);
  }

  private renderFragment(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(72, 104, 96, 80);
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(72, 104, 96, 80);

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.fillRect(80, 112, 34, 24);
    ctx.fillRect(120, 122, 40, 28);
    ctx.fillRect(100, 152, 42, 20);
  }
}
