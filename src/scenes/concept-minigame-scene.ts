/**
 * concept-minigame-scene.ts — Interactive concept teaching scene.
 *
 * Flow: Dialog beats (RPG-style Socratic conversation with parrot)
 *     → Interactive challenge (sort/select/connect/adjust)
 *     → Wrap-up line
 *     → Callback to island scene (concept unlocked)
 *
 * No wall of text — short dialog bubbles, one at a time, with choice buttons.
 */

import type { Scene, SceneContext } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import { drawParrot, drawVignette, rgba, roundRect, drawLandmark } from '../rendering/draw';
import type { ConceptMinigame, DialogBeat, InteractiveChallenge } from '../data/concept-minigames';
import type { AudioManager } from '../audio/audio-manager';
import { AudioEvent } from '../audio/types';

type MinigamePhase = 'dialog' | 'challenge' | 'wrapup' | 'done';

interface ConceptMinigameSceneDeps {
  minigame: ConceptMinigame;
  landmarkId: string;
  audio: AudioManager;
  onComplete: () => void;
}

const DIALOG_BOX_Y = 260;
const DIALOG_BOX_H = 120;
const CHOICE_BTN_H = 22;
const CHOICE_BTN_GAP = 4;
const TYPE_SPEED_MS = 25; // ms per character for typewriter effect

export class ConceptMinigameScene implements Scene {
  private readonly mg: ConceptMinigame;
  private readonly landmarkId: string;
  private phase: MinigamePhase = 'dialog';

  // Dialog state
  private dialogIndex = 0;
  private typewriterProgress = 0;
  private typewriterTimer = 0;
  private choiceSelected = -1;
  private showingFeedback = false;
  private feedbackText = '';
  private feedbackCorrect = false;
  private waitingForTap = false;

  // Challenge state
  private challengeSelections: number[] = [];
  private challengeComplete = false;
  private challengeFeedback = '';
  private challengeShowHint = false;
  private challengeAttempts = 0;

  // Time tracking
  private elapsedMs = 0;
  private parrotAnimTime = 0;

  constructor(private readonly deps: ConceptMinigameSceneDeps) {
    this.mg = deps.minigame;
    this.landmarkId = deps.landmarkId;
  }

  enter(_context: SceneContext): void {
    this.phase = 'dialog';
    this.dialogIndex = 0;
    this.typewriterProgress = 0;
    this.typewriterTimer = 0;
    this.choiceSelected = -1;
    this.showingFeedback = false;
    this.waitingForTap = false;
    this.challengeSelections = [];
    this.challengeComplete = false;
    this.challengeFeedback = '';
    this.challengeShowHint = false;
    this.challengeAttempts = 0;
    this.elapsedMs = 0;
    this.deps.audio.setMusicLayers(['base']);
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.elapsedMs += dt * 1000;
    this.parrotAnimTime += dt;

    // Typewriter effect
    if (this.phase === 'dialog' || this.phase === 'wrapup') {
      this.typewriterTimer += dt * 1000;
      const currentText = this.getCurrentDisplayText();
      const targetLen = currentText.length;
      this.typewriterProgress = Math.min(targetLen, Math.floor(this.typewriterTimer / TYPE_SPEED_MS));
    }

    const tap = actions.find(
      (a): a is Extract<InputAction, { type: 'primary' }> => a.type === 'primary',
    );
    if (!tap) return;

    switch (this.phase) {
      case 'dialog':
        this.handleDialogTap(tap.x, tap.y);
        break;
      case 'challenge':
        this.handleChallengeTap(tap.x, tap.y);
        break;
      case 'wrapup':
        this.handleWrapupTap();
        break;
      case 'done':
        break;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.elapsedMs / 1000;

    // Background — dark with landmark
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw the landmark large and centered at top
    drawLandmark(ctx, GAME_WIDTH / 2, 70, this.landmarkId, false, 0.6, t, 2.5);

    // Concept name
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText(this.mg.conceptName, GAME_WIDTH / 2, 115);

    // Metaphor subtitle
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(this.mg.metaphor, GAME_WIDTH / 2, 128);

    // Phase-specific rendering
    switch (this.phase) {
      case 'dialog':
        this.renderDialog(ctx, t);
        break;
      case 'challenge':
        this.renderChallenge(ctx, t);
        break;
      case 'wrapup':
        this.renderWrapup(ctx, t);
        break;
      case 'done':
        break;
    }

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.3);
  }

  // ────────────────────────────────────
  // DIALOG PHASE
  // ────────────────────────────────────

  private get currentBeat(): DialogBeat | undefined {
    return this.mg.dialog[this.dialogIndex];
  }

  private getCurrentDisplayText(): string {
    if (this.showingFeedback) return this.feedbackText;
    if (this.phase === 'wrapup') return this.mg.wrapUp;
    return this.currentBeat?.text ?? '';
  }

  private renderDialog(ctx: CanvasRenderingContext2D, t: number): void {
    const beat = this.currentBeat;
    if (!beat) return;

    // Speaker portrait area
    if (beat.speaker === 'parrot') {
      drawParrot(ctx, 30, DIALOG_BOX_Y - 12, this.parrotAnimTime);
      ctx.fillStyle = TOKENS.colorGreen400;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText('Polly', 42, DIALOG_BOX_Y - 8);
    } else {
      // Narrator — show compass icon
      ctx.fillStyle = TOKENS.colorCyan400;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText('✦ Lore', 22, DIALOG_BOX_Y - 8);
    }

    // Dialog box
    ctx.fillStyle = 'rgba(19, 27, 46, 0.92)';
    roundRect(ctx, 8, DIALOG_BOX_Y, GAME_WIDTH - 16, DIALOG_BOX_H, 6);
    ctx.fill();
    ctx.strokeStyle = this.showingFeedback
      ? (this.feedbackCorrect ? TOKENS.colorGreen400 : TOKENS.colorRed400)
      : TOKENS.colorCyan400;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 8, DIALOG_BOX_Y, GAME_WIDTH - 16, DIALOG_BOX_H, 6);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Typewriter text
    const displayText = this.getCurrentDisplayText();
    const visibleText = displayText.slice(0, this.typewriterProgress);
    this.renderWrappedText(ctx, visibleText, 16, DIALOG_BOX_Y + 14, GAME_WIDTH - 32, 12);

    // If showing feedback, show "tap to continue"
    if (this.showingFeedback && this.typewriterProgress >= displayText.length) {
      const blink = Math.sin(t * 4) > 0;
      if (blink) {
        ctx.fillStyle = TOKENS.colorTextMuted;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('▼ tap to continue', GAME_WIDTH / 2, DIALOG_BOX_Y + DIALOG_BOX_H - 6);
      }
    }

    // Choice buttons (if beat has choices and no feedback showing)
    if (beat.choices && !this.showingFeedback && this.typewriterProgress >= beat.text.length) {
      this.renderChoices(ctx, beat.choices, t);
    }

    // If no choices and text is complete, show "tap to continue"
    if (!beat.choices && !this.showingFeedback && this.typewriterProgress >= beat.text.length) {
      this.waitingForTap = true;
      const blink = Math.sin(t * 4) > 0;
      if (blink) {
        ctx.fillStyle = TOKENS.colorTextMuted;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('▼ tap to continue', GAME_WIDTH / 2, DIALOG_BOX_Y + DIALOG_BOX_H - 6);
      }
    }
  }

  private renderChoices(ctx: CanvasRenderingContext2D, choices: string[], t: number): void {
    const startY = DIALOG_BOX_Y + DIALOG_BOX_H + 6;

    for (let i = 0; i < choices.length; i++) {
      const btnY = startY + i * (CHOICE_BTN_H + CHOICE_BTN_GAP);
      const isHovered = this.choiceSelected === i;
      const pulse = isHovered ? 0.3 + Math.sin(t * 6) * 0.1 : 0;

      ctx.fillStyle = isHovered ? '#1e3a5f' : '#131b2e';
      roundRect(ctx, 16, btnY, GAME_WIDTH - 32, CHOICE_BTN_H, 4);
      ctx.fill();

      ctx.strokeStyle = rgba(TOKENS.colorCyan400, 0.6 + pulse);
      ctx.lineWidth = 1;
      roundRect(ctx, 16, btnY, GAME_WIDTH - 32, CHOICE_BTN_H, 4);
      ctx.stroke();

      ctx.fillStyle = TOKENS.colorText;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${choices[i]}`, 24, btnY + 14);
    }
  }

  private handleDialogTap(x: number, y: number): void {
    const beat = this.currentBeat;
    if (!beat) {
      this.advanceToChallenge();
      return;
    }

    const displayText = this.getCurrentDisplayText();

    // If typewriter still going, skip to full text
    if (this.typewriterProgress < displayText.length) {
      this.typewriterProgress = displayText.length;
      return;
    }

    // If showing feedback, advance
    if (this.showingFeedback) {
      this.showingFeedback = false;
      if (this.feedbackCorrect) {
        this.advanceDialog();
      } else {
        // Reset typewriter for the original beat text
        this.typewriterTimer = beat.text.length * TYPE_SPEED_MS;
        this.typewriterProgress = beat.text.length;
      }
      return;
    }

    // If beat has choices, check which button was tapped
    if (beat.choices) {
      const startY = DIALOG_BOX_Y + DIALOG_BOX_H + 6;
      for (let i = 0; i < beat.choices.length; i++) {
        const btnY = startY + i * (CHOICE_BTN_H + CHOICE_BTN_GAP);
        if (x >= 16 && x <= GAME_WIDTH - 16 && y >= btnY && y <= btnY + CHOICE_BTN_H) {
          this.choiceSelected = i;
          const isCorrect = i === beat.correctChoice;
          this.feedbackCorrect = isCorrect;
          this.feedbackText = isCorrect
            ? (beat.correctFeedback ?? 'Correct!')
            : (beat.wrongFeedback ?? 'Not quite — try again!');
          this.showingFeedback = true;
          this.typewriterProgress = 0;
          this.typewriterTimer = 0;

          if (isCorrect) {
            this.deps.audio.play(AudioEvent.RecallCorrect);
          } else {
            this.deps.audio.play(AudioEvent.RecallIncorrect);
          }
          return;
        }
      }
      return;
    }

    // No choices — just advance on tap
    if (this.waitingForTap) {
      this.waitingForTap = false;
      this.advanceDialog();
    }
  }

  private advanceDialog(): void {
    this.dialogIndex++;
    this.typewriterProgress = 0;
    this.typewriterTimer = 0;
    this.choiceSelected = -1;

    if (this.dialogIndex >= this.mg.dialog.length) {
      this.advanceToChallenge();
    }
  }

  private advanceToChallenge(): void {
    this.phase = 'challenge';
    this.challengeSelections = [];
    this.challengeComplete = false;
    this.challengeFeedback = '';
    this.challengeShowHint = false;
    this.challengeAttempts = 0;
    this.deps.audio.play(AudioEvent.BitChirp);
  }

  // ────────────────────────────────────
  // CHALLENGE PHASE
  // ────────────────────────────────────

  private renderChallenge(ctx: CanvasRenderingContext2D, t: number): void {
    const ch = this.mg.challenge;

    // Instruction header
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    const instrLines = this.wrapText(ch.instruction, GAME_WIDTH - 40, ctx);
    for (let i = 0; i < instrLines.length; i++) {
      ctx.fillText(instrLines[i]!, GAME_WIDTH / 2, 148 + i * 11);
    }

    // Render items as tappable buttons
    const itemStartY = 170;
    const itemH = 28;
    const itemGap = 6;

    for (let i = 0; i < ch.items.length; i++) {
      const iy = itemStartY + i * (itemH + itemGap);
      const isSelected = this.challengeSelections.includes(i);
      const pulse = isSelected ? 0.2 + Math.sin(t * 4) * 0.1 : 0;

      // Button background
      ctx.fillStyle = isSelected ? '#2a1e40' : '#131b2e';
      roundRect(ctx, 20, iy, GAME_WIDTH - 40, itemH, 5);
      ctx.fill();

      // Button border
      ctx.strokeStyle = isSelected ? TOKENS.colorYellow400 : rgba(TOKENS.colorCyan400, 0.4 + pulse);
      ctx.lineWidth = isSelected ? 2 : 1;
      roundRect(ctx, 20, iy, GAME_WIDTH - 40, itemH, 5);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Check mark for selected
      if (isSelected) {
        ctx.fillStyle = TOKENS.colorYellow400;
        ctx.font = TOKENS.fontMedium;
        ctx.textAlign = 'left';
        ctx.fillText('✓', 26, iy + 18);
      }

      // Item text
      ctx.fillStyle = isSelected ? TOKENS.colorYellow300 : TOKENS.colorText;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText(ch.items[i]!, isSelected ? 38 : 28, iy + 17);
    }

    // Confirm button (when selections made)
    if (this.challengeSelections.length > 0 && !this.challengeComplete) {
      const confirmY = itemStartY + ch.items.length * (itemH + itemGap) + 4;
      const confirmPulse = 0.7 + Math.sin(t * 3) * 0.2;
      ctx.fillStyle = '#1e3a2e';
      roundRect(ctx, 60, confirmY, GAME_WIDTH - 120, 24, 5);
      ctx.fill();
      ctx.strokeStyle = rgba(TOKENS.colorGreen400, confirmPulse);
      ctx.lineWidth = 1.5;
      roundRect(ctx, 60, confirmY, GAME_WIDTH - 120, 24, 5);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = TOKENS.colorGreen400;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('CONFIRM ✓', GAME_WIDTH / 2, confirmY + 15);
    }

    // Feedback area
    if (this.challengeFeedback) {
      ctx.fillStyle = this.challengeComplete ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      roundRect(ctx, 12, DIALOG_BOX_Y + 8, GAME_WIDTH - 24, 40, 5);
      ctx.fill();
      ctx.fillStyle = this.challengeComplete ? TOKENS.colorGreen400 : TOKENS.colorRed400;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      this.renderWrappedText(ctx, this.challengeFeedback, 20, DIALOG_BOX_Y + 20, GAME_WIDTH - 40, 11);
    }

    // Hint (after 2+ wrong attempts)
    if (this.challengeShowHint && !this.challengeComplete) {
      ctx.fillStyle = rgba(TOKENS.colorYellow400, 0.7);
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText(`💡 ${ch.hintText}`, GAME_WIDTH / 2, DIALOG_BOX_Y + 62);
    }

    // Tap to continue after success
    if (this.challengeComplete) {
      const blink = Math.sin(t * 4) > 0;
      if (blink) {
        ctx.fillStyle = TOKENS.colorTextMuted;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('▼ tap to continue', GAME_WIDTH / 2, DIALOG_BOX_Y + DIALOG_BOX_H - 6);
      }
    }
  }

  private handleChallengeTap(x: number, y: number): void {
    const ch = this.mg.challenge;

    // If challenge is complete, tap advances to wrapup
    if (this.challengeComplete) {
      this.phase = 'wrapup';
      this.typewriterProgress = 0;
      this.typewriterTimer = 0;
      return;
    }

    const itemStartY = 170;
    const itemH = 28;
    const itemGap = 6;

    // Check confirm button
    if (this.challengeSelections.length > 0) {
      const confirmY = itemStartY + ch.items.length * (itemH + itemGap) + 4;
      if (x >= 60 && x <= GAME_WIDTH - 60 && y >= confirmY && y <= confirmY + 24) {
        this.evaluateChallenge();
        return;
      }
    }

    // Check item taps
    for (let i = 0; i < ch.items.length; i++) {
      const iy = itemStartY + i * (itemH + itemGap);
      if (x >= 20 && x <= GAME_WIDTH - 20 && y >= iy && y <= iy + itemH) {
        if (ch.type === 'select' || ch.type === 'adjust') {
          // Single selection
          this.challengeSelections = [i];
        } else {
          // Toggle for sort/connect (multi-select)
          const idx = this.challengeSelections.indexOf(i);
          if (idx >= 0) {
            this.challengeSelections.splice(idx, 1);
          } else {
            this.challengeSelections.push(i);
          }
        }
        this.deps.audio.play(AudioEvent.BitChirp);
        return;
      }
    }
  }

  private evaluateChallenge(): void {
    const ch = this.mg.challenge;
    this.challengeAttempts++;

    let correct = false;

    if (ch.type === 'select' || ch.type === 'adjust') {
      correct = this.challengeSelections.length === 1 && this.challengeSelections[0] === ch.answer;
    } else if (ch.type === 'sort') {
      // Check if selected items match the expected indices
      const expected = ch.answer as number[];
      correct = this.challengeSelections.length === expected.length &&
        expected.every((idx) => this.challengeSelections.includes(idx));
    } else if (ch.type === 'connect') {
      // For connect, just check if user selected reasonable items
      correct = this.challengeSelections.length >= 2;
    }

    if (correct) {
      this.challengeComplete = true;
      this.challengeFeedback = ch.successText;
      this.deps.audio.play(AudioEvent.RecallCorrect);
    } else {
      this.challengeFeedback = 'Not quite — try again!';
      this.challengeSelections = [];
      this.deps.audio.play(AudioEvent.RecallIncorrect);
      if (this.challengeAttempts >= 2) {
        this.challengeShowHint = true;
      }
      // After 4 failed attempts, auto-complete so player isn't stuck
      if (this.challengeAttempts >= 4) {
        this.challengeComplete = true;
        this.challengeFeedback = ch.successText + ' (The parrot helped you out!)';
        this.deps.audio.play(AudioEvent.RecallCorrect);
      }
    }
  }

  // ────────────────────────────────────
  // WRAPUP PHASE
  // ────────────────────────────────────

  private renderWrapup(ctx: CanvasRenderingContext2D, t: number): void {
    // Parrot
    drawParrot(ctx, 30, DIALOG_BOX_Y - 12, this.parrotAnimTime);
    ctx.fillStyle = TOKENS.colorGreen400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.fillText('Polly', 42, DIALOG_BOX_Y - 8);

    // Dialog box
    ctx.fillStyle = 'rgba(19, 27, 46, 0.92)';
    roundRect(ctx, 8, DIALOG_BOX_Y, GAME_WIDTH - 16, DIALOG_BOX_H, 6);
    ctx.fill();
    ctx.strokeStyle = TOKENS.colorYellow400;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 8, DIALOG_BOX_Y, GAME_WIDTH - 16, DIALOG_BOX_H, 6);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Wrapup text with typewriter
    const text = this.mg.wrapUp;
    const visibleText = text.slice(0, this.typewriterProgress);
    ctx.fillStyle = TOKENS.colorText;
    this.renderWrappedText(ctx, visibleText, 16, DIALOG_BOX_Y + 16, GAME_WIDTH - 32, 12);

    // "Concept unlocked!" badge
    ctx.fillStyle = rgba(TOKENS.colorYellow400, 0.8 + Math.sin(t * 3) * 0.2);
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.fillText('✦ CONCEPT LEARNED ✦', GAME_WIDTH / 2, DIALOG_BOX_Y + DIALOG_BOX_H - 24);

    if (this.typewriterProgress >= text.length) {
      const blink = Math.sin(t * 4) > 0;
      if (blink) {
        ctx.fillStyle = TOKENS.colorTextMuted;
        ctx.font = TOKENS.fontSmall;
        ctx.fillText('▼ tap to return', GAME_WIDTH / 2, DIALOG_BOX_Y + DIALOG_BOX_H - 6);
      }
    }
  }

  private handleWrapupTap(): void {
    const text = this.mg.wrapUp;
    if (this.typewriterProgress < text.length) {
      this.typewriterProgress = text.length;
      return;
    }

    this.phase = 'done';
    this.deps.audio.play(AudioEvent.ConceptPlaced);
    this.deps.onComplete();
  }

  // ────────────────────────────────────
  // TEXT HELPERS
  // ────────────────────────────────────

  private renderWrappedText(
    ctx: CanvasRenderingContext2D, text: string,
    x: number, y: number, maxWidth: number, lineHeight: number,
  ): void {
    const lines = this.wrapText(text, maxWidth, ctx);
    ctx.fillStyle = ctx.fillStyle; // preserve current color
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, x, y + i * lineHeight);
    }
  }

  private wrapText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
    ctx.font = TOKENS.fontSmall;
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
}
