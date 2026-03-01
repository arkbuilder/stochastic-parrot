export interface NarrationSpeakOptions {
  interrupt?: boolean;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface NarrationQueueOptions extends NarrationSpeakOptions {
  gapMs?: number;
}

/**
 * Wrapper around browser SpeechSynthesis with graceful fallback.
 */
export class NarrationEngine {
  constructor(private readonly fallbackSpeak?: (text: string) => void) {}

  isAvailable(): boolean {
    return typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof window.SpeechSynthesisUtterance !== 'undefined';
  }

  speak(text: string, opts: NarrationSpeakOptions = {}): void {
    const normalized = text.trim();
    if (!normalized) return;

    if (!this.isAvailable()) {
      this.fallbackSpeak?.(normalized);
      return;
    }

    const speech = window.speechSynthesis;
    if (opts.interrupt) speech.cancel();

    const utter = new SpeechSynthesisUtterance(normalized);
    utter.rate = clamp(opts.rate ?? 1.0, 0.7, 1.4);
    utter.pitch = clamp(opts.pitch ?? 1.0, 0.6, 1.4);
    utter.volume = clamp(opts.volume ?? 1.0, 0, 1);
    speech.speak(utter);
  }

  speakLines(lines: string[], opts: NarrationQueueOptions = {}): void {
    const cleaned = lines.map((l) => l.trim()).filter(Boolean);
    if (cleaned.length === 0) return;

    const gapMs = Math.max(0, opts.gapMs ?? 80);
    const merged = cleaned.join(gapMs > 0 ? '. ' : ' ');
    this.speak(merged, opts);
  }

  cancel(): void {
    if (!this.isAvailable()) return;
    window.speechSynthesis.cancel();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
