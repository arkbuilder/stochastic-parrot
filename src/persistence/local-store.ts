import type { ProgressSubmission, ScoreSubmission } from './types';
import type { ApiClient, LeaderboardResponse } from './api-client';

type QueueItem =
  | { type: 'score'; payload: ScoreSubmission; ts: string; retries: number }
  | { type: 'progress'; payload: ProgressSubmission; ts: string; retries: number };

const QUEUE_KEY = 'dr_offline_queue';
const LEADERBOARD_CACHE_KEY = 'dr_leaderboard_cache';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;

export class LocalStore {
  saveScore(payload: ScoreSubmission): void {
    this.enqueue({ type: 'score', payload, ts: new Date().toISOString(), retries: 0 });
  }

  saveProgress(payload: ProgressSubmission): void {
    this.enqueue({ type: 'progress', payload, ts: new Date().toISOString(), retries: 0 });
  }

  readQueue(): QueueItem[] {
    const json = localStorage.getItem(QUEUE_KEY);
    if (!json) {
      return [];
    }

    try {
      const parsed = JSON.parse(json) as Array<QueueItem | (QueueItem & { retries?: number })>;
      return parsed.map((entry) => ({ ...entry, retries: entry.retries ?? 0 }));
    } catch {
      return [];
    }
  }

  clearQueue(): void {
    localStorage.removeItem(QUEUE_KEY);
  }

  async drainQueue(apiClient: ApiClient): Promise<{ sent: number; failed: number }> {
    if (!navigator.onLine) {
      return { sent: 0, failed: 0 };
    }

    const queued = this.readQueue();
    if (queued.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const failed: QueueItem[] = [];
    let sent = 0;

    for (const item of queued) {
      try {
        if (item.type === 'score') {
          await apiClient.submitScore(item.payload);
        } else {
          await apiClient.submitProgress(item.payload);
        }
        sent += 1;
      } catch {
        const nextRetries = item.retries + 1;
        if (nextRetries <= MAX_RETRIES) {
          failed.push({ ...item, retries: nextRetries });
        }
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    return { sent, failed: failed.length };
  }

  cacheLeaderboard(cacheKey: string, payload: LeaderboardResponse): void {
    const cache = this.readLeaderboardCache();
    cache[cacheKey] = payload;
    localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(cache));
  }

  readCachedLeaderboard(cacheKey: string): LeaderboardResponse | null {
    const cache = this.readLeaderboardCache();
    return cache[cacheKey] ?? null;
  }

  private enqueue(item: QueueItem): void {
    const current = this.readQueue();
    current.push(item);
    if (current.length > MAX_QUEUE_SIZE) {
      current.splice(0, current.length - MAX_QUEUE_SIZE);
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(current));
  }

  private readLeaderboardCache(): Record<string, LeaderboardResponse> {
    const json = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (!json) {
      return {};
    }

    try {
      return JSON.parse(json) as Record<string, LeaderboardResponse>;
    } catch {
      return {};
    }
  }
}
