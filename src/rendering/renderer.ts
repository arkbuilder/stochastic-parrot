import { GAME_HEIGHT, GAME_WIDTH } from '../core/types';
import { TOKENS } from './tokens';

export class Renderer {
  readonly offscreenCanvas: HTMLCanvasElement;
  readonly offscreenContext: CanvasRenderingContext2D;
  readonly visibleContext: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;

    const visibleContext = this.canvas.getContext('2d');
    if (!visibleContext) {
      throw new Error('Unable to acquire visible canvas context');
    }

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = GAME_WIDTH;
    offscreenCanvas.height = GAME_HEIGHT;

    const offscreenContext = offscreenCanvas.getContext('2d');
    if (!offscreenContext) {
      throw new Error('Unable to acquire offscreen canvas context');
    }

    visibleContext.imageSmoothingEnabled = false;
    offscreenContext.imageSmoothingEnabled = false;

    this.offscreenCanvas = offscreenCanvas;
    this.offscreenContext = offscreenContext;
    this.visibleContext = visibleContext;
  }

  clear(color = TOKENS.colorBackground): void {
    this.offscreenContext.fillStyle = color;
    this.offscreenContext.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  present(): void {
    this.visibleContext.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.visibleContext.drawImage(this.offscreenCanvas, 0, 0);
  }
}
