/**
 * SolavineSound — SFX Library
 *
 * 40 procedural sound effects defined as pure data structures.
 * Each SFX is a SfxDefinition that the engine interprets at runtime.
 *
 * Categories:
 *   - Core interaction (concept placement, recall feedback)
 *   - UI (buttons, menus, navigation)
 *   - Encounter ambience (storm, fog, squid, ruins)
 *   - Combat (cannon, crit, shield, heal)
 *   - Navigation (sail, anchor, map)
 *   - Rewards / upgrades (fanfares, collect)
 *   - Bit parrot (chirps, flight, celebration)
 */

import { SolavineEvent, type SfxDefinition, type ADSREnvelope } from './types';
import { noteFreq, noteToMidi, midiToFreq } from './music-theory';

/* ── Shared Envelope Shortcuts ── */

const CHIP: ADSREnvelope = { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.05, peak: 1.0 };
const BLIP: ADSREnvelope = { attack: 0.005, decay: 0.03, sustain: 0.0, release: 0.02, peak: 1.0 };
const SOFT: ADSREnvelope = { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.1, peak: 1.0 };
const PERC: ADSREnvelope = { attack: 0.003, decay: 0.08, sustain: 0.0, release: 0.04, peak: 1.0 };
const LONG: ADSREnvelope = { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.3, peak: 1.0 };
const SWELL: ADSREnvelope = { attack: 0.15, decay: 0.1, sustain: 0.6, release: 0.4, peak: 1.0 };

/* ── Frequency Helpers ── */

const C4 = noteFreq('C', 4);
const D4 = noteFreq('D', 4);
const E4 = noteFreq('E', 4);
const F4 = noteFreq('F', 4);
const G4 = noteFreq('G', 4);
const A4 = noteFreq('A', 4);
const B4 = noteFreq('B', 4);
const C5 = noteFreq('C', 5);
const D5 = noteFreq('D', 5);
const E5 = noteFreq('E', 5);
const G5 = noteFreq('G', 5);
const C3 = noteFreq('C', 3);
const E3 = noteFreq('E', 3);
const G3 = noteFreq('G', 3);
const A3 = noteFreq('A', 3);
const F3 = noteFreq('F', 3);

/* ── SFX Library ── */

export const SFX_LIBRARY: Record<SolavineEvent, SfxDefinition> = {

  /* ═══════════════════════════════════════════
   * CORE INTERACTION — Original 13 (enhanced)
   * ═══════════════════════════════════════════ */

  [SolavineEvent.ConceptPlaced]: {
    shape: 'arp',
    freqs: [C5, E5, G5],
    totalDuration: 0.35,
    wave: 'triangle',
    envelope: CHIP,
  },

  [SolavineEvent.RecallCorrect]: {
    shape: 'arp',
    freqs: [G4, C5, E5, G5],
    totalDuration: 0.4,
    wave: 'triangle',
    envelope: CHIP,
  },

  [SolavineEvent.RecallIncorrect]: {
    shape: 'arp',
    freqs: [D4, midiToFreq(noteToMidi('A#', 3))],
    totalDuration: 0.3,
    wave: 'sawtooth',
    envelope: { ...CHIP, sustain: 0.2 },
  },

  [SolavineEvent.RecallTimeout]: {
    shape: 'arp',
    freqs: [C4, B4, midiToFreq(noteToMidi('A#', 3)), A3],
    totalDuration: 0.5,
    wave: 'sawtooth',
    envelope: LONG,
  },

  [SolavineEvent.FogAdvance]: {
    shape: 'sweep',
    freqStart: noteFreq('F', 3),
    freqEnd: noteFreq('D', 3),
    duration: 0.25,
    wave: 'sine',
    envelope: SOFT,
  },

  [SolavineEvent.FogPushBack]: {
    shape: 'arp',
    freqs: [E4, G4, C5],
    totalDuration: 0.3,
    wave: 'triangle',
    envelope: CHIP,
  },

  [SolavineEvent.ChartFragmentEarned]: {
    shape: 'arp',
    freqs: [C5, E5, G5, midiToFreq(noteToMidi('C', 6))],
    totalDuration: 0.6,
    wave: 'triangle',
    envelope: { ...CHIP, sustain: 0.5, release: 0.15 },
  },

  [SolavineEvent.BitChirp]: {
    shape: 'arp',
    freqs: [G5, midiToFreq(noteToMidi('A', 5))],
    totalDuration: 0.15,
    wave: 'square',
    envelope: BLIP,
  },

  [SolavineEvent.NemoFootstep]: {
    shape: 'tone',
    freq: E4,
    duration: 0.06,
    wave: 'square',
    envelope: PERC,
  },

  [SolavineEvent.CurtainOpen]: {
    shape: 'arp',
    freqs: [C3, noteFreq('D', 3), E3, G3, A3, C4, E4, G4],
    totalDuration: 1.2,
    wave: 'sine',
    envelope: SWELL,
  },

  [SolavineEvent.TypewriterTick]: {
    shape: 'tone',
    freq: 1200,
    duration: 0.03,
    wave: 'square',
    envelope: BLIP,
  },

  [SolavineEvent.EnemyBurrow]: {
    shape: 'arp',
    freqs: [noteFreq('A', 2), C3, E3, A3],
    totalDuration: 0.5,
    wave: 'sawtooth',
    envelope: LONG,
  },

  [SolavineEvent.FreezeBlast]: {
    shape: 'arp',
    freqs: [midiToFreq(noteToMidi('A', 5)), G5, E5, C5, A4],
    totalDuration: 0.6,
    wave: 'sine',
    envelope: { ...SOFT, release: 0.2 },
  },

  /* ═══════════════════════════════════════════
   * UI SOUNDS — New
   * ═══════════════════════════════════════════ */

  [SolavineEvent.ButtonTap]: {
    shape: 'tone',
    freq: 1400,
    duration: 0.04,
    wave: 'square',
    envelope: BLIP,
  },

  [SolavineEvent.MenuOpen]: {
    shape: 'multi',
    layers: [
      { shape: 'tone', freq: 800, duration: 0.05, wave: 'square', envelope: BLIP, offset: 0 },
      { shape: 'arp', freqs: [C4, E4, G4], totalDuration: 0.15, wave: 'triangle', envelope: PERC, offset: 0.03 },
    ],
  },

  [SolavineEvent.MenuClose]: {
    shape: 'arp',
    freqs: [G4, E4, C4],
    totalDuration: 0.1,
    wave: 'triangle',
    envelope: PERC,
  },

  [SolavineEvent.ConceptDragStart]: {
    shape: 'multi',
    layers: [
      { shape: 'tone', freq: 600, duration: 0.05, wave: 'square', envelope: BLIP, offset: 0 },
      { shape: 'sweep', freqStart: 200, freqEnd: 300, duration: 0.1, wave: 'sine', envelope: SOFT, offset: 0.02 },
    ],
  },

  [SolavineEvent.RecallPromptAppear]: {
    shape: 'multi',
    layers: [
      { shape: 'tone', freq: A4, duration: 0.12, wave: 'triangle', envelope: CHIP, offset: 0 },
      { shape: 'tone', freq: A4, duration: 0.12, wave: 'triangle', envelope: CHIP, offset: 0.15 },
    ],
  },

  /* ═══════════════════════════════════════════
   * STATE TRANSITIONS — New
   * ═══════════════════════════════════════════ */

  [SolavineEvent.FailStateRumble]: {
    shape: 'multi',
    layers: [
      { shape: 'sweep', freqStart: 80, freqEnd: 30, duration: 0.8, wave: 'sine', envelope: LONG, offset: 0 },
      { shape: 'noise_burst', duration: 0.6, filterFreq: 200, filterType: 'lowpass', envelope: { attack: 0.05, decay: 0.4, sustain: 0.1, release: 0.3, peak: 0.5 }, offset: 0.1 },
    ],
  },

  [SolavineEvent.RetryBootUp]: {
    shape: 'arp',
    freqs: [C4, E4, G4, C5],
    totalDuration: 0.2,
    wave: 'triangle',
    envelope: CHIP,
  },

  /* ═══════════════════════════════════════════
   * REWARDS / UPGRADES — New
   * ═══════════════════════════════════════════ */

  [SolavineEvent.UpgradeCommon]: {
    shape: 'arp',
    freqs: [C5, E5, G5],
    totalDuration: 0.4,
    wave: 'triangle',
    envelope: { ...CHIP, sustain: 0.4, release: 0.1 },
  },

  [SolavineEvent.UpgradeRare]: {
    shape: 'arp',
    freqs: [G4, C5, E5, G5, midiToFreq(noteToMidi('C', 6))],
    totalDuration: 0.7,
    wave: 'triangle',
    envelope: { ...CHIP, sustain: 0.5, release: 0.15 },
  },

  [SolavineEvent.UpgradeLegendary]: {
    shape: 'multi',
    layers: [
      { shape: 'arp', freqs: [C4, E4, G4, C5, E5, G5, midiToFreq(noteToMidi('C', 6))], totalDuration: 1.2, wave: 'triangle', envelope: { ...CHIP, sustain: 0.6, release: 0.3 }, offset: 0 },
      { shape: 'arp', freqs: [C3, G3, C4, G4], totalDuration: 1.2, wave: 'sine', envelope: SWELL, offset: 0 },
    ],
  },

  [SolavineEvent.AchievementEarned]: {
    shape: 'multi',
    layers: [
      { shape: 'arp', freqs: [C5, E5, G5, C5, E5, G5, midiToFreq(noteToMidi('C', 6)), midiToFreq(noteToMidi('E', 6))], totalDuration: 2.0, wave: 'triangle', envelope: { ...LONG, sustain: 0.6 }, offset: 0 },
      { shape: 'arp', freqs: [C3, G3, C4, E4], totalDuration: 2.0, wave: 'sine', envelope: SWELL, offset: 0 },
    ],
  },

  [SolavineEvent.CoinCollect]: {
    shape: 'arp',
    freqs: [E5, midiToFreq(noteToMidi('A', 5))],
    totalDuration: 0.12,
    wave: 'square',
    envelope: BLIP,
  },

  /* ═══════════════════════════════════════════
   * ENCOUNTER AMBIENCE — New
   * ═══════════════════════════════════════════ */

  [SolavineEvent.StormThunder]: {
    shape: 'multi',
    layers: [
      { shape: 'noise_burst', duration: 0.8, filterFreq: 400, filterType: 'lowpass', envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.3, peak: 0.8 }, offset: 0 },
      { shape: 'sweep', freqStart: 60, freqEnd: 30, duration: 0.6, wave: 'sine', envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.2, peak: 0.6 }, offset: 0.05 },
    ],
  },

  [SolavineEvent.RuinsEcho]: {
    shape: 'multi',
    layers: [
      { shape: 'tone', freq: 400, duration: 0.2, wave: 'sine', envelope: { ...SOFT, attack: 0.05 }, offset: 0 },
      { shape: 'tone', freq: 400, duration: 0.15, wave: 'sine', envelope: { ...SOFT, attack: 0.05, peak: 0.5 }, offset: 0.3 },
      { shape: 'tone', freq: 400, duration: 0.1, wave: 'sine', envelope: { ...SOFT, attack: 0.05, peak: 0.25 }, offset: 0.55 },
    ],
  },

  [SolavineEvent.SquidHorn]: {
    shape: 'multi',
    layers: [
      { shape: 'sweep', freqStart: 80, freqEnd: 50, duration: 1.0, wave: 'sawtooth', envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.3, peak: 0.7 }, offset: 0 },
      { shape: 'sweep', freqStart: 120, freqEnd: 75, duration: 0.8, wave: 'sine', envelope: { attack: 0.15, decay: 0.2, sustain: 0.3, release: 0.2, peak: 0.4 }, offset: 0.05 },
    ],
  },

  [SolavineEvent.CannonFire]: {
    shape: 'multi',
    layers: [
      { shape: 'noise_burst', duration: 0.4, filterFreq: 800, filterType: 'lowpass', envelope: PERC, offset: 0 },
      { shape: 'sweep', freqStart: 200, freqEnd: 40, duration: 0.15, wave: 'sine', envelope: { ...PERC, decay: 0.12 }, offset: 0 },
    ],
  },

  [SolavineEvent.KrakenRoar]: {
    shape: 'multi',
    layers: [
      { shape: 'sweep', freqStart: 60, freqEnd: 25, duration: 1.5, wave: 'sawtooth', envelope: { attack: 0.2, decay: 0.5, sustain: 0.3, release: 0.5, peak: 0.8 }, offset: 0 },
      { shape: 'noise_burst', duration: 1.2, filterFreq: 300, filterType: 'lowpass', envelope: { attack: 0.15, decay: 0.6, sustain: 0.15, release: 0.4, peak: 0.5 }, offset: 0.1 },
      { shape: 'sweep', freqStart: 100, freqEnd: 40, duration: 1.0, wave: 'sine', envelope: { attack: 0.3, decay: 0.4, sustain: 0.2, release: 0.3, peak: 0.6 }, offset: 0.2 },
    ],
  },

  /* ═══════════════════════════════════════════
   * NAVIGATION — New
   * ═══════════════════════════════════════════ */

  [SolavineEvent.SailUnfurl]: {
    shape: 'multi',
    layers: [
      { shape: 'noise_burst', duration: 0.3, filterFreq: 3000, filterType: 'bandpass', envelope: { attack: 0.02, decay: 0.15, sustain: 0.1, release: 0.1, peak: 0.4 }, offset: 0 },
      { shape: 'sweep', freqStart: 300, freqEnd: 500, duration: 0.25, wave: 'triangle', envelope: SOFT, offset: 0.05 },
    ],
  },

  [SolavineEvent.AnchorDrop]: {
    shape: 'multi',
    layers: [
      { shape: 'sweep', freqStart: 400, freqEnd: 80, duration: 0.4, wave: 'sawtooth', envelope: { ...PERC, decay: 0.25 }, offset: 0 },
      { shape: 'noise_burst', duration: 0.3, filterFreq: 600, filterType: 'lowpass', envelope: { attack: 0.1, decay: 0.15, sustain: 0.05, release: 0.1, peak: 0.5 }, offset: 0.25 },
    ],
  },

  [SolavineEvent.MapRustle]: {
    shape: 'noise_burst',
    duration: 0.2,
    filterFreq: 4000,
    filterType: 'highpass',
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.08, peak: 0.3 },
  },

  [SolavineEvent.WavesCrash]: {
    shape: 'multi',
    layers: [
      { shape: 'noise_burst', duration: 1.0, filterFreq: 1200, filterType: 'bandpass', envelope: { attack: 0.3, decay: 0.4, sustain: 0.1, release: 0.3, peak: 0.4 }, offset: 0 },
      { shape: 'sweep', freqStart: 100, freqEnd: 60, duration: 0.8, wave: 'sine', envelope: { attack: 0.2, decay: 0.3, sustain: 0.1, release: 0.2, peak: 0.2 }, offset: 0.1 },
    ],
  },

  /* ═══════════════════════════════════════════
   * BIT (PARROT) — New
   * ═══════════════════════════════════════════ */

  [SolavineEvent.BitCelebrate]: {
    shape: 'arp',
    freqs: [
      midiToFreq(noteToMidi('A', 5)),
      midiToFreq(noteToMidi('C', 6)),
      midiToFreq(noteToMidi('A', 5)),
      midiToFreq(noteToMidi('C', 6)),
      midiToFreq(noteToMidi('E', 6)),
    ],
    totalDuration: 0.4,
    wave: 'square',
    envelope: BLIP,
  },

  [SolavineEvent.BitWingFlutter]: {
    shape: 'multi',
    layers: [
      { shape: 'noise_burst', duration: 0.15, filterFreq: 5000, filterType: 'bandpass', envelope: { attack: 0.005, decay: 0.05, sustain: 0.02, release: 0.05, peak: 0.3 }, offset: 0 },
      { shape: 'noise_burst', duration: 0.12, filterFreq: 5500, filterType: 'bandpass', envelope: { attack: 0.005, decay: 0.04, sustain: 0.02, release: 0.04, peak: 0.25 }, offset: 0.08 },
    ],
  },

  /* ═══════════════════════════════════════════
   * COMBAT — New
   * ═══════════════════════════════════════════ */

  [SolavineEvent.CritHit]: {
    shape: 'multi',
    layers: [
      { shape: 'tone', freq: E5, duration: 0.08, wave: 'square', envelope: PERC, offset: 0 },
      { shape: 'noise_burst', duration: 0.12, filterFreq: 3000, filterType: 'highpass', envelope: PERC, offset: 0 },
      { shape: 'arp', freqs: [E5, G5], totalDuration: 0.15, wave: 'triangle', envelope: CHIP, offset: 0.06 },
    ],
  },

  [SolavineEvent.ShieldBlock]: {
    shape: 'multi',
    layers: [
      { shape: 'tone', freq: 300, duration: 0.1, wave: 'sawtooth', envelope: PERC, offset: 0 },
      { shape: 'noise_burst', duration: 0.08, filterFreq: 1500, filterType: 'bandpass', envelope: { ...PERC, peak: 0.5 }, offset: 0 },
    ],
  },

  [SolavineEvent.HealChime]: {
    shape: 'arp',
    freqs: [E4, G4, C5, E5],
    totalDuration: 0.5,
    wave: 'sine',
    envelope: { ...SOFT, sustain: 0.6, release: 0.2 },
  },

  [SolavineEvent.ComboHit]: {
    shape: 'arp',
    freqs: [C4, E4, G4],
    totalDuration: 0.2,
    wave: 'square',
    envelope: PERC,
  },
};

/** Get all registered SFX event names. */
export function getSfxEventNames(): SolavineEvent[] {
  return Object.keys(SFX_LIBRARY) as SolavineEvent[];
}

/** Get an SFX definition by event. */
export function getSfxDefinition(event: SolavineEvent): SfxDefinition | undefined {
  return SFX_LIBRARY[event];
}

/**
 * Compute the total duration of an SFX definition in seconds.
 * For multi-layer SFX, returns the longest layer + its offset.
 */
export function getSfxDuration(def: SfxDefinition): number {
  switch (def.shape) {
    case 'tone': return def.duration;
    case 'arp': return def.totalDuration;
    case 'sweep': return def.duration;
    case 'noise_burst': return def.duration;
    case 'multi': {
      let max = 0;
      for (const layer of def.layers) {
        const layerDur = layer.offset + getSfxDuration(layer);
        if (layerDur > max) max = layerDur;
      }
      return max;
    }
  }
}
