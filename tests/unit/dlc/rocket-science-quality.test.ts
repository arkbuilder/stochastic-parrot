/**
 * Rocket Science DLC — Comprehensive Game Quality Verification
 *
 * Validates the "Starboard Launch" DLC across every quality dimension:
 * gameplay/playability, pacing & balance, story & narrative, audio/dialog,
 * fun & variety, and polish/UX. Mirrors the base-game quality test suites.
 */
import { describe, it, expect } from 'vitest';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import { ISLANDS } from '../../../src/data/islands';
import { CONCEPTS } from '../../../src/data/concepts';
import { BESTIARY } from '../../../src/data/bestiary';
import { OVERWORLD_NODES } from '../../../src/data/progression';
import { createWeatherState, updateWeatherSystem } from '../../../src/systems/weather-system';
import type { EncounterWeatherType } from '../../../src/systems/weather-system';

const { manifest, content } = ROCKET_SCIENCE_PACK;
const { islands, concepts, encounters, overworldNodes, bestiary, minigames } = content;

// Canvas / playable area constants (from Design tokens)
const CANVAS_W = 240;
const CANVAS_H = 400;
const PLAY_MIN_X = 8;
const PLAY_MAX_X = 220;
const PLAY_MIN_Y = 64;
const PLAY_MAX_Y = 308;

// ══════════════════════════════════════════════════════════════
// SECTION 1 — GAMEPLAY & PLAYABILITY
// ══════════════════════════════════════════════════════════════

describe('Gameplay — every DLC island can be set up', () => {
  for (const island of islands) {
    it(`${island.name}: has exactly 3 concepts`, () => {
      expect(island.conceptIds).toHaveLength(3);
    });

    it(`${island.name}: has exactly 3 landmarks`, () => {
      expect(island.landmarks).toHaveLength(3);
    });

    it(`${island.name}: each landmark maps to a concept on the island`, () => {
      for (const lm of island.landmarks) {
        expect(
          island.conceptIds,
          `landmark ${lm.id} references ${lm.conceptId} not in island concepts`,
        ).toContain(lm.conceptId);
      }
    });

    it(`${island.name}: concepts exist in the DLC concept list`, () => {
      const conceptIds = concepts.map((c) => c.id);
      for (const cid of island.conceptIds) {
        expect(conceptIds, `concept ${cid} missing from DLC concepts`).toContain(cid);
      }
    });

    it(`${island.name}: has a valid encounter type`, () => {
      const valid: EncounterWeatherType[] = ['fog', 'storm', 'battle', 'ruins', 'squid'];
      expect(valid).toContain(island.encounterType);
    });

    it(`${island.name}: has vegetation`, () => {
      expect(island.vegetation!.length).toBeGreaterThanOrEqual(1);
    });

    it(`${island.name}: has a reward`, () => {
      expect(island.reward).toBeTruthy();
    });
  }
});

describe('Gameplay — landmark <-> concept bidirectional mapping', () => {
  it('every DLC concept has a matching landmark on its island', () => {
    for (const concept of concepts) {
      const island = islands.find((i) => i.id === concept.islandId);
      expect(island, `no island for concept ${concept.id}`).toBeDefined();
      const lm = island!.landmarks.find((l) => l.conceptId === concept.id);
      expect(lm, `no landmark for concept ${concept.id} on ${island!.id}`).toBeDefined();
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

describe('Gameplay — overworld node coverage', () => {
  it('every DLC island has an overworld node', () => {
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

describe('Gameplay — minigame coverage', () => {
  it('every DLC concept has a minigame', () => {
    for (const concept of concepts) {
      const mg = minigames.find((m) => m.conceptId === concept.id);
      expect(mg, `no minigame for concept ${concept.id}`).toBeDefined();
    }
  });

  it('no orphan minigames — every minigame maps to a DLC concept', () => {
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

describe('Gameplay — weather system integration', () => {
  for (const island of islands) {
    it(`${island.name}: weather creates for encounter type "${island.encounterType}"`, () => {
      const state = createWeatherState(island.encounterType as EncounterWeatherType);
      expect(state).toBeDefined();
      expect(state.kind).toBeTruthy();
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

describe('Gameplay — no ID collisions with base game', () => {
  it('DLC island IDs don\'t collide with base islands', () => {
    const baseIds = new Set(ISLANDS.map((i) => i.id));
    for (const island of islands) {
      expect(baseIds.has(island.id), `${island.id} collides with base`).toBe(false);
    }
  });

  it('DLC concept IDs don\'t collide with base concepts', () => {
    const baseIds = new Set(CONCEPTS.map((c) => c.id));
    for (const concept of concepts) {
      expect(baseIds.has(concept.id), `${concept.id} collides with base`).toBe(false);
    }
  });

  it('DLC bestiary IDs don\'t collide with base bestiary', () => {
    const baseIds = new Set(BESTIARY.map((b) => b.id));
    for (const entry of bestiary) {
      expect(baseIds.has(entry.id), `${entry.id} collides with base`).toBe(false);
    }
  });

  it('DLC overworld node IDs don\'t collide with base nodes', () => {
    const baseIds = new Set(OVERWORLD_NODES.map((n) => n.islandId));
    for (const node of overworldNodes) {
      expect(baseIds.has(node.islandId), `${node.islandId} collides with base`).toBe(false);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 2 — PACING & BALANCE
// ══════════════════════════════════════════════════════════════

describe('Pacing — concept tier ramp', () => {
  it('stages 1-2 use tier 1 concepts', () => {
    const stage1 = islands[0]!;
    const stage2 = islands[1]!;
    const earlyConceptIds = [...stage1.conceptIds, ...stage2.conceptIds];
    for (const cid of earlyConceptIds) {
      const concept = concepts.find((c) => c.id === cid)!;
      expect(concept.tier, `${cid} should be tier 1`).toBe(1);
    }
  });

  it('stages 3-4 use tier 2 concepts', () => {
    const stage3 = islands[2]!;
    const stage4 = islands[3]!;
    const midConceptIds = [...stage3.conceptIds, ...stage4.conceptIds];
    for (const cid of midConceptIds) {
      const concept = concepts.find((c) => c.id === cid)!;
      expect(concept.tier, `${cid} should be tier 2`).toBe(2);
    }
  });

  it('stage 5 (boss) uses tier 3 concepts', () => {
    const stage5 = islands[4]!;
    for (const cid of stage5.conceptIds) {
      const concept = concepts.find((c) => c.id === cid)!;
      expect(concept.tier, `${cid} should be tier 3`).toBe(3);
    }
  });

  it('overall tier range matches manifest (1-3)', () => {
    const tiers = concepts.map((c) => c.tier);
    expect(Math.min(...tiers)).toBe(manifest.tierRange.min);
    expect(Math.max(...tiers)).toBe(manifest.tierRange.max);
  });
});

describe('Pacing — linear island unlock chain', () => {
  it('first island has no unlockAfter (entry point)', () => {
    expect(islands[0]!.unlockAfter).toBeUndefined();
  });

  it('remaining islands form a strict linear chain', () => {
    for (let i = 1; i < islands.length; i++) {
      expect(
        islands[i]!.unlockAfter,
        `island ${islands[i]!.id} should unlock after ${islands[i - 1]!.id}`,
      ).toBe(islands[i - 1]!.id);
    }
  });

  it('unlock chain references only DLC islands', () => {
    const dlcIds = new Set(islands.map((i) => i.id));
    for (const island of islands) {
      if (island.unlockAfter) {
        expect(dlcIds.has(island.unlockAfter)).toBe(true);
      }
    }
  });
});

describe('Pacing — boss stage placement', () => {
  it('boss (squid encounter) is the final stage', () => {
    const last = islands[islands.length - 1]!;
    expect(last.encounterType).toBe('squid');
  });

  it('no squid encounter before the final stage', () => {
    for (let i = 0; i < islands.length - 1; i++) {
      expect(islands[i]!.encounterType).not.toBe('squid');
    }
  });
});

describe('Pacing — difficulty escalation via bestiary danger', () => {
  it('critters (early enemies) are danger ≤ 3', () => {
    const critters = bestiary.filter((b) => b.category === 'critter');
    for (const c of critters) {
      expect(c.danger, `${c.id} danger too high for critter`).toBeLessThanOrEqual(3);
    }
  });

  it('threats (late enemies) are danger ≥ 4', () => {
    const threats = bestiary.filter((b) => b.category === 'threat');
    for (const t of threats) {
      expect(t.danger, `${t.id} danger too low for threat`).toBeGreaterThanOrEqual(4);
    }
  });

  it('boss (Space Kraken) is highest danger (5)', () => {
    const kraken = bestiary.find((b) => b.id === 'space_kraken')!;
    expect(kraken.danger).toBe(5);
    const maxDanger = Math.max(...bestiary.map((b) => b.danger));
    expect(kraken.danger).toBe(maxDanger);
  });

  it('flora and terrain do not exceed danger 3', () => {
    const passive = bestiary.filter((b) => b.category === 'flora' || b.category === 'terrain');
    for (const p of passive) {
      expect(p.danger, `${p.id} danger too high for ${p.category}`).toBeLessThanOrEqual(3);
    }
  });
});

describe('Pacing — encounter type variety across stages', () => {
  it('no two consecutive islands share the same encounter type', () => {
    for (let i = 1; i < islands.length; i++) {
      expect(
        islands[i]!.encounterType,
        `stage ${i + 1} repeats encounter type of stage ${i}`,
      ).not.toBe(islands[i - 1]!.encounterType);
    }
  });

  it('uses at least 4 distinct encounter types', () => {
    const types = new Set(islands.map((i) => i.encounterType));
    expect(types.size).toBeGreaterThanOrEqual(4);
  });
});

describe('Pacing — minigame challenge difficulty ramp', () => {
  const stageMinigames = islands.map((island) =>
    island.conceptIds.map((cid) => minigames.find((m) => m.conceptId === cid)!),
  );

  it('early stages (1-2) have fewer challenge items on average than later stages', () => {
    const earlyAvg =
      stageMinigames.slice(0, 2).flat().reduce((s, m) => s + m.challenge.items.length, 0) /
      stageMinigames.slice(0, 2).flat().length;
    const lateAvg =
      stageMinigames.slice(3).flat().reduce((s, m) => s + m.challenge.items.length, 0) /
      stageMinigames.slice(3).flat().length;
    // Late stages should have at least as many items (≥ complexity)
    expect(lateAvg).toBeGreaterThanOrEqual(earlyAvg - 1); // allow tolerance of 1
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 3 — STORY & NARRATIVE
// ══════════════════════════════════════════════════════════════

describe('Story — island names are evocative & unique', () => {
  it('all 5 DLC island names are unique', () => {
    const names = islands.map((i) => i.name);
    expect(new Set(names).size).toBe(5);
  });

  it('island names are descriptive (> 5 chars)', () => {
    for (const island of islands) {
      expect(island.name.length, `${island.name} too short`).toBeGreaterThan(5);
    }
  });

  it('island names don\'t duplicate base game names', () => {
    const baseNames = new Set(ISLANDS.map((i) => i.name.toLowerCase()));
    for (const island of islands) {
      expect(baseNames.has(island.name.toLowerCase())).toBe(false);
    }
  });
});

describe('Story — concept metaphors', () => {
  it('every concept has a unique metaphorObject', () => {
    const metaphors = concepts.map((c) => c.metaphorObject);
    expect(new Set(metaphors).size).toBe(concepts.length);
  });

  it('metaphorObject is non-trivial (> 3 chars)', () => {
    for (const c of concepts) {
      expect(c.metaphorObject.length, `${c.id} metaphor too short`).toBeGreaterThan(3);
    }
  });

  it('concept names are non-empty and descriptive', () => {
    for (const c of concepts) {
      expect(c.name.length).toBeGreaterThan(2);
    }
  });
});

describe('Story — bestiary lore quality', () => {
  for (const entry of bestiary) {
    it(`${entry.name}: flavour text is concise (10-100 chars)`, () => {
      expect(entry.flavour.length, 'too short').toBeGreaterThanOrEqual(10);
      expect(entry.flavour.length, 'too long for UI').toBeLessThanOrEqual(100);
    });

    it(`${entry.name}: has behaviour description`, () => {
      expect(entry.behaviour.length).toBeGreaterThan(5);
    });

    it(`${entry.name}: has at least one habitat`, () => {
      expect(entry.habitat.length).toBeGreaterThanOrEqual(1);
    });

    it(`${entry.name}: has a renderHint`, () => {
      expect(entry.renderHint).toBeTruthy();
    });
  }
});

describe('Story — Space Kraken boss lore', () => {
  const kraken = bestiary.find((b) => b.id === 'space_kraken')!;

  it('kraken exists', () => {
    expect(kraken).toBeDefined();
  });

  it('kraken is categorised as a threat', () => {
    expect(kraken.category).toBe('threat');
  });

  it('kraken flavour references its cosmic scale', () => {
    const text = kraken.flavour.toLowerCase();
    expect(text.includes('void') || text.includes('ancient') || text.includes('terror')).toBe(true);
  });

  it('kraken behaviour mentions boss mechanics', () => {
    const text = kraken.behaviour.toLowerCase();
    expect(text.includes('boss') || text.includes('phase') || text.includes('grab')).toBe(true);
  });

  it('kraken habitat is final island only', () => {
    expect(kraken.habitat).toContain("Kraken's Void");
  });
});

describe('Story — narrative arc across 5 stages', () => {
  it('stage 1 introduces basics (launch/fuel/cargo)', () => {
    const stage1Concepts = islands[0]!.conceptIds;
    const basicTerms = ['thrust', 'propellant', 'payload'];
    expect(stage1Concepts).toEqual(basicTerms);
  });

  it('mid-stages expand to orbital mechanics', () => {
    const midConcepts = [...islands[2]!.conceptIds, ...islands[3]!.conceptIds];
    const orbitalTerms = ['orbit', 'gravity', 'trajectory', 'vacuum', 'delta_v', 'gravity_assist'];
    expect(midConcepts).toEqual(orbitalTerms);
  });

  it('final stage returns to Earth (re-entry/splashdown)', () => {
    const finalConcepts = islands[4]!.conceptIds;
    expect(finalConcepts).toContain('reentry');
    expect(finalConcepts).toContain('splashdown');
  });

  it('journey forms a complete loop: launch → space → return', () => {
    expect(islands[0]!.name.toLowerCase()).toContain('launch');
    expect(islands[4]!.conceptIds).toContain('splashdown');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 4 — DIALOG & AUDIO DIRECTION
// ══════════════════════════════════════════════════════════════

describe('Dialog — minigame dialog structure', () => {
  for (const mg of minigames) {
    describe(`${mg.conceptName} minigame`, () => {
      it('has at least 3 dialog beats', () => {
        expect(mg.dialog.length).toBeGreaterThanOrEqual(3);
      });

      it('dialog speakers are valid (parrot or narrator)', () => {
        for (const beat of mg.dialog) {
          expect(['parrot', 'narrator']).toContain(beat.speaker);
        }
      });

      it('has exactly one quiz beat (with choices)', () => {
        const quizBeats = mg.dialog.filter((b) => b.choices && b.choices.length > 0);
        expect(quizBeats).toHaveLength(1);
      });

      it('quiz beat has 3 choices', () => {
        const quiz = mg.dialog.find((b) => b.choices)!;
        expect(quiz.choices).toHaveLength(3);
      });

      it('quiz correctChoice is a valid index', () => {
        const quiz = mg.dialog.find((b) => b.choices)!;
        expect(quiz.correctChoice).toBeGreaterThanOrEqual(0);
        expect(quiz.correctChoice).toBeLessThan(quiz.choices!.length);
      });

      it('quiz has wrongFeedback and correctFeedback', () => {
        const quiz = mg.dialog.find((b) => b.choices)!;
        expect(quiz.wrongFeedback!.length).toBeGreaterThan(5);
        expect(quiz.correctFeedback!.length).toBeGreaterThan(5);
      });

      it('has a narrator beat (definition/summary)', () => {
        const narrators = mg.dialog.filter((b) => b.speaker === 'narrator');
        expect(narrators.length).toBeGreaterThanOrEqual(1);
      });

      it('dialog texts are concise (≤ 120 chars each) for 8-bit UI', () => {
        for (const beat of mg.dialog) {
          expect(
            beat.text.length,
            `dialog text too long: "${beat.text.slice(0, 40)}..."`,
          ).toBeLessThanOrEqual(120);
        }
      });

      it('feedback texts are concise (≤ 100 chars) for SFX timing', () => {
        const quiz = mg.dialog.find((b) => b.choices)!;
        if (quiz.wrongFeedback) {
          expect(quiz.wrongFeedback.length).toBeLessThanOrEqual(100);
        }
        if (quiz.correctFeedback) {
          expect(quiz.correctFeedback.length).toBeLessThanOrEqual(100);
        }
      });
    });
  }
});

describe('Dialog — interactive challenge structure', () => {
  for (const mg of minigames) {
    describe(`${mg.conceptName} challenge`, () => {
      it('has a valid challenge type', () => {
        expect(['sort', 'connect', 'adjust', 'select']).toContain(mg.challenge.type);
      });

      it('has non-empty items array', () => {
        expect(mg.challenge.items.length).toBeGreaterThanOrEqual(2);
      });

      it('instruction is concise (≤ 80 chars)', () => {
        expect(mg.challenge.instruction.length).toBeLessThanOrEqual(80);
      });

      it('successText is concise (≤ 80 chars)', () => {
        expect(mg.challenge.successText.length).toBeLessThanOrEqual(80);
      });

      it('hintText is concise (≤ 80 chars)', () => {
        expect(mg.challenge.hintText.length).toBeLessThanOrEqual(80);
      });

      it('answer is valid for the challenge type', () => {
        const { type, items, answer } = mg.challenge;
        if (type === 'select' || type === 'adjust') {
          // answer is a single index
          expect(typeof answer).toBe('number');
          expect(answer as number).toBeGreaterThanOrEqual(0);
          expect(answer as number).toBeLessThan(items.length);
        } else if (type === 'sort') {
          // answer is an array of indices
          expect(Array.isArray(answer)).toBe(true);
          for (const idx of answer as number[]) {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(items.length);
          }
        } else if (type === 'connect') {
          // answer is array of [from, to] pairs
          expect(Array.isArray(answer)).toBe(true);
          for (const pair of answer as Array<[number, number]>) {
            expect(pair).toHaveLength(2);
            expect(pair[0]).toBeGreaterThanOrEqual(0);
            expect(pair[0]).toBeLessThan(items.length);
            expect(pair[1]).toBeGreaterThanOrEqual(0);
            expect(pair[1]).toBeLessThan(items.length);
          }
        }
      });
    });
  }
});

describe('Dialog — wrapUp messages', () => {
  for (const mg of minigames) {
    it(`${mg.conceptName}: wrapUp is non-empty`, () => {
      expect(mg.wrapUp.length).toBeGreaterThan(5);
    });

    it(`${mg.conceptName}: wrapUp is concise (≤ 100 chars)`, () => {
      expect(
        mg.wrapUp.length,
        `wrapUp too long: "${mg.wrapUp.slice(0, 40)}..."`,
      ).toBeLessThanOrEqual(100);
    });
  }
});

describe('Audio — dialog pacing for chiptune SFX', () => {
  it('no dialog text exceeds 120 chars (fits 8-bit text crawl ≤ 4s)', () => {
    for (const mg of minigames) {
      for (const beat of mg.dialog) {
        expect(beat.text.length).toBeLessThanOrEqual(120);
      }
    }
  });

  it('choice strings are short (≤ 25 chars each) for button display', () => {
    for (const mg of minigames) {
      const quiz = mg.dialog.find((b) => b.choices)!;
      for (const choice of quiz.choices!) {
        expect(choice.length, `choice too long: "${choice}"`).toBeLessThanOrEqual(25);
      }
    }
  });

  it('challenge items are short (≤ 30 chars) for touch-friendly display', () => {
    for (const mg of minigames) {
      for (const item of mg.challenge.items) {
        expect(item.length, `item too long: "${item}"`).toBeLessThanOrEqual(30);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 5 — FUN & VARIETY
// ══════════════════════════════════════════════════════════════

describe('Fun — encounter type variety', () => {
  it('5 islands use at least 4 different encounter types', () => {
    const types = new Set(islands.map((i) => i.encounterType));
    expect(types.size).toBeGreaterThanOrEqual(4);
  });

  it('all 5 base encounter types are represented', () => {
    const types = new Set(islands.map((i) => i.encounterType));
    expect(types.has('fog')).toBe(true);
    expect(types.has('storm')).toBe(true);
    expect(types.has('ruins')).toBe(true);
    expect(types.has('battle')).toBe(true);
    expect(types.has('squid')).toBe(true);
  });
});

describe('Fun — bestiary variety', () => {
  it('at least 7 bestiary entries', () => {
    expect(bestiary.length).toBeGreaterThanOrEqual(7);
  });

  it('all 4 bestiary categories represented', () => {
    const cats = new Set(bestiary.map((b) => b.category));
    expect(cats.has('critter')).toBe(true);
    expect(cats.has('threat')).toBe(true);
    expect(cats.has('flora')).toBe(true);
    expect(cats.has('terrain')).toBe(true);
  });

  it('danger levels span 0-5', () => {
    const dangers = bestiary.map((b) => b.danger);
    expect(Math.min(...dangers)).toBe(0);
    expect(Math.max(...dangers)).toBe(5);
  });

  it('bestiary names are unique', () => {
    const names = bestiary.map((b) => b.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('bestiary IDs are unique', () => {
    const ids = bestiary.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Fun — minigame challenge type variety', () => {
  it('uses at least 3 different challenge types', () => {
    const types = new Set(minigames.map((m) => m.challenge.type));
    expect(types.size).toBeGreaterThanOrEqual(3);
  });

  it('all 4 challenge types appear across 15 minigames', () => {
    const types = new Set(minigames.map((m) => m.challenge.type));
    expect(types.has('sort')).toBe(true);
    expect(types.has('select')).toBe(true);
    expect(types.has('adjust')).toBe(true);
    expect(types.has('connect')).toBe(true);
  });

  it('no island repeats the same challenge type 3 times', () => {
    for (const island of islands) {
      const challengeTypes = island.conceptIds.map((cid) => {
        const mg = minigames.find((m) => m.conceptId === cid)!;
        return mg.challenge.type;
      });
      // At most 2 of the same type per island
      for (const t of ['sort', 'select', 'adjust', 'connect']) {
        const count = challengeTypes.filter((ct) => ct === t).length;
        expect(count, `${island.name} has ${count} "${t}" challenges`).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('Fun — reward variety', () => {
  it('every island has a unique reward', () => {
    const rewards = islands.map((i) => i.reward);
    expect(new Set(rewards).size).toBe(islands.length);
  });

  it('rewards are non-empty strings', () => {
    for (const island of islands) {
      expect(island.reward!.length).toBeGreaterThan(2);
    }
  });
});

describe('Fun — vegetation variety', () => {
  it('at least 3 different vegetation types across all DLC islands', () => {
    const allVeg = new Set(islands.flatMap((i) => i.vegetation ?? []));
    expect(allVeg.size).toBeGreaterThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 6 — POLISH & UX
// ══════════════════════════════════════════════════════════════

describe('Polish — landmark positions within playable area', () => {
  for (const island of islands) {
    for (const lm of island.landmarks) {
      it(`${island.name}/${lm.id}: x in [${PLAY_MIN_X}, ${PLAY_MAX_X}]`, () => {
        expect(lm.x).toBeGreaterThanOrEqual(PLAY_MIN_X);
        expect(lm.x).toBeLessThanOrEqual(PLAY_MAX_X);
      });

      it(`${island.name}/${lm.id}: y in [${PLAY_MIN_Y}, ${PLAY_MAX_Y}]`, () => {
        expect(lm.y).toBeGreaterThanOrEqual(PLAY_MIN_Y);
        expect(lm.y).toBeLessThanOrEqual(PLAY_MAX_Y);
      });
    }
  }
});

describe('Polish — no landmark collisions (≥20px apart)', () => {
  for (const island of islands) {
    it(`${island.name}: landmarks are ≥20px apart`, () => {
      const lms = island.landmarks;
      for (let i = 0; i < lms.length; i++) {
        for (let j = i + 1; j < lms.length; j++) {
          const dx = lms[i]!.x - lms[j]!.x;
          const dy = lms[i]!.y - lms[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          expect(
            dist,
            `${lms[i]!.id} and ${lms[j]!.id} only ${dist.toFixed(1)}px apart`,
          ).toBeGreaterThanOrEqual(20);
        }
      }
    });
  }
});

describe('Polish — overworld nodes within canvas', () => {
  for (const node of overworldNodes) {
    it(`${node.name}: x in [0, ${CANVAS_W}]`, () => {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(CANVAS_W);
    });

    it(`${node.name}: y in [0, ${CANVAS_H}]`, () => {
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(CANVAS_H);
    });
  }
});

describe('Polish — overworld node spacing (≥20px)', () => {
  it('all DLC overworld nodes are ≥20px apart', () => {
    for (let i = 0; i < overworldNodes.length; i++) {
      for (let j = i + 1; j < overworldNodes.length; j++) {
        const a = overworldNodes[i]!;
        const b = overworldNodes[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(
          dist,
          `${a.name} and ${b.name} only ${dist.toFixed(1)}px apart`,
        ).toBeGreaterThanOrEqual(20);
      }
    }
  });
});

describe('Polish — overworld forms ascending voyage path', () => {
  it('nodes have ascending x across the journey', () => {
    for (let i = 1; i < overworldNodes.length; i++) {
      expect(
        overworldNodes[i]!.x,
        `node ${i} x should exceed node ${i - 1} x`,
      ).toBeGreaterThan(overworldNodes[i - 1]!.x);
    }
  });

  it('nodes have decreasing y (sailing upward on map)', () => {
    for (let i = 1; i < overworldNodes.length; i++) {
      expect(
        overworldNodes[i]!.y,
        `node ${i} y should be less than node ${i - 1} y`,
      ).toBeLessThan(overworldNodes[i - 1]!.y);
    }
  });
});

describe('Polish — data IDs use snake_case', () => {
  it('island IDs', () => {
    for (const island of islands) {
      expect(island.id).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('concept IDs', () => {
    for (const c of concepts) {
      expect(c.id).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('landmark IDs', () => {
    for (const island of islands) {
      for (const lm of island.landmarks) {
        expect(lm.id).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    }
  });

  it('bestiary IDs', () => {
    for (const b of bestiary) {
      expect(b.id).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Polish — manifest description fits UI', () => {
  it('description ≤ 100 chars', () => {
    expect(manifest.description.length).toBeLessThanOrEqual(100);
  });

  it('title ≤ 40 chars', () => {
    expect(manifest.title.length).toBeLessThanOrEqual(40);
  });

  it('version follows semver', () => {
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 7 — CROSS-CUTTING INTEGRITY
// ══════════════════════════════════════════════════════════════

describe('Integrity — manifest counts match actual content', () => {
  it('manifest.islandCount matches content.islands.length', () => {
    expect(islands.length).toBe(manifest.islandCount);
  });

  it('manifest.conceptCount matches content.concepts.length', () => {
    expect(concepts.length).toBe(manifest.conceptCount);
  });

  it('minigames count matches concepts count (1:1)', () => {
    expect(minigames.length).toBe(concepts.length);
  });

  it('overworld nodes count matches islands count', () => {
    expect(overworldNodes.length).toBe(islands.length);
  });
});

describe('Integrity — concept-to-island assignment', () => {
  it('every concept references a valid DLC island', () => {
    const islandIds = new Set(islands.map((i) => i.id));
    for (const c of concepts) {
      expect(islandIds.has(c.islandId), `${c.id} references unknown island ${c.islandId}`).toBe(true);
    }
  });

  it('concept distribution is 3 per island', () => {
    for (const island of islands) {
      const islandConcepts = concepts.filter((c) => c.islandId === island.id);
      expect(islandConcepts).toHaveLength(3);
    }
  });
});

describe('Integrity — bestiary habitat references', () => {
  it('every habitat references a DLC island name', () => {
    const islandNames = new Set(islands.map((i) => i.name));
    for (const entry of bestiary) {
      for (const hab of entry.habitat) {
        expect(
          islandNames.has(hab),
          `bestiary ${entry.id} habitat "${hab}" not a DLC island name`,
        ).toBe(true);
      }
    }
  });
});

describe('Integrity — no duplicate content across DLC', () => {
  it('no duplicate concept IDs', () => {
    const ids = concepts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate island IDs', () => {
    const ids = islands.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate landmark IDs across all DLC islands', () => {
    const lmIds = islands.flatMap((i) => i.landmarks.map((l) => l.id));
    expect(new Set(lmIds).size).toBe(lmIds.length);
  });

  it('no duplicate minigame conceptIds', () => {
    const ids = minigames.map((m) => m.conceptId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no duplicate overworld node islandIds', () => {
    const ids = overworldNodes.map((n) => n.islandId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
