import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { drawVignette, rgba } from '../rendering/draw';

export class BootScene implements Scene {
  private elapsed = 0;
  private ready = false;

  constructor(private readonly onReady: () => void) {}

  enter(context: SceneContext): void {
    void context;
    this.elapsed = 0;
    this.ready = false;
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    void actions;
    this.elapsed += dt;

    if (this.elapsed >= 0.4 && !this.ready) {
      this.ready = true;
      this.onReady();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Dark ocean gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#0b1628');
    grad.addColorStop(1, '#051020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.6);

    // Compass rose animation
    const progress = Math.min(1, this.elapsed / 0.35);
    const scale = 0.5 + progress * 0.5;
    const alpha = progress;

    ctx.save();
    ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Compass circle
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();

    // N/S/E/W points
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();

    // Loading text
    ctx.fillStyle = rgba(TOKENS.colorText, progress);
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Setting Sail...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);

    // Loading bar
    const barW = 100;
    const barH = 4;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2 + 46;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = TOKENS.colorCyan400;
    ctx.fillRect(barX, barY, barW * progress, barH);
    ctx.textBaseline = 'alphabetic';
  }
}
