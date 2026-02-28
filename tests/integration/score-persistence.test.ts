import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStore } from '../../src/persistence/local-store';

function createStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('score persistence queue drain', () => {
  beforeEach(() => {
    const storage = createStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
    });
  });

  it('drains queued score/progress entries on reconnect', async () => {
    const store = new LocalStore();

    store.saveScore({
      playerId: 'player_local',
      boardType: 'island',
      islandId: 'island_01',
      score: 1200,
      timeMs: 12000,
      accuracyPct: 90,
      grade: 'A',
      checksum: 'abc',
    });

    store.saveProgress({
      playerId: 'player_local',
      islandId: 'island_01',
      status: 'completed',
      bestGrade: 'A',
      bestScore: 1200,
      chartFragment: 1,
      expertBonus: 0,
      attempts: 1,
    });

    const client = {
      submitScore: vi.fn().mockResolvedValue(undefined),
      submitProgress: vi.fn().mockResolvedValue(undefined),
    } as never;

    const result = await store.drainQueue(client);

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(store.readQueue()).toHaveLength(0);
  });
});
