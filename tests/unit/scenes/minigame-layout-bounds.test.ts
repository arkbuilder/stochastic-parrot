import { describe, expect, it, vi } from 'vitest';
import { ConceptMinigameScene } from '../../../src/scenes/concept-minigame-scene';
import { getConceptMinigame } from '../../../src/data/concept-minigames';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/core/types';
import type { InputAction } from '../../../src/input/types';

/**
 * Layout bounds test — verifies that every rendered element in the
 * ConceptMinigameScene stays within the 240×400 viewport on both
 * mobile and PC. Tracks all canvas draw coordinates and asserts
 * none fall outside the safe area.
 */

/** Margin: elements may extend slightly beyond but never by more than this */
const TOLERANCE = 2;

interface DrawCall {
  method: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
}

/**
 * Creates a recording canvas stub that tracks the bounding box of
 * all drawing operations (fillRect, strokeRect, arc, fillText, etc.)
 */
function recordingCtx() {
  const calls: DrawCall[] = [];

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
    canvas: { width: GAME_WIDTH, height: GAME_HEIGHT },
  };

  return {
    calls,
    ctx: new Proxy(base, {
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

        // Track spatial draw calls
        if (prop === 'fillRect' || prop === 'strokeRect') {
          const fn = vi.fn((...args: number[]) => {
            calls.push({ method: prop as string, x: args[0]!, y: args[1]!, w: args[2]!, h: args[3]! });
          });
          target[prop as string] = fn;
          return fn;
        }
        if (prop === 'fillText' || prop === 'strokeText') {
          const fn = vi.fn((...args: unknown[]) => {
            const x = args[1] as number;
            const y = args[2] as number;
            // Approximate text bounds: ~100px wide, 12px tall
            calls.push({ method: prop as string, x, y: y - 10, w: 100, h: 12 });
          });
          target[prop as string] = fn;
          return fn;
        }
        if (prop === 'arc') {
          const fn = vi.fn((...args: number[]) => {
            const cx = args[0]!, cy = args[1]!, r = args[2]!;
            calls.push({ method: 'arc', x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
          });
          target[prop as string] = fn;
          return fn;
        }
        if (prop === 'ellipse') {
          const fn = vi.fn((...args: number[]) => {
            const cx = args[0]!, cy = args[1]!, rx = args[2]!, ry = args[3]!;
            calls.push({ method: 'ellipse', x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 });
          });
          target[prop as string] = fn;
          return fn;
        }

        // Default: no-op
        const fn = vi.fn();
        target[prop as string] = fn;
        return fn;
      },
      set(target, prop, value) {
        target[prop as string] = value;
        return true;
      },
    }) as unknown as CanvasRenderingContext2D,
  };
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

function createScene(conceptId: string) {
  const mg = getConceptMinigame(conceptId)!;
  const scene = new ConceptMinigameScene({
    minigame: mg,
    landmarkId: 'dock_crates',
    audio: stubAudio(),
    onComplete: vi.fn(),
  });
  scene.enter({ now: () => 1000 });
  return { scene, mg };
}

/**
 * Checks that all recorded draw calls fall within the viewport
 * (with tolerance). Returns list of violations.
 */
function findOutOfBounds(calls: DrawCall[]): string[] {
  const violations: string[] = [];
  for (const c of calls) {
    const bottom = c.h != null ? c.y + c.h : c.y;
    const right = c.w != null ? c.x + c.w : c.x;

    if (c.y < -TOLERANCE) {
      violations.push(`${c.method} at y=${c.y.toFixed(0)} above viewport`);
    }
    if (bottom > GAME_HEIGHT + TOLERANCE) {
      violations.push(`${c.method} at bottom=${bottom.toFixed(0)} below viewport (max ${GAME_HEIGHT})`);
    }
    if (c.x < -TOLERANCE) {
      violations.push(`${c.method} at x=${c.x.toFixed(0)} left of viewport`);
    }
    if (right > GAME_WIDTH + TOLERANCE) {
      violations.push(`${c.method} at right=${right.toFixed(0)} right of viewport (max ${GAME_WIDTH})`);
    }
  }
  return violations;
}

/** Advance past all dialog beats to reach challenge phase */
function fastForwardToChallenge(scene: ConceptMinigameScene, mg: ReturnType<typeof getConceptMinigame>) {
  for (const beat of mg!.dialog) {
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
}

const ALL_CONCEPTS = [
  'training_data', 'model', 'inference', 'bias', 'classification',
  'feedback_loop', 'overfitting', 'underfitting', 'training_vs_testing',
  'reinforcement', 'reward_function', 'agent',
  'neural_network', 'gradient_descent', 'generalization',
];

describe('Minigame layout bounds (no clipping)', () => {
  it('dialog phase: all elements within 240×400 for every concept', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene } = createScene(id);
      // Advance typewriter so choices appear
      scene.update(10, []);
      const rec = recordingCtx();
      scene.render(rec.ctx);
      const violations = findOutOfBounds(rec.calls);
      expect(violations, `${id} dialog phase`).toEqual([]);
    }
  });

  it('dialog choice buttons within viewport for 3-choice beats', () => {
    // training_data has a 3-choice beat — advance to it
    const { scene, mg } = createScene('training_data');
    // Find first beat with choices
    const choiceBeatIdx = mg.dialog.findIndex((b) => b.choices);
    // Advance to that beat
    for (let i = 0; i < choiceBeatIdx; i++) {
      scene.update(10, []);
      scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
    }
    // Advance typewriter for choice beat
    scene.update(10, []);

    const rec = recordingCtx();
    scene.render(rec.ctx);
    const violations = findOutOfBounds(rec.calls);
    expect(violations, 'choice buttons').toEqual([]);

    // Verify choice buttons start below dialog box and end above GAME_HEIGHT
    const choiceRects = rec.calls.filter(
      (c) => c.method === 'fillRect' && c.y >= 270 && c.h === 22,
    );
    // Should have at least the choice button backgrounds
    for (const r of choiceRects) {
      expect(r.y + r.h!).toBeLessThanOrEqual(GAME_HEIGHT);
    }
  });

  it('challenge phase: items + confirm + feedback within viewport for every concept', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      fastForwardToChallenge(scene, mg);

      // Select first item to make confirm button appear
      scene.update(0.016, [{ type: 'primary', x: 120, y: 180 }]);

      // Render challenge with confirm visible
      const rec = recordingCtx();
      scene.render(rec.ctx);
      const violations = findOutOfBounds(rec.calls);
      expect(violations, `${id} challenge phase (with confirm)`).toEqual([]);
    }
  });

  it('challenge phase: feedback + hint after wrong attempt stays in bounds', () => {
    // Use training_data (5 items — worst case for vertical space)
    const { scene, mg } = createScene('training_data');
    fastForwardToChallenge(scene, mg);

    // Two wrong attempts to trigger hint
    for (let i = 0; i < 2; i++) {
      scene.update(0.016, [{ type: 'primary', x: 120, y: 180 }]);
      const confirmY = 168 + mg.challenge.items.length * 28 + 6 + 12;
      scene.update(0.016, [{ type: 'primary', x: 120, y: confirmY }]);
    }

    const rec = recordingCtx();
    scene.render(rec.ctx);
    const violations = findOutOfBounds(rec.calls);
    expect(violations, 'feedback + hint with 5 items').toEqual([]);
  });

  it('wrapup phase: all elements within viewport', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      fastForwardToChallenge(scene, mg);

      // Auto-complete challenge (4 wrong attempts)
      for (let i = 0; i < 4; i++) {
        scene.update(0.016, [{ type: 'primary', x: 120, y: 180 }]);
        const confirmY = 168 + mg.challenge.items.length * 28 + 6 + 12;
        scene.update(0.016, [{ type: 'primary', x: 120, y: confirmY }]);
      }
      // Tap to go to wrapup
      scene.update(0.016, [{ type: 'primary', x: 120, y: 300 }]);
      // Advance typewriter
      scene.update(10, []);

      const rec = recordingCtx();
      scene.render(rec.ctx);
      const violations = findOutOfBounds(rec.calls);
      expect(violations, `${id} wrapup phase`).toEqual([]);
    }
  });
});
