import { describe, expect, it, vi } from 'vitest';
import { IslandScene } from '../../../src/scenes/island-scene';

/**
 * Verifies that enemy spawns follow the pacing curve from
 * Design/IslandProgression.md — "safe sandbox" on Island 1,
 * then a gradual ramp from simple patrol (crab) to the full
 * roster (crab + jellyfish + burrower) on the final island.
 */

function stubDeps(islandId: string) {
  return {
    islandId,
    onThreatTriggered: vi.fn(),
    telemetry: { send: vi.fn() } as any,
    audio: { play: vi.fn(), setMusicLayers: vi.fn(), resume: vi.fn(), playSong: vi.fn(), selectIslandTheme: vi.fn(), playFanfare: vi.fn(), applyEncounterPreset: vi.fn(), stopSong: vi.fn() } as any,
  };
}

function getEnemies(scene: IslandScene): { id: string; kind: string }[] {
  // enemies is private — peek via rendering: render and count drawEnemy calls
  // Simpler: access via (scene as any).enemies
  return (scene as any).enemies.map((e: any) => ({
    id: e.id,
    kind: e.state.kind,
  }));
}

describe('Island enemy pacing', () => {
  it('Island 1 (Bay of Learning) has zero enemies — tutorial sandbox', () => {
    const scene = new IslandScene(stubDeps('island_01'));
    const enemies = getEnemies(scene);
    expect(enemies).toHaveLength(0);
  });

  it('Island 2 (Driftwood Shallows) has only a crab — first enemy intro', () => {
    const scene = new IslandScene(stubDeps('island_02'));
    const enemies = getEnemies(scene);
    expect(enemies).toHaveLength(1);
    expect(enemies[0]!.kind).toBe('crab');
  });

  it('Island 3 (Coral Maze) has a crab and jellyfish — medium pressure', () => {
    const scene = new IslandScene(stubDeps('island_03'));
    const enemies = getEnemies(scene);
    const kinds = enemies.map((e) => e.kind).sort();
    expect(kinds).toEqual(['crab', 'jellyfish']);
  });

  it('Island 4 (Storm Bastion) has a crab and burrower — introduces burrower', () => {
    const scene = new IslandScene(stubDeps('island_04'));
    const enemies = getEnemies(scene);
    const kinds = enemies.map((e) => e.kind).sort();
    expect(kinds).toEqual(['burrower', 'crab']);
  });

  it('Island 5 (Kraken\'s Reach) has all three enemies — full difficulty', () => {
    const scene = new IslandScene(stubDeps('island_05'));
    const enemies = getEnemies(scene);
    const kinds = enemies.map((e) => e.kind).sort();
    expect(kinds).toEqual(['burrower', 'crab', 'jellyfish']);
  });

  it('Hidden Reef has all three enemies — bonus challenge island', () => {
    const scene = new IslandScene(stubDeps('hidden_reef'));
    const enemies = getEnemies(scene);
    const kinds = enemies.map((e) => e.kind).sort();
    expect(kinds).toEqual(['burrower', 'crab', 'jellyfish']);
  });

  it('enemy count never exceeds 3 on any island', () => {
    for (const id of ['island_01', 'island_02', 'island_03', 'island_04', 'island_05', 'hidden_reef']) {
      const scene = new IslandScene(stubDeps(id));
      const enemies = getEnemies(scene);
      expect(enemies.length, `${id} should have ≤3 enemies`).toBeLessThanOrEqual(3);
    }
  });

  it('enemy count increases monotonically across core islands 1→5', () => {
    const counts: number[] = [];
    for (const id of ['island_01', 'island_02', 'island_03', 'island_04', 'island_05']) {
      const scene = new IslandScene(stubDeps(id));
      counts.push(getEnemies(scene).length);
    }
    // Each island should have >= the previous island's enemy count
    for (let i = 1; i < counts.length; i++) {
      expect(
        counts[i],
        `island ${i + 1} (${counts[i]} enemies) should have >= island ${i} (${counts[i - 1]} enemies)`,
      ).toBeGreaterThanOrEqual(counts[i - 1]!);
    }
  });
});
