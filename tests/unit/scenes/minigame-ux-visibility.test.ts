import { describe, expect, it, vi } from 'vitest';
import { ConceptMinigameScene } from '../../../src/scenes/concept-minigame-scene';
import { getConceptMinigame } from '../../../src/data/concept-minigames';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/core/types';
import { TOKENS } from '../../../src/rendering/tokens';

/**
 * UX visibility test — verifies that every game phase renders text
 * the player can actually see. Catches bugs like drawing text in
 * the same color as its background (effectively invisible text).
 *
 * For each phase (dialog, challenge, wrapup), we:
 *  1. Render after the typewriter has finished
 *  2. Record every fillText call with its fillStyle color
 *  3. Assert dialog/instruction/wrapup text is drawn with a
 *     light, readable color (not the dark background colors)
 */

/** Dark background colors that should NOT be used for readable text */
const DARK_BG_COLORS = [
  'rgba(19, 27, 46, 0.92)', // dialog box bg
  '#0f172a',                 // scene bg gradient stop
  '#1e1b4b',                 // scene bg gradient stop
  '#131b2e',                 // button bg (unselected)
  '#2a1e40',                 // button bg (selected)
  '#1e3a2e',                 // confirm button bg
  '#1e3a5f',                 // choice button bg (focused)
  '#1e2a3f',                 // challenge item bg (focused)
  '#1e4a3e',                 // confirm button bg (focused)
];

interface TextCall {
  text: string;
  fillStyle: string;
  x: number;
  y: number;
}

/**
 * Creates a canvas stub that records fillText calls with their fillStyle.
 */
function textRecordingCtx() {
  const textCalls: TextCall[] = [];
  let currentFillStyle = '#000';

  const base: Record<string, unknown> = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
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

  // Trap fillStyle with getter/setter
  Object.defineProperty(base, 'fillStyle', {
    get() { return currentFillStyle; },
    set(v: string) { currentFillStyle = v; },
    enumerable: true,
  });

  return {
    textCalls,
    ctx: new Proxy(base, {
      get(target, prop) {
        if (prop === 'fillStyle') return currentFillStyle;
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
        if (prop === 'fillText') {
          const fn = vi.fn((...args: unknown[]) => {
            textCalls.push({
              text: String(args[0]),
              fillStyle: currentFillStyle,
              x: args[1] as number,
              y: args[2] as number,
            });
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
        if (prop === 'fillStyle') {
          currentFillStyle = value;
          return true;
        }
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

function isVisibleColor(color: string): boolean {
  // Reject known dark bg colors
  if (DARK_BG_COLORS.includes(color)) return false;
  // Reject any rgba with very low alpha
  const rgbaMatch = color.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    if (Number(a) < 0.2) return false;
    // Very dark colors whose RGB channels all < 50
    if (Number(r) < 50 && Number(g) < 50 && Number(b) < 50) return false;
  }
  // Reject pure near-black hex
  const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1]!;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (r < 50 && g < 50 && b < 50) return false;
  }
  return true;
}

const ALL_CONCEPTS = [
  'training_data', 'model', 'inference', 'bias', 'classification',
  'feedback_loop', 'overfitting', 'underfitting', 'training_vs_testing',
  'reinforcement', 'reward_function', 'agent',
  'neural_network', 'gradient_descent', 'generalization',
];

describe('Minigame UX visibility', () => {
  it('dialog text is rendered with a visible color for all concepts', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      // Advance typewriter to show full first beat text
      scene.update(10, []);

      const rec = textRecordingCtx();
      scene.render(rec.ctx);

      const firstBeatText = mg.dialog[0]!.text;
      // Find text calls within the dialog box area (y around 190..270)
      // that contain words from the beat text
      const firstWord = firstBeatText.split(' ')[0]!;
      const dialogTextCalls = rec.textCalls.filter(
        (c) => c.text.includes(firstWord) && c.y >= 190 && c.y <= 280,
      );

      expect(
        dialogTextCalls.length,
        `${id}: expected dialog text containing "${firstWord}" to be rendered`,
      ).toBeGreaterThan(0);

      for (const call of dialogTextCalls) {
        expect(
          isVisibleColor(call.fillStyle),
          `${id}: dialog text "${call.text}" drawn with invisible color "${call.fillStyle}"`,
        ).toBe(true);
      }
    }
  });

  it('dialog choice buttons have visible text for all concepts with choices', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      const choiceBeat = mg.dialog.find((b) => b.choices);
      if (!choiceBeat) continue;

      // Advance to that beat
      const idx = mg.dialog.indexOf(choiceBeat);
      for (let i = 0; i < idx; i++) {
        scene.update(10, []);
        scene.update(0.016, [{ type: 'primary', x: 120, y: 230 }]);
      }
      scene.update(10, []);

      const rec = textRecordingCtx();
      scene.render(rec.ctx);

      // Choice buttons are rendered below dialog box (y >= 278)
      for (const choice of choiceBeat.choices!) {
        const firstWord = choice.split(' ')[0]!;
        const choiceCalls = rec.textCalls.filter(
          (c) => c.text.includes(firstWord) && c.y >= 278,
        );
        expect(
          choiceCalls.length,
          `${id}: choice "${choice}" should be rendered`,
        ).toBeGreaterThan(0);
        for (const call of choiceCalls) {
          expect(
            isVisibleColor(call.fillStyle),
            `${id}: choice text "${call.text}" drawn with invisible color "${call.fillStyle}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('challenge instruction text is visible for all concepts', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      fastForwardToChallenge(scene, mg);

      const rec = textRecordingCtx();
      scene.render(rec.ctx);

      const instrText = mg.challenge.instruction;
      const firstWord = instrText.split(' ')[0]!;
      const instrCalls = rec.textCalls.filter(
        (c) => c.text.includes(firstWord) && c.y >= 140 && c.y <= 170,
      );

      expect(
        instrCalls.length,
        `${id}: challenge instruction containing "${firstWord}" should be rendered`,
      ).toBeGreaterThan(0);
      for (const call of instrCalls) {
        expect(
          isVisibleColor(call.fillStyle),
          `${id}: instruction "${call.text}" drawn with invisible color "${call.fillStyle}"`,
        ).toBe(true);
      }
    }
  });

  it('challenge item text is visible for all concepts', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      fastForwardToChallenge(scene, mg);

      const rec = textRecordingCtx();
      scene.render(rec.ctx);

      for (const item of mg.challenge.items) {
        const itemWord = item.replace(/^[^\w]*/, '').split(' ')[0]!;
        const itemCalls = rec.textCalls.filter(
          (c) => c.text.includes(itemWord) && c.y >= 168 && c.y <= 340,
        );
        expect(
          itemCalls.length,
          `${id}: challenge item "${item}" should be rendered`,
        ).toBeGreaterThan(0);
        for (const call of itemCalls) {
          expect(
            isVisibleColor(call.fillStyle),
            `${id}: item "${call.text}" drawn with invisible color "${call.fillStyle}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('wrapup text is visible for all concepts', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      fastForwardToChallenge(scene, mg);

      // Auto-complete challenge via 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        scene.update(0.016, [{ type: 'primary', x: 120, y: 180 }]);
        const confirmY = 168 + mg.challenge.items.length * 28 + 6 + 12;
        scene.update(0.016, [{ type: 'primary', x: 120, y: confirmY }]);
      }
      // Tap to go to wrapup
      scene.update(0.016, [{ type: 'primary', x: 120, y: 300 }]);
      // Advance typewriter
      scene.update(10, []);

      const rec = textRecordingCtx();
      scene.render(rec.ctx);

      const wrapText = mg.wrapUp;
      const firstWord = wrapText.split(' ')[0]!;
      const wrapCalls = rec.textCalls.filter(
        (c) => c.text.includes(firstWord) && c.y >= 190 && c.y <= 280,
      );

      expect(
        wrapCalls.length,
        `${id}: wrapup text containing "${firstWord}" should be rendered`,
      ).toBeGreaterThan(0);
      for (const call of wrapCalls) {
        expect(
          isVisibleColor(call.fillStyle),
          `${id}: wrapup "${call.text}" drawn with invisible color "${call.fillStyle}"`,
        ).toBe(true);
      }
    }
  });

  it('speaker labels (Polly / Lore) are visible', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      scene.update(10, []);

      const rec = textRecordingCtx();
      scene.render(rec.ctx);

      const speaker = mg.dialog[0]!.speaker;
      const label = speaker === 'parrot' ? 'Polly' : 'Lore';
      const labelCalls = rec.textCalls.filter((c) => c.text.includes(label));

      expect(
        labelCalls.length,
        `${id}: speaker label "${label}" should be rendered`,
      ).toBeGreaterThan(0);
      for (const call of labelCalls) {
        expect(
          isVisibleColor(call.fillStyle),
          `${id}: speaker "${call.text}" drawn with invisible color "${call.fillStyle}"`,
        ).toBe(true);
      }
    }
  });

  it('"tap to continue" prompt appears after typewriter finishes', () => {
    const { scene, mg } = createScene('training_data');
    // First beat has no choices — should show "tap to continue"
    scene.update(10, []);

    const rec = textRecordingCtx();
    scene.render(rec.ctx);

    const tapCalls = rec.textCalls.filter((c) => c.text.includes('tap to continue'));
    // It blinks, so it may or may not be visible depending on timing.
    // Render at time when sin(t*4) > 0 to ensure it shows.
    // elapsedMs after update(10) = 10000ms, t = 10s, sin(40) ≈ 0.745 > 0 ✓
    expect(
      tapCalls.length,
      'expected "tap to continue" to appear after typewriter finishes',
    ).toBeGreaterThan(0);
    for (const call of tapCalls) {
      expect(
        isVisibleColor(call.fillStyle),
        `"tap to continue" drawn with invisible color "${call.fillStyle}"`,
      ).toBe(true);
    }
  });

  it('concept name and metaphor are visible at top of screen', () => {
    for (const id of ALL_CONCEPTS) {
      const { scene, mg } = createScene(id);
      scene.update(0.1, []);

      const rec = textRecordingCtx();
      scene.render(rec.ctx);

      // Concept name at top
      const nameCalls = rec.textCalls.filter(
        (c) => c.text === mg.conceptName && c.y >= 100 && c.y <= 130,
      );
      expect(
        nameCalls.length,
        `${id}: concept name "${mg.conceptName}" should be rendered`,
      ).toBeGreaterThan(0);
      for (const call of nameCalls) {
        expect(
          isVisibleColor(call.fillStyle),
          `${id}: name "${call.text}" drawn with invisible color "${call.fillStyle}"`,
        ).toBe(true);
      }

      // Metaphor subtitle
      const metaphorCalls = rec.textCalls.filter(
        (c) => c.text === mg.metaphor && c.y >= 120 && c.y <= 145,
      );
      expect(
        metaphorCalls.length,
        `${id}: metaphor "${mg.metaphor}" should be rendered`,
      ).toBeGreaterThan(0);
    }
  });
});
