/**
 * SolavineSound — 80s-style Voice Synth (pure planning layer)
 *
 * Converts short text phrases into phoneme frames suitable for crude
 * arcade-era speech synthesis (voiced buzz + filtered noise).
 */

export interface VoiceOptions {
  pitchHz?: number;
  speed?: number;
}

export interface VoicePhoneme {
  id: string;
  voiced: boolean;
  durationS: number;
  /** Formants in Hz (up to 3 resonances). */
  formants: readonly number[];
  /** Noise contribution 0..1. */
  noise: number;
  /** Pitch multiplier for the base voice oscillator. */
  pitchMul: number;
}

export interface VoiceFrame {
  phoneme: VoicePhoneme;
  startS: number;
  durationS: number;
}

const PHONEMES: Record<string, VoicePhoneme> = {
  SIL: { id: 'SIL', voiced: false, durationS: 0.05, formants: [], noise: 0, pitchMul: 1 },

  A: { id: 'A', voiced: true, durationS: 0.095, formants: [800, 1150, 2900], noise: 0.04, pitchMul: 1 },
  E: { id: 'E', voiced: true, durationS: 0.09, formants: [500, 1900, 2600], noise: 0.05, pitchMul: 1.02 },
  I: { id: 'I', voiced: true, durationS: 0.085, formants: [300, 2200, 3000], noise: 0.05, pitchMul: 1.04 },
  O: { id: 'O', voiced: true, durationS: 0.095, formants: [500, 900, 2600], noise: 0.03, pitchMul: 0.98 },
  U: { id: 'U', voiced: true, durationS: 0.095, formants: [350, 800, 2200], noise: 0.03, pitchMul: 0.96 },

  R: { id: 'R', voiced: true, durationS: 0.07, formants: [350, 1300, 1700], noise: 0.05, pitchMul: 1 },
  L: { id: 'L', voiced: true, durationS: 0.065, formants: [400, 2400, 3000], noise: 0.04, pitchMul: 1.01 },
  M: { id: 'M', voiced: true, durationS: 0.075, formants: [250, 1200, 2100], noise: 0.02, pitchMul: 0.96 },
  N: { id: 'N', voiced: true, durationS: 0.07, formants: [280, 1700, 2600], noise: 0.03, pitchMul: 0.98 },
  W: { id: 'W', voiced: true, durationS: 0.06, formants: [300, 800, 2300], noise: 0.02, pitchMul: 0.92 },
  Y: { id: 'Y', voiced: true, durationS: 0.055, formants: [320, 2100, 3000], noise: 0.03, pitchMul: 1.08 },

  S: { id: 'S', voiced: false, durationS: 0.06, formants: [3500, 5200], noise: 1, pitchMul: 1 },
  SH: { id: 'SH', voiced: false, durationS: 0.07, formants: [2200, 3200, 4300], noise: 1, pitchMul: 1 },
  F: { id: 'F', voiced: false, durationS: 0.055, formants: [1200, 2400, 3600], noise: 0.95, pitchMul: 1 },
  H: { id: 'H', voiced: false, durationS: 0.05, formants: [1000, 1800, 2600], noise: 0.8, pitchMul: 1 },

  T: { id: 'T', voiced: false, durationS: 0.045, formants: [3000, 4500], noise: 0.95, pitchMul: 1 },
  K: { id: 'K', voiced: false, durationS: 0.05, formants: [1500, 2600, 3900], noise: 0.9, pitchMul: 1 },
  P: { id: 'P', voiced: false, durationS: 0.045, formants: [800, 1600, 2600], noise: 0.85, pitchMul: 1 },
  B: { id: 'B', voiced: true, durationS: 0.05, formants: [700, 1300, 2500], noise: 0.35, pitchMul: 0.98 },
  D: { id: 'D', voiced: true, durationS: 0.05, formants: [900, 1700, 2800], noise: 0.35, pitchMul: 1 },
  G: { id: 'G', voiced: true, durationS: 0.055, formants: [600, 1400, 2400], noise: 0.32, pitchMul: 0.96 },

  CH: { id: 'CH', voiced: false, durationS: 0.065, formants: [1800, 2800, 4200], noise: 1, pitchMul: 1 },
  TH: { id: 'TH', voiced: false, durationS: 0.065, formants: [1500, 2500, 3700], noise: 1, pitchMul: 1 },
};

const DIGRAPHS = ['CH', 'SH', 'TH'] as const;
const SILENCE_PHONEME: VoicePhoneme = PHONEMES.SIL!;

/**
 * Targeted word-level pronunciation hints for critical UI words.
 * This dramatically improves intelligibility versus letter-by-letter mapping.
 */
const WORD_OVERRIDES: Record<string, string[]> = {
  PLAY: ['P', 'L', 'A'],
  RESUME: ['R', 'I', 'S', 'U', 'M'],
  LEADERBOARD: ['L', 'E', 'D', 'R', 'B', 'O', 'R', 'D'],
  BESTIARY: ['B', 'E', 'S', 'T', 'I', 'R', 'E'],
};

const LETTER_FALLBACK: Record<string, string[]> = {
  C: ['K'],
  J: ['CH'],
  Q: ['K'],
  V: ['F'],
  X: ['K', 'S'],
  Z: ['S'],
};

function sanitize(text: string): string {
  return text.toUpperCase().replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function textToPhonemeIds(text: string): string[] {
  const cleaned = sanitize(text);
  if (!cleaned) return ['SIL'];

  const words = cleaned.split(' ');
  const out: string[] = [];

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi]!;

    const override = WORD_OVERRIDES[word];
    if (override) {
      out.push(...override);
    } else {
      out.push(...spellWord(word));
    }

    if (wi < words.length - 1) out.push('SIL');
  }

  return out.length > 0 ? out : ['SIL'];
}

function spellWord(word: string): string[] {
  const ids: string[] = [];
  let i = 0;

  while (i < word.length) {
    const c = word[i];
    if (!c) break;

    const pair = word.slice(i, i + 2);
    if ((DIGRAPHS as readonly string[]).includes(pair) && PHONEMES[pair]) {
      ids.push(pair);
      i += 2;
      continue;
    }

    if (PHONEMES[c]) {
      ids.push(c);
      i += 1;
      continue;
    }

    const fallback = LETTER_FALLBACK[c];
    if (fallback) ids.push(...fallback);
    else ids.push('SIL');
    i += 1;
  }

  return ids;
}

export function buildVoiceFrames(text: string, opts: VoiceOptions = {}): VoiceFrame[] {
  const speed = clamp(opts.speed ?? 1, 0.5, 2.5);
  const ids = textToPhonemeIds(text);

  let t = 0;
  const frames: VoiceFrame[] = [];

  for (const id of ids) {
    const p = PHONEMES[id] ?? SILENCE_PHONEME;
    const dur = p.durationS / speed;
    frames.push({ phoneme: p, startS: t, durationS: dur });
    t += dur;
  }

  return frames;
}

export function estimateVoiceDuration(text: string, opts: VoiceOptions = {}): number {
  const frames = buildVoiceFrames(text, opts);
  return frames.reduce((sum, f) => sum + f.durationS, 0);
}

/**
 * Proxy intelligibility metric for unit tests:
 * ratio of voiced time to total phrase duration.
 */
export function estimateVoicedRatio(text: string, opts: VoiceOptions = {}): number {
  const frames = buildVoiceFrames(text, opts);
  const total = frames.reduce((sum, f) => sum + f.durationS, 0);
  if (total <= 0) return 0;
  const voiced = frames.reduce((sum, f) => sum + (f.phoneme.voiced ? f.durationS : 0), 0);
  return voiced / total;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
