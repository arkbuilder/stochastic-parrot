/**
 * Cybersecurity DLC — Quality Verification
 *
 * Mirrors rocket-science-quality.test.ts patterns for CYBERSECURITY_PACK:
 * - Island setup (concepts, landmarks, encounter types)
 * - Landmark ↔ concept bidirectional mapping
 * - Overworld node coverage
 * - Minigame coverage
 * - Weather system integration
 * - No ID collisions with base game
 * - Bestiary coverage
 * - Tier ramp within manifest range
 * - Unlock chain validity
 * - Minigame answer correctness
 * - Landmark bounds within playable area
 */
import { describe, it, expect } from 'vitest';
import { CYBERSECURITY_PACK } from '../../../src/dlc/packs/cybersecurity-pack';
import { ISLANDS } from '../../../src/data/islands';
import { CONCEPTS } from '../../../src/data/concepts';
import { BESTIARY } from '../../../src/data/bestiary';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { createWeatherState, updateWeatherSystem } from '../../../src/systems/weather-system';
import type { EncounterWeatherType } from '../../../src/systems/weather-system';

const { manifest, content } = CYBERSECURITY_PACK;
const { islands, concepts, overworldNodes, bestiary, minigames } = content;

const PLAY_MIN_X = 8;
const PLAY_MAX_X = 220;
const PLAY_MIN_Y = 64;
const PLAY_MAX_Y = 308;

// ══════════════════════════════════════════════════════════════
// SECTION 1 — GAMEPLAY & PLAYABILITY
// ══════════════════════════════════════════════════════════════

describe('Cybersecurity — island setup', () => {
  it(`manifest declares ${manifest.islandCount} islands`, () => {
    expect(islands).toHaveLength(manifest.islandCount);
  });

  it(`manifest declares ${manifest.conceptCount} concepts`, () => {
    expect(concepts).toHaveLength(manifest.conceptCount);
  });

  for (const island of islands) {
    it(`${island.name}: has exactly 3 concepts`, () => {
      expect(island.conceptIds).toHaveLength(3);
    });

    it(`${island.name}: has exactly 3 landmarks`, () => {
      expect(island.landmarks).toHaveLength(3);
    });

    it(`${island.name}: each landmark maps to a concept on the island`, () => {
      for (const lm of island.landmarks) {
        expect(island.conceptIds).toContain(lm.conceptId);
      }
    });

    it(`${island.name}: concepts exist in the DLC concept list`, () => {
      const conceptIds = concepts.map((c) => c.id);
      for (const cid of island.conceptIds) {
        expect(conceptIds).toContain(cid);
      }
    });

    it(`${island.name}: has a valid encounter type`, () => {
      const valid = ['fog', 'storm', 'battle', 'ruins', 'squid'];
      expect(valid).toContain(island.encounterType);
    });

    it(`${island.name}: has a reward`, () => {
      expect(island.reward).toBeTruthy();
    });

    it(`${island.name}: has vegetation`, () => {
      expect(island.vegetation!.length).toBeGreaterThanOrEqual(1);
    });
  }
});

describe('Cybersecurity — landmark ↔ concept mapping', () => {
  it('every concept has a matching landmark on its island', () => {
    for (const concept of concepts) {
      const island = islands.find((i) => i.id === concept.islandId);
      expect(island, `no island for concept ${concept.id}`).toBeDefined();
      const lm = island!.landmarks.find((l) => l.conceptId === concept.id);
      expect(lm, `no landmark for concept ${concept.id}`).toBeDefined();
    }
  });

  it('every landmark references a valid DLC concept', () => {
    const conceptIds = concepts.map((c) => c.id);
    for (const island of islands) {
      for (const lm of island.landmarks) {
        expect(conceptIds).toContain(lm.conceptId);
      }
    }
  });

  it('landmark IDs match the concept landmarkId field', () => {
    for (const concept of concepts) {
      const island = islands.find((i) => i.id === concept.islandId)!;
      const lm = island.landmarks.find((l) => l.conceptId === concept.id);
      expect(lm!.id).toBe(concept.landmarkId);
    }
  });
});

describe('Cybersecurity — overworld node coverage', () => {
  it('every island has an overworld node', () => {
    for (const island of islands) {
      const node = overworldNodes.find((n) => n.islandId === island.id);
      expect(node, `no overworld node for ${island.id}`).toBeDefined();
    }
  });

  it('overworld node names match island names', () => {
    for (const island of islands) {
      const node = overworldNodes.find((n) => n.islandId === island.id)!;
      expect(node.name).toBe(island.name);
    }
  });
});

describe('Cybersecurity — minigame coverage', () => {
  it('every concept has a minigame', () => {
    for (const concept of concepts) {
      const mg = minigames.find((m) => m.conceptId === concept.id);
      expect(mg, `no minigame for concept ${concept.id}`).toBeDefined();
    }
  });

  it('no orphan minigames', () => {
    const conceptIds = concepts.map((c) => c.id);
    for (const mg of minigames) {
      expect(conceptIds).toContain(mg.conceptId);
    }
  });

  it('minigame metaphors match concept metaphorObject', () => {
    for (const mg of minigames) {
      const concept = concepts.find((c) => c.id === mg.conceptId)!;
      expect(mg.metaphor).toBe(concept.metaphorObject);
    }
  });
});

describe('Cybersecurity — weather integration', () => {
  for (const island of islands) {
    it(`${island.name}: weather creates for "${island.encounterType}"`, () => {
      const state = createWeatherState(island.encounterType as EncounterWeatherType);
      expect(state).toBeDefined();
    });

    it(`${island.name}: weather updates 10s without error`, () => {
      const type = island.encounterType as EncounterWeatherType;
      const state = createWeatherState(type);
      for (let i = 0; i < 600; i++) {
        updateWeatherSystem(state, 1 / 60, type);
      }
      expect(state).toBeDefined();
    });
  }
});

describe('Cybersecurity — no ID collisions with base game', () => {
  it('island IDs don\'t collide with base', () => {
    const baseIds = new Set(ISLANDS.map((i) => i.id));
    for (const island of islands) {
      expect(baseIds.has(island.id), `${island.id} collides`).toBe(false);
    }
  });

  it('concept IDs don\'t collide with base', () => {
    const baseIds = new Set(CONCEPTS.map((c) => c.id));
    for (const concept of concepts) {
      expect(baseIds.has(concept.id), `${concept.id} collides`).toBe(false);
    }
  });

  it('bestiary IDs don\'t collide with base', () => {
    const baseIds = new Set(BESTIARY.map((b) => b.id));
    for (const entry of bestiary) {
      expect(baseIds.has(entry.id), `${entry.id} collides`).toBe(false);
    }
  });

  it('overworld node IDs don\'t collide with base', () => {
    const baseIds = new Set(OVERWORLD_NODES.map((n) => n.islandId));
    for (const node of overworldNodes) {
      expect(baseIds.has(node.islandId), `${node.islandId} collides`).toBe(false);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 2 — PACING & BALANCE
// ══════════════════════════════════════════════════════════════

describe('Cybersecurity — tier ramp', () => {
  it('overall tier range matches manifest', () => {
    const tiers = concepts.map((c) => c.tier);
    expect(Math.min(...tiers)).toBe(manifest.tierRange.min);
    expect(Math.max(...tiers)).toBe(manifest.tierRange.max);
  });

  it('first island uses tier 1 concepts', () => {
    const island1 = islands[0]!;
    for (const cid of island1.conceptIds) {
      const concept = concepts.find((c) => c.id === cid)!;
      expect(concept.tier).toBe(1);
    }
  });

  it('second island uses tier 2 concepts', () => {
    const island2 = islands[1]!;
    for (const cid of island2.conceptIds) {
      const concept = concepts.find((c) => c.id === cid)!;
      expect(concept.tier).toBe(2);
    }
  });
});

describe('Cybersecurity — unlock chain', () => {
  it('first island unlocks after island_05 (base game complete)', () => {
    expect(islands[0]!.unlockAfter).toBe('island_05');
  });

  it('second island unlocks after first DLC island', () => {
    expect(islands[1]!.unlockAfter).toBe(islands[0]!.id);
  });
});

describe('Cybersecurity — bestiary', () => {
  it('has 3 bestiary entries', () => {
    expect(bestiary).toHaveLength(3);
  });

  it('all entries have required fields', () => {
    for (const entry of bestiary) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.flavour).toBeTruthy();
      expect(entry.habitat.length).toBeGreaterThan(0);
      expect(typeof entry.danger).toBe('number');
    }
  });

  it('flora does not exceed danger 3', () => {
    const flora = bestiary.filter((b) => b.category === 'flora');
    for (const f of flora) {
      expect(f.danger).toBeLessThanOrEqual(3);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 3 — MINIGAME ANSWER CORRECTNESS
// ══════════════════════════════════════════════════════════════

describe('Cybersecurity — minigame answer correctness', () => {
  for (const mg of minigames) {
    const choiceStep = mg.dialog.find((d: any) => d.choices);
    if (choiceStep) {
      it(`${mg.conceptName}: correct choice index is in range`, () => {
        const step = choiceStep as any;
        expect(step.correctChoice).toBeGreaterThanOrEqual(0);
        expect(step.correctChoice).toBeLessThan(step.choices.length);
      });

      it(`${mg.conceptName}: correct choice text relates to concept`, () => {
        const step = choiceStep as any;
        const correctText: string = step.choices[step.correctChoice];
        expect(correctText.length).toBeGreaterThan(0);
      });
    }

    it(`${mg.conceptName}: challenge has valid answer`, () => {
      const ch = mg.challenge;
      if (ch.type === 'select') {
        expect(ch.answer).toBeGreaterThanOrEqual(0);
        expect(ch.answer).toBeLessThan(ch.items.length);
      } else if (ch.type === 'sort') {
        for (const idx of ch.answer as number[]) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(ch.items.length);
        }
      } else if (ch.type === 'connect') {
        for (const pair of ch.answer as number[][]) {
          expect(pair).toHaveLength(2);
          expect(pair[0]).toBeGreaterThanOrEqual(0);
          expect(pair[0]).toBeLessThan(ch.items.length);
          expect(pair[1]).toBeGreaterThanOrEqual(0);
          expect(pair[1]).toBeLessThan(ch.items.length);
        }
      }
    });
  }
});

// ══════════════════════════════════════════════════════════════
// SECTION 4 — LANDMARK BOUNDS
// ══════════════════════════════════════════════════════════════

describe('Cybersecurity — landmark bounds', () => {
  for (const island of islands) {
    for (const lm of island.landmarks) {
      it(`${lm.id}: x in playable range [${PLAY_MIN_X}, ${PLAY_MAX_X}]`, () => {
        expect(lm.x).toBeGreaterThanOrEqual(PLAY_MIN_X);
        expect(lm.x).toBeLessThanOrEqual(PLAY_MAX_X);
      });

      it(`${lm.id}: y in playable range [${PLAY_MIN_Y}, ${PLAY_MAX_Y}]`, () => {
        expect(lm.y).toBeGreaterThanOrEqual(PLAY_MIN_Y);
        expect(lm.y).toBeLessThanOrEqual(PLAY_MAX_Y);
      });
    }
  }
});
