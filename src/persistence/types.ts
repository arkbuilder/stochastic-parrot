export interface ScoreSubmission {
  playerId: string;
  boardType: 'island' | 'total' | 'speed' | 'accuracy';
  islandId?: string;
  score: number;
  timeMs: number;
  accuracyPct: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  checksum: string;
}

export interface ProgressSubmission {
  playerId: string;
  islandId: string;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
  bestGrade?: 'S' | 'A' | 'B' | 'C' | 'D';
  bestScore: number;
  chartFragment: 0 | 1;
  expertBonus: 0 | 1;
  attempts: number;
  conceptMastery?: Array<{
    conceptId: string;
    masteryLevel: 'discovered' | 'placed' | 'recalled' | 'mastered';
    recallCount: number;
  }>;
}

export interface TelemetryBatch {
  events: Array<{
    sessionId: string;
    eventName: string;
    payload: Record<string, unknown>;
    payloadVersion: number;
    ts?: string;
  }>;
}
