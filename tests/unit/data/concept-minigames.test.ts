import { describe, expect, it } from 'vitest';
import { CONCEPT_MINIGAMES, getConceptMinigame } from '../../../src/data/concept-minigames';
import { CONCEPTS } from '../../../src/data/concepts';

describe('CONCEPT_MINIGAMES', () => {
  it('provides a minigame for every concept', () => {
    for (const concept of CONCEPTS) {
      const mg = getConceptMinigame(concept.id);
      expect(mg, `Missing minigame for concept: ${concept.id}`).toBeDefined();
    }
  });

  it('has exactly 15 minigames matching the 15 concepts', () => {
    expect(CONCEPT_MINIGAMES).toHaveLength(15);
  });

  it('has unique concept IDs', () => {
    const ids = CONCEPT_MINIGAMES.map((mg) => mg.conceptId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every dialog beat has valid speaker', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      for (const beat of mg.dialog) {
        expect(['parrot', 'narrator']).toContain(beat.speaker);
      }
    }
  });

  it('every dialog beat with choices has correctChoice in range', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      for (const beat of mg.dialog) {
        if (beat.choices) {
          expect(beat.correctChoice).toBeDefined();
          expect(beat.correctChoice).toBeGreaterThanOrEqual(0);
          expect(beat.correctChoice).toBeLessThan(beat.choices.length);
        }
      }
    }
  });

  it('every dialog beat with choices has at least 2 options', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      for (const beat of mg.dialog) {
        if (beat.choices) {
          expect(beat.choices.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('every dialog beat with choices has feedback strings', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      for (const beat of mg.dialog) {
        if (beat.choices) {
          expect(beat.wrongFeedback, `Missing wrongFeedback in ${mg.conceptId}`).toBeTruthy();
          expect(beat.correctFeedback, `Missing correctFeedback in ${mg.conceptId}`).toBeTruthy();
        }
      }
    }
  });

  it('every minigame has at least 2 dialog beats', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      expect(mg.dialog.length, `Too few beats in ${mg.conceptId}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every challenge has valid type', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      expect(['sort', 'connect', 'adjust', 'select']).toContain(mg.challenge.type);
    }
  });

  it('every challenge has at least 2 items', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      expect(mg.challenge.items.length, `Too few items in ${mg.conceptId}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('select/adjust challenges have answer index in range', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      const ch = mg.challenge;
      if (ch.type === 'select' || ch.type === 'adjust') {
        expect(typeof ch.answer).toBe('number');
        expect(ch.answer as number).toBeGreaterThanOrEqual(0);
        expect(ch.answer as number).toBeLessThan(ch.items.length);
      }
    }
  });

  it('sort challenges have answer as array of valid indices', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      const ch = mg.challenge;
      if (ch.type === 'sort') {
        expect(Array.isArray(ch.answer)).toBe(true);
        for (const idx of ch.answer as number[]) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(ch.items.length);
        }
      }
    }
  });

  it('every minigame has a non-empty wrapUp', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      expect(mg.wrapUp.length).toBeGreaterThan(0);
    }
  });

  it('every minigame has a non-empty metaphor', () => {
    for (const mg of CONCEPT_MINIGAMES) {
      expect(mg.metaphor.length).toBeGreaterThan(0);
    }
  });

  it('getConceptMinigame returns undefined for unknown concept', () => {
    expect(getConceptMinigame('nonexistent_concept')).toBeUndefined();
  });
});
