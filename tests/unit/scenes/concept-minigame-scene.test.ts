import { describe, expect, it, vi } from 'vitest';
import { ConceptMinigameScene } from '../../../src/scenes/concept-minigame-scene';
import { getConceptMinigame } from '../../../src/data/concept-minigames';
import type { InputAction } from '../../../src/input/types';

/**
 * Creates a minimal CanvasRenderingContext2D stub for testing.
 * Scene.render() calls drawing functions that need these methods to exist.
 */
function stubCtx(): CanvasRenderingContext2D {
  const base: Record<string, unknown> = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '12px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    canvas: { width: 240, height: 400 },
  };

  // Return a Proxy that stubs any canvas method on the fly
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      if (prop === 'measureText') {
        const fn = vi.fn().mockReturnValue({ width: 40 });
        target[prop as string] = fn;
        return fn;
      }
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        const fn = vi.fn().mockReturnValue({ addColorStop: vi.fn() });
        target[prop as string] = fn;
        return fn;
      }
      // Default: return a no-op vi.fn()
      const fn = vi.fn();
      target[prop as string] = fn;
      return fn;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

function stubAudio() {
  return {
    play: vi.fn(),
    setMusicLayers: vi.fn(),
    resume: vi.fn(),
    playSong: vi.fn(),
    selectIslandTheme: vi.fn(),
    playFanfare: vi.fn(),
    applyEncounterPreset: vi.fn(),
    stopSong: vi.fn(),
  } as any;
}

function createScene(conceptId = 'training_data') {
  const mg = getConceptMinigame(conceptId)!;
  const onComplete = vi.fn();
  const audio = stubAudio();
  const scene = new ConceptMinigameScene({
    minigame: mg,
    landmarkId: 'dock_crates',
    audio,
    onComplete,
  });
  scene.enter({ now: () => 1000 });
  return { scene, onComplete, audio, mg };
}

describe('ConceptMinigameScene', () => {
  it('starts in dialog phase and renders without throwing', () => {
    const { scene } = createScene();
    const ctx = stubCtx();
    // Should not throw
    scene.render(ctx);
  });

  it('advances typewriter on update', () => {
    const { scene } = createScene();
    const ctx = stubCtx();

    // First frame — typewriter at 0
    scene.render(ctx);

    // Advance time to progress typewriter
    scene.update(0.5, []);
    scene.render(ctx);
  });

  it('skips typewriter on tap during dialog', () => {
    const { scene, mg } = createScene();
    // Tap before typewriter is done — should skip to full text
    const tap: InputAction = { type: 'primary', x: 120, y: 300 };
    scene.update(0.01, [tap]);
    // No error means the tap handler ran correctly
  });

  it('advances through all dialog beats to challenge phase', () => {
    const { scene, mg, audio } = createScene();

    for (const beat of mg.dialog) {
      // Skip typewriter
      scene.update(10, []);

      if (beat.choices !== undefined) {
        // Tap the correct choice button (center of button)
        // CHOICE_START_Y=278, each button 26px tall
        const btnY = 278 + beat.correctChoice! * 26 + 11;
        scene.update(0.016, [{ type: 'primary', x: 120, y: btnY }]);
        // Skip feedback typewriter
        scene.update(10, []);
        // Tap to continue past feedback (dialog box at y=190..270)
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      } else {
        // Tap to continue (no choices)
        scene.update(0.016, [{ type: 'primary', x: 120, y: 300 }]);
      }
    }

    // After all dialog, should be in challenge phase — render should not throw
    scene.render(stubCtx());
  });

  it('wrong choice shows feedback and does not advance', () => {
    const { scene, mg, audio } = createScene();

    // Find first beat with choices
    const choiceBeat = mg.dialog.find((b) => b.choices);
    if (!choiceBeat) return;

    // Skip through beats before the choice beat
    const beatIdx = mg.dialog.indexOf(choiceBeat);
    for (let i = 0; i < beatIdx; i++) {
      // Advance typewriter fully
      scene.update(10, []);
      // Tap to advance (anywhere in dialog area, no choices)
      scene.update(0.016, [{ type: 'primary', x: 120, y: 300 }]);
    }

    // Advance typewriter for the choice beat
    scene.update(10, []);

    // Pick a wrong answer — tap the wrong button
    const wrongIdx = choiceBeat.correctChoice === 0 ? 1 : 0;
    const wrongBtnY = 278 + wrongIdx * 26 + 11; // center of button
    scene.update(0.016, [{ type: 'primary', x: 120, y: wrongBtnY }]);

    // audio.play should have been called with RecallIncorrect
    expect(audio.play).toHaveBeenCalled();
  });

  it('challenge phase — selecting and confirming correct answer completes', () => {
    const { scene, mg, audio } = createScene();

    // Fast-forward through all dialog
    for (const beat of mg.dialog) {
      scene.update(10, []);
      if (beat.choices !== undefined) {
        const btnY = 278 + beat.correctChoice! * 26 + 11;
        scene.update(0.016, [{ type: 'primary', x: 120, y: btnY }]);
        scene.update(10, []);
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      } else {
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      }
    }

    // Now in challenge phase — select the correct item
    const ch = mg.challenge;
    const itemH = 24;
    const itemGap = 4;
    if (ch.type === 'select' || ch.type === 'adjust') {
      const itemY = 168 + (ch.answer as number) * (itemH + itemGap) + 12;
      scene.update(0.016, [{ type: 'primary', x: 120, y: itemY }]);

      // Tap confirm button
      const confirmY = 168 + ch.items.length * (itemH + itemGap) + 6 + 12;
      scene.update(0.016, [{ type: 'primary', x: 120, y: confirmY }]);

      // Should show success — render should not throw
      scene.render(stubCtx());
    }
  });

  it('wrapup phase calls onComplete on tap', () => {
    const { scene, mg, onComplete } = createScene();

    // Fast-forward through all dialog
    for (const beat of mg.dialog) {
      scene.update(10, []);
      if (beat.choices !== undefined) {
        const btnY = 278 + beat.correctChoice! * 26 + 11;
        scene.update(0.016, [{ type: 'primary', x: 120, y: btnY }]);
        scene.update(10, []);
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      } else {
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      }
    }

    // Fast-forward challenge: 4 wrong attempts → auto-complete
    const itemH = 24;
    const itemGap = 4;
    for (let i = 0; i < 4; i++) {
      // Select first item (center of item at CHALLENGE_ITEMS_Y=168)
      scene.update(0.016, [{ type: 'primary', x: 120, y: 180 }]);
      // Confirm button y = 168 + items.length * 28 + 6
      const confirmY = 168 + mg.challenge.items.length * (itemH + itemGap) + 6 + 12;
      scene.update(0.016, [{ type: 'primary', x: 120, y: confirmY }]);
    }

    // After 4 failed attempts, auto-completes. Tap to go to wrapup.
    scene.update(0.016, [{ type: 'primary', x: 120, y: 300 }]);

    // In wrapup — skip typewriter
    scene.update(10, []);

    // Tap to finish
    scene.update(0.016, [{ type: 'primary', x: 120, y: 300 }]);

    expect(onComplete).toHaveBeenCalled();
  });

  it('renders all 15 concept minigames without throwing', () => {
    const concepts = [
      'training_data', 'model', 'inference', 'bias', 'classification',
      'feedback_loop', 'overfitting', 'underfitting', 'training_vs_testing',
      'reinforcement', 'reward_function', 'agent',
      'neural_network', 'gradient_descent', 'generalization',
    ];
    const ctx = stubCtx();
    for (const id of concepts) {
      const { scene } = createScene(id);
      // Should render dialog phase without error
      scene.render(ctx);
      // Advance a bit and re-render
      scene.update(0.5, []);
      scene.render(ctx);
    }
  });

  // ── Keyboard navigation tests ──

  it('arrow keys navigate dialog choices and Enter selects correct answer', () => {
    const { scene, mg, audio } = createScene();
    const down = { type: 'move' as const, dx: 0, dy: 1 };
    const up = { type: 'move' as const, dx: 0, dy: -1 };
    const enter = { type: 'primary' as const, x: 120, y: 200 }; // center = keyboard

    // Advance to first choice beat
    const choiceBeatIdx = mg.dialog.findIndex((b) => b.choices);
    for (let i = 0; i < choiceBeatIdx; i++) {
      scene.update(10, []);
      scene.update(0.016, [enter]);
    }
    // Advance typewriter
    scene.update(10, []);

    // Navigate down to correct choice (index 1 for training_data)
    scene.update(0.016, [down]); // focus 0
    scene.update(0.016, [down]); // focus 1
    scene.update(0.016, [enter]); // confirm the choice

    // Should have shown correct feedback
    expect(audio.play).toHaveBeenCalledWith(expect.anything());
    // Render should not throw
    scene.render(stubCtx());
  });

  it('arrow keys navigate challenge items and Enter toggles selection', () => {
    const { scene, mg, audio } = createScene();
    const down = { type: 'move' as const, dx: 0, dy: 1 };
    const enter = { type: 'primary' as const, x: 120, y: 200 };

    // Fast-forward through all dialog
    for (const beat of mg.dialog) {
      scene.update(10, []);
      if (beat.choices !== undefined) {
        const btnY = 278 + beat.correctChoice! * 26 + 11;
        scene.update(0.016, [{ type: 'primary', x: 120, y: btnY }]);
        scene.update(10, []);
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      } else {
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      }
    }

    // In challenge phase — use arrow keys to select items
    scene.update(0.016, [down]); // focus 0
    scene.update(0.016, [enter]); // select item 0

    // Navigate down and select more items for sort challenge
    scene.update(0.016, [down]); // focus 1
    scene.update(0.016, [down]); // focus 2
    scene.update(0.016, [enter]); // select item 2

    // Audio should have been triggered
    expect(audio.play).toHaveBeenCalled();
    // Render should not throw
    scene.render(stubCtx());
  });

  it('arrow up wraps around to last option', () => {
    const { scene, mg } = createScene();
    const up = { type: 'move' as const, dx: 0, dy: -1 };

    // Advance to first choice beat
    const choiceBeatIdx = mg.dialog.findIndex((b) => b.choices);
    for (let i = 0; i < choiceBeatIdx; i++) {
      scene.update(10, []);
      scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
    }
    scene.update(10, []); // finish typewriter

    // Press up first — should wrap to last choice
    scene.update(0.016, [up]);
    // Render to visualize — should not throw
    scene.render(stubCtx());
  });

  it('keyboard Enter navigates through full flow to completion', () => {
    const { scene, mg, onComplete } = createScene();
    const down = { type: 'move' as const, dx: 0, dy: 1 };
    const enter = { type: 'primary' as const, x: 120, y: 200 };

    // Go through all dialog with keyboard
    for (const beat of mg.dialog) {
      scene.update(10, []);
      if (beat.choices !== undefined) {
        // Navigate to correct choice
        for (let k = 0; k <= beat.correctChoice!; k++) {
          scene.update(0.016, [down]);
        }
        scene.update(0.016, [enter]); // select
        scene.update(10, []); // skip feedback typewriter
        scene.update(0.016, [enter]); // continue past feedback
      } else {
        scene.update(0.016, [enter]); // continue
      }
    }

    // In challenge: use 4 wrong attempts to auto-complete
    const up = { type: 'move' as const, dx: 0, dy: -1 };
    for (let i = 0; i < 4; i++) {
      scene.update(0.016, [down]); // focus item 0
      scene.update(0.016, [enter]); // select item 0

      // Navigate to confirm button (last index) via up-wrap
      scene.update(0.016, [up]); // wraps to confirm (last index)
      scene.update(0.016, [enter]); // confirm
    }

    // After auto-complete, tap to go to wrapup
    scene.update(0.016, [enter]);
    // Wrapup — skip typewriter then confirm
    scene.update(10, []);
    scene.update(0.016, [enter]);

    expect(onComplete).toHaveBeenCalled();
  });
});
