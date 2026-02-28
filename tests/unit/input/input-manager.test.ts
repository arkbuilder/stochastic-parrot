// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { InputManager } from '../../../src/input/input-manager';
import type { RawInputAction } from '../../../src/input/types';

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({ left: 10, top: 20, width: 480, height: 800 }),
  });
  return canvas;
}

describe('InputManager', () => {
  it('normalizes pointer coordinates into game space', () => {
    const manager = new InputManager(createCanvas());

    const fakeProvider = {
      poll: (): RawInputAction[] => [{ type: 'primary', screenX: 250, screenY: 420 }],
    };

    (manager as unknown as { providers: Array<{ poll: () => RawInputAction[] }> }).providers = [
      fakeProvider,
    ];

    const actions = manager.poll();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({ type: 'primary', x: 120, y: 200 });
  });

  it('maps keyboard fallback to center for primary actions', () => {
    const manager = new InputManager(createCanvas());

    const fakeProvider = {
      poll: (): RawInputAction[] => [{ type: 'primary', screenX: Number.NaN, screenY: Number.NaN }],
    };

    (manager as unknown as { providers: Array<{ poll: () => RawInputAction[] }> }).providers = [
      fakeProvider,
    ];

    const actions = manager.poll();
    expect(actions[0]).toEqual({ type: 'primary', x: 120, y: 200 });
  });
});
