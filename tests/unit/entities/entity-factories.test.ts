import { describe, expect, it } from 'vitest';
import { createPlayer } from '../../../src/entities/player';
import { createParrot } from '../../../src/entities/parrot';
import { createLandmark } from '../../../src/entities/landmark';
import { createConceptCard } from '../../../src/entities/concept-card';
import { createFogThreat } from '../../../src/entities/threat';

describe('createPlayer', () => {
  it('returns entity with correct type and position', () => {
    const player = createPlayer(100, 200);
    expect(player.type).toBe('player');
    expect(player.position).toEqual({ x: 100, y: 200 });
  });

  it('has correct default state', () => {
    const player = createPlayer(50, 80);
    expect(player.state.speed).toBe(64);
    expect(player.state.targetX).toBe(50);
    expect(player.state.targetY).toBe(80);
    expect(player.state.placing).toBe(false);
    expect(player.state.animationTime).toBe(0);
  });

  it('has expected bounds', () => {
    const player = createPlayer(0, 0);
    expect(player.bounds).toEqual({ w: 16, h: 16 });
  });

  it('is visible and non-interactive', () => {
    const player = createPlayer(0, 0);
    expect(player.visible).toBe(true);
    expect(player.interactive).toBe(false);
  });

  it('has a stable id', () => {
    expect(createPlayer(0, 0).id).toBe('player_nemo');
  });
});

describe('createParrot', () => {
  it('returns entity with correct type and position', () => {
    const parrot = createParrot(10, 20);
    expect(parrot.type).toBe('parrot');
    expect(parrot.position).toEqual({ x: 10, y: 20 });
  });

  it('starts in idle mode', () => {
    const parrot = createParrot(0, 0);
    expect(parrot.state.mode).toBe('idle');
  });

  it('target matches initial position', () => {
    const parrot = createParrot(12, 34);
    expect(parrot.state.targetX).toBe(12);
    expect(parrot.state.targetY).toBe(34);
  });

  it('has non-zero speed', () => {
    expect(createParrot(0, 0).state.speed).toBeGreaterThan(0);
  });

  it('has a stable id', () => {
    expect(createParrot(0, 0).id).toBe('parrot_bit');
  });
});

describe('createLandmark', () => {
  it('returns entity with correct type and id', () => {
    const lm = createLandmark('lm_1', 'concept_a', 60, 120);
    expect(lm.type).toBe('landmark');
    expect(lm.id).toBe('lm_1');
    expect(lm.position).toEqual({ x: 60, y: 120 });
  });

  it('has conceptId in state', () => {
    const lm = createLandmark('lm_1', 'training_data', 0, 0);
    expect(lm.state.conceptId).toBe('training_data');
  });

  it('starts with no placed concept', () => {
    const lm = createLandmark('lm_1', 'c', 0, 0);
    expect(lm.state.placedConceptId).toBeNull();
  });

  it('glow and lockTimer start at 0', () => {
    const lm = createLandmark('lm_1', 'c', 0, 0);
    expect(lm.state.glow).toBe(0);
    expect(lm.state.lockTimer).toBe(0);
  });

  it('is interactive and visible', () => {
    const lm = createLandmark('lm_1', 'c', 0, 0);
    expect(lm.visible).toBe(true);
    expect(lm.interactive).toBe(true);
  });
});

describe('createConceptCard', () => {
  it('returns entity with correct type', () => {
    const card = createConceptCard('card_1', 'bias', 'Bias', '⚖️', 10, 350);
    expect(card.type).toBe('concept-card');
    expect(card.id).toBe('card_1');
  });

  it('stores concept metadata', () => {
    const card = createConceptCard('card_1', 'model', 'Model', '🧠', 20, 360);
    expect(card.state.conceptId).toBe('model');
    expect(card.state.label).toBe('Model');
    expect(card.state.iconGlyph).toBe('🧠');
  });

  it('starts not dragging, not placed, not unlocked', () => {
    const card = createConceptCard('c', 'x', 'X', '?', 0, 0);
    expect(card.state.dragging).toBe(false);
    expect(card.state.placed).toBe(false);
    expect(card.state.unlocked).toBe(false);
  });

  it('position matches tray coordinates', () => {
    const card = createConceptCard('c', 'x', 'X', '?', 42, 380);
    expect(card.position).toEqual({ x: 42, y: 380 });
    expect(card.state.trayX).toBe(42);
    expect(card.state.trayY).toBe(380);
  });

  it('has expected bounds', () => {
    const card = createConceptCard('c', 'x', 'X', '?', 0, 0);
    expect(card.bounds).toEqual({ w: 48, h: 32 });
  });
});

describe('createFogThreat', () => {
  it('returns threat entity', () => {
    const threat = createFogThreat();
    expect(threat.type).toBe('threat');
    expect(threat.id).toBe('threat_fog');
  });

  it('starts with full health and zero fog', () => {
    const threat = createFogThreat();
    expect(threat.state.healthRatio).toBe(1);
    expect(threat.state.fogDepth).toBe(0);
    expect(threat.state.shakeFrames).toBe(0);
  });

  it('has positive fog speed', () => {
    expect(createFogThreat().state.fogSpeed).toBeGreaterThan(0);
  });

  it('covers the full game area', () => {
    const threat = createFogThreat();
    expect(threat.bounds).toEqual({ w: 240, h: 400 });
  });
});
