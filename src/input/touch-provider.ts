import type { InputProvider, RawInputAction } from './types';

export class TouchProvider implements InputProvider {
  private readonly queue: RawInputAction[] = [];

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  poll(): RawInputAction[] {
    return this.queue.splice(0, this.queue.length);
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button === 2) {
      this.queue.push({ type: 'secondary', screenX: event.clientX, screenY: event.clientY });
      return;
    }

    this.queue.push({ type: 'primary', screenX: event.clientX, screenY: event.clientY });
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.queue.push({ type: 'primary_end', screenX: event.clientX, screenY: event.clientY });
  };

  private onPointerMove = (event: PointerEvent): void => {
    if ((event.buttons & 1) !== 1) {
      return;
    }

    this.queue.push({ type: 'drag', screenX: event.clientX, screenY: event.clientY });
  };

  private onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };
}
