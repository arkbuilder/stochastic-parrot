import { describe, expect, it } from 'vitest';
import { OverworldScene } from '../../src/scenes/overworld-scene';

describe('overworld to island flow', () => {
  it('sails from island 1 node to island 2 and arrives', () => {
    let arrivedIslandId: string | null = null;

    const scene = new OverworldScene({
      progress: {
        completedIslands: ['island_01'],
        unlockedIslands: ['island_01', 'island_02'],
        islandResults: [{ islandId: 'island_01', score: 1200, grade: 'A' }],
        shipUpgrades: ['reinforced_mast'],
        expertBonusIslands: ['island_01'],
      },
      fromIslandId: 'island_01',
      telemetry: {
        emit: () => undefined,
      } as never,
      audio: {
        setMusicLayers: () => undefined,
      } as never,
      onIslandArrive: (islandId) => {
        arrivedIslandId = islandId;
      },
    });

    scene.enter({ now: () => 0 });

    scene.update(0, [{ type: 'primary', x: 108, y: 194 }]);
    scene.update(0, [{ type: 'primary', x: 120, y: 360 }]);

    for (let index = 0; index < 80; index += 1) {
      scene.update(0.2, []);
      if (arrivedIslandId) {
        break;
      }
    }

    expect(arrivedIslandId).toBe('island_02');
  });
});
