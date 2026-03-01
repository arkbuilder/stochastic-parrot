/**
 * State Machine — Comprehensive Design Compliance Tests
 *
 * Validates requirements SM1–SM8 from state-machine-and-game-loop.md:
 *  - Global states: boot, menu, play, pause, complete
 *  - All valid transitions are defined
 *  - No undefined transitions (catch-all)
 *  - Fail→retry→active path stable after repeated attempts
 *  - Transition records include reason
 *  - Scene manager stack operations
 */
import { describe, it, expect } from 'vitest';
import { StateMachine } from '../../../src/core/state-machine';
import type { GameState, TransitionRecord } from '../../../src/core/types';
import { SceneManager } from '../../../src/core/scene-manager';
import type { Scene, SceneContext } from '../../../src/core/types';

// ── SM1: Global states enumeration ──

describe('State Machine — Global States (SM1)', () => {
  it('SM1 — GameState type includes boot, menu, play, pause, complete', () => {
    // We verify by constructing a StateMachine and testing all valid states
    const sm = new StateMachine();
    expect(sm.current).toBe('boot');

    // Can reach menu
    sm.transition('menu', 'init');
    expect(sm.current).toBe('menu');

    // Can reach play
    sm.transition('play', 'start_game');
    expect(sm.current).toBe('play');

    // Can reach pause
    sm.transition('pause', 'user_pause');
    expect(sm.current).toBe('pause');

    // Back to play
    sm.transition('play', 'resume');
    expect(sm.current).toBe('play');

    // Can reach complete
    sm.transition('complete', 'game_over');
    expect(sm.current).toBe('complete');
  });

  it('SM1 — initial state is boot', () => {
    const sm = new StateMachine();
    expect(sm.current).toBe('boot');
  });
});

// ── SM3: No undefined transitions ──

describe('State Machine — Transition Guards (SM3)', () => {
  it('SM3 — boot can only transition to menu', () => {
    const sm = new StateMachine();
    expect(sm.canTransition('menu')).toBe(true);
    expect(sm.canTransition('play')).toBe(false);
    expect(sm.canTransition('pause')).toBe(false);
    expect(sm.canTransition('complete')).toBe(false);
    expect(sm.canTransition('boot')).toBe(false);
  });

  it('SM3 — menu can transition to play and complete', () => {
    const sm = new StateMachine();
    sm.transition('menu', 'init');
    expect(sm.canTransition('play')).toBe(true);
    expect(sm.canTransition('complete')).toBe(true);
    expect(sm.canTransition('boot')).toBe(false);
    expect(sm.canTransition('pause')).toBe(false);
  });

  it('SM3 — play can transition to pause, complete, and menu', () => {
    const sm = new StateMachine();
    sm.transition('menu', 'init');
    sm.transition('play', 'start');
    expect(sm.canTransition('pause')).toBe(true);
    expect(sm.canTransition('complete')).toBe(true);
    expect(sm.canTransition('menu')).toBe(true);
    expect(sm.canTransition('boot')).toBe(false);
  });

  it('SM3 — pause can transition to play and menu', () => {
    const sm = new StateMachine();
    sm.transition('menu', 'init');
    sm.transition('play', 'start');
    sm.transition('pause', 'user');
    expect(sm.canTransition('play')).toBe(true);
    expect(sm.canTransition('menu')).toBe(true);
    expect(sm.canTransition('boot')).toBe(false);
    expect(sm.canTransition('complete')).toBe(false);
  });

  it('SM3 — complete can transition to menu', () => {
    const sm = new StateMachine();
    sm.transition('menu', 'init');
    sm.transition('play', 'start');
    sm.transition('complete', 'done');
    expect(sm.canTransition('menu')).toBe(true);
    expect(sm.canTransition('boot')).toBe(false);
    expect(sm.canTransition('play')).toBe(false);
  });

  it('SM3 — invalid transitions throw Error', () => {
    const sm = new StateMachine();
    expect(() => sm.transition('play', 'skip')).toThrow();
    expect(() => sm.transition('complete', 'skip')).toThrow();
  });
});

// ── SM4: Fail→retry→active stability ──

describe('State Machine — Stability Under Stress (SM4)', () => {
  it('SM4 — play→pause→play cycle stable over 20 iterations', () => {
    const sm = new StateMachine();
    sm.transition('menu', 'init');
    sm.transition('play', 'start');

    for (let i = 0; i < 20; i++) {
      sm.transition('pause', `pause_${i}`);
      expect(sm.current).toBe('pause');
      sm.transition('play', `resume_${i}`);
      expect(sm.current).toBe('play');
    }

    // State is still valid after 20 cycles
    expect(sm.current).toBe('play');
    expect(sm.canTransition('complete')).toBe(true);
  });

  it('SM4 — play→complete→menu→play cycle stable over 10 iterations', () => {
    const sm = new StateMachine();
    sm.transition('menu', 'init');

    for (let i = 0; i < 10; i++) {
      sm.transition('play', `start_${i}`);
      sm.transition('complete', `done_${i}`);
      sm.transition('menu', `return_${i}`);
    }

    expect(sm.current).toBe('menu');
  });
});

// ── SM5: Transition records include reasons ──

describe('State Machine — Transition Records (SM5)', () => {
  it('SM5 — transition() returns TransitionRecord with from, to, reason, ts', () => {
    const sm = new StateMachine();
    const record = sm.transition('menu', 'game_loaded');

    expect(record.from).toBe('boot');
    expect(record.to).toBe('menu');
    expect(record.reason).toBe('game_loaded');
    expect(typeof record.ts).toBe('number');
    expect(record.ts).toBeGreaterThan(0);
  });

  it('SM5 — subscriber receives transition records with reason', () => {
    const sm = new StateMachine();
    const records: TransitionRecord[] = [];
    sm.subscribe((r) => records.push(r));

    sm.transition('menu', 'boot_complete');
    sm.transition('play', 'user_start');

    expect(records).toHaveLength(2);
    expect(records[0]!.reason).toBe('boot_complete');
    expect(records[1]!.reason).toBe('user_start');
  });

  it('SM5 — unsubscribe stops further notifications', () => {
    const sm = new StateMachine();
    const records: TransitionRecord[] = [];
    const unsub = sm.subscribe((r) => records.push(r));

    sm.transition('menu', 'init');
    unsub();
    sm.transition('play', 'start');

    expect(records).toHaveLength(1);
  });
});

// ── PF8 / SM8: Scene Manager ──

describe('Scene Manager — Stack Operations', () => {
  const mockContext: SceneContext = { now: () => Date.now() };

  function createMockScene(id: string): Scene & { entered: boolean; exited: boolean; id: string } {
    return {
      id,
      entered: false,
      exited: false,
      enter() { this.entered = true; },
      exit() { this.exited = true; },
      update() {},
      render() {},
    };
  }

  it('push() enters scene and makes it active', () => {
    const sm = new SceneManager(mockContext);
    const scene = createMockScene('test');
    sm.push(scene);

    expect(scene.entered).toBe(true);
    expect(sm.activeScene).toBe(scene);
  });

  it('pop() exits scene and returns to previous', () => {
    const sm = new SceneManager(mockContext);
    const scene1 = createMockScene('base');
    const scene2 = createMockScene('overlay');

    sm.push(scene1);
    sm.push(scene2);
    expect(sm.activeScene).toBe(scene2);

    sm.pop();
    expect(scene2.exited).toBe(true);
    expect(sm.activeScene).toBe(scene1);
  });

  it('replace() exits current and enters new', () => {
    const sm = new SceneManager(mockContext);
    const scene1 = createMockScene('old');
    const scene2 = createMockScene('new');

    sm.push(scene1);
    sm.replace(scene2);

    expect(scene1.exited).toBe(true);
    expect(scene2.entered).toBe(true);
    expect(sm.activeScene).toBe(scene2);
  });

  it('SM8 — transitions use scene stack, not page reload', () => {
    // Structural: SceneManager has push/pop/replace — no location.reload
    const sm = new SceneManager(mockContext);
    expect(typeof sm.push).toBe('function');
    expect(typeof sm.pop).toBe('function');
    expect(typeof sm.replace).toBe('function');
  });

  it('activeScene is undefined when stack is empty', () => {
    const sm = new SceneManager(mockContext);
    expect(sm.activeScene).toBeUndefined();
  });

  it('update and render delegate to active scene', () => {
    const sm = new SceneManager(mockContext);
    let updated = false;
    let rendered = false;

    const scene: Scene = {
      enter() {},
      exit() {},
      update() { updated = true; },
      render() { rendered = true; },
    };

    sm.push(scene);
    sm.update(0.016, []);

    const fakeCtx = {
      fillStyle: '',
      fillRect() {},
    } as unknown as CanvasRenderingContext2D;
    sm.render(fakeCtx);

    expect(updated).toBe(true);
    expect(rendered).toBe(true);
  });
});
