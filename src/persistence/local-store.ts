import type {
  AccessibilitySettings,
  ConceptMasteryState,
  ProgressSubmission,
  ScoreSubmission,
  SessionSave,
} from './types';
import type { ApiClient, LeaderboardResponse } from './api-client';

type QueueItem =
  | { type: 'score'; payload: ScoreSubmission; ts: string; retries: number }
  | { type: 'progress'; payload: ProgressSubmission; ts: string; retries: number };

const QUEUE_KEY = 'dr_offline_queue';
const LEADERBOARD_CACHE_KEY = 'dr_leaderboard_cache';
const SETTINGS_KEY = 'dr_accessibility_settings';
const SESSION_KEY = 'dr_session_state';
const MASTERY_KEY = 'dr_concept_mastery';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;
const MAX_RESUME_AGE_MS = 60 * 60 * 1000;

const DEFAULT_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  visualOnlyMode: false,
  muteAll: false,
  masterVolume: 0.6,
  musicVolume: 0.5,
  sfxVolume: 0.6,
};

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

  saveAccessibilitySettings(settings: AccessibilitySettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  loadAccessibilitySettings(): AccessibilitySettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
      return {
        reducedMotion: Boolean(parsed.reducedMotion),
        highContrast: Boolean(parsed.highContrast),
        visualOnlyMode: Boolean(parsed.visualOnlyMode),
        muteAll: Boolean(parsed.muteAll),
        masterVolume: clamp01(parsed.masterVolume ?? DEFAULT_SETTINGS.masterVolume),
        musicVolume: clamp01(parsed.musicVolume ?? DEFAULT_SETTINGS.musicVolume),
        sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSessionSave(save: SessionSave): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(save));
  }

  loadSessionSave(): SessionSave | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as SessionSave;
      if (!parsed.islandId || (parsed.phase !== 'encode' && parsed.phase !== 'recall')) {
        this.clearSessionSave();
        return null;
      }

      const ageMs = Date.now() - parsed.timestampMs;
      if (ageMs > MAX_RESUME_AGE_MS) {
        this.clearSessionSave();
        return null;
      }

      return parsed;
    } catch {
      this.clearSessionSave();
      return null;
    }
  }

  clearSessionSave(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  saveConceptMastery(entries: ConceptMasteryState[]): void {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(entries));
  }

  loadConceptMastery(): ConceptMasteryState[] {
    const raw = localStorage.getItem(MASTERY_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<Partial<ConceptMasteryState>>;
      return parsed
        .filter((entry) => typeof entry.conceptId === 'string')
        .map((entry) => ({
          conceptId: entry.conceptId as string,
          masteryLevel: normalizeMasteryLevel(entry.masteryLevel),
          recallCount: Math.max(0, Math.floor(entry.recallCount ?? 0)),
        }));
    } catch {
      return [];
    }
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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeMasteryLevel(level: unknown): ConceptMasteryState['masteryLevel'] {
  if (level === 'mastered' || level === 'recalled' || level === 'placed') {
    return level;
  }
  return 'discovered';
}
