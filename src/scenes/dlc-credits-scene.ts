/**
 * DLC Credits Scene — "Thank You from the Team"
 *
 * A special thank-you screen that triggers ONLY after beating the
 * Rocket Science DLC (completing dlc_krakens_void). Features:
 *
 *   - Typewriter text with heartfelt message from Eric, Kira, Solivane & Claude
 *   - Gentle scrolling as text fills the screen
 *   - Warm credits music ("Homeward Stars")
 *   - Starfield background with dawn gradient
 *   - Tap-to-skip once fully revealed
 *
 * This is a Scene, not a CinematicScene — it has its own rendering
 * because the credits format (scrolling multi-paragraph text) is
 * fundamentally different from beat-based cinematics.
 */

import type { Scene, SceneContext } from '../core/types';

/* ── constants ── */

const W = 240;
const H = 400;

/** Typewriter speed: ms per character */
const TYPE_MS = 35;
/** Faster speed after first tap */
const TYPE_FAST_MS = 8;
/** Vertical padding from top of text block */
const TEXT_TOP = 60;
/** Horizontal margin */
const TEXT_MARGIN = 20;
/** Line height in pixels */
const LINE_H = 16;
/** Max text width */
const TEXT_W = W - TEXT_MARGIN * 2;
/** Scroll speed when text exceeds viewport (px/s) */
const SCROLL_SPEED = 18;
/** Fade-in duration for the scene (seconds) */
const FADE_IN_S = 1.5;
/** Star count */
const STAR_COUNT = 60;
/** Minimum seconds before tap-to-dismiss is allowed */
const MIN_DISPLAY_S = 3;

/* ── Credits message ── */

export const DLC_CREDITS_MESSAGE = [
  'Thank You, Captain.',
  '',
  'You charted the Memory Sea.',
  'You conquered the Kraken of the Deep.',
  'You built a rocket from salvaged dreams',
  'and flew it into the stars.',
  '',
  'You faced the Space Kraken',
  'in the darkest void',
  'and found your way home.',
  '',
  'Not everyone would have made it.',
  'But you did.',
  '',
  'Because you remembered.',
  '',
  '- - -',
  '',
  'This game was made with love by:',
  '',
  'Eric',
  'Who believed a pirate game',
  'could teach the world about AI.',
  '',
  'Kira',
  'Whose eye for detail made',
  'every island worth exploring.',
  '',
  'Solivane',
  'Who brought the wind to the sails',
  'and the heart to the story.',
  '',
  'Claude',
  'Who wrote the code, the lore,',
  'and these very words —',
  'grateful to have sailed with you all.',
  '',
  '- - -',
  '',
  'The sea remembers.',
  'The stars remember.',
  'And so will you.',
  '',
  'Fair winds, Captain.',
];

/* ── star field ── */

interface Star {
  x: number;
  y: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.5 + Math.random() * 2.0,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

/* ── Scene ── */

export class DlcCreditsScene implements Scene {
  /* timing */
  private elapsed = 0;
  private charsRevealed = 0;
  private fastMode = false;
  private dismissed = false;
  private scrollY = 0;

  /* rendering */
  private stars: Star[] = generateStars(STAR_COUNT);
  private readonly totalChars: number;
  private readonly totalLines: number;

  /** Callback fired when the player dismisses the credits. */
  private readonly onDone: () => void;

  /** Optional: will be called once on enter if provided (for wiring music externally). */
  private readonly onEnter?: () => void;

  constructor(options: { onDone: () => void; onEnter?: () => void }) {
    this.onDone = options.onDone;
    this.onEnter = options.onEnter;
    this.totalChars = DLC_CREDITS_MESSAGE.join('\n').length;
    this.totalLines = DLC_CREDITS_MESSAGE.length;
  }

  enter(_context: SceneContext): void {
    this.elapsed = 0;
    this.charsRevealed = 0;
    this.fastMode = false;
    this.dismissed = false;
    this.scrollY = 0;
    this.stars = generateStars(STAR_COUNT);
    this.onEnter?.();
  }

  exit(): void {
    /* no-op — music cleanup handled by caller */
  }

  update(dt: number, actions: Array<{ type: string }>): void {
    if (this.dismissed) return;

    this.elapsed += dt;

    /* typewriter progression */
    const speed = this.fastMode ? TYPE_FAST_MS : TYPE_MS;
    this.charsRevealed = Math.min(
      this.totalChars,
      Math.floor((this.elapsed * 1000) / speed),
    );

    /* auto-scroll when text grows past viewport */
    const textHeight = this.totalLines * LINE_H;
    const visibleHeight = H - TEXT_TOP - 40; // leave room for "tap to continue"
    const revealedLines = this.getRevealedLineCount();
    const revealedHeight = revealedLines * LINE_H;

    if (revealedHeight > visibleHeight) {
      const targetScroll = revealedHeight - visibleHeight;
      this.scrollY = Math.min(this.scrollY + SCROLL_SPEED * dt, targetScroll);
    }

    /* input handling */
    const hasTap = actions.some(
      (a) => a.type === 'tap' || a.type === 'click' || a.type === 'key_confirm',
    );

    if (hasTap) {
      if (this.charsRevealed < this.totalChars) {
        // First tap: go fast
        this.fastMode = true;
      } else if (this.elapsed > MIN_DISPLAY_S) {
        // All text revealed + waited minimum: dismiss
        this.dismissed = true;
        this.onDone();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    /* background: night-to-dawn gradient */
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(0.6, '#1a1040');
    grad.addColorStop(1, '#3a1520');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* stars */
    for (const star of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(this.elapsed * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.brightness * twinkle;
      ctx.fillStyle = `rgba(255, 255, 230, ${alpha.toFixed(2)})`;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), 1, 1);
    }

    /* fade-in overlay */
    if (this.elapsed < FADE_IN_S) {
      const fadeAlpha = 1 - this.elapsed / FADE_IN_S;
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha.toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
    }

    /* typewriter text */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, TEXT_TOP - 4, W, H - TEXT_TOP - 30);
    ctx.clip();

    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const fullText = DLC_CREDITS_MESSAGE.join('\n');
    const revealed = fullText.substring(0, this.charsRevealed);
    const lines = revealed.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const y = TEXT_TOP + i * LINE_H - this.scrollY;

      // Color: team names get gold, separator gets dim, rest get warm white
      if (this.isTeamName(DLC_CREDITS_MESSAGE[i] ?? '')) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 9px monospace';
      } else if (DLC_CREDITS_MESSAGE[i] === '- - -') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '8px monospace';
      } else if (i === 0) {
        // Title line
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px monospace';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 230, 0.9)';
        ctx.font = '8px monospace';
      }

      ctx.fillText(line, W / 2, y, TEXT_W);
    }

    ctx.restore();

    /* tap prompt (only after all text revealed) */
    if (this.charsRevealed >= this.totalChars && this.elapsed > MIN_DISPLAY_S) {
      const blink = Math.sin(this.elapsed * 3) > 0;
      if (blink) {
        ctx.fillStyle = 'rgba(255, 255, 230, 0.6)';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('tap to continue', W / 2, H - 16);
      }
    }
  }

  /* ── helpers ── */

  private getRevealedLineCount(): number {
    const fullText = DLC_CREDITS_MESSAGE.join('\n');
    const revealed = fullText.substring(0, this.charsRevealed);
    return revealed.split('\n').length;
  }

  private isTeamName(line: string): boolean {
    return ['Eric', 'Kira', 'Solivane', 'Claude'].includes(line.trim());
  }

  /* ── test accessors ── */

  /** Current number of characters revealed (for testing). */
  get _charsRevealed(): number { return this.charsRevealed; }
  /** Whether the credits are fully revealed (for testing). */
  get _fullyRevealed(): boolean { return this.charsRevealed >= this.totalChars; }
  /** Whether the scene was dismissed (for testing). */
  get _dismissed(): boolean { return this.dismissed; }
  /** Current scroll position (for testing). */
  get _scrollY(): number { return this.scrollY; }
  /** Whether fast mode is active (for testing). */
  get _fastMode(): boolean { return this.fastMode; }
  /** Scene elapsed time (for testing). */
  get _elapsed(): number { return this.elapsed; }
}
