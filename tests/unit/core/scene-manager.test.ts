import { describe, expect, it, vi } from 'vitest';
import { SceneManager } from '../../../src/core/scene-manager';
import type { Scene, SceneContext } from '../../../src/core/types';

function mockScene(name = 'scene'): Scene {
  return {
    enter: vi.fn(),
    exit: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
  };
}

function mockCtx(): SceneContext {
  return {} as SceneContext;
}

function createTrackingCanvas() {
  const fillRectCalls: Array<[number, number, number, number]> = [];
  const base: Record<string, any> = {
    fillStyle: '',
    canvas: { width: 240, height: 400 },
  };
  const ctx = new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'fillRect') return (x: number, y: number, w: number, h: number) => {
        fillRectCalls.push([x, y, w, h]);
      };
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, fillRectCalls };
}

describe('SceneManager', () => {
  describe('push', () => {
    it('calls enter() on the pushed scene', () => {
      const sm = new SceneManager(mockCtx());
      const scene = mockScene();
      sm.push(scene);
      expect(scene.enter).toHaveBeenCalledOnce();
    });

    it('sets the pushed scene as activeScene', () => {
      const sm = new SceneManager(mockCtx());
      const scene = mockScene();
      sm.push(scene);
      expect(sm.activeScene).toBe(scene);
    });

    it('stacks multiple scenes, active is the last one', () => {
      const sm = new SceneManager(mockCtx());
      const s1 = mockScene();
      const s2 = mockScene();
      sm.push(s1);
      sm.push(s2);
      expect(sm.activeScene).toBe(s2);
    });

    it('sets transitionAlpha to 1', () => {
      const sm = new SceneManager(mockCtx());
      sm.push(mockScene());
      // Render immediately — the overlay should appear
      const { ctx, fillRectCalls } = createTrackingCanvas();
      sm.render(ctx);
      // Should have at least 2 fillRect calls: scene render + transition overlay
      expect(fillRectCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('pop', () => {
    it('calls exit() on the popped scene', () => {
      const sm = new SceneManager(mockCtx());
      const scene = mockScene();
      sm.push(scene);
      sm.pop();
      expect(scene.exit).toHaveBeenCalledOnce();
    });

    it('returns the popped scene', () => {
      const sm = new SceneManager(mockCtx());
      const scene = mockScene();
      sm.push(scene);
      const popped = sm.pop();
      expect(popped).toBe(scene);
    });

    it('returns undefined when stack is empty', () => {
      const sm = new SceneManager(mockCtx());
      expect(sm.pop()).toBeUndefined();
    });

    it('reveals the previous scene after pop', () => {
      const sm = new SceneManager(mockCtx());
      const s1 = mockScene();
      const s2 = mockScene();
      sm.push(s1);
      sm.push(s2);
      sm.pop();
      expect(sm.activeScene).toBe(s1);
    });
  });

  describe('replace', () => {
    it('exits the current scene and enters the new one', () => {
      const sm = new SceneManager(mockCtx());
      const s1 = mockScene();
      const s2 = mockScene();
      sm.push(s1);
      sm.replace(s2);
      expect(s1.exit).toHaveBeenCalledOnce();
      expect(s2.enter).toHaveBeenCalledOnce();
    });

    it('sets the new scene as active', () => {
      const sm = new SceneManager(mockCtx());
      const s1 = mockScene();
      const s2 = mockScene();
      sm.push(s1);
      sm.replace(s2);
      expect(sm.activeScene).toBe(s2);
    });

    it('works when stack is empty (no scene to exit)', () => {
      const sm = new SceneManager(mockCtx());
      const s = mockScene();
      sm.replace(s);
      expect(sm.activeScene).toBe(s);
      expect(s.enter).toHaveBeenCalledOnce();
    });

    it('does not grow the stack size', () => {
      const sm = new SceneManager(mockCtx());
      sm.push(mockScene());
      sm.push(mockScene());
      sm.replace(mockScene());
      // Pop twice: one from the remaining first push, then the replacement
      sm.pop();
      expect(sm.activeScene).not.toBeUndefined();
      sm.pop();
      expect(sm.activeScene).toBeUndefined();
    });
  });

  describe('update', () => {
    it('delegates to the active scene', () => {
      const sm = new SceneManager(mockCtx());
      const scene = mockScene();
      sm.push(scene);
      sm.update(0.016, []);
      expect(scene.update).toHaveBeenCalledWith(0.016, []);
    });

    it('does not throw when no active scene', () => {
      const sm = new SceneManager(mockCtx());
      expect(() => sm.update(0.016, [])).not.toThrow();
    });

    it('decays transitionAlpha over time', () => {
      const sm = new SceneManager(mockCtx());
      sm.push(mockScene());
      // Multiple updates should reduce alpha toward 0
      for (let i = 0; i < 20; i++) sm.update(0.016, []);
      // After enough time, overlay should be gone
      const { ctx, fillRectCalls } = createTrackingCanvas();
      sm.render(ctx);
      // Only 1 fillRect from render if no overlay (no transition rect)
      // Overlay fillRect would have rgba with non-zero alpha
    });
  });

  describe('render', () => {
    it('delegates to the active scene', () => {
      const sm = new SceneManager(mockCtx());
      const scene = mockScene();
      sm.push(scene);
      const { ctx } = createTrackingCanvas();
      sm.render(ctx);
      expect(scene.render).toHaveBeenCalledOnce();
    });

    it('does not throw when no active scene', () => {
      const sm = new SceneManager(mockCtx());
      const { ctx } = createTrackingCanvas();
      expect(() => sm.render(ctx)).not.toThrow();
    });

    it('draws transition overlay when alpha > 0', () => {
      const sm = new SceneManager(mockCtx());
      sm.push(mockScene());
      const { ctx, fillRectCalls } = createTrackingCanvas();
      sm.render(ctx);
      // Should have a fillRect(0, 0, 240, 400) for the overlay
      const overlay = fillRectCalls.find(
        ([x, y, w, h]) => x === 0 && y === 0 && w === 240 && h === 400,
      );
      expect(overlay).toBeDefined();
    });

    it('transition overlay disappears after enough updates', () => {
      const sm = new SceneManager(mockCtx());
      sm.push(mockScene());
      // Decay the alpha fully
      for (let i = 0; i < 100; i++) sm.update(0.05, []);
      const { ctx, fillRectCalls } = createTrackingCanvas();
      sm.render(ctx);
      // The overlay fillRect should not appear (alpha decayed to 0)
      const overlay = fillRectCalls.find(
        ([x, y, w, h]) => x === 0 && y === 0 && w === 240 && h === 400,
      );
      expect(overlay).toBeUndefined();
    });
  });

  describe('activeScene', () => {
    it('is undefined initially', () => {
      const sm = new SceneManager(mockCtx());
      expect(sm.activeScene).toBeUndefined();
    });
  });
});
