import { GAME_HEIGHT, GAME_WIDTH, type Scene, type SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { drawVignette, rgba } from '../rendering/draw';
import { AudioEvent } from '../audio/types';

/** Phase flow: curtain → scroll → done */
type IntroPhase = 'curtain' | 'scroll' | 'done';

const CURTAIN_OPEN_DURATION = 1.2; // seconds for curtains to fully open
const TYPE_SPEED_MS = 35; // ms per character (normal speed)
const TYPE_SPEED_FAST_MS = 8; // ms per character when tapping
const SCROLL_PADDING_X = 24;
const SCROLL_PADDING_Y = 16;
const LINE_HEIGHT = 12;

const SCROLL_TEXT = [
  'Ahoy, brave navigator!',
  '',
  'You are Nemo, a young pirate',
  'who learns the secrets of',
  'Artificial Intelligence by',
  'exploring mysterious islands.',
  '',
  'Place concepts at landmarks,',
  'then recall them when the',
  'sea creatures attack!',
  '',
  'Memory is your greatest',
  'weapon on the Memory Sea.',
];

const FULL_TEXT = SCROLL_TEXT.join('\n');

export class IntroScene implements Scene {
  private phase: IntroPhase = 'curtain';
  private elapsed = 0;
  private curtainProgress = 0; // 0 = closed, 1 = open
  private curtainTriggered = false;
  private typewriterTimer = 0;
  private typewriterProgress = 0;
  private fastMode = false;
  private scrollDone = false;
  private lastTickChar = -1;
  private playSound: ((event: AudioEvent) => void) | null = null;
  private hasNarratedScroll = false;

  constructor(
    private readonly onDone: () => void,
    private readonly audioPlay?: (event: AudioEvent) => void,
    private readonly narrateScroll?: (lines: string[]) => void,
    private readonly stopNarration?: () => void,
  ) {
    this.playSound = audioPlay ?? null;
  }

  enter(_context: SceneContext): void {
    this.phase = 'curtain';
    this.elapsed = 0;
    this.curtainProgress = 0;
    this.curtainTriggered = false;
    this.typewriterTimer = 0;
    this.typewriterProgress = 0;
    this.fastMode = false;
    this.scrollDone = false;
    this.lastTickChar = -1;
    this.hasNarratedScroll = false;
  }

  exit(): void {
    this.stopNarration?.();
  }

  update(dt: number, actions: InputAction[]): void {
    this.elapsed += dt;

    const hasTap = actions.some((a) => a.type === 'primary');

    switch (this.phase) {
      case 'curtain':
        if (hasTap && !this.curtainTriggered) {
          this.curtainTriggered = true;
          this.playSound?.(AudioEvent.CurtainOpen);
        }

        if (this.curtainTriggered) {
          this.curtainProgress = Math.min(1, this.curtainProgress + dt / CURTAIN_OPEN_DURATION);
          if (this.curtainProgress >= 1) {
            this.phase = 'scroll';
            this.elapsed = 0;
            this.typewriterTimer = 0;
            this.typewriterProgress = 0;
            if (!this.hasNarratedScroll) {
              this.narrateScroll?.(SCROLL_TEXT);
              this.hasNarratedScroll = true;
            }
          }
        }
        break;

      case 'scroll': {
        // Speed up on tap
        if (hasTap) {
          this.fastMode = true;
        }

        const speed = this.fastMode ? TYPE_SPEED_FAST_MS : TYPE_SPEED_MS;
        this.typewriterTimer += dt * 1000;
        const newProgress = Math.min(FULL_TEXT.length, Math.floor(this.typewriterTimer / speed));

        // Play tick sound for each new character (throttled)
        if (newProgress > this.typewriterProgress && newProgress > this.lastTickChar + 2) {
          const char = FULL_TEXT[newProgress - 1];
          if (char && char !== ' ' && char !== '\n') {
            this.playSound?.(AudioEvent.TypewriterTick);
            this.lastTickChar = newProgress;
          }
        }

        this.typewriterProgress = newProgress;

        if (this.typewriterProgress >= FULL_TEXT.length && !this.scrollDone) {
          this.scrollDone = true;
          this.elapsed = 0;
        }

        // After text is complete, tap or wait 2s to exit
        if (this.scrollDone) {
          if (hasTap || this.elapsed > 2.0) {
            this.phase = 'done';
            this.stopNarration?.();
            this.onDone();
          }
        }
        break;
      }

      case 'done':
        break;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Deep ocean background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGrad.addColorStop(0, '#0b1628');
    bgGrad.addColorStop(0.5, '#0d2847');
    bgGrad.addColorStop(1, '#051020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.5);

    switch (this.phase) {
      case 'curtain':
        this.renderCurtain(ctx);
        break;
      case 'scroll':
        this.renderScroll(ctx);
        break;
      case 'done':
        this.renderScroll(ctx);
        break;
    }
  }

  private renderCurtain(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;

    // Dimmed background behind curtains
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Curtain fabric — two halves that slide apart
    const halfW = GAME_WIDTH / 2;
    const openAmount = easeOutCubic(this.curtainProgress) * halfW;

    // Left curtain
    const leftX = -openAmount;
    this.drawCurtainHalf(ctx, leftX, halfW, t, false);

    // Right curtain
    const rightX = halfW + openAmount;
    this.drawCurtainHalf(ctx, rightX, halfW, t, true);

    // Curtain rod
    ctx.fillStyle = '#8b6f47';
    ctx.fillRect(0, 0, GAME_WIDTH, 6);
    ctx.fillStyle = '#a0845c';
    ctx.fillRect(0, 0, GAME_WIDTH, 3);

    // Rod end caps
    for (const x of [4, GAME_WIDTH - 4]) {
      ctx.beginPath();
      ctx.arc(x, 3, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#c4a56e';
      ctx.fill();
    }

    // Prompt text
    if (!this.curtainTriggered) {
      const pulse = 0.5 + Math.sin(t * 3) * 0.3;
      ctx.fillStyle = rgba(TOKENS.colorYellow400, pulse);
      ctx.font = TOKENS.fontMedium;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tap to begin...', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }
  }

  private drawCurtainHalf(
    ctx: CanvasRenderingContext2D,
    x: number,
    w: number,
    t: number,
    isRight: boolean,
  ): void {
    ctx.save();

    // Clip to curtain area
    ctx.beginPath();
    ctx.rect(x, 0, w, GAME_HEIGHT);
    ctx.clip();

    // Curtain gradient — rich dark red
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    if (isRight) {
      grad.addColorStop(0, '#4a0e0e');
      grad.addColorStop(0.3, '#7a1a1a');
      grad.addColorStop(0.7, '#8b2020');
      grad.addColorStop(1, '#5c1212');
    } else {
      grad.addColorStop(0, '#5c1212');
      grad.addColorStop(0.3, '#8b2020');
      grad.addColorStop(0.7, '#7a1a1a');
      grad.addColorStop(1, '#4a0e0e');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, GAME_HEIGHT);

    // Vertical fold lines (drapes)
    const foldCount = 5;
    for (let i = 0; i < foldCount; i++) {
      const foldX = x + (w / foldCount) * (i + 0.5);
      const wave = Math.sin(t * 0.8 + i * 1.5) * 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(foldX + wave, 6);
      ctx.bezierCurveTo(
        foldX + wave * 0.5, GAME_HEIGHT * 0.33,
        foldX - wave * 0.5, GAME_HEIGHT * 0.66,
        foldX + wave, GAME_HEIGHT,
      );
      ctx.stroke();

      // Highlight fold
      ctx.strokeStyle = 'rgba(180,60,60,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(foldX + wave + 2, 6);
      ctx.bezierCurveTo(
        foldX + wave * 0.5 + 2, GAME_HEIGHT * 0.33,
        foldX - wave * 0.5 + 2, GAME_HEIGHT * 0.66,
        foldX + wave + 2, GAME_HEIGHT,
      );
      ctx.stroke();
    }

    // Gold trim along the inner edge
    const trimX = isRight ? x : x + w - 3;
    const trimGrad = ctx.createLinearGradient(trimX, 0, trimX + 3, 0);
    trimGrad.addColorStop(0, 'rgba(196,165,110,0.6)');
    trimGrad.addColorStop(0.5, 'rgba(218,195,140,0.8)');
    trimGrad.addColorStop(1, 'rgba(196,165,110,0.4)');
    ctx.fillStyle = trimGrad;
    ctx.fillRect(trimX, 6, 3, GAME_HEIGHT);

    // Tassel at top inner corner
    const tasselX = isRight ? x + 6 : x + w - 6;
    ctx.fillStyle = '#c4a56e';
    ctx.beginPath();
    ctx.arc(tasselX, 20, 4, 0, Math.PI * 2);
    ctx.fill();
    // Tassel strings
    for (let i = -2; i <= 2; i++) {
      ctx.strokeStyle = 'rgba(196,165,110,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tasselX + i * 1.5, 24);
      ctx.lineTo(tasselX + i * 2 + Math.sin(t * 2 + i) * 1.5, 40);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderScroll(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsed;

    // Scroll parchment background
    const scrollX = 20;
    const scrollY = 40;
    const scrollW = GAME_WIDTH - 40;
    const scrollH = 300;

    // Parchment shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRectFill(ctx, scrollX + 3, scrollY + 3, scrollW, scrollH, 6);

    // Parchment body
    const parchGrad = ctx.createLinearGradient(scrollX, scrollY, scrollX + scrollW, scrollY + scrollH);
    parchGrad.addColorStop(0, '#e8d5a3');
    parchGrad.addColorStop(0.3, '#f0e4c4');
    parchGrad.addColorStop(0.7, '#ede0b8');
    parchGrad.addColorStop(1, '#d4c08a');
    ctx.fillStyle = parchGrad;
    roundRectFill(ctx, scrollX, scrollY, scrollW, scrollH, 6);

    // Parchment edge highlight
    ctx.strokeStyle = 'rgba(180,150,90,0.6)';
    ctx.lineWidth = 1;
    roundRectStroke(ctx, scrollX + 0.5, scrollY + 0.5, scrollW - 1, scrollH - 1, 6);

    // Aged stain effect
    ctx.fillStyle = 'rgba(160,130,70,0.08)';
    ctx.beginPath();
    ctx.arc(scrollX + scrollW * 0.3, scrollY + scrollH * 0.4, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(scrollX + scrollW * 0.7, scrollY + scrollH * 0.6, 20, 0, Math.PI * 2);
    ctx.fill();

    // Scroll roll at top and bottom
    this.drawScrollRoll(ctx, scrollX - 2, scrollY - 4, scrollW + 4);
    this.drawScrollRoll(ctx, scrollX - 2, scrollY + scrollH - 2, scrollW + 4);

    // Typewriter text on the scroll
    const visibleText = FULL_TEXT.slice(0, this.typewriterProgress);
    const lines = visibleText.split('\n');

    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#3a2a14';

    const textX = scrollX + SCROLL_PADDING_X;
    let textY = scrollY + SCROLL_PADDING_Y + 12;

    for (const line of lines) {
      ctx.fillText(line, textX, textY);
      textY += LINE_HEIGHT;
    }

    // Blinking cursor at end of text
    if (!this.scrollDone && Math.floor(t * 3) % 2 === 0) {
      const lastLine = lines[lines.length - 1] ?? '';
      const cursorX = textX + ctx.measureText(lastLine).width + 1;
      const cursorY = textY - LINE_HEIGHT;
      ctx.fillStyle = '#3a2a14';
      ctx.fillRect(cursorX, cursorY, 1, 8);
    }

    // Continue prompt after text is done
    if (this.scrollDone) {
      const pulse = 0.4 + Math.sin(t * 3) * 0.3;
      ctx.fillStyle = rgba(TOKENS.colorCyan400, pulse);
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tap to set sail...', GAME_WIDTH / 2, scrollY + scrollH + 24);
    }

    // Compass accent in bottom corner
    const compassAlpha = this.scrollDone ? 0.6 : 0.2;
    ctx.globalAlpha = compassAlpha;
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, scrollY + scrollH + 54, 10, 0, Math.PI * 2);
    ctx.stroke();
    // North pointer
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, scrollY + scrollH + 46);
    ctx.lineTo(GAME_WIDTH / 2 - 2, scrollY + scrollH + 54);
    ctx.lineTo(GAME_WIDTH / 2 + 2, scrollY + scrollH + 54);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawScrollRoll(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    // Wooden roll cylinder
    const grad = ctx.createLinearGradient(x, y, x, y + 8);
    grad.addColorStop(0, '#a08050');
    grad.addColorStop(0.3, '#c4a56e');
    grad.addColorStop(0.6, '#b8945a');
    grad.addColorStop(1, '#8b6f47');
    ctx.fillStyle = grad;
    roundRectFill(ctx, x, y, w, 8, 3);

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 4, y + 1, w - 8, 2);
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function roundRectFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function roundRectStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.stroke();
}
