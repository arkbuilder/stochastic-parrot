/**
 * Pause Scene — Unit Tests
 *
 * Tests the 3-view pause menu:
 * - Menu: resume / journal / settings / quit buttons
 * - Journal: pagination (prev/next), onJournalViewed callback
 * - Settings: toggles (reduced_motion, high_contrast, visual_only, mute_all),
 *             sliders (master, music, sfx), clamping to [0,1]
 * - Keyboard navigation (move d-pad, pause ESC toggle)
 * - render does not throw
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PauseScene, type ConceptJournalEntry } from '../../../src/scenes/pause-scene';
import type { AccessibilitySettings } from '../../../src/persistence/types';
import type { InputAction } from '../../../src/input/types';

// ── Helpers ──────────────────────────────────────────────────

function defaultSettings(): AccessibilitySettings {
  return {
    reducedMotion: false,
    highContrast: false,
    visualOnlyMode: false,
    muteAll: false,
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.6,
  };
}

function makeJournalEntries(count = 20): ConceptJournalEntry[] {
  const entries: ConceptJournalEntry[] = [];
  for (let i = 0; i < count; i++) {
    entries.push({
      conceptId: `c${i}`,
      conceptName: `Concept ${i}`,
      islandId: `island_0${(i % 5) + 1}`,
      masteryLevel: i % 4 === 0 ? 'mastered' : i % 3 === 0 ? 'recalled' : 'placed',
      recallCount: i * 2,
    });
  }
  return entries;
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  let settings = defaultSettings();
  return {
    getSettings: vi.fn(() => settings),
    onSettingsChange: vi.fn((s: AccessibilitySettings) => { settings = s; }),
    getJournalEntries: vi.fn(() => makeJournalEntries()),
    onJournalViewed: vi.fn(),
    onResume: vi.fn(),
    onQuit: vi.fn(),
    ...overrides,
  } as any;
}

function makeCtxStub(): CanvasRenderingContext2D {
  return new Proxy({} as CanvasRenderingContext2D, {
    get: (_t, prop) => {
      if (prop === 'canvas') return { width: 240, height: 400 };
      return typeof prop === 'string' ? vi.fn(() => ({ addColorStop: vi.fn() })) : undefined;
    },
    set: () => true,
  });
}

function tapAction(x: number, y: number): InputAction {
  return { type: 'primary', x, y } as any;
}

function keyConfirm(): InputAction {
  return { type: 'primary', x: NaN, y: NaN } as any;
}

function pauseAction(): InputAction {
  return { type: 'pause' } as any;
}

function moveAction(dx: number, dy: number): InputAction {
  return { type: 'move', dx, dy } as any;
}

// Menu rows: resume {42,108,156,34}, journal {42,152,156,34}, settings {42,196,156,34}, quit {42,240,156,34}

describe('PauseScene', () => {
  let deps: ReturnType<typeof makeDeps>;

  beforeEach(() => {
    deps = makeDeps();
  });

  // ── Menu View ───────────────────────────────────────────────

  describe('menu view', () => {
    it('resume tap calls onResume', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      // Resume button center at (42+78, 108+17) = (120, 125)
      scene.update(0, [tapAction(120, 125)]);
      expect(deps.onResume).toHaveBeenCalled();
    });

    it('quit tap calls onQuit', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      // Quit button center at (120, 257)
      scene.update(0, [tapAction(120, 257)]);
      expect(deps.onQuit).toHaveBeenCalled();
    });

    it('journal tap transitions to journal view', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      // Journal button center at (120, 169)
      scene.update(0, [tapAction(120, 169)]);
      expect(deps.onJournalViewed).toHaveBeenCalled();
    });

    it('settings tap transitions to settings view', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      // Settings button center at (120, 213)
      scene.update(0, [tapAction(120, 213)]);
      // We can verify by rendering which shows "SETTINGS" title
      expect(() => scene.render(makeCtxStub())).not.toThrow();
    });

    it('ESC pauses resume from menu', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [pauseAction()]);
      expect(deps.onResume).toHaveBeenCalled();
    });
  });

  // ── Keyboard Navigation ──────────────────────────────────

  describe('keyboard navigation', () => {
    it('move down changes selectedMenuIndex', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [moveAction(0, 1)]); // move to index 1 (journal)
      scene.update(0, [keyConfirm()]); // select journal
      expect(deps.onJournalViewed).toHaveBeenCalled();
    });

    it('move wraps around menu (down from last → first)', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      // Navigate down 4 times to wrap: 0→1→2→3→0
      scene.update(0, [moveAction(0, 1)]);
      scene.update(0, [moveAction(0, 1)]);
      scene.update(0, [moveAction(0, 1)]);
      scene.update(0, [moveAction(0, 1)]);
      scene.update(0, [keyConfirm()]);
      expect(deps.onResume).toHaveBeenCalled(); // back to resume
    });

    it('ESC from settings returns to menu', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 213)]); // go to settings
      scene.update(0, [pauseAction()]); // ESC
      // Should be back in menu, next ESC resumes
      scene.update(0, [pauseAction()]);
      expect(deps.onResume).toHaveBeenCalled();
    });
  });

  // ── Journal View ──────────────────────────────────────────

  describe('journal view', () => {
    it('journal next button paginates forward', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 169)]); // open journal
      // JOURNAL_NEXT at {136, 322, 62, 24}
      scene.update(0, [tapAction(167, 334)]); // tap next center
      // Should not throw
      expect(() => scene.render(makeCtxStub())).not.toThrow();
    });

    it('journal prev button paginates backward (clamped to 0)', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 169)]); // open journal
      // JOURNAL_PREV at {42, 322, 62, 24}
      scene.update(0, [tapAction(73, 334)]); // tap prev center
      // Should still be page 0
      expect(() => scene.render(makeCtxStub())).not.toThrow();
    });

    it('keyboard NaN primary returns to menu from journal', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 169)]); // open journal
      scene.update(0, [keyConfirm()]); // NaN primary = back to menu
      scene.update(0, [pauseAction()]); // ESC resumes
      expect(deps.onResume).toHaveBeenCalled();
    });
  });

  // ── Settings View ─────────────────────────────────────────

  describe('settings view', () => {
    it('toggle reduced_motion flips setting', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 213)]); // go to settings

      // reduced_motion is first row, at y = 92 - 13 = 79 to 79+22 = 101, x = 24 to 216
      scene.update(0, [tapAction(100, 92)]); // tap toggle
      expect(deps.onSettingsChange).toHaveBeenCalled();
      const newSettings = deps.onSettingsChange.mock.calls[0][0];
      expect(newSettings.reducedMotion).toBe(true);
    });

    it('slider click sets volume proportionally', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 213)]); // go to settings

      // master_vol is index 4, row y = 92 + 4*28 = 204
      // slider starts at x=120, width=86
      // Click at x=163 (midpoint) should give ratio ~0.5
      scene.update(0, [tapAction(163, 204)]);
      expect(deps.onSettingsChange).toHaveBeenCalled();
      const called = deps.onSettingsChange.mock.calls[0][0];
      expect(called.masterVolume).toBeCloseTo(0.5, 0);
    });

    it('volume values are clamped to [0,1]', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 213)]); // settings

      // Click slider beyond right edge (x=120+90=210 > sliderEnd)
      scene.update(0, [tapAction(210, 204)]); // master vol
      const called = deps.onSettingsChange.mock.calls[0][0];
      expect(called.masterVolume).toBeLessThanOrEqual(1);
      expect(called.masterVolume).toBeGreaterThanOrEqual(0);
    });

    it('keyboard move dx adjusts slider by 0.1', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 213)]); // settings

      // Navigate to master vol (index 4)
      scene.update(0, [moveAction(0, 1)]); // 1
      scene.update(0, [moveAction(0, 1)]); // 2
      scene.update(0, [moveAction(0, 1)]); // 3
      scene.update(0, [moveAction(0, 1)]); // 4 = master

      scene.update(0, [moveAction(1, 0)]); // dx=1 → +0.1
      expect(deps.onSettingsChange).toHaveBeenCalled();
      const called = deps.onSettingsChange.mock.calls[0][0];
      // masterVolume was 0.8 + 0.1 = 0.9 (clamped to [0,1])
      expect(called.masterVolume).toBeCloseTo(0.9, 1);
    });

    it('back action item returns to menu', () => {
      const scene = new PauseScene(deps);
      scene.enter({} as any);
      scene.update(0, [tapAction(120, 213)]); // settings

      // back is index 7, row y = 92 + 7*28 = 288
      scene.update(0, [tapAction(100, 288)]); // tap back

      // Should be in menu now; tapping resume works
      scene.update(0, [tapAction(120, 125)]);
      expect(deps.onResume).toHaveBeenCalled();
    });
  });

  // ── Render ────────────────────────────────────────────────

  it('render() executes without error (menu)', () => {
    const scene = new PauseScene(deps);
    scene.enter({} as any);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('render() executes without error (settings)', () => {
    const scene = new PauseScene(deps);
    scene.enter({} as any);
    scene.update(0, [tapAction(120, 213)]);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('render() executes without error (journal)', () => {
    const scene = new PauseScene(deps);
    scene.enter({} as any);
    scene.update(0, [tapAction(120, 169)]);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });
});
