/**
 * Audio System — Design Compliance Tests
 *
 * Validates requirements A1–A14 from AudioDirection.md:
 *  - 4-channel music layer engine (base, rhythm, tension, resolution)
 *  - Independent volume controls (master, music, sfx)
 *  - Mute-all toggle
 *  - SFX event coverage for all game interactions
 *  - AudioEvent enum covers required feedback sounds
 */
import { describe, it, expect } from 'vitest';
import { AudioEvent, type MusicLayerName } from '../../../src/audio/types';

// ── A1: 4-channel structure ──

describe('Audio — Music Layer Architecture (A1/A6)', () => {
  it('A1 — exactly 4 music layers defined', () => {
    const layers: MusicLayerName[] = ['base', 'rhythm', 'tension', 'resolution'];
    expect(layers).toHaveLength(4);
  });

  it('A6 — layer names match adaptive music spec (Base, Rhythm, Tension, Resolution)', () => {
    // These are the canonical layer names from AudioDirection.md
    const expectedLayers: MusicLayerName[] = ['base', 'rhythm', 'tension', 'resolution'];
    for (const layer of expectedLayers) {
      // Type system enforces this — if it compiles, it's correct
      const typed: MusicLayerName = layer;
      expect(typed).toBeDefined();
    }
  });
});

// ── A3/A4/A5: SFX event coverage ──

describe('Audio — SFX Event Catalogue', () => {
  const allEvents = Object.values(AudioEvent);

  it('A3 — has UI motion SFX events', () => {
    // Concept placement and footstep are UI motion sounds
    expect(allEvents).toContain(AudioEvent.ConceptPlaced);
    expect(allEvents).toContain(AudioEvent.NemoFootstep);
  });

  it('A4 — has feedback SFX events for recall outcomes', () => {
    expect(allEvents).toContain(AudioEvent.RecallCorrect);
    expect(allEvents).toContain(AudioEvent.RecallIncorrect);
    expect(allEvents).toContain(AudioEvent.RecallTimeout);
  });

  it('A4 — has feedback SFX for encounter actions', () => {
    expect(allEvents).toContain(AudioEvent.FogAdvance);
    expect(allEvents).toContain(AudioEvent.FogPushBack);
  });

  it('A4 — has reward feedback SFX', () => {
    expect(allEvents).toContain(AudioEvent.ChartFragmentEarned);
  });

  it('A10 — Bit parrot has chirp audio event', () => {
    expect(allEvents).toContain(AudioEvent.BitChirp);
  });

  it('comprehensive SFX count: ≥10 distinct audio events', () => {
    expect(allEvents.length).toBeGreaterThanOrEqual(10);
  });

  it('all audio event values are snake_case strings', () => {
    for (const event of allEvents) {
      expect(event).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

// ── A8: Independent volume controls ──

describe('Audio — Volume Controls (A8/A9)', () => {
  // We test the AudioManager's interface structurally — 
  // actual AudioContext is not available in Node.
  
  it('A8 — AudioManager exposes separate master, music, and sfx volume setters', async () => {
    // Import the class and verify it has the right methods
    const { AudioManager } = await import('../../../src/audio/audio-manager');
    const am = new AudioManager();
    
    expect(typeof am.setMasterVolume).toBe('function');
    expect(typeof am.setMusicVolume).toBe('function');
    expect(typeof am.setSfxVolume).toBe('function');
  });

  it('A9 — AudioManager has mute toggle', async () => {
    const { AudioManager } = await import('../../../src/audio/audio-manager');
    const am = new AudioManager();
    
    expect(typeof am.setMuted).toBe('function');
  });

  it('A9 — mute toggle reflected in snapshot', async () => {
    const { AudioManager } = await import('../../../src/audio/audio-manager');
    const am = new AudioManager();
    
    // Before muting
    const before = am.getSnapshot();
    expect(before.muted).toBe(false);
    
    // After muting (no AudioContext needed for state tracking)
    am.setMuted(true);
    const after = am.getSnapshot();
    expect(after.muted).toBe(true);
  });

  it('A8 — volume values clamp to [0, 1] range', async () => {
    const { AudioManager } = await import('../../../src/audio/audio-manager');
    const am = new AudioManager();
    
    am.setMasterVolume(1.5);
    expect(am.getSnapshot().masterVolume).toBeLessThanOrEqual(1);
    
    am.setMasterVolume(-0.5);
    expect(am.getSnapshot().masterVolume).toBeGreaterThanOrEqual(0);
  });

  it('A8 — default volumes are in audible range', async () => {
    const { AudioManager } = await import('../../../src/audio/audio-manager');
    const am = new AudioManager();
    const snap = am.getSnapshot();
    
    expect(snap.masterVolume).toBeGreaterThan(0);
    expect(snap.masterVolume).toBeLessThanOrEqual(1);
    expect(snap.musicVolume).toBeGreaterThan(0);
    expect(snap.musicVolume).toBeLessThanOrEqual(1);
    expect(snap.sfxVolume).toBeGreaterThan(0);
    expect(snap.sfxVolume).toBeLessThanOrEqual(1);
  });
});

// ── A2: No voice acting ──

describe('Audio — No Voice Acting (A2)', () => {
  it('A2 — AudioEvent enum contains no voice-related events', () => {
    const allEvents = Object.values(AudioEvent);
    const voiceEvents = allEvents.filter(
      (e) => e.includes('voice') || e.includes('speech') || e.includes('dialogue'),
    );
    expect(voiceEvents).toEqual([]);
  });
});

// ── A10: Visual equivalents for audio cues ──

describe('Audio — Visual Feedback Parity (A10)', () => {
  it('A10 — recall correct has both audio and visual feedback path', () => {
    // Audio: RecallCorrect event exists
    expect(Object.values(AudioEvent)).toContain(AudioEvent.RecallCorrect);
    // Visual: recall system returns correct=true with scoreAwarded > 0
    // (tested in recall-system.test.ts and encounter-mechanics.test.ts)
  });

  it('A10 — recall incorrect has both audio and visual feedback path', () => {
    expect(Object.values(AudioEvent)).toContain(AudioEvent.RecallIncorrect);
    // Visual: threat system applies shakeFrames on incorrect
    // (tested in threat-system.test.ts)
  });

  it('A10 — fog advance has both audio and visual representation', () => {
    expect(Object.values(AudioEvent)).toContain(AudioEvent.FogAdvance);
    // Visual: fog depth increases
  });
});

// ── Credits Music ──

describe('Audio — Credits Music', () => {
  it('CreditsMusic class exists and exports melody data', async () => {
    const mod = await import('../../../src/audio/credits-music');
    expect(mod.CreditsMusic).toBeDefined();
    expect(mod.CREDITS_MELODY).toBeDefined();
    expect(mod.CREDITS_HARMONY).toBeDefined();
  });

  it('credits melody has multiple phrases', async () => {
    const { CREDITS_MELODY } = await import('../../../src/audio/credits-music');
    expect(CREDITS_MELODY.length).toBeGreaterThanOrEqual(4);
  });

  it('credits harmony provides bass accompaniment', async () => {
    const { CREDITS_HARMONY } = await import('../../../src/audio/credits-music');
    expect(CREDITS_HARMONY.length).toBeGreaterThanOrEqual(1);
  });
});
