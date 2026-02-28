export class Clock {
  private lastTs = 0;
  private paused = false;

  tick(ts: number): number {
    if (this.lastTs === 0) {
      this.lastTs = ts;
      return 0;
    }

    if (this.paused) {
      this.lastTs = ts;
      return 0;
    }

    const dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    return Math.max(0, dt);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  reset(): void {
    this.lastTs = 0;
    this.paused = false;
  }
}
