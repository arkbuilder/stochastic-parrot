import { describe, expect, it } from 'vitest';
import { buildVoiceFrames, estimateVoiceDuration, textToPhonemeIds } from '../../../../src/audio/solavine/voice';

describe('voice planning', () => {
  it('maps digraphs first', () => {
    expect(textToPhonemeIds('SHIP THAT')).toEqual(['SH', 'I', 'P', 'SIL', 'TH', 'A', 'T']);
  });

  it('returns silence frame for empty text', () => {
    const ids = textToPhonemeIds('   ');
    expect(ids).toEqual(['SIL']);
  });

  it('builds monotonically increasing frame start times', () => {
    const frames = buildVoiceFrames('LEVEL UP');
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]!.startS).toBeGreaterThan(frames[i - 1]!.startS);
    }
  });

  it('speed option shortens total duration', () => {
    const normal = estimateVoiceDuration('READY PLAYER ONE', { speed: 1 });
    const faster = estimateVoiceDuration('READY PLAYER ONE', { speed: 2 });
    expect(faster).toBeLessThan(normal);
  });
});
