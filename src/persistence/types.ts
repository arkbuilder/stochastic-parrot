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

export type MasteryLevel = 'discovered' | 'placed' | 'recalled' | 'mastered';

export interface ConceptMasteryState {
  conceptId: string;
  masteryLevel: MasteryLevel;
  recallCount: number;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  visualOnlyMode: boolean;
  muteAll: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface SessionSave {
  islandId: string;
  phase: 'encode' | 'recall';
  timestampMs: number;
}
