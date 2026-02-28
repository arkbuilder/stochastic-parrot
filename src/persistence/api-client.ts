import type { ProgressSubmission, ScoreSubmission, TelemetryBatch } from './types';

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
