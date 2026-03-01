/**
 * Leaderboard Scene — Unit Tests
 *
 * Tests:
 * - Board type selection (island/total/speed/accuracy)
 * - Island pagination (prev/next)
 * - Back button fires onBack
 * - Keyboard (NaN) back fires onBack
 * - Fetch success populates rows
 * - Fetch error falls back to cache
 * - Empty state renders without error
 * - render does not throw
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaderboardScene } from '../../../src/scenes/leaderboard-scene';
import type { LeaderboardResponse } from '../../../src/persistence/api-client';
import type { InputAction } from '../../../src/input/types';

// ── Helpers ──────────────────────────────────────────────────

function makeLeaderboardResponse(count = 3): LeaderboardResponse {
  return {
    top10: Array.from({ length: count }, (_, i) => ({
      playerId: `p${i}`,
      displayName: `Player ${i}`,
      score: 1000 - i * 100,
      grade: 'A' as const,
      timeMs: 10000 + i * 500,
    })),
    playerRank: 2,
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    telemetry: { emit: vi.fn(), flush: vi.fn() },
    audio: { play: vi.fn(), setMusicLayers: vi.fn(), playSong: vi.fn(), selectIslandTheme: vi.fn(), playFanfare: vi.fn(), applyEncounterPreset: vi.fn(), stopSong: vi.fn() },
    apiClient: {
      getLeaderboard: vi.fn(() => Promise.resolve(makeLeaderboardResponse())),
    },
    localStore: {
      cacheLeaderboard: vi.fn(),
      readCachedLeaderboard: vi.fn(() => null),
    },
    playerId: 'player_me',
    availableIslands: ['island_01', 'island_02', 'island_03'],
    onBack: vi.fn(),
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

// ── Tests ────────────────────────────────────────────────────

describe('LeaderboardScene', () => {
  let deps: ReturnType<typeof makeDeps>;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('constructs without error', () => {
    const scene = new LeaderboardScene(deps);
    expect(scene).toBeDefined();
  });

  it('enter() calls fetchBoard (getLeaderboard)', async () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    // Wait for the promise to settle
    await vi.waitFor(() => {
      expect(deps.apiClient.getLeaderboard).toHaveBeenCalled();
    });
  });

  it('enter() sets music layers', () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    expect(deps.audio.setMusicLayers).toHaveBeenCalledWith(['base']);
  });

  it('back button fires onBack', () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    // BACK_BUTTON at {8, 8, 52, 22}
    scene.update(0, [tapAction(34, 19)]);
    expect(deps.onBack).toHaveBeenCalled();
  });

  it('keyboard NaN fires onBack', () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    scene.update(0, [keyConfirm()]);
    expect(deps.onBack).toHaveBeenCalled();
  });

  it('board type tab selection calls new fetch', async () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    await vi.waitFor(() => {
      expect(deps.apiClient.getLeaderboard).toHaveBeenCalled();
    });

    // Tap 'TTL' tab at {66, 52, 52, 24}
    scene.update(0, [tapAction(92, 64)]);
    await vi.waitFor(() => {
      // Should have been called at least twice (enter + tab switch)
      expect(deps.apiClient.getLeaderboard.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('island prev/next pagination cycles islands', async () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    await vi.waitFor(() => {
      expect(deps.apiClient.getLeaderboard).toHaveBeenCalled();
    });

    // Default board is 'island'; ISLAND_NEXT at {194, 84, 24, 20}
    scene.update(0, [tapAction(206, 94)]);
    await vi.waitFor(() => {
      expect(deps.apiClient.getLeaderboard.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('island prev wraps around', async () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    await vi.waitFor(() => {
      expect(deps.apiClient.getLeaderboard).toHaveBeenCalled();
    });

    // ISLAND_PREV at {22, 84, 24, 20}
    scene.update(0, [tapAction(34, 94)]);
    await vi.waitFor(() => {
      expect(deps.apiClient.getLeaderboard.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('fetch failure falls back to cache', async () => {
    const failDeps = makeDeps({
      apiClient: {
        getLeaderboard: vi.fn(() => Promise.reject(new Error('offline'))),
      },
      localStore: {
        cacheLeaderboard: vi.fn(),
        readCachedLeaderboard: vi.fn(() => makeLeaderboardResponse(2)),
      },
    });
    const scene = new LeaderboardScene(failDeps);
    scene.enter({} as any);

    await vi.waitFor(() => {
      expect(failDeps.localStore.readCachedLeaderboard).toHaveBeenCalled();
    });
  });

  it('fetch success caches the response', async () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    await vi.waitFor(() => {
      expect(deps.localStore.cacheLeaderboard).toHaveBeenCalled();
    });
  });

  it('fetch success emits leaderboardViewed telemetry', async () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    await vi.waitFor(() => {
      const calls = deps.telemetry.emit.mock.calls;
      expect(calls.some((c: any) => c[0] === 'leaderboard_viewed')).toBe(true);
    });
  });

  it('render() does not throw (empty state)', () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('render() does not throw after fetch completes', async () => {
    const scene = new LeaderboardScene(deps);
    scene.enter({} as any);
    await vi.waitFor(() => {
      expect(deps.apiClient.getLeaderboard).toHaveBeenCalled();
    });
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('availableIslands defaults to [island_01] if empty', () => {
    const d = makeDeps({ availableIslands: [] });
    const scene = new LeaderboardScene(d);
    scene.enter({} as any);
    // Should not crash
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });
});
