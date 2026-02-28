export class CountdownTimer {
  private remainingMs: number;

  constructor(durationMs: number) {
    this.remainingMs = durationMs;
  }

  update(dtMs: number): void {
    this.remainingMs = Math.max(0, this.remainingMs - dtMs);
  }

  get isExpired(): boolean {
    return this.remainingMs <= 0;
  }

  get valueMs(): number {
    return this.remainingMs;
  }
}

export class Stopwatch {
  private elapsedMs = 0;

  update(dtMs: number): void {
    this.elapsedMs += Math.max(0, dtMs);
  }

  reset(): void {
    this.elapsedMs = 0;
  }

  get valueMs(): number {
    return this.elapsedMs;
  }
}
