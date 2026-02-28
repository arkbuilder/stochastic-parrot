import type { ThreatEntity } from '../entities/threat';

export interface ThreatTickResult {
  failed: boolean;
  fogDepth: number;
}

export function updateThreatSystem(threat: ThreatEntity, dt: number): ThreatTickResult {
  threat.state.fogDepth = Math.min(1, threat.state.fogDepth + threat.state.fogSpeed * dt);
  threat.state.healthRatio = Math.max(0, 1 - threat.state.fogDepth);

  if (threat.state.shakeFrames > 0) {
    threat.state.shakeFrames -= 1;
  }

  return {
    failed: threat.state.fogDepth >= 1,
    fogDepth: threat.state.fogDepth,
  };
}

export function applyRecallOutcomeToThreat(threat: ThreatEntity, correct: boolean): void {
  if (correct) {
    threat.state.fogDepth = Math.max(0, threat.state.fogDepth - 0.34);
  } else {
    threat.state.fogDepth = Math.min(1, threat.state.fogDepth + 0.12);
    threat.state.shakeFrames = 3;
  }

  threat.state.healthRatio = Math.max(0, 1 - threat.state.fogDepth);
}
