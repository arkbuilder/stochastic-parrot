import type { InputProvider, RawInputAction } from './types';

const MOVE_KEYS: Record<string, { dx: number; dy: number }> = {
  ArrowUp: { dx: 0, dy: -1 },
  KeyW: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  KeyS: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  KeyA: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  KeyD: { dx: 1, dy: 0 },
};

export class KeyboardProvider implements InputProvider {
  private readonly queue: RawInputAction[] = [];

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  poll(): RawInputAction[] {
    return this.queue.splice(0, this.queue.length);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const moveVector = MOVE_KEYS[event.code];
    if (moveVector) {
      this.queue.push({ type: 'move', dx: moveVector.dx, dy: moveVector.dy });
      return;
    }

    if (event.code === 'Enter' || event.code === 'Space') {
      this.queue.push({ type: 'primary', screenX: Number.NaN, screenY: Number.NaN });
      return;
    }

    if (event.code === 'Escape') {
      this.queue.push({ type: 'pause' });
    }
  };
}
