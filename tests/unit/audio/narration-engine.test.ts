import { describe, expect, it, vi } from 'vitest';
import { NarrationEngine } from '../../../src/audio/narration-engine';

describe('NarrationEngine', () => {
  it('falls back to provided speaker when SpeechSynthesis is unavailable', () => {
    const fallback = vi.fn();
    const engine = new NarrationEngine(fallback);

    engine.speak('HELLO THERE');

    expect(fallback).toHaveBeenCalledWith('HELLO THERE');
  });

  it('speakLines forwards merged text through fallback', () => {
    const fallback = vi.fn();
    const engine = new NarrationEngine(fallback);

    engine.speakLines([' Ahoy ', '', 'Set sail now'], { gapMs: 100 });

    expect(fallback).toHaveBeenCalledWith('Ahoy. Set sail now');
  });
});
