import { describe, expect, it, vi } from 'vitest';
import { BestiaryScene } from '../../../src/scenes/bestiary-scene';
import type { InputAction } from '../../../src/input/types';

const KEYBOARD_ENTER: InputAction = { type: 'primary', x: NaN, y: NaN };
const MOVE_RIGHT: InputAction = { type: 'move', dx: 1, dy: 0 };

describe('BestiaryScene narration', () => {
  it('narrates when opening detail and resets narration when browsing', () => {
    const onBack = vi.fn();
    const narrateEntry = vi.fn();
    const stopNarration = vi.fn();

    const scene = new BestiaryScene(onBack, { narrateEntry, stopNarration });
    scene.enter({ now: () => 0 });

    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(narrateEntry).toHaveBeenCalledTimes(1);

    scene.update(0.016, [MOVE_RIGHT]);
    expect(stopNarration).toHaveBeenCalled();
    expect(narrateEntry).toHaveBeenCalledTimes(2);
  });

  it('stops narration when closing detail', () => {
    const stopNarration = vi.fn();
    const scene = new BestiaryScene(vi.fn(), {
      narrateEntry: vi.fn(),
      stopNarration,
    });
    scene.enter({ now: () => 0 });

    scene.update(0.016, [KEYBOARD_ENTER]);
    scene.update(0.016, [KEYBOARD_ENTER]);

    expect(stopNarration).toHaveBeenCalled();
  });
});
