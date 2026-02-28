import type { ProgressSubmission, ScoreSubmission } from './types';

type QueueItem =
  | { type: 'score'; payload: ScoreSubmission; ts: string }
  | { type: 'progress'; payload: ProgressSubmission; ts: string };

const QUEUE_KEY = 'dr_offline_queue';

export class LocalStore {
  saveScore(payload: ScoreSubmission): void {
    this.enqueue({ type: 'score', payload, ts: new Date().toISOString() });
  }

  saveProgress(payload: ProgressSubmission): void {
    this.enqueue({ type: 'progress', payload, ts: new Date().toISOString() });
  }

  readQueue(): QueueItem[] {
    const json = localStorage.getItem(QUEUE_KEY);
    if (!json) {
      return [];
    }

    try {
      return JSON.parse(json) as QueueItem[];
    } catch {
      return [];
    }
  }

  clearQueue(): void {
    localStorage.removeItem(QUEUE_KEY);
  }

  private enqueue(item: QueueItem): void {
    const current = this.readQueue();
    current.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(current));
  }
}
