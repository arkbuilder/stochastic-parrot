import { describe, expect, it } from 'vitest';
import { createFogThreat } from '../../../src/entities/threat';
import { applyRecallOutcomeToThreat, updateThreatSystem } from '../../../src/systems/threat-system';

describe('threat-system', () => {
  it('advances fog over time', () => {
    const threat = createFogThreat();

    updateThreatSystem(threat, 1.0);
    expect(threat.state.fogDepth).toBeGreaterThan(0);
    expect(threat.state.healthRatio).toBeLessThan(1);
  });

  it('pushes fog back on correct recall', () => {
    const threat = createFogThreat();
    threat.state.fogDepth = 0.6;

    applyRecallOutcomeToThreat(threat, true);
    expect(threat.state.fogDepth).toBeLessThan(0.6);
  });

  it('advances fog and triggers shake on incorrect recall', () => {
    const threat = createFogThreat();
    threat.state.fogDepth = 0.4;

    applyRecallOutcomeToThreat(threat, false);
    expect(threat.state.fogDepth).toBeGreaterThan(0.4);
    expect(threat.state.shakeFrames).toBe(3);
  });
});
