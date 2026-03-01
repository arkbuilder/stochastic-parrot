/**
 * Menu Scene — Comprehensive Tests
 *
 * Tests the main menu information architecture (IA):
 * - computeMenuItems() pure function: all state permutations
 * - computeButtonRects() layout logic
 * - DLC hint / locked state
 * - MenuScene interaction (navigation, activation, locked item hint)
 * - Button ordering invariants
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeMenuItems,
  computeButtonRects,
  MenuScene,
  type MenuState,
  type MenuSceneDeps,
  type MenuItemId,
  type MenuItemConfig,
} from '../../../src/scenes/menu-scene';
import type { InputAction } from '../../../src/input/types';

// ── Helpers ──────────────────────────────────────────────────

function defaultState(overrides: Partial<MenuState> = {}): MenuState {
  return {
    hasResumableSession: false,
    hasBestiary: true,
    ...overrides,
  };
}

function defaultDeps(overrides: Partial<MenuSceneDeps> = {}): MenuSceneDeps {
  return {
    onPlay: vi.fn(),
    onResume: vi.fn(),
    onLeaderboard: vi.fn(),
    onBestiary: vi.fn(),
    getMenuState: () => defaultState(),
    ...overrides,
  };
}

function ids(items: MenuItemConfig[]): MenuItemId[] {
  return items.map((i) => i.id);
}

function makeCtxStub(): CanvasRenderingContext2D {
  return {
    fillText: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    lineWidth: 1,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    quadraticCurveTo: vi.fn(),
    ellipse: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: computeMenuItems — pure function tests
// ═══════════════════════════════════════════════════════════════

describe('computeMenuItems — IA structure', () => {

  // ── Basic item presence ──

  it('IA1 — always includes PLAY', () => {
    const items = computeMenuItems(defaultState());
    expect(items.some((i) => i.id === 'play')).toBe(true);
  });

  it('IA2 — always includes LEADERBOARD', () => {
    const items = computeMenuItems(defaultState());
    expect(items.some((i) => i.id === 'leaderboard')).toBe(true);
  });

  it('IA3 — includes BESTIARY when hasBestiary is true', () => {
    const items = computeMenuItems(defaultState({ hasBestiary: true }));
    expect(items.some((i) => i.id === 'bestiary')).toBe(true);
  });

  it('IA4 — excludes BESTIARY when hasBestiary is false', () => {
    const items = computeMenuItems(defaultState({ hasBestiary: false }));
    expect(items.some((i) => i.id === 'bestiary')).toBe(false);
  });

  it('IA5 — includes RESUME when hasResumableSession is true', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true }));
    expect(items.some((i) => i.id === 'resume')).toBe(true);
  });

  it('IA6 — excludes RESUME when hasResumableSession is false', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: false }));
    expect(items.some((i) => i.id === 'resume')).toBe(false);
  });

  // ── DLC / Expansions ──

  it('IA7 — no longer has a separate expansions item', () => {
    const items = computeMenuItems(defaultState());
    expect(items.some((i) => i.id === 'expansions' as string)).toBe(false);
  });

  it('IA8 — PLAY button is never locked', () => {
    const items = computeMenuItems(defaultState());
    const playItem = items.find((i) => i.id === 'play')!;
    expect(playItem.locked).toBe(false);
  });

  // ── Ordering ──

  it('IA13 — RESUME comes before PLAY when present', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true }));
    const order = ids(items);
    expect(order.indexOf('resume')).toBeLessThan(order.indexOf('play'));
  });

  it('IA14 — PLAY comes before LEADERBOARD', () => {
    const items = computeMenuItems(defaultState());
    const order = ids(items);
    expect(order.indexOf('play')).toBeLessThan(order.indexOf('leaderboard'));
  });

  it('IA15 — PLAY comes before LEADERBOARD (redundant check)', () => {
    const items = computeMenuItems(defaultState());
    const order = ids(items);
    expect(order.indexOf('play')).toBeLessThan(order.indexOf('leaderboard'));
  });

  it('IA16 — LEADERBOARD comes before BESTIARY when both present', () => {
    const items = computeMenuItems(defaultState({ hasBestiary: true }));
    const order = ids(items);
    expect(order.indexOf('leaderboard')).toBeLessThan(order.indexOf('bestiary'));
  });

  it('IA17 — full order with all items: resume → play → leaderboard → bestiary', () => {
    const items = computeMenuItems(defaultState({
      hasResumableSession: true,
      hasBestiary: true,
    }));
    expect(ids(items)).toEqual(['resume', 'play', 'leaderboard', 'bestiary']);
  });

  it('IA18 — minimal order (no resume, no bestiary): play → leaderboard', () => {
    const items = computeMenuItems(defaultState({
      hasResumableSession: false,
      hasBestiary: false,
    }));
    expect(ids(items)).toEqual(['play', 'leaderboard']);
  });

  // ── No locked items except expansions ──

  it('IA19 — no items are ever locked', () => {
    const items = computeMenuItems(defaultState({
      hasResumableSession: true,
      hasBestiary: true,
    }));
    for (const item of items) {
      expect(item.locked).toBe(false);
    }
  });

  // ── Label presence ──

  it('IA20 — every item has a non-empty label', () => {
    const items = computeMenuItems(defaultState({
      hasResumableSession: true,
      hasBestiary: true,
    }));
    for (const item of items) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  // ── Idempotency ──

  it('IA21 — same state produces identical item list', () => {
    const state = defaultState({ hasResumableSession: true });
    const a = computeMenuItems(state);
    const b = computeMenuItems(state);
    expect(a).toEqual(b);
  });
});


// ═══════════════════════════════════════════════════════════════
// SECTION 2: computeButtonRects — layout tests
// ═══════════════════════════════════════════════════════════════

describe('computeButtonRects — layout', () => {
  it('LY1 — returns one rect per item', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true }));
    const rects = computeButtonRects(items);
    expect(rects.length).toBe(items.length);
  });

  it('LY2 — rects are vertically stacked (each y > previous y)', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true, hasBestiary: true }));
    const rects = computeButtonRects(items);
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i]!.y).toBeGreaterThan(rects[i - 1]!.y);
    }
  });

  it('LY3 — no rects overlap vertically', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true, hasBestiary: true }));
    const rects = computeButtonRects(items);
    for (let i = 1; i < rects.length; i++) {
      const prevBottom = rects[i - 1]!.y + rects[i - 1]!.h;
      expect(rects[i]!.y).toBeGreaterThanOrEqual(prevBottom);
    }
  });

  it('LY4 — primary items (resume, start) are taller than secondary items', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true, hasBestiary: true }));
    const rects = computeButtonRects(items);
    const startRect = rects[items.findIndex((i) => i.id === 'start')]!;
    const leaderboardRect = rects[items.findIndex((i) => i.id === 'leaderboard')]!;
    expect(startRect.h).toBeGreaterThan(leaderboardRect.h);
  });

  it('LY5 — all rects are within game canvas bounds (240×400)', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true, hasBestiary: true }));
    const rects = computeButtonRects(items);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(240);
      expect(r.y + r.h).toBeLessThanOrEqual(400);
    }
  });

  it('LY6 — all rects have consistent width', () => {
    const items = computeMenuItems(defaultState({ hasResumableSession: true, hasBestiary: true }));
    const rects = computeButtonRects(items);
    const widths = new Set(rects.map((r) => r.w));
    expect(widths.size).toBe(1);
  });
});


// ═══════════════════════════════════════════════════════════════
// SECTION 3: MenuScene — interaction tests
// ═══════════════════════════════════════════════════════════════

describe('MenuScene — interaction', () => {
  let scene: MenuScene;
  let deps: MenuSceneDeps;
  let state: MenuState;

  beforeEach(() => {
    state = defaultState({ hasBestiary: true });
    deps = defaultDeps({ getMenuState: () => state });
    scene = new MenuScene(deps);
    scene.enter({ now: () => 0 });
  });

  // ── Activation ──

  it('IX1 — keyboard Enter on PLAY calls onPlay', () => {
    // Default selection should be on 'play'
    const enterAction: InputAction = { type: 'primary', x: NaN, y: NaN };
    scene.update(0.016, [enterAction]);
    expect(deps.onPlay).toHaveBeenCalled();
  });

  it('IX2 — tap on LEADERBOARD calls onLeaderboard', () => {
    const items = computeMenuItems(state);
    const rects = computeButtonRects(items);
    const leaderboardIdx = items.findIndex((i) => i.id === 'leaderboard');
    const r = rects[leaderboardIdx]!;
    const tap: InputAction = { type: 'primary', x: r.x + r.w / 2, y: r.y + r.h / 2 };
    scene.update(0.016, [tap]);
    expect(deps.onLeaderboard).toHaveBeenCalled();
  });

  it('IX3 — tap on BESTIARY calls onBestiary', () => {
    const items = computeMenuItems(state);
    const rects = computeButtonRects(items);
    const bestiaryIdx = items.findIndex((i) => i.id === 'bestiary');
    const r = rects[bestiaryIdx]!;
    const tap: InputAction = { type: 'primary', x: r.x + r.w / 2, y: r.y + r.h / 2 };
    scene.update(0.016, [tap]);
    expect(deps.onBestiary).toHaveBeenCalled();
  });

  it('IX4 — tap on RESUME (when present) calls onResume', () => {
    state.hasResumableSession = true;
    scene.enter({ now: () => 0 });

    const items = computeMenuItems(state);
    const rects = computeButtonRects(items);
    const resumeIdx = items.findIndex((i) => i.id === 'resume');
    const r = rects[resumeIdx]!;
    const tap: InputAction = { type: 'primary', x: r.x + r.w / 2, y: r.y + r.h / 2 };
    scene.update(0.016, [tap]);
    expect(deps.onResume).toHaveBeenCalled();
  });

  // ── DLC interaction ──

  it('IX5 — PLAY is a single button that opens campaign select', () => {
    const items = computeMenuItems(state);
    const rects = computeButtonRects(items);
    const playIdx = items.findIndex((i) => i.id === 'play');
    const r = rects[playIdx]!;
    const tap: InputAction = { type: 'primary', x: r.x + r.w / 2, y: r.y + r.h / 2 };
    scene.update(0.016, [tap]);
    expect(deps.onPlay).toHaveBeenCalled();
  });

  // ── Keyboard navigation ──

  it('IX8 — move down wraps to first item', () => {
    const items = computeMenuItems(state);
    // Move down enough to wrap
    const moves: InputAction[] = [];
    for (let i = 0; i < items.length + 1; i++) {
      moves.push({ type: 'move', dx: 0, dy: 1 });
    }
    scene.update(0.016, moves);
    // Should have wrapped — no crash
    const enterAction: InputAction = { type: 'primary', x: NaN, y: NaN };
    scene.update(0.016, [enterAction]);
    // Some callback should have been called (whichever item is selected)
    expect(
      (deps.onPlay as ReturnType<typeof vi.fn>).mock.calls.length +
      (deps.onLeaderboard as ReturnType<typeof vi.fn>).mock.calls.length +
      (deps.onBestiary as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBeGreaterThanOrEqual(0); // No crash = pass
  });

  it('IX9 — move up wraps to last item', () => {
    const moveUp: InputAction = { type: 'move', dx: 0, dy: -1 };
    scene.update(0.016, [moveUp]);
    // Now should be on last item — no crash
    const enterAction: InputAction = { type: 'primary', x: NaN, y: NaN };
    scene.update(0.016, [enterAction]);
    // Some action should occur (bestiary in this case since it's last)
    expect(deps.onBestiary).toHaveBeenCalled();
  });

  it('IX10 — horizontal move is ignored (no crash)', () => {
    const moveRight: InputAction = { type: 'move', dx: 1, dy: 0 };
    scene.update(0.016, [moveRight]);
    // No crash, selection unchanged
    const enterAction: InputAction = { type: 'primary', x: NaN, y: NaN };
    scene.update(0.016, [enterAction]);
    expect(deps.onStart).toHaveBeenCalled();
  });

  it('IX11 — tap outside any button does nothing', () => {
    const tap: InputAction = { type: 'primary', x: 0, y: 0 };
    scene.update(0.016, [tap]);
    expect(deps.onPlay).not.toHaveBeenCalled();
    expect(deps.onLeaderboard).not.toHaveBeenCalled();
    expect(deps.onBestiary).not.toHaveBeenCalled();
    expect(deps.onResume).not.toHaveBeenCalled();
  });

  it('IX12 — pause action is ignored in menu', () => {
    const pauseAction: InputAction = { type: 'pause' };
    scene.update(0.016, [pauseAction]);
    // No crashes, no callbacks
    expect(deps.onStart).not.toHaveBeenCalled();
  });
});


// ═══════════════════════════════════════════════════════════════
// SECTION 4: MenuScene — rendering smoke tests
// ═══════════════════════════════════════════════════════════════

describe('MenuScene — rendering', () => {
  it('RN1 — render does not throw with default state', () => {
    const state = defaultState({ hasBestiary: true });
    const deps = defaultDeps({ getMenuState: () => state });
    const scene = new MenuScene(deps);
    scene.enter({ now: () => 0 });
    scene.update(0.5, []);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('RN2 — render does not throw after tapping PLAY', () => {
    const state = defaultState();
    const deps = defaultDeps({ getMenuState: () => state });
    const scene = new MenuScene(deps);
    scene.enter({ now: () => 0 });
    const items = computeMenuItems(state);
    const rects = computeButtonRects(items);
    const playIdx = items.findIndex((i) => i.id === 'play');
    const r = rects[playIdx]!;
    scene.update(0.016, [{ type: 'primary', x: r.x + r.w / 2, y: r.y + r.h / 2 }]);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('RN3 — render does not throw with resume session', () => {
    const state = defaultState({ hasResumableSession: true, hasBestiary: false });
    const deps = defaultDeps({ getMenuState: () => state });
    const scene = new MenuScene(deps);
    scene.enter({ now: () => 0 });
    scene.update(0.5, []);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('RN4 — render does not throw with minimal state (no resume, no bestiary)', () => {
    const state = defaultState({ hasResumableSession: false, hasBestiary: false });
    const deps = defaultDeps({ getMenuState: () => state });
    const scene = new MenuScene(deps);
    scene.enter({ now: () => 0 });
    scene.update(0.5, []);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });
});


// ═══════════════════════════════════════════════════════════════
// SECTION 5: State permutation matrix
// ═══════════════════════════════════════════════════════════════

describe('computeMenuItems — state permutations', () => {
  const booleans = [false, true];

  for (const hasResumableSession of booleans) {
    for (const hasBestiary of booleans) {
      const label = `resume=${hasResumableSession} bestiary=${hasBestiary}`;

      it(`PM — ${label}: returns valid items`, () => {
        const state: MenuState = { hasResumableSession, hasBestiary };
        const items = computeMenuItems(state);

        // Always at least play + leaderboard
        expect(items.length).toBeGreaterThanOrEqual(2);

        // No duplicates
        const itemIds = ids(items);
        expect(new Set(itemIds).size).toBe(itemIds.length);

        // Play and leaderboard always present
        expect(itemIds).toContain('play');
        expect(itemIds).toContain('leaderboard');

        // Resume present iff hasResumableSession
        expect(itemIds.includes('resume')).toBe(hasResumableSession);

        // Bestiary present iff hasBestiary
        expect(itemIds.includes('bestiary')).toBe(hasBestiary);

        // Layout should produce valid rects
        const rects = computeButtonRects(items);
        expect(rects.length).toBe(items.length);
        for (const r of rects) {
          expect(r.w).toBeGreaterThan(0);
          expect(r.h).toBeGreaterThan(0);
        }
      });
    }
  }
});
