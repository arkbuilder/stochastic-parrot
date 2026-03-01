import { describe, it, expect, vi } from 'vitest';
import { IntroScene } from '../../../src/scenes/intro-scene';
import { AudioEvent } from '../../../src/audio/types';

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
    arcTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    measureText: vi.fn(() => ({ width: 30 })),
    save: vi.fn(),
    restore: vi.fn(),
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

describe('IntroScene', () => {
  it('starts in curtain phase and waits for tap', () => {
    const onDone = vi.fn();
    const scene = new IntroScene(onDone);
    scene.enter({ now: () => 0 });

    // Update without tap — should stay in curtain phase
    scene.update(0.5, []);
    scene.render(makeCtx()); // should not throw

    expect(onDone).not.toHaveBeenCalled();
  });

  it('opens curtains on tap and transitions to scroll phase', () => {
    const onDone = vi.fn();
    const audioPlay = vi.fn();
    const scene = new IntroScene(onDone, audioPlay);
    scene.enter({ now: () => 0 });

    // Tap to trigger curtain opening
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    expect(audioPlay).toHaveBeenCalledWith(AudioEvent.CurtainOpen);

    // Advance time to fully open curtains (1.2s)
    for (let i = 0; i < 80; i++) {
      scene.update(0.016, []);
    }

    // Should be in scroll phase now — render should not throw
    scene.render(makeCtx());
    expect(onDone).not.toHaveBeenCalled();
  });

  it('typewriter completes and calls onDone on tap', () => {
    const onDone = vi.fn();
    const audioPlay = vi.fn();
    const scene = new IntroScene(onDone, audioPlay);
    scene.enter({ now: () => 0 });

    // Open curtains
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 80; i++) {
      scene.update(0.016, []);
    }

    // Fast-forward typewriter by tapping (fast mode) + lots of time
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]); // trigger fast mode
    for (let i = 0; i < 300; i++) {
      scene.update(0.016, []);
    }

    // Text should be done, tap to exit
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('plays typewriter tick sounds during scroll phase', () => {
    const onDone = vi.fn();
    const audioPlay = vi.fn();
    const scene = new IntroScene(onDone, audioPlay);
    scene.enter({ now: () => 0 });

    // Open curtains fully
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 80; i++) {
      scene.update(0.016, []);
    }

    // Advance in scroll phase — should hear tick sounds
    audioPlay.mockClear();
    for (let i = 0; i < 20; i++) {
      scene.update(0.05, []);
    }

    const tickCalls = audioPlay.mock.calls.filter(
      (c: [AudioEvent]) => c[0] === AudioEvent.TypewriterTick,
    );
    expect(tickCalls.length).toBeGreaterThan(0);
  });
});
