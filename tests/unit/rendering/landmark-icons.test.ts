import { describe, expect, it } from 'vitest';
import { ISLANDS } from '../../../src/data/islands';
import { getLandmarkIconName } from '../../../src/rendering/draw';

describe('Landmark icon mapping', () => {
  const allLandmarks = ISLANDS.flatMap((island) => island.landmarks);

  it('every landmark ID maps to a unique (non-default) icon', () => {
    for (const landmark of allLandmarks) {
      const iconName = getLandmarkIconName(landmark.id);
      expect(iconName, `Landmark "${landmark.id}" falls through to default icon`).not.toBe('default');
    }
  });

  it('landmarks within each island map to distinct icons', () => {
    for (const island of ISLANDS) {
      const iconNames = island.landmarks.map((lm) => getLandmarkIconName(lm.id));
      const unique = new Set(iconNames);
      expect(
        unique.size,
        `Island "${island.id}" has duplicate landmark icons: [${iconNames.join(', ')}]`,
      ).toBe(island.landmarks.length);
    }
  });

  it('all 15 core landmark IDs produce specific icons', () => {
    const expectedMappings: Record<string, string> = {
      dock_crates: 'crate',
      chart_table: 'scroll',
      cannon: 'cannon',
      compass_pedestal: 'compass',
      market_stalls: 'bins',
      tidewheel: 'wheel',
      barnacle_chest: 'chest',
      blank_map_frame: 'scroll',
      twin_net_posts: 'net',
      reward_bell_tower: 'bell',
      treasure_scale: 'scale',
      crows_nest: 'nest',
      rigging_web: 'web',
      anchor_winch: 'anchor',
      master_key_shrine: 'key',
    };

    for (const [landmarkId, expectedIcon] of Object.entries(expectedMappings)) {
      expect(getLandmarkIconName(landmarkId)).toBe(expectedIcon);
    }
  });

  it('hidden reef landmarks also map to non-default icons', () => {
    const hiddenReef = ISLANDS.find((i) => i.id === 'hidden_reef');
    expect(hiddenReef).toBeDefined();
    for (const lm of hiddenReef!.landmarks) {
      const iconName = getLandmarkIconName(lm.id);
      expect(iconName, `Hidden reef landmark "${lm.id}" falls through to default`).not.toBe('default');
    }
  });
});
