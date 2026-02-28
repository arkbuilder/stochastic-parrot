export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  frames?: number;
  fps?: number;
}

export interface SpriteManifest {
  frames: Record<string, SpriteFrame>;
}

export class SpriteSheet {
  private readonly image: HTMLImageElement;
  private readonly manifest: SpriteManifest;

  private constructor(image: HTMLImageElement, manifest: SpriteManifest) {
    this.image = image;
    this.manifest = manifest;
  }

  static async load(imageUrl: string, manifestUrl: string): Promise<SpriteSheet> {
    const [image, manifest] = await Promise.all([loadImage(imageUrl), loadManifest(manifestUrl)]);
    return new SpriteSheet(image, manifest);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    key: string,
    dx: number,
    dy: number,
    animationTimeS = 0,
  ): void {
    const frame = this.manifest.frames[key];
    if (!frame) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(dx, dy, 16, 16);
      return;
    }

    const totalFrames = frame.frames ?? 1;
    const fps = frame.fps ?? 1;
    const frameIndex = totalFrames > 1 ? Math.floor(animationTimeS * fps) % totalFrames : 0;
    const sx = frame.x + frameIndex * frame.w;

    ctx.drawImage(this.image, sx, frame.y, frame.w, frame.h, dx, dy, frame.w, frame.h);
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load sprite image: ${url}`));
    image.src = url;
  });
}

async function loadManifest(url: string): Promise<SpriteManifest> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load sprite manifest: ${url}`);
  }

  return (await response.json()) as SpriteManifest;
}
