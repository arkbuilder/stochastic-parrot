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
  /** If set, wrong answers call this immediately (pop quiz mode from enemy touch) */
  onFail?: () => void;
}

const DIALOG_BOX_Y = 190;
const DIALOG_BOX_H = 80;
const CHOICE_BTN_H = 22;
const CHOICE_BTN_GAP = 4;
const CHOICE_START_Y = DIALOG_BOX_Y + DIALOG_BOX_H + 8; // 278
const CHALLENGE_ITEMS_Y = 168;
const CHALLENGE_ITEM_H = 24;
const CHALLENGE_ITEM_GAP = 4;
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

  // Challenge state
  private challengeSelections: number[] = [];
  private challengeComplete = false;
  private challengeFeedback = '';
  private challengeShowHint = false;
  private challengeAttempts = 0;

  // Keyboard focus (-1 = none; indexes into choices or challenge items; last index = confirm)
  private kbFocus = -1;

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

    // Handle arrow key navigation (move actions)
    for (const a of actions) {
      if (a.type === 'move') {
        this.handleArrowNav(a.dy);
      }
    }

    const tap = actions.find(
      (a): a is Extract<InputAction, { type: 'primary' }> => a.type === 'primary',
    );
    if (!tap) return;

    // Detect keyboard confirm (Enter/Space produces center coords)
    const isKeyboard = tap.x === GAME_WIDTH / 2 && tap.y === GAME_HEIGHT / 2;

    switch (this.phase) {
      case 'dialog':
        if (isKeyboard && this.kbFocus >= 0) {
          this.handleDialogKeyConfirm();
        } else {
          this.handleDialogTap(tap.x, tap.y);
        }
        break;
      case 'challenge':
        if (isKeyboard && this.kbFocus >= 0) {
          this.handleChallengeKeyConfirm();
        } else {
          this.handleChallengeTap(tap.x, tap.y);
        }
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
    ctx.fillStyle = TOKENS.colorText;
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
    const startY = CHOICE_START_Y;

    for (let i = 0; i < choices.length; i++) {
      const btnY = startY + i * (CHOICE_BTN_H + CHOICE_BTN_GAP);
      const isHovered = this.choiceSelected === i;
      const isFocused = this.kbFocus === i;
      const pulse = (isHovered || isFocused) ? 0.3 + Math.sin(t * 6) * 0.1 : 0;

      ctx.fillStyle = (isHovered || isFocused) ? '#1e3a5f' : '#131b2e';
      roundRect(ctx, 16, btnY, GAME_WIDTH - 32, CHOICE_BTN_H, 4);
      ctx.fill();

      ctx.strokeStyle = isFocused ? TOKENS.colorYellow400 : rgba(TOKENS.colorCyan400, 0.6 + pulse);
      ctx.lineWidth = isFocused ? 2 : 1;
      roundRect(ctx, 16, btnY, GAME_WIDTH - 32, CHOICE_BTN_H, 4);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Focus indicator arrow
      if (isFocused) {
        ctx.fillStyle = TOKENS.colorYellow400;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'right';
        ctx.fillText('▸', 22, btnY + 14);
      }

      ctx.fillStyle = isFocused ? TOKENS.colorYellow300 : TOKENS.colorText;
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
      const startY = CHOICE_START_Y;
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
            // In pop quiz mode, wrong answer = immediate fail
            if (this.deps.onFail) {
              this.deps.onFail();
              return;
            }
          }
          return;
        }
      }
      return;
    }

    // No choices — just advance on tap (typewriter is complete, no feedback)
    this.advanceDialog();
  }

  private advanceDialog(): void {
    this.dialogIndex++;
    this.typewriterProgress = 0;
    this.typewriterTimer = 0;
    this.choiceSelected = -1;
    this.kbFocus = -1;

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
    this.kbFocus = -1;
    this.deps.audio.play(AudioEvent.BitChirp);
  }

  // ────────────────────────────────────
  // CHALLENGE PHASE
  // ────────────────────────────────────

  private renderChallenge(ctx: CanvasRenderingContext2D, t: number): void {
    const ch = this.mg.challenge;
    const itemStep = CHALLENGE_ITEM_H + CHALLENGE_ITEM_GAP;

    // Instruction header
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    const instrLines = this.wrapText(ch.instruction, GAME_WIDTH - 40, ctx);
    for (let i = 0; i < instrLines.length; i++) {
      ctx.fillText(instrLines[i]!, GAME_WIDTH / 2, 148 + i * 11);
    }

    // Render items as tappable buttons
    for (let i = 0; i < ch.items.length; i++) {
      const iy = CHALLENGE_ITEMS_Y + i * itemStep;
      const isSelected = this.challengeSelections.includes(i);
      const isFocused = this.kbFocus === i;
      const pulse = isSelected ? 0.2 + Math.sin(t * 4) * 0.1 : 0;

      // Button background
      ctx.fillStyle = isSelected ? '#2a1e40' : isFocused ? '#1e2a3f' : '#131b2e';
      roundRect(ctx, 20, iy, GAME_WIDTH - 40, CHALLENGE_ITEM_H, 5);
      ctx.fill();

      // Button border
      ctx.strokeStyle = isFocused ? TOKENS.colorYellow400 : isSelected ? TOKENS.colorYellow400 : rgba(TOKENS.colorCyan400, 0.4 + pulse);
      ctx.lineWidth = (isSelected || isFocused) ? 2 : 1;
      roundRect(ctx, 20, iy, GAME_WIDTH - 40, CHALLENGE_ITEM_H, 5);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Focus indicator arrow
      if (isFocused && !isSelected) {
        ctx.fillStyle = TOKENS.colorYellow400;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'right';
        ctx.fillText('\u25b8', 26, iy + 15);
      }

      // Check mark for selected
      if (isSelected) {
        ctx.fillStyle = TOKENS.colorYellow400;
        ctx.font = TOKENS.fontMedium;
        ctx.textAlign = 'left';
        ctx.fillText('✓', 26, iy + 16);
      }

      // Item text
      ctx.fillStyle = isSelected ? TOKENS.colorYellow300 : TOKENS.colorText;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText(ch.items[i]!, isSelected ? 38 : 28, iy + 15);
    }

    // Dynamic Y positions after items
    const itemsBottom = CHALLENGE_ITEMS_Y + ch.items.length * itemStep;
    const confirmY = itemsBottom + 6;
    const feedbackY = confirmY + 30;

    // Confirm button (when selections made)
    if (this.challengeSelections.length > 0 && !this.challengeComplete) {
      const confirmFocused = this.kbFocus === ch.items.length;
      const confirmPulse = 0.7 + Math.sin(t * 3) * 0.2;
      ctx.fillStyle = confirmFocused ? '#1e4a3e' : '#1e3a2e';
      roundRect(ctx, 60, confirmY, GAME_WIDTH - 120, 24, 5);
      ctx.fill();
      ctx.strokeStyle = confirmFocused ? TOKENS.colorYellow400 : rgba(TOKENS.colorGreen400, confirmPulse);
      ctx.lineWidth = confirmFocused ? 2 : 1.5;
      roundRect(ctx, 60, confirmY, GAME_WIDTH - 120, 24, 5);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = confirmFocused ? TOKENS.colorYellow300 : TOKENS.colorGreen400;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('CONFIRM ✓', GAME_WIDTH / 2, confirmY + 15);
    }

    // Feedback area (positioned dynamically below confirm)
    if (this.challengeFeedback) {
      ctx.fillStyle = this.challengeComplete ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      roundRect(ctx, 12, feedbackY, GAME_WIDTH - 24, 34, 5);
      ctx.fill();
      ctx.fillStyle = this.challengeComplete ? TOKENS.colorGreen400 : TOKENS.colorRed400;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      this.renderWrappedText(ctx, this.challengeFeedback, 20, feedbackY + 10, GAME_WIDTH - 40, 11);
    }

    // Hint (after 2+ wrong attempts)
    if (this.challengeShowHint && !this.challengeComplete) {
      ctx.fillStyle = rgba(TOKENS.colorYellow400, 0.7);
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText(`💡 ${ch.hintText}`, GAME_WIDTH / 2, feedbackY + 44);
    }

    // Tap to continue after success
    if (this.challengeComplete) {
      const blink = Math.sin(t * 4) > 0;
      if (blink) {
        ctx.fillStyle = TOKENS.colorTextMuted;
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('▼ tap to continue', GAME_WIDTH / 2, GAME_HEIGHT - 12);
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

    const itemStep = CHALLENGE_ITEM_H + CHALLENGE_ITEM_GAP;
    const itemsBottom = CHALLENGE_ITEMS_Y + ch.items.length * itemStep;
    const confirmY = itemsBottom + 6;

    // Check confirm button
    if (this.challengeSelections.length > 0) {
      if (x >= 60 && x <= GAME_WIDTH - 60 && y >= confirmY && y <= confirmY + 24) {
        this.evaluateChallenge();
        return;
      }
    }

    // Check item taps
    for (let i = 0; i < ch.items.length; i++) {
      const iy = CHALLENGE_ITEMS_Y + i * itemStep;
      if (x >= 20 && x <= GAME_WIDTH - 20 && y >= iy && y <= iy + CHALLENGE_ITEM_H) {
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
      this.kbFocus = -1;
      this.deps.audio.play(AudioEvent.RecallIncorrect);
      // In pop quiz mode, wrong answer = immediate fail
      if (this.deps.onFail) {
        this.deps.onFail();
        return;
      }
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
  // KEYBOARD NAVIGATION
  // ────────────────────────────────────

  private handleArrowNav(dy: number): void {
    if (dy === 0) return;

    if (this.phase === 'dialog') {
      const beat = this.currentBeat;
      if (!beat?.choices) return;
      // Only navigate when choices are visible (typewriter done, no feedback)
      if (this.typewriterProgress < beat.text.length || this.showingFeedback) return;
      const count = beat.choices.length;
      if (this.kbFocus < 0) {
        this.kbFocus = dy > 0 ? 0 : count - 1;
      } else {
        this.kbFocus = (this.kbFocus + dy + count) % count;
      }
    } else if (this.phase === 'challenge' && !this.challengeComplete) {
      const ch = this.mg.challenge;
      // items + (confirm button if selections exist)
      const count = ch.items.length + (this.challengeSelections.length > 0 ? 1 : 0);
      if (count === 0) return;
      if (this.kbFocus < 0) {
        this.kbFocus = dy > 0 ? 0 : count - 1;
      } else {
        this.kbFocus = (this.kbFocus + dy + count) % count;
      }
    }
  }

  private handleDialogKeyConfirm(): void {
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
        this.typewriterTimer = beat.text.length * TYPE_SPEED_MS;
        this.typewriterProgress = beat.text.length;
      }
      return;
    }

    // Select the focused choice
    if (beat.choices && this.kbFocus >= 0 && this.kbFocus < beat.choices.length) {
      const i = this.kbFocus;
      this.choiceSelected = i;
      const isCorrect = i === beat.correctChoice;
      this.feedbackCorrect = isCorrect;
      this.feedbackText = isCorrect
        ? (beat.correctFeedback ?? 'Correct!')
        : (beat.wrongFeedback ?? 'Not quite — try again!');
      this.showingFeedback = true;
      this.typewriterProgress = 0;
      this.typewriterTimer = 0;
      this.kbFocus = -1;

      if (isCorrect) {
        this.deps.audio.play(AudioEvent.RecallCorrect);
      } else {
        this.deps.audio.play(AudioEvent.RecallIncorrect);
        if (this.deps.onFail) {
          this.deps.onFail();
        }
      }
      return;
    }

    // No choices — just advance
    if (!beat.choices) {
      this.advanceDialog();
    }
  }

  private handleChallengeKeyConfirm(): void {
    const ch = this.mg.challenge;

    if (this.challengeComplete) {
      this.phase = 'wrapup';
      this.typewriterProgress = 0;
      this.typewriterTimer = 0;
      this.kbFocus = -1;
      return;
    }

    // Confirm button focused
    if (this.kbFocus === ch.items.length && this.challengeSelections.length > 0) {
      this.evaluateChallenge();
      return;
    }

    // Item focused — toggle/select
    if (this.kbFocus >= 0 && this.kbFocus < ch.items.length) {
      const i = this.kbFocus;
      if (ch.type === 'select' || ch.type === 'adjust') {
        this.challengeSelections = [i];
      } else {
        const idx = this.challengeSelections.indexOf(i);
        if (idx >= 0) {
          this.challengeSelections.splice(idx, 1);
        } else {
          this.challengeSelections.push(i);
        }
      }
      this.deps.audio.play(AudioEvent.BitChirp);
    }
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
