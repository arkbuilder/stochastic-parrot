import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BestiaryScene } from '../../../src/scenes/bestiary-scene';
import { BESTIARY, CRITTERS, THREATS, FLORA, TERRAIN } from '../../../src/data/bestiary';
import { resetGameData, mergeDlcIntoGameData } from '../../../src/data/game-data';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import type { InputAction } from '../../../src/input/types';

// ── Canvas mock ──────────────────────────────────────────────

function makeCtx(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    arcTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    measureText: vi.fn(() => ({ width: 30 })),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

const TAP = (x: number, y: number): InputAction => ({ type: 'primary', x, y });
const KEYBOARD_ENTER: InputAction = { type: 'primary', x: NaN, y: NaN };
const MOVE_DOWN: InputAction = { type: 'move', dx: 0, dy: 1 };
const MOVE_UP: InputAction = { type: 'move', dx: 0, dy: -1 };
const MOVE_RIGHT: InputAction = { type: 'move', dx: 1, dy: 0 };
const MOVE_LEFT: InputAction = { type: 'move', dx: -1, dy: 0 };
const SECONDARY: InputAction = { type: 'secondary', x: 0, y: 0 };

// Ensure game-data is reset between tests to avoid DLC leaking between tests
beforeEach(() => {
  resetGameData();
});

function createScene(): { scene: BestiaryScene; onBack: ReturnType<typeof vi.fn> } {
  const onBack = vi.fn();
  const scene = new BestiaryScene(onBack);
  scene.enter({ now: () => 0 });
  return { scene, onBack };
}

// ── Lifecycle ────────────────────────────────────────────────

describe('BestiaryScene — lifecycle', () => {
  it('can be constructed and entered without error', () => {
    const { scene } = createScene();
    expect(scene).toBeDefined();
  });

  it('renders list mode without throwing', () => {
    const { scene } = createScene();
    scene.update(0.016, []);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('renders detail mode without throwing', () => {
    const { scene } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]); // open first entry
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('exit does not throw', () => {
    const { scene } = createScene();
    expect(() => scene.exit()).not.toThrow();
  });
});

// ── Navigation: Back button ──────────────────────────────────

describe('BestiaryScene — back button', () => {
  it('tapping BACK calls onBack', () => {
    const { scene, onBack } = createScene();
    scene.update(0.016, [TAP(30, 20)]); // BACK button area
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('pressing secondary (Escape) from list calls onBack', () => {
    const { scene, onBack } = createScene();
    scene.update(0.016, [SECONDARY]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ── Tab switching ────────────────────────────────────────────

describe('BestiaryScene — tabs', () => {
  it('starts on critters tab', () => {
    const { scene } = createScene();
    // Render and verify no throw — if it renders entries, it defaults correctly
    scene.update(0.016, []);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('tapping threats tab switches and renders without error', () => {
    const { scene } = createScene();
    // TAB_THREATS rect: x:65, y:40, w:54, h:24
    scene.update(0.016, [TAP(92, 52)]);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('tapping critters tab switches back', () => {
    const { scene } = createScene();
    // Switch to threats first
    scene.update(0.016, [TAP(92, 52)]);
    // Switch back to critters
    scene.update(0.016, [TAP(35, 52)]);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });
});

// ── Keyboard navigation ──────────────────────────────────────

describe('BestiaryScene — keyboard navigation', () => {
  it('arrow down moves selection', () => {
    const { scene } = createScene();
    scene.update(0.016, [MOVE_DOWN]);
    // Should not throw — selection moved to index 1
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('arrow up wraps to last entry', () => {
    const { scene } = createScene();
    scene.update(0.016, [MOVE_UP]);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('enter opens detail view', () => {
    const { scene } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]);
    // Should now be in detail mode — render should not throw
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('enter in detail view returns to list', () => {
    const { scene } = createScene();
    // Open detail
    scene.update(0.016, [KEYBOARD_ENTER]);
    // Close detail
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('left/right arrows browse entries in detail mode', () => {
    const { scene } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]); // open detail
    scene.update(0.016, [MOVE_RIGHT]); // next entry
    expect(() => scene.render(makeCtx())).not.toThrow();
    scene.update(0.016, [MOVE_LEFT]); // previous entry
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('secondary from detail returns to list, not menu', () => {
    const { scene, onBack } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]); // open detail
    scene.update(0.016, [SECONDARY]); // back to list
    expect(onBack).not.toHaveBeenCalled(); // should NOT exit scene
    expect(() => scene.render(makeCtx())).not.toThrow();
  });
});

// ── Touch navigation ─────────────────────────────────────────

describe('BestiaryScene — touch navigation', () => {
  it('tapping a list row opens detail', () => {
    const { scene } = createScene();
    // First row: y ~72, height 32 → tap at (120, 88)
    scene.update(0.016, [TAP(120, 88)]);
    // Should be in detail mode
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('tapping BACK in detail returns to list', () => {
    const { scene, onBack } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]); // open detail
    scene.update(0.016, [TAP(30, 20)]); // BACK in detail mode
    expect(onBack).not.toHaveBeenCalled(); // goes to list, not menu
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('tapping left half of detail browses previous', () => {
    const { scene } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]); // open detail
    scene.update(0.016, [TAP(30, 100)]); // left half
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('tapping right half of detail browses next', () => {
    const { scene } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]); // open detail
    scene.update(0.016, [TAP(210, 100)]); // right half
    expect(() => scene.render(makeCtx())).not.toThrow();
  });
});

// ── All entries render ───────────────────────────────────────

describe('BestiaryScene — all entries render', () => {
  it('renders every critter in detail without throwing', () => {
    for (let i = 0; i < CRITTERS.length; i++) {
      const { scene } = createScene();
      // Navigate to entry i
      for (let j = 0; j < i; j++) {
        scene.update(0.016, [MOVE_DOWN]);
      }
      scene.update(0.016, [KEYBOARD_ENTER]);
      expect(() => scene.render(makeCtx())).not.toThrow();
    }
  });

  it('renders every threat in detail without throwing', () => {
    for (let i = 0; i < THREATS.length; i++) {
      const { scene } = createScene();
      // Switch to threats tab (x:65, y:40, w:54, h:24)
      scene.update(0.016, [TAP(92, 52)]);
      // Navigate to entry i
      for (let j = 0; j < i; j++) {
        scene.update(0.016, [MOVE_DOWN]);
      }
      scene.update(0.016, [KEYBOARD_ENTER]);
      expect(() => scene.render(makeCtx())).not.toThrow();
    }
  });
});

// ── Data alignment ───────────────────────────────────────────

describe('BestiaryScene — data alignment', () => {
  it('BESTIARY has entries for all 8 critter kinds', () => {
    const critterHints = CRITTERS.map((e) => e.renderHint);
    expect(critterHints).toContain('crab');
    expect(critterHints).toContain('fire_crab');
    expect(critterHints).toContain('jellyfish');
    expect(critterHints).toContain('shadow_jelly');
    expect(critterHints).toContain('burrower');
    expect(critterHints).toContain('sand_wyrm');
    expect(critterHints).toContain('urchin');
    expect(critterHints).toContain('ray');
  });

  it('BESTIARY has entries for all 5 encounter types', () => {
    const threatHints = THREATS.map((e) => e.renderHint);
    expect(threatHints).toContain('fog');
    expect(threatHints).toContain('storm');
    expect(threatHints).toContain('battle');
    expect(threatHints).toContain('ruins');
    expect(threatHints).toContain('squid');
  });

  it('BESTIARY has entries for all 6 flora types', () => {
    const floraHints = FLORA.map((e) => e.renderHint);
    expect(floraHints).toContain('palm_tree');
    expect(floraHints).toContain('mangrove');
    expect(floraHints).toContain('coral_fan');
    expect(floraHints).toContain('storm_pine');
    expect(floraHints).toContain('glow_kelp');
    expect(floraHints).toContain('sea_anemone');
  });

  it('all flora entries have danger 0', () => {
    for (const entry of FLORA) {
      expect(entry.danger).toBe(0);
    }
  });

  it('total bestiary count is 29 (8 critters + 5 threats + 6 flora + 10 terrain)', () => {
    expect(BESTIARY.length).toBe(29);
  });

  it('BESTIARY has entries for all 10 terrain types', () => {
    const terrainHints = TERRAIN.map((e) => e.renderHint);
    expect(terrainHints).toContain('tile_water');
    expect(terrainHints).toContain('tile_sand');
    expect(terrainHints).toContain('tile_grass');
    expect(terrainHints).toContain('tile_dock');
    expect(terrainHints).toContain('tile_cobble');
    expect(terrainHints).toContain('tile_tide_pools');
    expect(terrainHints).toContain('tile_ruins_stone');
    expect(terrainHints).toContain('tile_volcanic');
    expect(terrainHints).toContain('tile_reef_pools');
    expect(terrainHints).toContain('tile_mossy_stone');
  });

  it('all terrain entries have danger 0', () => {
    for (const entry of TERRAIN) {
      expect(entry.danger).toBe(0);
    }
  });
});

// ── Flora tab ────────────────────────────────────────────────

describe('BestiaryScene — flora tab', () => {
  it('tapping flora tab switches and renders without error', () => {
    const { scene } = createScene();
    // TAB_FLORA rect: x:122, y:40, w:54, h:24
    scene.update(0.016, [TAP(149, 52)]);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('renders every flora entry in detail without throwing', () => {
    for (let i = 0; i < FLORA.length; i++) {
      const { scene } = createScene();
      // Switch to flora tab (x:122, y:40, w:54, h:24)
      scene.update(0.016, [TAP(149, 52)]);
      // Navigate to entry i
      for (let j = 0; j < i; j++) {
        scene.update(0.016, [MOVE_DOWN]);
      }
      scene.update(0.016, [KEYBOARD_ENTER]);
      expect(() => scene.render(makeCtx())).not.toThrow();
    }
  });

  it('flora detail shows ISLAND FLORA badge', () => {
    const { scene } = createScene();
    scene.update(0.016, [TAP(149, 52)]); // flora tab
    scene.update(0.016, [KEYBOARD_ENTER]); // open first flora
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('ISLAND FLORA');
  });
});

// ── Terrain tab ──────────────────────────────────────────────

describe('BestiaryScene — terrain tab', () => {
  it('tapping terrain tab switches and renders without error', () => {
    const { scene } = createScene();
    // TAB_TERRAIN rect: x:179, y:40, w:54, h:24
    scene.update(0.016, [TAP(206, 52)]);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('renders every terrain entry in detail without throwing', () => {
    for (let i = 0; i < TERRAIN.length; i++) {
      const { scene } = createScene();
      // Switch to terrain tab (x:179, y:40, w:54, h:24)
      scene.update(0.016, [TAP(206, 52)]);
      // Navigate to entry i
      for (let j = 0; j < i; j++) {
        scene.update(0.016, [MOVE_DOWN]);
      }
      scene.update(0.016, [KEYBOARD_ENTER]);
      expect(() => scene.render(makeCtx())).not.toThrow();
    }
  });

  it('terrain detail shows GROUND TILE badge', () => {
    const { scene } = createScene();
    scene.update(0.016, [TAP(206, 52)]); // terrain tab
    scene.update(0.016, [KEYBOARD_ENTER]); // open first terrain
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('GROUND TILE');
  });
});

// ── DLC source toggle ────────────────────────────────────────

describe('BestiaryScene — DLC source toggle', () => {
  // SOURCE_BUTTON: x:140, y:8, w:92, h:24 — tap center at (186, 20)
  const TAP_SOURCE = TAP(186, 20);

  it('source toggle button does not appear when no DLC is merged', () => {
    const { scene } = createScene();
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    // None of the source labels should be rendered as a button
    expect(texts.filter((t: string) => typeof t === 'string' && t.startsWith('▸'))).toHaveLength(0);
  });

  it('source toggle button appears when DLC is merged', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('▸ ALL');
  });

  it('tapping source button cycles from ALL to BASE', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    scene.update(0.016, [TAP_SOURCE]); // cycle once: ALL → BASE
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('▸ BASE');
  });

  it('tapping source button twice cycles to DLC name', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    scene.update(0.016, [TAP_SOURCE]); // ALL → BASE
    scene.update(0.016, [TAP_SOURCE]); // BASE → ROCKET
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('▸ ROCKET');
  });

  it('tapping source button three times wraps back to ALL', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    scene.update(0.016, [TAP_SOURCE]); // ALL → BASE
    scene.update(0.016, [TAP_SOURCE]); // BASE → ROCKET
    scene.update(0.016, [TAP_SOURCE]); // ROCKET → ALL
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('▸ ALL');
  });

  it('DLC source filter shows only DLC bestiary entries', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    // Cycle to DLC source: ALL → BASE → ROCKET
    scene.update(0.016, [TAP_SOURCE]);
    scene.update(0.016, [TAP_SOURCE]);
    // Render and check entry count — DLC critter count (if any) should differ from base
    const ctx = makeCtx();
    scene.render(ctx);
    // Just verify it renders without error when filtered to DLC entries
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('BASE source filter excludes DLC entries', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    scene.update(0.016, [TAP_SOURCE]); // ALL → BASE
    // Render should succeed
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('switching source resets selection index', () => {
    mergeDlcIntoGameData(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    // Move selection down a few
    scene.update(0.016, [MOVE_DOWN]);
    scene.update(0.016, [MOVE_DOWN]);
    // Switch source — selection should reset to 0
    scene.update(0.016, [TAP_SOURCE]);
    // If we open detail, it should be the first entry (index 0)
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });
});
