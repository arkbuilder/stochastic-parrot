import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStore } from '../../../src/persistence/local-store';

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

describe('local-store m4 persistence', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createStorage(),
      configurable: true,
    });
  });

  it('persists and clamps accessibility settings', () => {
    const store = new LocalStore();

    store.saveAccessibilitySettings({
      reducedMotion: true,
      highContrast: true,
      visualOnlyMode: false,
      muteAll: false,
      masterVolume: 1.4,
      musicVolume: -0.1,
      sfxVolume: 0.4,
    });

    const loaded = store.loadAccessibilitySettings();

    expect(loaded.reducedMotion).toBe(true);
    expect(loaded.highContrast).toBe(true);
    expect(loaded.masterVolume).toBe(1);
    expect(loaded.musicVolume).toBe(0);
    expect(loaded.sfxVolume).toBe(0.4);
  });

  it('discards stale resumable sessions older than one hour', () => {
    const store = new LocalStore();

    store.saveSessionSave({
      islandId: 'island_03',
      phase: 'recall',
      timestampMs: Date.now() - 61 * 60 * 1000,
    });

    expect(store.loadSessionSave()).toBeNull();
  });

  it('loads fresh resumable sessions', () => {
    const store = new LocalStore();

    store.saveSessionSave({
      islandId: 'island_02',
      phase: 'encode',
      timestampMs: Date.now() - 5_000,
    });

    const loaded = store.loadSessionSave();
    expect(loaded).not.toBeNull();
    expect(loaded?.islandId).toBe('island_02');
    expect(loaded?.phase).toBe('encode');
  });
});
