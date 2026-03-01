import { describe, it, expect, vi } from 'vitest';
import { IntroScene, SAIL_BUTTON_RECT } from '../../../src/scenes/intro-scene';
import { AudioEvent } from '../../../src/audio/types';

/** A tap coordinate inside the SET SAIL button rect */
const BUTTON_TAP = {
  x: SAIL_BUTTON_RECT.x + SAIL_BUTTON_RECT.w / 2,
  y: SAIL_BUTTON_RECT.y + SAIL_BUTTON_RECT.h / 2,
};

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

  it('typewriter completes and calls onDone on SET SAIL button tap', () => {
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

    // Text should be done — tap SET SAIL button to exit
    scene.update(0.016, [{ type: 'primary', ...BUTTON_TAP }]);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onDone when tapping outside the SET SAIL button', () => {
    const onDone = vi.fn();
    const scene = new IntroScene(onDone);
    scene.enter({ now: () => 0 });

    // Open curtains
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 80; i++) {
      scene.update(0.016, []);
    }

    // Fast-forward typewriter
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 300; i++) {
      scene.update(0.016, []);
    }

    // Tap outside the button rect (above it)
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('does NOT auto-advance after elapsed time (regression)', () => {
    const onDone = vi.fn();
    const scene = new IntroScene(onDone);
    scene.enter({ now: () => 0 });

    // Open curtains
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 80; i++) {
      scene.update(0.016, []);
    }

    // Fast-forward typewriter
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 300; i++) {
      scene.update(0.016, []);
    }

    // Wait 10 seconds with no input — should NOT auto-exit
    for (let i = 0; i < 600; i++) {
      scene.update(0.016, []);
    }
    expect(onDone).not.toHaveBeenCalled();
  });

  it('keyboard Enter (NaN x) triggers SET SAIL exit', () => {
    const onDone = vi.fn();
    const scene = new IntroScene(onDone);
    scene.enter({ now: () => 0 });

    // Open curtains
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 80; i++) {
      scene.update(0.016, []);
    }

    // Fast-forward typewriter
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 300; i++) {
      scene.update(0.016, []);
    }

    // Keyboard enter action (NaN coords)
    scene.update(0.016, [{ type: 'primary', x: NaN, y: NaN }]);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('calls stopNarration when exiting via SET SAIL', () => {
    const onDone = vi.fn();
    const stopNarration = vi.fn();
    const scene = new IntroScene(onDone, undefined, undefined, stopNarration);
    scene.enter({ now: () => 0 });

    // Open curtains
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 80; i++) {
      scene.update(0.016, []);
    }

    // Fast-forward typewriter
    scene.update(0.016, [{ type: 'primary', x: 120, y: 200 }]);
    for (let i = 0; i < 300; i++) {
      scene.update(0.016, []);
    }

    // Tap SET SAIL
    scene.update(0.016, [{ type: 'primary', ...BUTTON_TAP }]);
    expect(stopNarration).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
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
