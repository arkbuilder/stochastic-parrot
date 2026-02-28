import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetRateLimitBucketsForTests, RATE_MAX_REQUESTS, rateLimit } from '../../../server/middleware/rate-limit';
import { computeScoreChecksum, isValidScoreChecksum } from '../../../server/security/score-checksum';
import { isGradeConsistent } from '../../../server/routes/scores';

describe('server score validation', () => {
  it('validates checksum for score submissions', () => {
    const payload = {
      playerId: 'player_local',
      boardType: 'island' as const,
      islandId: 'island_01',
      score: 1200,
      timeMs: 14000,
      accuracyPct: 92,
      grade: 'A' as const,
    };

    const checksum = computeScoreChecksum(payload);
    expect(isValidScoreChecksum(payload, checksum)).toBe(true);
    expect(isValidScoreChecksum(payload, `${checksum}bad`)).toBe(false);
  });

  it('checks grade plausibility against score envelope', () => {
    expect(isGradeConsistent(1300, 'S')).toBe(true);
    expect(isGradeConsistent(1300, 'D')).toBe(false);
    expect(isGradeConsistent(200, 'D')).toBe(true);
  });
});

describe('rate-limit middleware', () => {
  beforeEach(() => {
    __resetRateLimitBucketsForTests();
  });

  it('blocks requests over max within the same window', () => {
    const req = {
      header: (name: string) => (name === 'x-device-id' ? 'device-a' : undefined),
      ip: '127.0.0.1',
    } as never;

    let statusCode = 200;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: vi.fn(),
    } as never;

    const next = vi.fn();

    for (let index = 0; index < RATE_MAX_REQUESTS; index += 1) {
      rateLimit(req, res, next);
    }

    expect(next).toHaveBeenCalledTimes(RATE_MAX_REQUESTS);

    rateLimit(req, res, next);

    expect(statusCode).toBe(429);
  });
});
