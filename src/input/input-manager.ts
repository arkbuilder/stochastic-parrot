import { GAME_HEIGHT, GAME_WIDTH } from '../core/types';
import { KeyboardProvider } from './keyboard-provider';
import { TouchProvider } from './touch-provider';
import type { InputAction, InputProvider, RawInputAction } from './types';

export class InputManager {
  private readonly providers: InputProvider[];

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.providers = [new TouchProvider(canvas), new KeyboardProvider()];
  }

  poll(): InputAction[] {
    const rawActions = this.providers.flatMap((provider) => provider.poll());
    return rawActions.map((action) => this.normalize(action));
  }

  private normalize(action: RawInputAction): InputAction {
    if (action.type === 'move' || action.type === 'pause') {
      return action;
    }

    if (Number.isNaN(action.screenX) || Number.isNaN(action.screenY)) {
      return {
        type: action.type,
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
      };
    }

    const point = this.screenToGame(action.screenX, action.screenY);

    return {
      type: action.type,
      x: point.x,
      y: point.y,
    };
  }

  private screenToGame(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();

    return {
      x: ((screenX - rect.left) / rect.width) * GAME_WIDTH,
      y: ((screenY - rect.top) / rect.height) * GAME_HEIGHT,
    };
  }
}
