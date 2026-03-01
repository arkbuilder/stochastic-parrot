import { describe, expect, it, vi } from 'vitest';
import { MenuScene, type MenuSceneDeps } from '../../../src/scenes/menu-scene';
import type { InputAction } from '../../../src/input/types';

function deps(): MenuSceneDeps {
  return {
    onPlay: vi.fn(),
    onResume: vi.fn(),
    onLeaderboard: vi.fn(),
    onBestiary: vi.fn(),
    onSpeakMenuItem: vi.fn(),
    getMenuState: () => ({ hasResumableSession: false, hasBestiary: true }),
  };
}

describe('MenuScene voice barks', () => {
  it('speaks selected item when activated by primary action', () => {
    const d = deps();
    const scene = new MenuScene(d);
    scene.enter({ now: () => 0 });

    const enterAction: InputAction = { type: 'primary', x: NaN, y: NaN };
    scene.update(0.016, [enterAction]);

    expect(d.onSpeakMenuItem).toHaveBeenCalledWith('PLAY');
    expect(d.onPlay).toHaveBeenCalled();
  });
});
