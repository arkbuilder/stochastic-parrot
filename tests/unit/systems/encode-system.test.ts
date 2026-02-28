import { describe, expect, it } from 'vitest';
import { createConceptCard } from '../../../src/entities/concept-card';
import { createLandmark } from '../../../src/entities/landmark';
import { updateEncodeSystem } from '../../../src/systems/encode-system';

describe('updateEncodeSystem', () => {
  it('places card onto matching landmark within snap radius', () => {
    const card = createConceptCard('card_training', 'training_data', 'Training Data', 'TD', 12, 352);
    card.state.unlocked = true;

    const landmark = createLandmark('dock_crates', 'training_data', 52, 290);
    const runtime = { heldCardId: null as string | null };

    const events = updateEncodeSystem(
      [card],
      [landmark],
      [
        { type: 'primary', x: 20, y: 360 },
        { type: 'drag', x: 52, y: 290 },
        { type: 'primary_end', x: 52, y: 290 },
      ],
      runtime,
    );

    expect(events.some((event) => event.type === 'concept_placed')).toBe(true);
    expect(card.state.placed).toBe(true);
    expect(landmark.state.placedConceptId).toBe('training_data');
  });

  it('returns card to tray on invalid placement', () => {
    const card = createConceptCard('card_model', 'model', 'Model', 'MO', 88, 352);
    card.state.unlocked = true;

    const wrongLandmark = createLandmark('dock_crates', 'training_data', 52, 290);
    const runtime = { heldCardId: null as string | null };

    const events = updateEncodeSystem(
      [card],
      [wrongLandmark],
      [
        { type: 'primary', x: 96, y: 360 },
        { type: 'drag', x: 50, y: 290 },
        { type: 'primary_end', x: 50, y: 290 },
      ],
      runtime,
    );

    expect(events.some((event) => event.type === 'placement_failed')).toBe(true);
    expect(card.state.placed).toBe(false);
    expect(card.position.x).toBe(card.state.trayX);
    expect(card.position.y).toBe(card.state.trayY);
  });
});
