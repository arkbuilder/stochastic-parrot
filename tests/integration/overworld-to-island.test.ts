import { describe, expect, it, vi } from 'vitest';
import { OverworldScene } from '../../src/scenes/overworld-scene';

function makeProgress(completedIslands: string[] = [], unlockedIslands: string[] = []) {
  return {
    completedIslands,
    unlockedIslands,
    islandResults: completedIslands.map((id) => ({ islandId: id, score: 1000, grade: 'A' as const })),
    shipUpgrades: [] as string[],
    expertBonusIslands: [] as string[],
  };
}

function makeDeps(overrides: Partial<Parameters<typeof OverworldScene['prototype']['enter']>[0]> & { progress?: ReturnType<typeof makeProgress>; fromIslandId?: string; onIslandArrive?: (id: string) => void } = {}) {
  return {
    progress: overrides.progress ?? makeProgress(['island_01'], ['island_01', 'island_02']),
    fromIslandId: overrides.fromIslandId ?? 'island_01',
    telemetry: { emit: () => undefined } as never,
    audio: { setMusicLayers: () => undefined } as never,
    onIslandArrive: overrides.onIslandArrive ?? (() => undefined),
  };
}

function makeCtx() {
  const fillStyles: string[] = [];
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
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    setLineDash: vi.fn(),
    rotate: vi.fn(),
    clip: vi.fn(),
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    set fillStyle(v: string) { fillStyles.push(v); },
    get fillStyle() { return fillStyles[fillStyles.length - 1] ?? ''; },
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    lineDashOffset: 0,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
    _fillStyles: fillStyles,
  } as unknown as CanvasRenderingContext2D & { _fillStyles: string[] };
}

describe('overworld to island flow', () => {
  it('sails from island 1 node to island 2 and arrives', () => {
    let arrivedIslandId: string | null = null;

    const scene = new OverworldScene(makeDeps({
      progress: makeProgress(['island_01'], ['island_01', 'island_02']),
      fromIslandId: 'island_01',
      onIslandArrive: (islandId) => { arrivedIslandId = islandId; },
    }));
    scene.enter({ now: () => 0 });

    scene.update(0, [{ type: 'primary', x: 108, y: 194 }]);
    scene.update(0, [{ type: 'primary', x: 120, y: 360 }]);

    for (let index = 0; index < 80; index += 1) {
      scene.update(0.2, []);
      if (arrivedIslandId) {
        break;
      }
    }

    expect(arrivedIslandId).toBe('island_02');
  });
});

describe('overworld completed island checkmark', () => {
  it('renders a green checkmark badge on completed island nodes', () => {
    const scene = new OverworldScene(makeDeps({
      progress: makeProgress(['island_01'], ['island_01', 'island_02']),
      fromIslandId: 'island_01',
    }));
    scene.enter({ now: () => 0 });

    const ctx = makeCtx();
    scene.render(ctx);

    // The green checkmark circle uses fillStyle '#16a34a'
    expect(ctx._fillStyles).toContain('#16a34a');
    // The white checkmark uses strokeStyle '#ffffff' — check via stroke calls
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('does NOT render a green checkmark on incomplete island nodes', () => {
    const scene = new OverworldScene(makeDeps({
      progress: makeProgress([], ['island_01']),
      fromIslandId: undefined,
    }));
    scene.enter({ now: () => 0 });

    const ctx = makeCtx();
    scene.render(ctx);

    // No green checkmark circle should appear
    expect(ctx._fillStyles).not.toContain('#16a34a');
  });
});
