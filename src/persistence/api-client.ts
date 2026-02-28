import type { ProgressSubmission, ScoreSubmission, TelemetryBatch } from './types';

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  timeMs: number;
}

export interface LeaderboardResponse {
  top10: LeaderboardEntry[];
  playerRank: number | null;
}

export class ApiClient {
  async submitScore(payload: ScoreSubmission): Promise<void> {
    await this.post('/api/scores', payload);
  }

  async submitProgress(payload: ProgressSubmission): Promise<void> {
    await this.post('/api/progress', payload);
  }

  async sendTelemetry(payload: TelemetryBatch): Promise<void> {
    await this.post('/api/events', payload);
  }

  async getLeaderboard(
    boardType: 'island' | 'total' | 'speed' | 'accuracy',
    islandId: string | undefined,
    playerId: string,
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({ boardType, playerId });
    if (islandId) {
      params.set('islandId', islandId);
    }

    return this.get<LeaderboardResponse>(`/api/scores?${params.toString()}`);
  }

  async getProgress(playerId: string): Promise<{ progress: ProgressSubmission[] }> {
    return this.get<{ progress: ProgressSubmission[] }>(`/api/progress?playerId=${encodeURIComponent(playerId)}`);
  }

  private async post(path: string, payload: unknown): Promise<void> {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-device-id': getDeviceId(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${path} (${response.status})`);
    }
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'x-device-id': getDeviceId(),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${path} (${response.status})`);
    }

    return (await response.json()) as T;
  }
}

function getDeviceId(): string {
  const key = 'dr_device_id';
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}
