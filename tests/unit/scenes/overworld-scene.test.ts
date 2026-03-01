/**
 * Overworld Scene — Unit Tests
 *
 * Tests the sea-chart navigation flow:
 * - phase transitions (chart_visible → node_selected → sailing)
 * - node selection via tap
 * - sail button confirmation
 * - sailing progress → onIslandArrive callback
 * - reinforced_mast speed upgrade
 * - locked island ignore
 * - secret node visibility (ghostlight_lantern)
 * - enter / exit lifecycle
 * - render does not throw
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverworldScene } from '../../../src/scenes/overworld-scene';
import type { OverworldProgress } from '../../../src/scenes/flow-types';
import type { InputAction } from '../../../src/input/types';

// ── Helpers ──────────────────────────────────────────────────

function makeProgress(overrides: Partial<OverworldProgress> = {}): OverworldProgress {
  return {
    completedIslands: [],
    unlockedIslands: ['island_01', 'island_02'],
    islandResults: [],
    shipUpgrades: [],
    expertBonusIslands: [],
    ...overrides,
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    progress: makeProgress(),
    telemetry: { emit: vi.fn(), flush: vi.fn() },
    audio: { play: vi.fn(), setMusicLayers: vi.fn(), playSong: vi.fn(), selectIslandTheme: vi.fn(), playFanfare: vi.fn(), applyEncounterPreset: vi.fn(), stopSong: vi.fn() },
    onIslandArrive: vi.fn(),
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

function keyConfirmAction(): InputAction {
  return { type: 'primary', x: NaN, y: NaN } as any;
}

// ── Tests ────────────────────────────────────────────────────

describe('OverworldScene', () => {
  let deps: ReturnType<typeof makeDeps>;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('constructs without error', () => {
    const scene = new OverworldScene(deps);
    expect(scene).toBeDefined();
  });

  it('enter() sets music layers and plays overworld song', () => {
    const scene = new OverworldScene(deps);
    scene.enter({} as any);
    expect(deps.audio.setMusicLayers).toHaveBeenCalledWith(['base', 'rhythm']);
    expect(deps.audio.playSong).toHaveBeenCalledWith('overworld');
  });

  it('enter() emits overworldEntered telemetry', () => {
    const scene = new OverworldScene(deps);
    scene.enter({} as any);
    const calls = deps.telemetry.emit.mock.calls;
    expect(calls.some((c: any) => c[0] === 'overworld_entered')).toBe(true);
  });

  it('tapping unlocked node selects it (node_selected phase)', () => {
    const scene = new OverworldScene(deps);
    scene.enter({} as any);

    // island_02 is at { x: 108, y: 194 }
    scene.update(0.016, [tapAction(108, 194)]);

    const calls = deps.telemetry.emit.mock.calls;
    expect(calls.some((c: any) => c[0] === 'node_selected' && c[1].destination_island_id === 'island_02')).toBe(true);
  });

  it('tapping locked node does nothing', () => {
    const scene = new OverworldScene(deps);
    scene.enter({} as any);

    // island_03 at {152,232} is NOT in unlockedIslands
    const before = deps.telemetry.emit.mock.calls.length;
    scene.update(0.016, [tapAction(152, 232)]);
    // Only the enter telemetry call should exist
    const nodeSelected = deps.telemetry.emit.mock.calls.find(
      (c: any) => c[0] === 'node_selected' && c[1].destination_island_id === 'island_03',
    );
    expect(nodeSelected).toBeUndefined();
  });

  it('sail button tap starts sailing', () => {
    const d = makeDeps({
      progress: makeProgress({ unlockedIslands: ['island_01', 'island_02'] }),
      fromIslandId: 'island_01',
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    // Select island_02
    scene.update(0.016, [tapAction(108, 194)]);
    // Tap sail button at {48,352,144,34}
    scene.update(0.016, [tapAction(120, 370)]);

    const sailStart = d.telemetry.emit.mock.calls.find((c: any) => c[0] === 'sailing_started');
    expect(sailStart).toBeDefined();
  });

  it('keyboard confirm starts sailing from node_selected', () => {
    const d = makeDeps({
      progress: makeProgress({ unlockedIslands: ['island_01', 'island_02'] }),
      fromIslandId: 'island_01',
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    // Select island_02
    scene.update(0.016, [tapAction(108, 194)]);
    // Keyboard confirm
    scene.update(0.016, [keyConfirmAction()]);

    const sailStart = d.telemetry.emit.mock.calls.find((c: any) => c[0] === 'sailing_started');
    expect(sailStart).toBeDefined();
  });

  it('sailing to completion fires onIslandArrive', () => {
    const d = makeDeps({
      progress: makeProgress({ unlockedIslands: ['island_01', 'island_02'] }),
      fromIslandId: 'island_01',
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    // Select + sail
    scene.update(0.016, [tapAction(108, 194)]);
    scene.update(0.016, [tapAction(120, 370)]);

    // Advance 12s+ to complete sailing (sailDurationMs starts at 12000)
    scene.update(13, []);

    expect(d.onIslandArrive).toHaveBeenCalledWith('island_02');
  });

  it('reinforced_mast upgrade speeds up sailing', () => {
    const d = makeDeps({
      progress: makeProgress({
        unlockedIslands: ['island_01', 'island_02'],
        shipUpgrades: ['reinforced_mast'],
      }),
      fromIslandId: 'island_01',
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    scene.update(0.016, [tapAction(108, 194)]);
    scene.update(0.016, [tapAction(120, 370)]);

    // With reinforced_mast, sailDuration = floor(12000/1.2) = 10000ms = 10s
    scene.update(11, []);
    expect(d.onIslandArrive).toHaveBeenCalled();
  });

  it('cannot sail to same island (sailFromNodeId === selectedNodeId)', () => {
    const d = makeDeps({
      progress: makeProgress({ unlockedIslands: ['island_01'] }),
      fromIslandId: 'island_01',
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    // Select the same island we're at
    scene.update(0.016, [tapAction(56, 246)]); // island_01 coords
    scene.update(0.016, [tapAction(120, 370)]); // sail button

    const sailStart = d.telemetry.emit.mock.calls.find((c: any) => c[0] === 'sailing_started');
    expect(sailStart).toBeUndefined();
  });

  it('secret node hidden_reef not pickable without ghostlight_lantern', () => {
    const d = makeDeps({
      progress: makeProgress({ unlockedIslands: ['island_01', 'hidden_reef'] }),
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    // hidden_reef at {34, 122}
    scene.update(0.016, [tapAction(34, 122)]);
    const nodeSelected = d.telemetry.emit.mock.calls.find(
      (c: any) => c[0] === 'node_selected' && c[1].destination_island_id === 'hidden_reef',
    );
    expect(nodeSelected).toBeUndefined();
  });

  it('secret node hidden_reef pickable with ghostlight_lantern', () => {
    const d = makeDeps({
      progress: makeProgress({
        unlockedIslands: ['island_01', 'hidden_reef'],
        shipUpgrades: ['ghostlight_lantern'],
      }),
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    scene.update(0.016, [tapAction(34, 122)]);
    const nodeSelected = d.telemetry.emit.mock.calls.find(
      (c: any) => c[0] === 'node_selected' && c[1].destination_island_id === 'hidden_reef',
    );
    expect(nodeSelected).toBeDefined();
  });

  it('sighting telemetry emits during sailing (0.46-0.72 range)', () => {
    const d = makeDeps({
      progress: makeProgress({ unlockedIslands: ['island_01', 'island_02'] }),
      fromIslandId: 'island_01',
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);

    scene.update(0.016, [tapAction(108, 194)]);
    scene.update(0.016, [tapAction(120, 370)]);
    // Advance to about 50% (6s of 12s)
    scene.update(6, []);

    const sighting = d.telemetry.emit.mock.calls.find((c: any) => c[0] === 'sighting_shown');
    expect(sighting).toBeDefined();
  });

  it('render() executes without error (chart phase)', () => {
    const scene = new OverworldScene(deps);
    scene.enter({} as any);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('render() executes without error (sailing phase)', () => {
    const d = makeDeps({
      progress: makeProgress({ unlockedIslands: ['island_01', 'island_02'] }),
      fromIslandId: 'island_01',
    });
    const scene = new OverworldScene(d);
    scene.enter({} as any);
    scene.update(0.016, [tapAction(108, 194)]);
    scene.update(0.016, [tapAction(120, 370)]);
    scene.update(1, []); // in sailing
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });
});
