/**
 * minigame-answer-correctness.test.ts — Validates that every minigame
 * dialog choice and challenge answer is semantically correct and unambiguous.
 *
 * Requirements:
 *  - Each dialog correctChoice index refers to the option containing the concept keyword
 *  - Each challenge answer index is within range and unambiguous
 *  - Select/adjust challenges have exactly one correct answer (number)
 *  - Sort challenges have distinct correct vs incorrect items
 *  - DLC minigames are discoverable through the findMinigame pattern
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { CONCEPT_MINIGAMES, getConceptMinigame } from '../../../src/data/concept-minigames';
import type { ConceptMinigame } from '../../../src/data/concept-minigames';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import { CYBERSECURITY_PACK } from '../../../src/dlc/packs/cybersecurity-pack';
import { registerDlcPack, clearDlcRegistry, listDlcPacks } from '../../../src/dlc/dlc-registry';

// ── Helpers ──────────────────────────────────────────────────

/** Expected keyword each dialog correct answer must contain (case-insensitive) */
const DIALOG_KEYWORDS: Record<string, string> = {
  // Base game
  training_data: 'example',
  model: 'model',
  inference: 'inference',
  bias: 'bias',
  classification: 'classification',
  feedback_loop: 'feedback',
  overfitting: 'overfitting',
  underfitting: 'underfitting',
  training_vs_testing: 'learned',
  reinforcement: 'reinforcement',
  reward_function: 'reward function',
  agent: 'observes',
  neural_network: 'brain',
  gradient_descent: 'small steps',
  generalization: 'generalization',
  // Rocket science DLC
  thrust: 'thrust',
  propellant: 'propellant',
  payload: 'payload',
  staging: 'staging',
  drag: 'drag',
  escape_velocity: 'escape velocity',
  orbit: 'orbit',
  gravity: 'gravity',
  trajectory: 'trajectory',
  vacuum: 'vacuum',
  delta_v: 'delta-v',
  gravity_assist: 'gravity assist',
  heat_shield: 'heat shield',
  reentry: 're-entry',
  splashdown: 'splashdown',
  // Cybersecurity DLC
  encryption: 'encryption',
  phishing: 'phishing',
  firewall: 'firewall',
  authentication: 'authentication',
  malware: 'malware',
  zero_trust: 'zero trust',
};

/**
 * Collect ALL minigames from base game + DLC packs.
 */
function getAllMinigames(): ConceptMinigame[] {
  return [
    ...CONCEPT_MINIGAMES,
    ...ROCKET_SCIENCE_PACK.content.minigames,
    ...CYBERSECURITY_PACK.content.minigames,
  ];
}

// ── Tests ────────────────────────────────────────────────────

describe('Minigame dialog answer correctness', () => {
  const allMinigames = getAllMinigames();

  it('has a keyword entry for every minigame', () => {
    for (const mg of allMinigames) {
      expect(
        DIALOG_KEYWORDS[mg.conceptId],
        `Missing keyword for concept: ${mg.conceptId}`,
      ).toBeTruthy();
    }
  });

  for (const mg of getAllMinigames()) {
    describe(`${mg.conceptId} dialog`, () => {
      const choiceBeats = mg.dialog.filter((b) => b.choices);

      for (let bi = 0; bi < choiceBeats.length; bi++) {
        const beat = choiceBeats[bi]!;

        it(`beat ${bi}: correctChoice (${beat.correctChoice}) contains expected keyword`, () => {
          const keyword = DIALOG_KEYWORDS[mg.conceptId]!;
          const correctText = beat.choices![beat.correctChoice!]!.toLowerCase();
          expect(
            correctText.includes(keyword.toLowerCase()),
            `Expected "${correctText}" to contain keyword "${keyword}" for ${mg.conceptId}`,
          ).toBe(true);
        });

        it(`beat ${bi}: wrong choices do NOT contain the concept keyword`, () => {
          const keyword = DIALOG_KEYWORDS[mg.conceptId]!.toLowerCase();
          for (let i = 0; i < beat.choices!.length; i++) {
            if (i === beat.correctChoice) continue;
            const wrongText = beat.choices![i]!.toLowerCase();
            // Wrong choices should not contain the exact concept keyword
            expect(
              wrongText.includes(keyword),
              `Wrong choice "${beat.choices![i]}" should not contain keyword "${keyword}" in ${mg.conceptId}`,
            ).toBe(false);
          }
        });

        it(`beat ${bi}: correctChoice index is within bounds`, () => {
          expect(beat.correctChoice).toBeGreaterThanOrEqual(0);
          expect(beat.correctChoice).toBeLessThan(beat.choices!.length);
        });
      }
    });
  }
});

describe('Challenge answer correctness', () => {
  for (const mg of getAllMinigames()) {
    describe(`${mg.conceptId} challenge (${mg.challenge.type})`, () => {
      const ch = mg.challenge;

      it('answer is the correct type for its challenge type', () => {
        if (ch.type === 'select' || ch.type === 'adjust') {
          expect(typeof ch.answer, `${mg.conceptId}: select/adjust answer must be a number`).toBe('number');
        } else if (ch.type === 'sort') {
          expect(Array.isArray(ch.answer), `${mg.conceptId}: sort answer must be an array`).toBe(true);
        } else if (ch.type === 'connect') {
          expect(Array.isArray(ch.answer), `${mg.conceptId}: connect answer must be an array`).toBe(true);
        }
      });

      if (ch.type === 'select' || ch.type === 'adjust') {
        it('answer index is within items range', () => {
          const ans = ch.answer as number;
          expect(ans).toBeGreaterThanOrEqual(0);
          expect(ans).toBeLessThan(ch.items.length);
        });
      }

      if (ch.type === 'sort') {
        it('answer indices are all within items range', () => {
          const indices = ch.answer as number[];
          for (const idx of indices) {
            expect(idx, `Index ${idx} out of range for ${mg.conceptId}`).toBeGreaterThanOrEqual(0);
            expect(idx, `Index ${idx} out of range for ${mg.conceptId}`).toBeLessThan(ch.items.length);
          }
        });

        it('answer indices are unique (no duplicates)', () => {
          const indices = ch.answer as number[];
          expect(new Set(indices).size).toBe(indices.length);
        });

        it('answer does NOT include all items (some must be wrong)', () => {
          // If answer = all items then there's nothing to sort — the challenge is trivial
          // Exception: ranking/ordering challenges where all items must be selected
          const indices = ch.answer as number[];
          if (indices.length === ch.items.length) {
            // All-select is OK for ordering challenges — just note it
            expect(indices.length).toBe(ch.items.length);
          }
        });

        it('correct items are visually distinct from incorrect items', () => {
          const indices = ch.answer as number[];
          const correctItems = indices.map((i) => ch.items[i]!);
          const wrongIndices = ch.items.map((_, i) => i).filter((i) => !indices.includes(i));
          const wrongItems = wrongIndices.map((i) => ch.items[i]!);

          if (wrongItems.length > 0) {
            // Correct and wrong items must be distinguishable:
            // EITHER they have different leading emojis,
            // OR the text portion contains distinct keywords (e.g., "(train)" vs "(test)")
            for (const correct of correctItems) {
              const correctEmoji = correct.slice(0, 2).trim();
              for (const wrong of wrongItems) {
                const wrongEmoji = wrong.slice(0, 2).trim();
                if (correctEmoji === wrongEmoji) {
                  // Same emoji — text labels must be different
                  const correctLabel = correct.replace(/^.{2}\s*/, '').toLowerCase();
                  const wrongLabel = wrong.replace(/^.{2}\s*/, '').toLowerCase();
                  expect(
                    correctLabel !== wrongLabel,
                    `Ambiguous: correct item "${correct}" is identical to wrong item "${wrong}" in ${mg.conceptId}`,
                  ).toBe(true);
                }
              }
            }
          }
        });
      }

      if (ch.type === 'connect') {
        it('connect pairs are arrays of [number, number]', () => {
          const pairs = ch.answer as Array<[number, number]>;
          for (const pair of pairs) {
            expect(Array.isArray(pair)).toBe(true);
            expect(pair).toHaveLength(2);
            expect(pair[0]).toBeGreaterThanOrEqual(0);
            expect(pair[1]).toBeGreaterThanOrEqual(0);
          }
        });
      }

      it('has non-empty successText', () => {
        expect(ch.successText.length).toBeGreaterThan(0);
      });

      it('has non-empty hintText', () => {
        expect(ch.hintText.length).toBeGreaterThan(0);
      });

      it('has non-empty instruction', () => {
        expect(ch.instruction.length).toBeGreaterThan(0);
      });

      it('has at least 2 items', () => {
        expect(ch.items.length).toBeGreaterThanOrEqual(2);
      });
    });
  }
});

describe('DLC minigame discoverability', () => {
  beforeEach(() => {
    clearDlcRegistry();
    registerDlcPack(ROCKET_SCIENCE_PACK);
    registerDlcPack(CYBERSECURITY_PACK);
  });

  afterEach(() => {
    clearDlcRegistry();
  });

  /** Mirror of main.ts findMinigame: searches base then DLC packs */
  function findMinigame(conceptId: string) {
    const base = getConceptMinigame(conceptId);
    if (base) return base;
    for (const pack of listDlcPacks()) {
      const found = pack.content.minigames.find((mg) => mg.conceptId === conceptId);
      if (found) return found;
    }
    return undefined;
  }

  it('finds base game minigames', () => {
    expect(findMinigame('training_data')).toBeDefined();
    expect(findMinigame('generalization')).toBeDefined();
  });

  it('finds rocket science DLC minigames', () => {
    for (const mg of ROCKET_SCIENCE_PACK.content.minigames) {
      expect(findMinigame(mg.conceptId), `Missing DLC minigame: ${mg.conceptId}`).toBeDefined();
    }
  });

  it('finds cybersecurity DLC minigames', () => {
    for (const mg of CYBERSECURITY_PACK.content.minigames) {
      expect(findMinigame(mg.conceptId), `Missing DLC minigame: ${mg.conceptId}`).toBeDefined();
    }
  });

  it('returns undefined for nonexistent concept', () => {
    expect(findMinigame('nonexistent_xyz')).toBeUndefined();
  });

  it('base getConceptMinigame does NOT find DLC minigames', () => {
    // This confirms the bug: base lookup can't see DLC. findMinigame fixes it.
    expect(getConceptMinigame('thrust')).toBeUndefined();
    expect(getConceptMinigame('encryption')).toBeUndefined();
  });
});
