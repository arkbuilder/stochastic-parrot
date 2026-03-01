import { describe, it, expect, vi } from 'vitest';
import {
  renderSky,
  renderCharacter,
  renderProp,
  renderCaption,
  renderTapPrompt,
  renderBeat,
} from '../../../src/cinematics/beat-renderer';
import type { CinematicBeat, SkyPreset, CharacterId, CharacterPlacement, PropPlacement } from '../../../src/cinematics/types';

// ── helpers ──────────────────────────────────────────────────

/** Tracking context that records fillStyle/strokeStyle values as they're set. */
function makeCtx() {
  const styles: { fillStyles: string[]; strokeStyles: string[] } = {
    fillStyles: [],
    strokeStyles: [],
  };

  const ctx = {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arcTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    ellipse: vi.fn(),
    setTransform: vi.fn(),
    rotate: vi.fn(),
    measureText: vi.fn(() => ({ width: 30 })),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    _fillStyle: '',
    _strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    __styles: styles,
  };

  Object.defineProperty(ctx, 'fillStyle', {
    get() { return ctx._fillStyle; },
    set(v: string) { ctx._fillStyle = v; styles.fillStyles.push(v); },
  });
  Object.defineProperty(ctx, 'strokeStyle', {
    get() { return ctx._strokeStyle; },
    set(v: string) { ctx._strokeStyle = v; styles.strokeStyles.push(v); },
  });

  return ctx as unknown as CanvasRenderingContext2D & { __styles: typeof styles };
}

// ── renderSky — atmosphere presets ───────────────────────────

describe('renderSky', () => {
  const skyPresets: SkyPreset[] = ['dawn', 'day', 'dusk', 'night', 'storm', 'dark_sea'];

  for (const preset of skyPresets) {
    it(`renders "${preset}" sky at t=0 without throwing`, () => {
      expect(() => renderSky(makeCtx(), preset, 0)).not.toThrow();
    });

    it(`renders "${preset}" sky at t=5s without throwing`, () => {
      expect(() => renderSky(makeCtx(), preset, 5)).not.toThrow();
    });
  }

  it('night sky draws stars (fillRect calls for star particles)', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'night', 0);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('dusk sky also draws stars (stars: true in config)', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'dusk', 0);
    // dusk has stars: true → drawStars is called which uses fillRect
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('dark_sea draws stars AND fog overlay', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'dark_sea', 0);
    // Stars drawn + fog overlay via fillRect
    expect(ctx.fillRect).toHaveBeenCalled();
    // fogAlpha > 0 means an overlay is drawn encompassing the viewport
    const largeFillRects = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls
      .filter((c: number[]) => c[2] === 240 && c[3] === 400);
    expect(largeFillRects.length).toBeGreaterThanOrEqual(1);
  });

  it('dawn sky draws sun disc via arc and radial gradient', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'dawn', 0);
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('dawn sky sun uses warm golden colors', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'dawn', 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // Sun disc uses #fde047 directly
    expect(strs).toContain('#fde047');
  });

  it('storm sky draws cloud ellipses', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'storm', 0);
    expect(ctx.ellipse).toHaveBeenCalled();
    expect((ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length).toBe(5);
  });

  it('storm sky fog overlay uses dark slate color', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'storm', 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#0f172a', ...) → rgba(15,23,42,...)
    const hasDarkSlate = strs.some((s) => s.includes('15,23,42'));
    expect(hasDarkSlate).toBe(true);
  });

  it('day sky has NO clouds and NO sun disc', () => {
    const ctx = makeCtx();
    renderSky(ctx, 'day', 0);
    // day has stars: false, fogAlpha: 0, no sun, no clouds
    expect(ctx.ellipse).not.toHaveBeenCalled(); // no clouds
    expect(ctx.createRadialGradient).not.toHaveBeenCalled(); // no sun glow
  });
});

// ── renderCharacter — identity and visual correctness ────────

describe('renderCharacter', () => {
  const characters: CharacterId[] = ['nemo', 'bit', 'ship_loci', 'ship_overfit', 'null', 'kraken'];

  for (const id of characters) {
    it(`renders "${id}" without throwing`, () => {
      expect(() => renderCharacter(makeCtx(), { id, x: 120, y: 200 }, 0)).not.toThrow();
    });

    it(`renders "${id}" with scale and flipX`, () => {
      expect(() => renderCharacter(makeCtx(), { id, x: 60, y: 100, scale: 1.5, flipX: true }, 2)).not.toThrow();
    });
  }

  it('saves and restores context (no leak)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'nemo', x: 50, y: 50 }, 0);
    expect((ctx.save as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBe((ctx.restore as ReturnType<typeof vi.fn>).mock.calls.length);
  });

  it('translates to character position before drawing', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'nemo', x: 80, y: 250 }, 0);
    const calls = (ctx.translate as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.some((c: number[]) => c[0] === 80 && c[1] === 250)).toBe(true);
  });

  it('applies scale when scale !== 1', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'bit', x: 50, y: 50, scale: 2 }, 0);
    const scaleCalls = (ctx.scale as ReturnType<typeof vi.fn>).mock.calls;
    expect(scaleCalls.some((c: number[]) => c[0] === 2 && c[1] === 2)).toBe(true);
  });

  it('applies flipX as scale(-1,1)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'nemo', x: 50, y: 50, flipX: true }, 0);
    const scaleCalls = (ctx.scale as ReturnType<typeof vi.fn>).mock.calls;
    expect(scaleCalls.some((c: number[]) => c[0] === -1 && c[1] === 1)).toBe(true);
  });

  // ── Visual identity checks ──

  it('Null captain wears a red coat (#ef4444)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'null', x: 100, y: 200, anim: 'idle' }, 0);
    expect(ctx.__styles.fillStyles).toContain('#ef4444');
  });

  it('Null captain has an eye patch (black rect)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'null', x: 100, y: 200 }, 0);
    expect(ctx.__styles.fillStyles).toContain('#000');
  });

  it('Null captain fist_shake animation draws extra shape', () => {
    const ctxIdle = makeCtx();
    renderCharacter(ctxIdle, { id: 'null', x: 100, y: 200, anim: 'idle' }, 0);
    const idleFillRects = (ctxIdle.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

    const ctxShake = makeCtx();
    renderCharacter(ctxShake, { id: 'null', x: 100, y: 200, anim: 'fist_shake' }, 0);
    const shakeFillRects = (ctxShake.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

    expect(shakeFillRects).toBeGreaterThan(idleFillRects);
  });

  it('Null\'s ship (ship_overfit) has red sail (#ef4444)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'ship_overfit', x: 100, y: 200 }, 0);
    expect(ctx.__styles.fillStyles).toContain('#ef4444');
  });

  it('Null\'s ship has dark hull (#4a1c1c)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'ship_overfit', x: 100, y: 200 }, 0);
    expect(ctx.__styles.fillStyles).toContain('#4a1c1c');
  });

  it('Null\'s ship has skull flag drawn with gold (#fbbf24)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'ship_overfit', x: 100, y: 200 }, 0);
    expect(ctx.__styles.fillStyles).toContain('#fbbf24');
  });

  it('Kraken draws tentacles via quadraticCurveTo', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    // 6 tentacles → 6 quadraticCurveTo calls
    expect((ctx.quadraticCurveTo as ReturnType<typeof vi.fn>).mock.calls.length).toBe(6);
  });

  it('Kraken draws a pulsing eye via arc', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    // 6 sucker dots + 3 bioluminescent spots + 3 eye arcs (glow, iris, pupil) = 12
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(10);
  });

  it('Kraken tentacles use pink/magenta (rgb 236,72,153)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    const strs = ctx.__styles.strokeStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#ec4899', ...) → rgba(236,72,153,...)
    const hasPink = strs.some((s) => s.includes('236,72,153'));
    expect(hasPink).toBe(true);
  });

  it('Kraken eye uses gold (rgb 251,191,36)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#fbbf24', ...) → rgba(251,191,36,...)
    const hasGold = strs.some((s) => s.includes('251,191,36'));
    expect(hasGold).toBe(true);
  });

  it('Kraken has a cohesive violet mantle via ellipse', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    expect(ctx.ellipse).toHaveBeenCalledTimes(1);
    // Mantle centred at (0, -18)
    const [cx, cy, rx, ry] = (ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(cx).toBe(0);
    expect(cy).toBe(-18);
    expect(rx).toBe(14);
    expect(ry).toBe(18);
  });

  it('Kraken mantle uses violet fill', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#7c3aed', ...) → rgb(124,58,237)
    const hasViolet = strs.some((s) => s.includes('124,58,237'));
    expect(hasViolet).toBe(true);
  });

  it('Kraken has cyan bioluminescent spots', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#22d3ee', ...) → rgb(34,211,238)
    const hasCyan = strs.some((s) => s.includes('34,211,238'));
    expect(hasCyan).toBe(true);
  });

  it('Kraken draws within a tight bounding box (no scatter)', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 120, y: 140, scale: 1.3 }, 0);
    // All arc calls should have coords within ±15 of origin x and -36..+30 of origin y
    const arcCalls = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls;
    for (const [x, y] of arcCalls) {
      expect(x).toBeGreaterThanOrEqual(-15);
      expect(x).toBeLessThanOrEqual(15);
      expect(y).toBeGreaterThanOrEqual(-36);
      expect(y).toBeLessThanOrEqual(30);
    }
    // All quadraticCurveTo control/end points within ±15 x and -10..+35 y
    const qCalls = (ctx.quadraticCurveTo as ReturnType<typeof vi.fn>).mock.calls;
    for (const [cpx, cpy, ex, ey] of qCalls) {
      expect(cpx).toBeGreaterThanOrEqual(-15);
      expect(cpx).toBeLessThanOrEqual(15);
      expect(cpy).toBeGreaterThanOrEqual(-10);
      expect(cpy).toBeLessThanOrEqual(35);
      expect(ex).toBeGreaterThanOrEqual(-15);
      expect(ex).toBeLessThanOrEqual(15);
      expect(ey).toBeGreaterThanOrEqual(-10);
      expect(ey).toBeLessThanOrEqual(35);
    }
  });

  it('Kraken has pink sucker dots on tentacles', () => {
    const ctx = makeCtx();
    renderCharacter(ctx, { id: 'kraken', x: 100, y: 200 }, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#f472b6', ...) → rgb(244,114,182)
    const hasSuckerPink = strs.some((s) => s.includes('244,114,182'));
    expect(hasSuckerPink).toBe(true);
  });
});

// ── renderProp — visual correctness ──────────────────────────

describe('renderProp', () => {
  const propTypes: PropPlacement['kind'][] = [
    'island_silhouette', 'fog_wall', 'lightning', 'tentacle',
    'chart_fragment', 'golden_chart', 'wreckage', 'sunrise', 'cannon_flash',
  ];

  for (const kind of propTypes) {
    it(`renders "${kind}" without throwing`, () => {
      expect(() => renderProp(makeCtx(), { kind, x: 120, y: 200 }, 0)).not.toThrow();
    });

    it(`renders "${kind}" scaled at different time`, () => {
      expect(() => renderProp(makeCtx(), { kind, x: 50, y: 100, scale: 2 }, 3.5)).not.toThrow();
    });
  }

  it('saves and restores context (no leak)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'wreckage', x: 50, y: 50 }, 0);
    expect((ctx.save as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBe((ctx.restore as ReturnType<typeof vi.fn>).mock.calls.length);
  });

  // ── Specific prop visual checks ──

  it('island_silhouette has dark blue fill and sandy beach', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'island_silhouette', x: 100, y: 100 }, 0);
    expect(ctx.__styles.fillStyles).toContain('#1a2744'); // dark island
    expect(ctx.__styles.fillStyles).toContain('#d4a76a'); // beach sand
  });

  it('fog_wall draws 5 ellipses (one per fog patch)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'fog_wall', x: 100, y: 100 }, 0);
    expect((ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length).toBe(5);
  });

  it('fog_wall uses slate gray (rgb 100,116,139)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'fog_wall', x: 100, y: 100 }, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#64748b', ...) → rgba(100,116,139,...)
    const hasSlate = strs.some((s) => s.includes('100,116,139'));
    expect(hasSlate).toBe(true);
  });

  it('tentacle draws with pink (rgb 236,72,153)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'tentacle', x: 100, y: 100 }, 0);
    const strs = ctx.__styles.strokeStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#ec4899', ...) → rgba(236,72,153,...)
    const hasPink = strs.some((s) => s.includes('236,72,153'));
    expect(hasPink).toBe(true);
  });

  it('tentacle uses quadraticCurveTo for organic shape', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'tentacle', x: 100, y: 100 }, 0);
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });

  it('chart_fragment draws golden parchment (rgb 253,224,71)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'chart_fragment', x: 100, y: 100 }, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#fde047', glow) → rgba(253,224,71,...)
    const hasGold = strs.some((s) => s.includes('253,224,71'));
    expect(hasGold).toBe(true);
  });

  it('chart_fragment has map lines drawn via stroke', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'chart_fragment', x: 100, y: 100 }, 0);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('golden_chart uses radial gradient glow', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'golden_chart', x: 100, y: 100 }, 0);
    expect(ctx.createRadialGradient).toHaveBeenCalled();
  });

  it('golden_chart has red star marker (#ef4444)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'golden_chart', x: 100, y: 100 }, 0);
    expect(ctx.__styles.fillStyles).toContain('#ef4444');
  });

  it('wreckage has brown hull (#78350f) — Null ship debris', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'wreckage', x: 100, y: 100 }, 0);
    expect(ctx.__styles.fillStyles).toContain('#78350f');
  });

  it('wreckage has tattered red sail (Null\'s color)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'wreckage', x: 100, y: 100 }, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#ef4444', 0.5) → rgba(239,68,68,0.5)
    const hasRed = strs.some((s) => s.includes('239,68,68'));
    expect(hasRed).toBe(true);
  });

  it('wreckage has broken mast drawn in dark red (#4a1c1c)', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'wreckage', x: 100, y: 100 }, 0);
    expect(ctx.__styles.strokeStyles).toContain('#4a1c1c');
  });

  it('sunrise uses radial gradient glow', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'sunrise', x: 100, y: 100 }, 0);
    expect(ctx.createRadialGradient).toHaveBeenCalled();
  });

  it('sunrise draws sun disc via arc', () => {
    const ctx = makeCtx();
    renderProp(ctx, { kind: 'sunrise', x: 100, y: 100 }, 0);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('cannon_flash draws two circles (outer + inner glow)', () => {
    const ctx = makeCtx();
    // Use t value that triggers flash: sin(t*6) > 0.85
    // sin(6 * 0.257) = sin(1.542) ≈ 0.999 > 0.85
    renderProp(ctx, { kind: 'cannon_flash', x: 100, y: 100 }, 0.257);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });
});

// ── renderCaption — caption panel composition ────────────────

describe('renderCaption', () => {
  it('renders nothing when typewriter progress is 0', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello', 0, 0);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('renders partial text at mid-progress', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello captain', 5, 0);
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('renders full text when progress matches length', () => {
    const ctx = makeCtx();
    const text = 'Full reveal';
    renderCaption(ctx, text, text.length, 0);
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('draws dark panel background via fill', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello', 3, 0);
    expect(ctx.fill).toHaveBeenCalled();
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#0f172a', 0.88) → rgba(15,23,42,0.88)
    const hasDarkBg = strs.some((s) => s.includes('15,23,42'));
    expect(hasDarkBg).toBe(true);
  });

  it('panel border uses cyan accent color (colorCyan400)', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello', 3, 0);
    const strs = ctx.__styles.strokeStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#22d3ee', 0.3) → rgba(34,211,238,0.3)
    const hasCyan = strs.some((s) => s.includes('34,211,238'));
    expect(hasCyan).toBe(true);
  });

  it('text uses colorText (#e2e8f0) for readability', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello', 5, 0);
    expect(ctx.__styles.fillStyles).toContain('#e2e8f0');
  });

  it('text is center-aligned', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello', 5, 0);
    expect(ctx.textAlign).toBe('center');
  });

  it('text is drawn at GAME_WIDTH/2 = 120 (centered)', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello', 5, 0);
    const fillTextCalls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const centerCalls = fillTextCalls.filter((c: unknown[]) => c[1] === 120);
    expect(centerCalls.length).toBeGreaterThan(0);
  });

  it('wraps long text into multiple lines', () => {
    const ctx = makeCtx();
    (ctx.measureText as ReturnType<typeof vi.fn>).mockImplementation(
      (str: string) => ({ width: str.length * 7 }),
    );
    const longText = 'This is a really long line of text that should wrap onto multiple lines.';
    renderCaption(ctx, longText, longText.length, 0);
    expect((ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1);
  });

  it('draws blinking cursor when text not fully revealed', () => {
    const ctx = makeCtx();
    renderCaption(ctx, 'Hello', 3, Math.PI / 12);
    // Cursor drawn as fillRect with cyan color
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});

// ── renderTapPrompt — UX prompt ──────────────────────────────

describe('renderTapPrompt', () => {
  it('draws "tap to continue" text', () => {
    const ctx = makeCtx();
    renderTapPrompt(ctx, 0);
    const calls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const tapCall = calls.find((c: unknown[]) =>
      typeof c[0] === 'string' && (c[0] as string).includes('tap to continue'),
    );
    expect(tapCall).toBeDefined();
  });

  it('renders at horizontal center (x = 120)', () => {
    const ctx = makeCtx();
    renderTapPrompt(ctx, 0);
    const calls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0]?.[1]).toBe(120);
  });

  it('renders near bottom of screen (y = 386)', () => {
    const ctx = makeCtx();
    renderTapPrompt(ctx, 0);
    const calls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    // GAME_HEIGHT - 14 = 400 - 14 = 386
    expect(calls[0]?.[2]).toBe(386);
  });

  it('uses muted text color (#94a3b8)', () => {
    const ctx = makeCtx();
    renderTapPrompt(ctx, 0);
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    // rgba('#94a3b8', alpha) → rgba(148,163,184,...)
    const hasMuted = strs.some((s) => s.includes('148,163,184'));
    expect(hasMuted).toBe(true);
  });
});

// ── renderBeat — full composition layer ordering ─────────────

describe('renderBeat', () => {
  function makeBeat(overrides: Partial<CinematicBeat> = {}): CinematicBeat {
    return {
      id: 'test_beat',
      durationS: 2,
      sky: 'day',
      ...overrides,
    };
  }

  it('renders a minimal beat (sky only) without throwing', () => {
    expect(() => renderBeat(makeCtx(), makeBeat(), 0, 0, { x: 0, y: 0 })).not.toThrow();
  });

  it('renders beat with all layers enabled', () => {
    const ctx = makeCtx();
    const beat = makeBeat({
      sky: 'storm',
      characters: [
        { id: 'nemo', x: 100, y: 200 },
        { id: 'bit', x: 140, y: 170 },
      ],
      props: [
        { kind: 'island_silhouette', x: 60, y: 100 },
        { kind: 'fog_wall', x: 120, y: 80 },
      ],
      caption: 'Full test beat',
      tint: 'rgba(10,5,30,0.3)',
      shake: 0.5,
    });
    expect(() => renderBeat(ctx, beat, 1, 10, { x: 2, y: -1 })).not.toThrow();
  });

  it('applies camera shake offset via translate', () => {
    const ctx = makeCtx();
    renderBeat(ctx, makeBeat(), 0, 0, { x: 3, y: -2 });
    const calls = (ctx.translate as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.some((c: number[]) => c[0] === 3 && c[1] === -2)).toBe(true);
  });

  it('skips shake translate when offset is (0,0)', () => {
    const ctx = makeCtx();
    renderBeat(ctx, makeBeat({ characters: undefined, props: undefined }), 0, 0, { x: 0, y: 0 });
    const calls = (ctx.translate as ReturnType<typeof vi.fn>).mock.calls;
    const nonZero = calls.filter((c: number[]) => c[0] !== 0 || c[1] !== 0);
    expect(nonZero.length).toBe(0);
  });

  it('draws tint overlay when specified', () => {
    const ctx = makeCtx();
    const tint = 'rgba(255,0,0,0.5)';
    renderBeat(ctx, makeBeat({ tint }), 0, 0, { x: 0, y: 0 });
    expect(ctx.__styles.fillStyles).toContain(tint);
  });

  it('does NOT draw tint when not specified', () => {
    const ctx = makeCtx();
    const tint = 'rgba(10,5,30,0.3)';
    renderBeat(ctx, makeBeat({ tint: undefined }), 0, 0, { x: 0, y: 0 });
    const strs = ctx.__styles.fillStyles.filter((s): s is string => typeof s === 'string');
    expect(strs).not.toContain(tint);
  });

  it('skips character/prop layers when arrays are undefined', () => {
    const ctx = makeCtx();
    const beat = makeBeat({ characters: undefined, props: undefined });
    expect(() => renderBeat(ctx, beat, 0, 0, { x: 0, y: 0 })).not.toThrow();
  });

  it('renders caption text when present', () => {
    const ctx = makeCtx();
    renderBeat(ctx, makeBeat({ caption: 'Test caption' }), 0, 5, { x: 0, y: 0 });
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('does not render caption text when absent', () => {
    const ctx = makeCtx();
    renderBeat(ctx, makeBeat({ caption: undefined }), 0, 0, { x: 0, y: 0 });
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('save/restore are balanced (no context leak)', () => {
    const ctx = makeCtx();
    const beat = makeBeat({
      characters: [{ id: 'nemo', x: 50, y: 200 }, { id: 'kraken', x: 150, y: 100 }],
      props: [{ kind: 'tentacle', x: 80, y: 150 }, { kind: 'fog_wall', x: 120, y: 80 }],
      caption: 'Test',
    });
    renderBeat(ctx, beat, 1, 4, { x: 0, y: 0 });
    expect((ctx.save as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBe((ctx.restore as ReturnType<typeof vi.fn>).mock.calls.length);
  });

  for (const sky of ['dawn', 'day', 'dusk', 'night', 'storm', 'dark_sea'] as const) {
    it(`renders beat with ${sky} sky`, () => {
      expect(() => renderBeat(makeCtx(), makeBeat({ sky }), 0, 0, { x: 0, y: 0 })).not.toThrow();
    });
  }

  it('draws vignette after restoring shake transform (unshaken)', () => {
    const ctx = makeCtx();
    const callOrder: string[] = [];
    (ctx.restore as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('restore');
    });
    (ctx.createRadialGradient as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        callOrder.push('radialGradient');
        return { addColorStop: vi.fn() };
      },
    );

    renderBeat(ctx, makeBeat({ shake: 0.5 }), 0, 0, { x: 1, y: 1 });

    // drawVignette calls createRadialGradient. It should occur AFTER ctx.restore.
    const lastRestore = callOrder.lastIndexOf('restore');
    const vignetteIdx = callOrder.lastIndexOf('radialGradient');
    expect(vignetteIdx).toBeGreaterThan(-1);
    expect(lastRestore).toBeGreaterThan(-1);
    // The vignette's radial gradient is the very last one, after the final restore
    expect(vignetteIdx).toBeGreaterThan(callOrder.indexOf('restore'));
  });
});
