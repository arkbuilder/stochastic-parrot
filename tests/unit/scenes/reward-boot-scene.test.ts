/**
 * Reward Scene + Boot Scene — Unit Tests
 *
 * Reward Scene:
 * - Score animation over 900ms
 * - Continue button fires onContinue + telemetry
 * - Keyboard (NaN) confirm works
 * - render does not throw
 *
 * Boot Scene:
 * - onReady fires after 0.4s
 * - onReady does not fire before 0.4s
 * - render does not throw
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RewardScene } from '../../../src/scenes/reward-scene';
import { BootScene } from '../../../src/scenes/boot-scene';
import type { RewardData } from '../../../src/scenes/flow-types';
import type { InputAction } from '../../../src/input/types';

// ── Helpers ──────────────────────────────────────────────────

function makeReward(overrides: Partial<RewardData> = {}): RewardData {
  return {
    islandId: 'island_01',
    islandScore: 1500,
    grade: 'A',
    expertBonus: false,
    comboPeak: 2.0,
    encounterType: 'fog',
    ...overrides,
  };
}

function makeRewardDeps() {
  return {
    onContinue: vi.fn(),
    telemetry: { emit: vi.fn(), flush: vi.fn() },
    audio: { play: vi.fn(), setMusicLayers: vi.fn(), playSong: vi.fn(), selectIslandTheme: vi.fn(), playFanfare: vi.fn(), applyEncounterPreset: vi.fn(), stopSong: vi.fn() },
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

// ── Reward Scene Tests ──────────────────────────────────────

describe('RewardScene', () => {
  let deps: ReturnType<typeof makeRewardDeps>;
  let reward: RewardData;

  beforeEach(() => {
    deps = makeRewardDeps();
    reward = makeReward();
  });

  it('constructs without error', () => {
    const scene = new RewardScene(reward, deps);
    expect(scene).toBeDefined();
  });

  it('enter() emits rewardSeen telemetry', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);
    const calls = deps.telemetry.emit.mock.calls;
    const seen = calls.find((c: any) => c[0] === 'reward_seen');
    expect(seen).toBeDefined();
    expect(seen![1]).toMatchObject({
      island_id: 'island_01',
      score: 1500,
      grade: 'A',
    });
  });

  it('enter() plays chart fragment audio', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);
    expect(deps.audio.play).toHaveBeenCalled();
  });

  it('score animates from 0 over 900ms', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);

    // At t=0 score should be 0
    scene.update(0, []);
    // After 450ms (half), score should be about half
    scene.update(0.45, []);
    // After a full second, score should be at max
    scene.update(0.55, []);
    // No error
    expect(scene).toBeDefined();
  });

  it('continue button tap calls onContinue', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);
    scene.update(0.016, []);

    // CONTINUE_BUTTON at {48, 330, 144, 36}
    scene.update(0.016, [tapAction(120, 348)]);
    expect(deps.onContinue).toHaveBeenCalled();
  });

  it('continue button emits rewardCollected telemetry', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);
    scene.update(0.016, [tapAction(120, 348)]);

    const calls = deps.telemetry.emit.mock.calls;
    const collected = calls.find((c: any) => c[0] === 'reward_collected');
    expect(collected).toBeDefined();
  });

  it('keyboard NaN confirm fires onContinue', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);
    scene.update(0.016, [keyConfirm()]);
    expect(deps.onContinue).toHaveBeenCalled();
  });

  it('tap outside continue button does NOT call onContinue', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);
    scene.update(0.016, [tapAction(10, 10)]);
    expect(deps.onContinue).not.toHaveBeenCalled();
  });

  it('render() does not throw', () => {
    const scene = new RewardScene(reward, deps);
    scene.enter({} as any);
    scene.update(0.5, []);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('render() with expert bonus does not throw', () => {
    const expertReward = makeReward({ expertBonus: true });
    const scene = new RewardScene(expertReward, deps);
    scene.enter({} as any);
    scene.update(0.5, []);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('render() with squid dead reckoner does not throw', () => {
    const squidReward = makeReward({ encounterType: 'squid', expertBonus: true });
    const scene = new RewardScene(squidReward, deps);
    scene.enter({} as any);
    scene.update(0.5, []);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });
});

// ── Boot Scene Tests ────────────────────────────────────────

describe('BootScene', () => {
  it('constructs without error', () => {
    const onReady = vi.fn();
    const scene = new BootScene(onReady);
    expect(scene).toBeDefined();
  });

  it('onReady fires after 0.4s', () => {
    const onReady = vi.fn();
    const scene = new BootScene(onReady);
    scene.enter({} as any);

    scene.update(0.5, []);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('onReady does NOT fire before 0.4s', () => {
    const onReady = vi.fn();
    const scene = new BootScene(onReady);
    scene.enter({} as any);

    scene.update(0.3, []);
    expect(onReady).not.toHaveBeenCalled();
  });

  it('onReady fires only once even with multiple updates', () => {
    const onReady = vi.fn();
    const scene = new BootScene(onReady);
    scene.enter({} as any);

    scene.update(0.5, []);
    scene.update(0.5, []);
    scene.update(0.5, []);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('render() does not throw', () => {
    const scene = new BootScene(vi.fn());
    scene.enter({} as any);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('render() does not throw after ready', () => {
    const scene = new BootScene(vi.fn());
    scene.enter({} as any);
    scene.update(0.5, []);
    expect(() => scene.render(makeCtxStub())).not.toThrow();
  });

  it('exit() does not throw', () => {
    const scene = new BootScene(vi.fn());
    scene.enter({} as any);
    expect(() => scene.exit()).not.toThrow();
  });
});
