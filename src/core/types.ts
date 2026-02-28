import type { InputAction } from '../input/types';

export const GAME_WIDTH = 240;
export const GAME_HEIGHT = 400;

export type GameState = 'boot' | 'menu' | 'play' | 'pause' | 'complete';

export type TransitionRecord = {
  from: GameState;
  to: GameState;
  reason: string;
  ts: number;
};

export interface SceneContext {
  now: () => number;
}

export interface Scene {
  enter(context: SceneContext): void;
  exit(): void;
  update(dt: number, actions: InputAction[]): void;
  render(ctx: CanvasRenderingContext2D): void;
}
