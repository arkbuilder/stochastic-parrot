import { describe, it, expect, vi } from 'vitest';
import { CinematicScene } from '../../../src/cinematics/cinematic-scene';
import type { CinematicSequence, CinematicBeat } from '../../../src/cinematics/types';

// ── helpers ──────────────────────────────────────────────────

function makeCtx(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arcTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    ellipse: vi.fn(),
    setTransform: vi.fn(),
    rotate: vi.fn(),
    measureText: vi.fn(() => ({ width: 30 })),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

function tap() {
  return [{ type: 'primary' as const, x: 120, y: 200 }];
}

function makeBeat(overrides: Partial<CinematicBeat> = {}): CinematicBeat {
  return {
    id: 'test_beat',
    durationS: 2,
    sky: 'day',
    caption: 'Hello world',
    waitForTap: true,
    ...overrides,
  };
}

function makeSeq(beats: CinematicBeat[]): CinematicSequence {
  return { id: 'test_seq', beats };
}

/** Advance a scene's typewriter to completion (enough frames for any short caption). */
function finishTypewriter(scene: CinematicScene, frames = 100): void {
  for (let i = 0; i < frames; i++) scene.update(0.016, []);
}

// ── CinematicScene — lifecycle ───────────────────────────────

describe('CinematicScene — lifecycle', () => {
  it('starts at beat 0 after enter()', () => {
    const scene = new CinematicScene(makeSeq([makeBeat()]), vi.fn());
    scene.enter({ now: () => 0 });
    expect(scene.currentBeatIndex).toBe(0);
  });

  it('calls onDone when the sequence has no beats', () => {
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq([]), onDone);
    scene.enter({ now: () => 0 });
    scene.update(0.016, []);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('exit() does not throw', () => {
    const scene = new CinematicScene(makeSeq([makeBeat()]), vi.fn());
    scene.enter({ now: () => 0 });
    expect(() => scene.exit()).not.toThrow();
  });

  it('enter() resets state for replay', () => {
    const onDone = vi.fn();
    const beat = makeBeat({ caption: 'X', durationS: 0.05, waitForTap: false });
    const scene = new CinematicScene(makeSeq([beat]), onDone);

    // First play
    scene.enter({ now: () => 0 });
    for (let i = 0; i < 200; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalledTimes(1);

    // Re-enter should reset
    scene.enter({ now: () => 0 });
    expect(scene.currentBeatIndex).toBe(0);
  });

  it('onDone fires exactly once even after continued updates', () => {
    const onDone = vi.fn();
    const beat = makeBeat({ caption: 'X', durationS: 0.05, waitForTap: false });
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });
    for (let i = 0; i < 400; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

// ── CinematicScene — typewriter ──────────────────────────────

describe('CinematicScene — typewriter', () => {
  it('reveals caption progressively (not all at once)', () => {
    const beat = makeBeat({ caption: 'A longer caption text here', waitForTap: true });
    const scene = new CinematicScene(makeSeq([beat]), vi.fn());
    scene.enter({ now: () => 0 });

    // After only 1ms the full text shouldn't be fully revealed yet
    scene.update(0.001, []);
    const ctx = makeCtx();
    scene.render(ctx);
    const textCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      .filter((c: unknown[]) => typeof c[0] === 'string' && !(c[0] as string).includes('tap'));
    // Caption panel was drawn but full text not all visible — no "tap to continue"
    const tapCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      .filter((c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('tap to continue'));
    expect(tapCalls.length).toBe(0); // typewriter still running → no tap prompt
  });

  it('tap speeds up typewriter to fast mode', () => {
    const caption = 'The quick brown fox jumps over the lazy dog again and again.';
    const beat = makeBeat({ caption, waitForTap: true });
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });

    // First tap — goes to fast mode
    scene.update(0.1, tap());
    // Many small updates with fast speed
    for (let i = 0; i < 200; i++) scene.update(0.016, []);
    // Second tap — advance beat (text should be done)
    scene.update(0.016, tap());
    // After transition (0.35s)
    for (let i = 0; i < 30; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalled();
  });

  it('does not call onDone prematurely with long caption', () => {
    const longCaption = 'This is a much longer caption that takes real time to reveal.';
    const beat = makeBeat({ caption: longCaption, durationS: 10, waitForTap: true });
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });
    scene.update(0.016, []);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('handles beat with no caption — text phase is instantly done', () => {
    const beat = makeBeat({ caption: undefined, durationS: 0.2, waitForTap: false });
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });
    for (let i = 0; i < 50; i++) scene.update(0.016, []);
    scene.render(makeCtx());
    expect(onDone).toHaveBeenCalled();
  });

  it('shows "tap to continue" only after typewriter finishes', () => {
    const beat = makeBeat({ caption: 'Hello', waitForTap: true });
    const scene = new CinematicScene(makeSeq([beat]), vi.fn());
    scene.enter({ now: () => 0 });

    // Finish typewriter fully
    finishTypewriter(scene);

    const ctx = makeCtx();
    scene.render(ctx);
    const tapCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
      .filter((c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('tap to continue'));
    expect(tapCalls.length).toBeGreaterThan(0);
  });
});

// ── CinematicScene — beat progression ────────────────────────

describe('CinematicScene — beat progression', () => {
  it('auto-advances after durationS when waitForTap is false', () => {
    const beat = makeBeat({ caption: 'Hi', durationS: 0.5, waitForTap: false });
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });
    for (let i = 0; i < 200; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalled();
  });

  it('does NOT auto-advance when waitForTap is true even after durationS', () => {
    const beat = makeBeat({ caption: 'Hi', durationS: 0.1, waitForTap: true });
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });
    // Run way past durationS
    for (let i = 0; i < 200; i++) scene.update(0.016, []);
    expect(onDone).not.toHaveBeenCalled(); // still waiting for tap
    expect(scene.currentBeatIndex).toBe(0);
  });

  it('beat index increments step-by-step through a 3-beat sequence', () => {
    const beats = [
      makeBeat({ id: 'b1', caption: 'A', waitForTap: true }),
      makeBeat({ id: 'b2', caption: 'B', waitForTap: true }),
      makeBeat({ id: 'b3', caption: 'C', waitForTap: true }),
    ];
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq(beats), onDone);
    scene.enter({ now: () => 0 });

    expect(scene.currentBeatIndex).toBe(0);

    // Finish beat 1 typewriter + tap to advance
    finishTypewriter(scene);
    scene.update(0.016, tap());
    // Wait for transition to complete
    for (let i = 0; i < 30; i++) scene.update(0.016, []);
    expect(scene.currentBeatIndex).toBe(1);

    // Finish beat 2 typewriter + tap
    finishTypewriter(scene);
    scene.update(0.016, tap());
    for (let i = 0; i < 30; i++) scene.update(0.016, []);
    expect(scene.currentBeatIndex).toBe(2);

    // Finish beat 3 → onDone
    finishTypewriter(scene);
    scene.update(0.016, tap());
    for (let i = 0; i < 30; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('advances through auto-play beats in sequence', () => {
    const beats = [
      makeBeat({ id: 'b1', caption: 'A', durationS: 0.1, waitForTap: false }),
      makeBeat({ id: 'b2', caption: 'B', durationS: 0.1, waitForTap: false }),
      makeBeat({ id: 'b3', caption: 'C', durationS: 0.1, waitForTap: false }),
    ];
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq(beats), onDone);
    scene.enter({ now: () => 0 });

    for (let i = 0; i < 500; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalled();
  });
});

// ── CinematicScene — transition fades ────────────────────────

describe('CinematicScene — transitions', () => {
  it('renders transition fade overlay between beats', () => {
    const beats = [
      makeBeat({ id: 'b1', caption: 'A', waitForTap: true }),
      makeBeat({ id: 'b2', caption: 'B', waitForTap: true }),
    ];
    const scene = new CinematicScene(makeSeq(beats), vi.fn());
    scene.enter({ now: () => 0 });

    finishTypewriter(scene);
    scene.update(0.016, tap()); // begin transition

    const ctx = makeCtx();
    scene.render(ctx);
    // Transition draws a dark overlay via fillRect with rgba
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('input is ignored during transition (does not double-skip)', () => {
    const beats = [
      makeBeat({ id: 'b1', caption: 'A', waitForTap: true }),
      makeBeat({ id: 'b2', caption: 'B', waitForTap: true }),
      makeBeat({ id: 'b3', caption: 'C', waitForTap: true }),
    ];
    const scene = new CinematicScene(makeSeq(beats), vi.fn());
    scene.enter({ now: () => 0 });

    finishTypewriter(scene);
    scene.update(0.016, tap()); // triggers transition from b1 → b2

    // During transition, tap should be ignored — should NOT skip to b3
    scene.update(0.016, tap());
    scene.update(0.016, tap());

    // Complete transition
    for (let i = 0; i < 30; i++) scene.update(0.016, []);

    // Should be on b2, not b3
    expect(scene.currentBeatIndex).toBe(1);
  });
});

// ── CinematicScene — visual composition ──────────────────────

describe('CinematicScene — visual composition', () => {
  it('renders without throwing for a fully-featured beat', () => {
    const beat = makeBeat({
      sky: 'storm',
      characters: [{ id: 'nemo', x: 100, y: 200 }],
      props: [{ kind: 'lightning', x: 50, y: 50 }],
      caption: 'Stormy scene',
      tint: 'rgba(10,5,30,0.3)',
      shake: 0.5,
    });
    const scene = new CinematicScene(makeSeq([beat]), vi.fn());
    scene.enter({ now: () => 0 });
    scene.update(0.5, []);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('applies camera shake for beats with shake > 0', () => {
    const beat = makeBeat({ shake: 0.5 });
    const scene = new CinematicScene(makeSeq([beat]), vi.fn());
    scene.enter({ now: () => 0 });
    scene.update(0.016, []);

    const ctx = makeCtx();
    scene.render(ctx);
    expect(ctx.translate).toHaveBeenCalled();
  });

  it('does not apply camera shake when shake is 0', () => {
    const beat = makeBeat({ shake: 0, characters: undefined, props: undefined });
    const scene = new CinematicScene(makeSeq([beat]), vi.fn());
    scene.enter({ now: () => 0 });
    scene.update(0.016, []);

    const ctx = makeCtx();
    scene.render(ctx);
    // translate only called with (0,0) internally by renderBeat — no shake offset applied
    const calls = (ctx.translate as ReturnType<typeof vi.fn>).mock.calls;
    const nonZeroCalls = calls.filter((c: number[]) => c[0] !== 0 || c[1] !== 0);
    expect(nonZeroCalls.length).toBe(0);
  });

  it('save/restore are balanced in render (no context leak)', () => {
    const beat = makeBeat({
      characters: [{ id: 'nemo', x: 50, y: 200 }, { id: 'bit', x: 100, y: 170 }],
      props: [{ kind: 'chart_fragment', x: 80, y: 150 }],
    });
    const scene = new CinematicScene(makeSeq([beat]), vi.fn());
    scene.enter({ now: () => 0 });
    scene.update(0.5, []);

    const ctx = makeCtx();
    scene.render(ctx);
    expect((ctx.save as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBe((ctx.restore as ReturnType<typeof vi.fn>).mock.calls.length);
  });
});

// ── CinematicScene — edge cases ──────────────────────────────

describe('CinematicScene — edge cases', () => {
  it('handles rapid tapping without crashing', () => {
    const beats = [
      makeBeat({ id: 'b1', caption: 'A', waitForTap: true }),
      makeBeat({ id: 'b2', caption: 'B', waitForTap: true }),
    ];
    const onDone = vi.fn();
    const scene = new CinematicScene(makeSeq(beats), onDone);
    scene.enter({ now: () => 0 });

    for (let i = 0; i < 300; i++) scene.update(0.016, tap());
    scene.render(makeCtx());
    expect(onDone).toHaveBeenCalled();
  });

  it('single-beat sequence completes cleanly', () => {
    const onDone = vi.fn();
    const beat = makeBeat({ caption: 'Solo', waitForTap: true });
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });

    finishTypewriter(scene);
    scene.update(0.016, tap());
    for (let i = 0; i < 30; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('render returns early when past last beat (no error)', () => {
    const onDone = vi.fn();
    const beat = makeBeat({ caption: 'X', durationS: 0.05, waitForTap: false });
    const scene = new CinematicScene(makeSeq([beat]), onDone);
    scene.enter({ now: () => 0 });
    for (let i = 0; i < 200; i++) scene.update(0.016, []);
    expect(onDone).toHaveBeenCalled();

    // Render after completion — should not throw
    expect(() => scene.render(makeCtx())).not.toThrow();
  });
});
