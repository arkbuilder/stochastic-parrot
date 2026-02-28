const SCORE_SECRET = 'dead-reckoning-dev';

export async function computeScoreChecksum(payload: {
  playerId: string;
  boardType: string;
  islandId?: string;
  score: number;
  timeMs: number;
  accuracyPct: number;
  grade: string;
}): Promise<string> {
  const source = [
    payload.playerId,
    payload.boardType,
    payload.islandId ?? '',
    String(payload.score),
    String(payload.timeMs),
    payload.accuracyPct.toFixed(2),
    payload.grade,
    SCORE_SECRET,
  ].join(':');

  const data = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
