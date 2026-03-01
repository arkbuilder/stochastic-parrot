/**
 * SolavineSound — Content Integrity Tests
 *
 * Validates that all data definitions (instruments, drums, SFX, songs,
 * fanfares, encounter presets) are internally consistent and complete.
 * These tests verify structural correctness — no AudioContext needed.
 */
import { describe, it, expect } from 'vitest';
import { INSTRUMENTS, getInstrumentNames, getInstrument, validateInstrument } from '../../../../src/audio/solavine/instruments';
import { DRUM_KIT, getDrumNames, getDrum, validateDrum } from '../../../../src/audio/solavine/drums';
import { SFX_LIBRARY, getSfxEventNames, getSfxDefinition, getSfxDuration } from '../../../../src/audio/solavine/sfx-library';
import { ALL_SONGS, getSong, getSongIds } from '../../../../src/audio/solavine/island-songs';
import { ALL_FANFARES, getFanfare, getFanfareIds } from '../../../../src/audio/solavine/fanfares';
import { ENCOUNTER_PRESETS, ENCOUNTER_AMBIENCES } from '../../../../src/audio/solavine/encounter-music';
import { validateEnvelope } from '../../../../src/audio/solavine/envelope';
import { SolavineEvent, type SolavineMusicLayer } from '../../../../src/audio/solavine/types';

/* ═══════════════════════════════════════════════
   INSTRUMENTS (12 presets)
   ═══════════════════════════════════════════════ */

describe('Instruments', () => {
  it('has 12 instrument presets', () => {
    expect(getInstrumentNames()).toHaveLength(12);
  });

  it('getInstrument returns preset or undefined', () => {
    expect(getInstrument('triangle_smooth')).toBeDefined();
    expect(getInstrument('nonexistent')).toBeUndefined();
  });

  it('all instruments have valid envelopes', () => {
    for (const [name, preset] of Object.entries(INSTRUMENTS)) {
      const errors = validateEnvelope(preset.envelope);
      expect(errors, `instrument '${name}' envelope invalid: ${errors.join(', ')}`).toEqual([]);
    }
  });

  it('all instruments have positive volume ≤ 1', () => {
    for (const [name, preset] of Object.entries(INSTRUMENTS)) {
      expect(preset.volume, `${name} volume`).toBeGreaterThan(0);
      expect(preset.volume, `${name} volume`).toBeLessThanOrEqual(1);
    }
  });

  it('pulse instruments have valid duty cycles', () => {
    const pulseInstruments = Object.entries(INSTRUMENTS).filter(([_, p]) => p.pulse);
    expect(pulseInstruments.length).toBeGreaterThanOrEqual(2);
    for (const [name, preset] of pulseInstruments) {
      expect(preset.pulse!.dutyCycle, `${name} duty cycle`).toBeGreaterThan(0);
      expect(preset.pulse!.dutyCycle, `${name} duty cycle`).toBeLessThanOrEqual(0.5);
    }
  });

  it('FM instruments have positive modulator ratio and index', () => {
    const fmInstruments = Object.entries(INSTRUMENTS).filter(([_, p]) => p.fm);
    expect(fmInstruments.length).toBeGreaterThanOrEqual(2);
    for (const [name, preset] of fmInstruments) {
      expect(preset.fm!.modulatorRatio, `${name} mod ratio`).toBeGreaterThan(0);
      expect(preset.fm!.modulationIndex, `${name} mod index`).toBeGreaterThan(0);
    }
  });

  it('all instruments pass full validateInstrument', () => {
    for (const [name, preset] of Object.entries(INSTRUMENTS)) {
      const errors = validateInstrument(preset);
      expect(errors, `instrument '${name}': ${errors.join(', ')}`).toEqual([]);
    }
  });

  it('named presets include classic chip voices', () => {
    const names = getInstrumentNames();
    expect(names).toContain('pulse_thin');
    expect(names).toContain('square_full');
    expect(names).toContain('triangle_smooth');
    expect(names).toContain('sawtooth_bright');
    expect(names).toContain('sine_pure');
  });

  it('named presets include extended voices', () => {
    const names = getInstrumentNames();
    expect(names).toContain('fm_bell');
    expect(names).toContain('fm_metallic');
    expect(names).toContain('noise_white');
    expect(names).toContain('filtered_pad');
    expect(names).toContain('detuned_chorus');
    expect(names).toContain('vibrato_lead');
  });
});

/* ═══════════════════════════════════════════════
   DRUMS (8 presets)
   ═══════════════════════════════════════════════ */

describe('Drums', () => {
  it('has 8 drum presets', () => {
    expect(getDrumNames()).toHaveLength(8);
  });

  it('getDrum returns preset or undefined', () => {
    expect(getDrum('kick')).toBeDefined();
    expect(getDrum('nonexistent')).toBeUndefined();
  });

  it('all drums have valid envelopes', () => {
    for (const [name, preset] of Object.entries(DRUM_KIT)) {
      const errors = validateEnvelope(preset.envelope);
      expect(errors, `drum '${name}' envelope invalid: ${errors.join(', ')}`).toEqual([]);
    }
  });

  it('drums with tone have positive pitch start', () => {
    const toned = Object.entries(DRUM_KIT).filter(([_, d]) => d.toneVolume > 0);
    for (const [name, preset] of toned) {
      expect(preset.pitchStart, `${name} pitchStart`).toBeGreaterThan(0);
    }
  });

  it('noise-only drums have 0 tone volume', () => {
    const noiseOnly = Object.entries(DRUM_KIT).filter(
      ([_, d]) => d.pitchStart === 0 && d.pitchEnd === 0,
    );
    for (const [name, preset] of noiseOnly) {
      expect(preset.toneVolume, `${name} toneVolume`).toBe(0);
      expect(preset.noiseVolume, `${name} noiseVolume`).toBeGreaterThan(0);
    }
  });

  it('all drums pass validateDrum', () => {
    for (const [name, preset] of Object.entries(DRUM_KIT)) {
      const errors = validateDrum(preset);
      expect(errors, `drum '${name}': ${errors.join(', ')}`).toEqual([]);
    }
  });

  it('expected drum names present', () => {
    const names = getDrumNames();
    expect(names).toContain('kick');
    expect(names).toContain('snare');
    expect(names).toContain('hihat_closed');
    expect(names).toContain('hihat_open');
    expect(names).toContain('tom_low');
    expect(names).toContain('tom_high');
    expect(names).toContain('crash');
    expect(names).toContain('rim');
  });
});

/* ═══════════════════════════════════════════════
   SFX LIBRARY (40 events)
   ═══════════════════════════════════════════════ */

describe('SFX Library', () => {
  it('has 40 SFX events', () => {
    expect(getSfxEventNames()).toHaveLength(40);
  });

  it('every SolavineEvent enum value has a definition', () => {
    const values = Object.values(SolavineEvent);
    for (const event of values) {
      const def = getSfxDefinition(event);
      expect(def, `missing SFX for event '${event}'`).toBeDefined();
    }
  });

  it('all SFX have positive duration', () => {
    for (const event of getSfxEventNames()) {
      const def = getSfxDefinition(event)!;
      const dur = getSfxDuration(def);
      expect(dur, `${event} duration`).toBeGreaterThan(0);
    }
  });

  it('original 13 events are present', () => {
    const original = [
      SolavineEvent.ConceptPlaced,
      SolavineEvent.RecallCorrect,
      SolavineEvent.RecallIncorrect,
      SolavineEvent.RecallTimeout,
      SolavineEvent.FogAdvance,
      SolavineEvent.FogPushBack,
      SolavineEvent.ChartFragmentEarned,
      SolavineEvent.BitChirp,
      SolavineEvent.NemoFootstep,
      SolavineEvent.CurtainOpen,
      SolavineEvent.TypewriterTick,
      SolavineEvent.EnemyBurrow,
      SolavineEvent.FreezeBlast,
    ];
    for (const e of original) {
      expect(getSfxDefinition(e), `missing original event ${e}`).toBeDefined();
    }
  });

  it('new UI events are present', () => {
    expect(getSfxDefinition(SolavineEvent.ButtonTap)).toBeDefined();
    expect(getSfxDefinition(SolavineEvent.MenuOpen)).toBeDefined();
    expect(getSfxDefinition(SolavineEvent.MenuClose)).toBeDefined();
  });

  it('new combat events are present', () => {
    expect(getSfxDefinition(SolavineEvent.CritHit)).toBeDefined();
    expect(getSfxDefinition(SolavineEvent.ShieldBlock)).toBeDefined();
    expect(getSfxDefinition(SolavineEvent.HealChime)).toBeDefined();
    expect(getSfxDefinition(SolavineEvent.ComboHit)).toBeDefined();
  });

  it('multi-layer SFX have offset on each layer', () => {
    for (const event of getSfxEventNames()) {
      const def = getSfxDefinition(event)!;
      if (def.shape === 'multi') {
        for (const layer of def.layers) {
          expect(typeof layer.offset, `${event} layer missing offset`).toBe('number');
          expect(layer.offset, `${event} layer offset`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('all tone SFX have valid wave types', () => {
    const validWaves = ['sine', 'triangle', 'square', 'sawtooth'];
    for (const event of getSfxEventNames()) {
      const def = getSfxDefinition(event)!;
      if (def.shape === 'tone') {
        expect(validWaves, `${event} wave type`).toContain(def.wave);
      }
    }
  });

  it('all arp SFX have at least 2 frequencies', () => {
    for (const event of getSfxEventNames()) {
      const def = getSfxDefinition(event)!;
      if (def.shape === 'arp') {
        expect(def.freqs.length, `${event} arp freqs`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('sweep SFX have different start and end frequencies', () => {
    for (const event of getSfxEventNames()) {
      const def = getSfxDefinition(event)!;
      if (def.shape === 'sweep') {
        expect(def.freqStart, `${event} sweep`).not.toBe(def.freqEnd);
      }
    }
  });
});

/* ═══════════════════════════════════════════════
   SONGS (7 island/overworld/combat themes)
   ═══════════════════════════════════════════════ */

describe('Songs', () => {
  it('has 7 songs', () => {
    expect(getSongIds()).toHaveLength(7);
  });

  it('getSong returns a song or undefined', () => {
    expect(getSong('island_01')).toBeDefined();
    expect(getSong('nonexistent')).toBeUndefined();
  });

  it('expected song IDs present', () => {
    const ids = getSongIds();
    expect(ids).toContain('island_01');
    expect(ids).toContain('island_02');
    expect(ids).toContain('island_03');
    expect(ids).toContain('island_04');
    expect(ids).toContain('island_05');
    expect(ids).toContain('overworld');
    expect(ids).toContain('combat');
  });

  it('all songs have positive BPM', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      expect(song.bpm, `${id} bpm`).toBeGreaterThan(0);
      expect(song.bpm, `${id} bpm`).toBeLessThanOrEqual(200);
    }
  });

  it('all island songs loop', () => {
    for (const id of ['island_01', 'island_02', 'island_03', 'island_04', 'island_05']) {
      const song = getSong(id)!;
      expect(song.loop, `${id} should loop`).toBe(true);
    }
  });

  it('overworld loops', () => {
    expect(getSong('overworld')!.loop).toBe(true);
  });

  it('combat loops', () => {
    expect(getSong('combat')!.loop).toBe(true);
  });

  it('all songs have at least 1 melody note', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      expect(song.melody.notes.length, `${id} melody`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all songs have at least 1 bass note', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      expect(song.bass.notes.length, `${id} bass`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all songs have at least 1 drum hit', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      expect(song.drums.hits.length, `${id} drums`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all melody notes have MIDI in playable range (21–108)', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      for (const note of song.melody.notes) {
        if (note.midi === 0) continue; // rest
        expect(note.midi, `${id} melody note MIDI`).toBeGreaterThanOrEqual(21);
        expect(note.midi, `${id} melody note MIDI`).toBeLessThanOrEqual(108);
      }
    }
  });

  it('all bass notes have MIDI in bass range (24–60)', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      for (const note of song.bass.notes) {
        if (note.midi === 0) continue;
        expect(note.midi, `${id} bass note MIDI`).toBeGreaterThanOrEqual(24);
        expect(note.midi, `${id} bass note MIDI`).toBeLessThanOrEqual(60);
      }
    }
  });

  it('drum hits reference valid drum presets', () => {
    const drumNames = getDrumNames();
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      for (const hit of song.drums.hits) {
        expect(drumNames, `${id} drum '${hit.drum}'`).toContain(hit.drum);
      }
    }
  });

  it('melody instruments reference valid instrument presets', () => {
    const instNames = getInstrumentNames();
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      expect(instNames, `${id} melody inst`).toContain(song.melody.instrument);
      expect(instNames, `${id} harmony inst`).toContain(song.harmony.instrument);
      expect(instNames, `${id} bass inst`).toContain(song.bass.instrument);
    }
  });

  it('note velocities are in [0, 1]', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      for (const track of [song.melody, song.harmony, song.bass]) {
        for (const note of track.notes) {
          expect(note.velocity, `${id} velocity`).toBeGreaterThanOrEqual(0);
          expect(note.velocity, `${id} velocity`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('drum hit velocities are in [0, 1]', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      for (const hit of song.drums.hits) {
        expect(hit.velocity, `${id} drum velocity`).toBeGreaterThanOrEqual(0);
        expect(hit.velocity, `${id} drum velocity`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('all 4 tracks have matching lengthBeats ≥ 1', () => {
    for (const [id, song] of Object.entries(ALL_SONGS)) {
      const ml = song.melody.lengthBeats;
      expect(ml, `${id} melody length`).toBeGreaterThanOrEqual(1);
      expect(song.harmony.lengthBeats, `${id} harmony length`).toBe(ml);
      expect(song.bass.lengthBeats, `${id} bass length`).toBe(ml);
      expect(song.drums.lengthBeats, `${id} drums length`).toBe(ml);
    }
  });
});

/* ═══════════════════════════════════════════════
   FANFARES (4 stingers)
   ═══════════════════════════════════════════════ */

describe('Fanfares', () => {
  it('has 4 fanfares', () => {
    expect(getFanfareIds()).toHaveLength(4);
  });

  it('none loop', () => {
    for (const id of getFanfareIds()) {
      expect(getFanfare(id)!.loop, `${id} should not loop`).toBe(false);
    }
  });

  it('all have positive BPM', () => {
    for (const [id, f] of Object.entries(ALL_FANFARES)) {
      expect(f.bpm, `${id} bpm`).toBeGreaterThan(0);
    }
  });

  it('all have at least 1 melody note', () => {
    for (const [id, f] of Object.entries(ALL_FANFARES)) {
      expect(f.melody.notes.length, `${id} melody`).toBeGreaterThanOrEqual(1);
    }
  });

  it('expected fanfare IDs present', () => {
    const ids = getFanfareIds();
    expect(ids).toContain('victory_short');
    expect(ids).toContain('victory_grand');
    expect(ids).toContain('achievement');
    expect(ids).toContain('game_over');
  });

  it('fanfares are short (≤ 10 seconds)', () => {
    for (const [id, f] of Object.entries(ALL_FANFARES)) {
      const maxBeats = Math.max(
        f.melody.lengthBeats,
        f.harmony.lengthBeats,
        f.bass.lengthBeats,
        f.drums.lengthBeats,
      );
      const durationS = (maxBeats / f.bpm) * 60;
      expect(durationS, `${id} too long`).toBeLessThanOrEqual(10);
    }
  });
});

/* ═══════════════════════════════════════════════
   ENCOUNTER PRESETS
   ═══════════════════════════════════════════════ */

describe('Encounter Presets', () => {
  const VALID_LAYERS: SolavineMusicLayer[] = ['base', 'rhythm', 'tension', 'urgency', 'resolution'];

  it('has at least 8 presets', () => {
    expect(Object.keys(ENCOUNTER_PRESETS).length).toBeGreaterThanOrEqual(8);
  });

  it('all presets reference valid music layers', () => {
    for (const [name, preset] of Object.entries(ENCOUNTER_PRESETS)) {
      for (const layer of preset.layers) {
        expect(VALID_LAYERS, `preset '${name}' layer '${layer}'`).toContain(layer);
      }
    }
  });

  it('exploration preset includes base layer', () => {
    expect(ENCOUNTER_PRESETS.exploration!.layers).toContain('base');
  });

  it('boss_phase preset activates urgency', () => {
    expect(ENCOUNTER_PRESETS.boss_phase!.layers).toContain('urgency');
  });

  it('encounter_victory activates resolution', () => {
    expect(ENCOUNTER_PRESETS.encounter_victory!.layers).toContain('resolution');
  });
});

describe('Encounter Ambiences', () => {
  it('has at least 5 ambience configs', () => {
    expect(ENCOUNTER_AMBIENCES.length).toBeGreaterThanOrEqual(5);
  });

  it('all ambiences have ambient events', () => {
    for (const amb of ENCOUNTER_AMBIENCES) {
      expect(amb.ambientEvents.length, `${amb.encounterType} ambientEvents`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all ambiences have positive interval', () => {
    for (const amb of ENCOUNTER_AMBIENCES) {
      expect(amb.ambientInterval, `${amb.encounterType} interval`).toBeGreaterThan(0);
    }
  });

  it('all ambiences reference a valid music preset', () => {
    const presetKeys = Object.keys(ENCOUNTER_PRESETS);
    for (const amb of ENCOUNTER_AMBIENCES) {
      expect(presetKeys, `${amb.encounterType} musicPreset '${amb.musicPreset}'`).toContain(amb.musicPreset);
    }
  });
});
