export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len === 0) {
    return { x: 0, y: 0 };
  }

  return { x: x / len, y: y / len };
}
