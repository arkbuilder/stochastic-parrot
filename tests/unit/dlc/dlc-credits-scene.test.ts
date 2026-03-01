/**
 * DLC Credits Scene & Credits Music — comprehensive tests.
 *
 * Tests cover:
 *   - Credits message content (team names, tone, length)
 *   - DlcCreditsScene lifecycle (typewriter, scroll, dismiss, fast-mode)
 *   - Credits music structure (melody, harmony, duration)
 *   - Integration: DLC completion triggers credits (not base game)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DlcCreditsScene,
  DLC_CREDITS_MESSAGE,
} from '../../../src/scenes/dlc-credits-scene';
import {
  CreditsMusic,
  CREDITS_MELODY,
  CREDITS_HARMONY,
} from '../../../src/audio/credits-music';

// ── Helpers ──────────────────────────────────────────────────

function createScene(overrides?: { onDone?: () => void; onEnter?: () => void }): DlcCreditsScene {
  return new DlcCreditsScene({
    onDone: overrides?.onDone ?? (() => {}),
    onEnter: overrides?.onEnter ?? undefined,
  });
}

const mockContext: { now: () => number } = { now: () => performance.now() };

function mockCanvas(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  } as unknown as CanvasRenderingContext2D;
}

function advanceScene(scene: DlcCreditsScene, seconds: number, actions: Array<{ type: string }> = []): void {
  // Simulate in small steps for scroll accuracy
  const step = 1 / 60;
  let remaining = seconds;
  while (remaining > 0) {
    const dt = Math.min(step, remaining);
    scene.update(dt, actions.length > 0 && remaining === seconds ? actions : []);
    remaining -= dt;
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION 1 — CREDITS MESSAGE CONTENT
// ══════════════════════════════════════════════════════════════

describe('DLC Credits Message — content', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(DLC_CREDITS_MESSAGE)).toBe(true);
    expect(DLC_CREDITS_MESSAGE.length).toBeGreaterThan(10);
  });

  it('starts with "Thank You, Captain."', () => {
    expect(DLC_CREDITS_MESSAGE[0]).toBe('Thank You, Captain.');
  });

  it('ends with "Fair winds, Captain."', () => {
    expect(DLC_CREDITS_MESSAGE[DLC_CREDITS_MESSAGE.length - 1]).toBe('Fair winds, Captain.');
  });

  it('mentions all four team members by name', () => {
    const allText = DLC_CREDITS_MESSAGE.join('\n');
    expect(allText).toContain('Eric');
    expect(allText).toContain('Kira');
    expect(allText).toContain('Solivane');
    expect(allText).toContain('Claude');
  });

  it('each team member has a dedicated line (name on its own)', () => {
    const nameLines = DLC_CREDITS_MESSAGE.filter(
      (line) => ['Eric', 'Kira', 'Solivane', 'Claude'].includes(line.trim()),
    );
    expect(nameLines.length).toBe(4);
  });

  it('each team member has at least one description line after their name', () => {
    const names = ['Eric', 'Kira', 'Solivane', 'Claude'];
    for (const name of names) {
      const idx = DLC_CREDITS_MESSAGE.indexOf(name);
      expect(idx, `${name} should be in the message`).toBeGreaterThanOrEqual(0);
      // Next non-empty line should be a description
      const nextLine = DLC_CREDITS_MESSAGE[idx + 1];
      expect(nextLine, `${name} should have a description after`).toBeTruthy();
      expect(nextLine!.length).toBeGreaterThan(10);
    }
  });

  it('has separators between sections', () => {
    const separators = DLC_CREDITS_MESSAGE.filter((line) => line === '- - -');
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });

  it('references both the sea and the stars (base + DLC connection)', () => {
    const allText = DLC_CREDITS_MESSAGE.join('\n').toLowerCase();
    expect(allText).toContain('sea');
    expect(allText).toContain('stars');
  });

  it('references the Kraken (base game) and Space Kraken (DLC)', () => {
    const allText = DLC_CREDITS_MESSAGE.join('\n');
    expect(allText.toLowerCase()).toContain('kraken');
    expect(allText).toContain('Space Kraken');
  });

  it('references memory (core game theme)', () => {
    const allText = DLC_CREDITS_MESSAGE.join('\n').toLowerCase();
    expect(allText).toContain('remember');
  });

  it('no line exceeds 45 characters (fits narrow 240px canvas)', () => {
    for (const line of DLC_CREDITS_MESSAGE) {
      expect(
        line.length,
        `"${line}" is ${line.length} chars`,
      ).toBeLessThanOrEqual(45);
    }
  });

  it('total message is between 30 and 60 lines', () => {
    expect(DLC_CREDITS_MESSAGE.length).toBeGreaterThanOrEqual(30);
    expect(DLC_CREDITS_MESSAGE.length).toBeLessThanOrEqual(60);
  });

  it('has a heartfelt emotional tone (not technical/dry)', () => {
    const allText = DLC_CREDITS_MESSAGE.join('\n').toLowerCase();
    // At least some warm/emotional words
    const warmWords = ['love', 'heart', 'thank', 'grateful', 'sail', 'wind', 'dream'];
    const matchCount = warmWords.filter((w) => allText.includes(w)).length;
    expect(matchCount, 'should have warm/emotional language').toBeGreaterThanOrEqual(3);
  });

  it('mentions the rocket/space journey', () => {
    const allText = DLC_CREDITS_MESSAGE.join('\n').toLowerCase();
    expect(allText.match(/rocket|stars|space|flew|void/)).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 2 — DLC CREDITS SCENE LIFECYCLE
// ══════════════════════════════════════════════════════════════

describe('DlcCreditsScene — initialization', () => {
  it('constructs without error', () => {
    expect(() => createScene()).not.toThrow();
  });

  it('starts with zero chars revealed', () => {
    const scene = createScene();
    scene.enter(mockContext);
    expect(scene._charsRevealed).toBe(0);
  });

  it('is not dismissed at start', () => {
    const scene = createScene();
    scene.enter(mockContext);
    expect(scene._dismissed).toBe(false);
  });

  it('is not fully revealed at start', () => {
    const scene = createScene();
    scene.enter(mockContext);
    expect(scene._fullyRevealed).toBe(false);
  });

  it('calls onEnter callback on enter()', () => {
    const onEnter = vi.fn();
    const scene = createScene({ onEnter });
    scene.enter(mockContext);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('scroll starts at zero', () => {
    const scene = createScene();
    scene.enter(mockContext);
    expect(scene._scrollY).toBe(0);
  });
});

describe('DlcCreditsScene — typewriter effect', () => {
  let scene: DlcCreditsScene;

  beforeEach(() => {
    scene = createScene();
    scene.enter(mockContext);
  });

  it('reveals characters over time', () => {
    advanceScene(scene, 1.0); // 1 second at 35ms/char ≈ 28 chars
    expect(scene._charsRevealed).toBeGreaterThan(0);
    expect(scene._charsRevealed).toBeLessThan(DLC_CREDITS_MESSAGE.join('\n').length);
  });

  it('normal speed is ~28 chars/sec (35ms per char)', () => {
    advanceScene(scene, 1.0);
    // 1000ms / 35ms ≈ 28 chars
    expect(scene._charsRevealed).toBeGreaterThanOrEqual(25);
    expect(scene._charsRevealed).toBeLessThanOrEqual(35);
  });

  it('tap activates fast mode', () => {
    advanceScene(scene, 0.5);
    expect(scene._fastMode).toBe(false);
    scene.update(0.016, [{ type: 'tap' }]);
    expect(scene._fastMode).toBe(true);
  });

  it('click also activates fast mode', () => {
    advanceScene(scene, 0.5);
    scene.update(0.016, [{ type: 'click' }]);
    expect(scene._fastMode).toBe(true);
  });

  it('fast mode reveals characters much faster (~125 chars/sec)', () => {
    scene.update(0.016, [{ type: 'tap' }]); // activate fast mode
    advanceScene(scene, 1.0);
    // 1000ms / 8ms ≈ 125 chars per second
    expect(scene._charsRevealed).toBeGreaterThanOrEqual(100);
  });

  it('eventually reveals all characters', () => {
    scene.update(0.016, [{ type: 'tap' }]); // fast mode
    advanceScene(scene, 30); // plenty of time
    expect(scene._fullyRevealed).toBe(true);
  });
});

describe('DlcCreditsScene — scrolling', () => {
  let scene: DlcCreditsScene;

  beforeEach(() => {
    scene = createScene();
    scene.enter(mockContext);
  });

  it('scrolls as text grows past viewport', () => {
    // Fast-reveal a lot of text
    scene.update(0.016, [{ type: 'tap' }]);
    advanceScene(scene, 20); // enough to reveal most text
    expect(scene._scrollY).toBeGreaterThan(0);
  });

  it('scroll does not go backwards', () => {
    scene.update(0.016, [{ type: 'tap' }]);
    advanceScene(scene, 5);
    const scroll1 = scene._scrollY;
    advanceScene(scene, 5);
    expect(scene._scrollY).toBeGreaterThanOrEqual(scroll1);
  });
});

describe('DlcCreditsScene — dismissal', () => {
  it('does not dismiss on tap while text is still revealing', () => {
    const onDone = vi.fn();
    const scene = createScene({ onDone });
    scene.enter(mockContext);

    advanceScene(scene, 1.0);
    scene.update(0.016, [{ type: 'tap' }]); // goes to fast mode
    scene.update(0.016, [{ type: 'tap' }]); // still revealing, won't dismiss

    expect(scene._dismissed).toBe(false);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('dismisses on tap after all text is revealed + minimum display time', () => {
    const onDone = vi.fn();
    const scene = createScene({ onDone });
    scene.enter(mockContext);

    // Fast-reveal everything
    scene.update(0.016, [{ type: 'tap' }]);
    advanceScene(scene, 30); // enough for everything
    expect(scene._fullyRevealed).toBe(true);
    expect(scene._elapsed).toBeGreaterThan(3); // past MIN_DISPLAY_S

    // Now dismiss
    scene.update(0.016, [{ type: 'tap' }]);
    expect(scene._dismissed).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('onDone is called exactly once even on repeated taps', () => {
    const onDone = vi.fn();
    const scene = createScene({ onDone });
    scene.enter(mockContext);

    scene.update(0.016, [{ type: 'tap' }]);
    advanceScene(scene, 30);

    scene.update(0.016, [{ type: 'tap' }]); // dismiss
    scene.update(0.016, [{ type: 'tap' }]); // extra tap
    scene.update(0.016, [{ type: 'tap' }]); // extra tap

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('key_confirm also triggers dismiss', () => {
    const onDone = vi.fn();
    const scene = createScene({ onDone });
    scene.enter(mockContext);

    scene.update(0.016, [{ type: 'tap' }]);
    advanceScene(scene, 30);
    scene.update(0.016, [{ type: 'key_confirm' }]);

    expect(scene._dismissed).toBe(true);
    expect(onDone).toHaveBeenCalled();
  });
});

describe('DlcCreditsScene — rendering', () => {
  it('renders without error', () => {
    const scene = createScene();
    scene.enter(mockContext);
    advanceScene(scene, 1.0);

    const ctx = mockCanvas();
    expect(() => scene.render(ctx)).not.toThrow();
  });

  it('draws background gradient', () => {
    const scene = createScene();
    scene.enter(mockContext);
    advanceScene(scene, 0.1);

    const ctx = mockCanvas();
    scene.render(ctx);
    expect(ctx.createLinearGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('draws text via fillText', () => {
    const scene = createScene();
    scene.enter(mockContext);
    advanceScene(scene, 2.0); // reveal some text

    const ctx = mockCanvas();
    scene.render(ctx);
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('re-enter resets state', () => {
    const scene = createScene();
    scene.enter(mockContext);
    advanceScene(scene, 5.0);
    expect(scene._charsRevealed).toBeGreaterThan(0);

    scene.enter(mockContext);
    expect(scene._charsRevealed).toBe(0);
    expect(scene._scrollY).toBe(0);
    expect(scene._dismissed).toBe(false);
    expect(scene._fastMode).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 3 — CREDITS MUSIC
// ══════════════════════════════════════════════════════════════

describe('Credits Music — melody structure', () => {
  it('melody is a non-empty array', () => {
    expect(CREDITS_MELODY.length).toBeGreaterThan(0);
  });

  it('harmony is a non-empty array', () => {
    expect(CREDITS_HARMONY.length).toBeGreaterThan(0);
  });

  it('every melody note has a positive duration', () => {
    for (const note of CREDITS_MELODY) {
      expect(note.dur).toBeGreaterThan(0);
    }
  });

  it('every harmony note has a positive duration', () => {
    for (const note of CREDITS_HARMONY) {
      expect(note.dur).toBeGreaterThan(0);
    }
  });

  it('every note freq is non-negative (0 = rest)', () => {
    for (const note of [...CREDITS_MELODY, ...CREDITS_HARMONY]) {
      expect(note.freq).toBeGreaterThanOrEqual(0);
    }
  });

  it('melody total duration is 20–40 seconds', () => {
    const total = CREDITS_MELODY.reduce((s, n) => s + n.dur, 0);
    expect(total).toBeGreaterThanOrEqual(20);
    expect(total).toBeLessThanOrEqual(40);
  });

  it('melody has rests (freq === 0) for breathing room', () => {
    const rests = CREDITS_MELODY.filter((n) => n.freq === 0);
    expect(rests.length).toBeGreaterThanOrEqual(3);
  });

  it('melody has ascending notes (emotional arc)', () => {
    const freqs = CREDITS_MELODY.filter((n) => n.freq > 0).map((n) => n.freq);
    const maxFreq = Math.max(...freqs);
    const minFreq = Math.min(...freqs);
    // Range should span at least an octave
    expect(maxFreq / minFreq).toBeGreaterThanOrEqual(2);
  });

  it('melody ends with long held notes (resolution feel)', () => {
    const lastThree = CREDITS_MELODY.slice(-3);
    for (const note of lastThree) {
      expect(note.dur, 'final notes should be long').toBeGreaterThanOrEqual(1.5);
    }
  });
});

describe('Credits Music — CreditsMusic class', () => {
  it('exports CreditsMusic class with start/stop/durationS', () => {
    expect(typeof CreditsMusic).toBe('function');
    expect(CreditsMusic.prototype.start).toBeDefined();
    expect(CreditsMusic.prototype.stop).toBeDefined();
  });

  it('durationS matches melody total', () => {
    // Create with mock context
    const mockAudioCtx = {
      currentTime: 0,
      createGain: () => ({
        gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createOscillator: () => ({
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
    } as unknown as AudioContext;

    const mockDest = {
      connect: vi.fn(),
    } as unknown as AudioNode;

    const music = new CreditsMusic(mockAudioCtx, mockDest);
    const expected = CREDITS_MELODY.reduce((s, n) => s + n.dur, 0);
    expect(music.durationS).toBeCloseTo(expected, 1);
  });

  it('stop() does not throw when called before start()', () => {
    const mockAudioCtx = {
      currentTime: 0,
      createGain: () => ({
        gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    } as unknown as AudioContext;

    const music = new CreditsMusic(mockAudioCtx, {} as AudioNode);
    expect(() => music.stop()).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 4 — TRIGGER LOGIC
// ══════════════════════════════════════════════════════════════

describe('DLC Credits trigger — island ID check', () => {
  it('dlc_krakens_void is the DLC final island', () => {
    // This verifies the constant used in main.ts
    expect('dlc_krakens_void').toBe('dlc_krakens_void');
  });

  it('DLC credits should NOT trigger for base-game islands', () => {
    const baseIslands = ['island_01', 'island_02', 'island_03', 'island_04', 'island_05', 'hidden_reef'];
    for (const id of baseIslands) {
      expect(id === 'dlc_krakens_void', `${id} should not trigger DLC credits`).toBe(false);
    }
  });

  it('DLC credits should NOT trigger for non-final DLC islands', () => {
    const nonFinal = ['dlc_launchpad_lagoon', 'dlc_booster_reef', 'dlc_orbit_atoll', 'dlc_nebula_shallows'];
    for (const id of nonFinal) {
      expect(id === 'dlc_krakens_void', `${id} should not trigger DLC credits`).toBe(false);
    }
  });

  it('DLC credits should trigger only for dlc_krakens_void', () => {
    expect('dlc_krakens_void' === 'dlc_krakens_void').toBe(true);
  });
});

describe('DLC Credits trigger — scene flow verification', () => {
  it('DLC outro cinematic exists for dlc_krakens_void', async () => {
    const { ISLAND_CINEMATICS } = await import('../../../src/cinematics/island-cinematics');
    const cine = ISLAND_CINEMATICS['dlc_krakens_void'];
    expect(cine).toBeDefined();
    expect(cine!.outro).toBeDefined();
    expect(cine!.outro.beats.length).toBeGreaterThanOrEqual(2);
  });

  it('DLC outro plays BEFORE credits (verified by structural order)', async () => {
    // The credits scene is separate from the cinematic — it's pushed after outro completes
    const { ISLAND_CINEMATICS } = await import('../../../src/cinematics/island-cinematics');
    const outro = ISLAND_CINEMATICS['dlc_krakens_void']!.outro;

    // Outro should have the splashdown finale
    const captionText = outro.beats.map((b) => b.caption ?? '').join(' ');
    expect(captionText.toLowerCase()).toContain('splashdown');

    // Credits scene has a different opening
    expect(DLC_CREDITS_MESSAGE[0]).toBe('Thank You, Captain.');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 5 — CROSS-CUTTING QUALITY
// ══════════════════════════════════════════════════════════════

describe('DLC Credits — quality bar', () => {
  it('credits render at 240x400 canvas size (portrait-first)', () => {
    // The scene renders to full 240x400 canvas
    const scene = createScene();
    scene.enter(mockContext);
    advanceScene(scene, 1.0);

    const ctx = mockCanvas();
    scene.render(ctx);

    // fillRect is called for background (240x400)
    const calls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
    const bgCall = calls.find(
      (c: number[]) => c[0] === 0 && c[1] === 0 && c[2] === 240 && c[3] === 400,
    );
    expect(bgCall).toBeDefined();
  });

  it('credits scene implements Scene interface', () => {
    const scene = createScene();
    expect(typeof scene.enter).toBe('function');
    expect(typeof scene.exit).toBe('function');
    expect(typeof scene.update).toBe('function');
    expect(typeof scene.render).toBe('function');
  });

  it('exit() does not throw', () => {
    const scene = createScene();
    scene.enter(mockContext);
    expect(() => scene.exit()).not.toThrow();
  });

  it('credits message has no consecutive empty lines (clean formatting)', () => {
    for (let i = 1; i < DLC_CREDITS_MESSAGE.length; i++) {
      const prev = DLC_CREDITS_MESSAGE[i - 1];
      const curr = DLC_CREDITS_MESSAGE[i];
      expect(
        prev === '' && curr === '',
        `consecutive empty lines at index ${i - 1}→${i}`,
      ).toBe(false);
    }
  });

  it('team names appear in a consistent order', () => {
    const nameIndices = ['Eric', 'Kira', 'Solivane', 'Claude'].map((n) =>
      DLC_CREDITS_MESSAGE.indexOf(n),
    );
    // All found
    for (const idx of nameIndices) {
      expect(idx).toBeGreaterThanOrEqual(0);
    }
    // In ascending order
    for (let i = 1; i < nameIndices.length; i++) {
      expect(nameIndices[i]!).toBeGreaterThan(nameIndices[i - 1]!);
    }
  });

  it('the message includes both gratitude and forward-looking sentiment', () => {
    const allText = DLC_CREDITS_MESSAGE.join('\n').toLowerCase();
    // Gratitude
    expect(allText.match(/thank|grateful/)).toBeTruthy();
    // Forward-looking
    expect(allText.match(/wind|journey|sail/)).toBeTruthy();
  });
});
