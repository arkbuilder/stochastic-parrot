import { createHash } from 'node:crypto';

const SCORE_SECRET = process.env.SCORE_SECRET ?? 'dead-reckoning-dev';

export interface ScoreChecksumPayload {
  playerId: string;
  boardType: 'island' | 'total' | 'speed' | 'accuracy';
  islandId?: string;
  score: number;
  timeMs: number;
  accuracyPct: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export function computeScoreChecksum(payload: ScoreChecksumPayload): string {
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

  return createHash('sha256').update(source).digest('hex');
}

export function isValidScoreChecksum(payload: ScoreChecksumPayload, checksum: string): boolean {
  return computeScoreChecksum(payload) === checksum;
}
