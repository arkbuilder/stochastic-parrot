/**
 * Campaign Select Scene — Unit Tests
 *
 * Tests the campaign selection screen that sits between main menu and gameplay:
 * - buildCampaignList() pure function
 * - computeCardRects() layout logic
 * - CampaignSelectScene interaction (navigation, activation, back)
 * - DLC registration affects available campaigns
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CampaignSelectScene,
  buildCampaignList,
  computeCardRects,
} from '../../../src/scenes/campaign-select-scene';
import { registerDlcPack, clearDlcRegistry } from '../../../src/dlc/dlc-registry';
import { ROCKET_SCIENCE_PACK } from '../../../src/dlc/packs/rocket-science-pack';
import { CYBERSECURITY_PACK } from '../../../src/dlc/packs/cybersecurity-pack';
import type { InputAction } from '../../../src/input/types';

// ── Helpers ──────────────────────────────────────────────────

function makeCtx(): CanvasRenderingContext2D {
  return {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    arcTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    measureText: vi.fn(() => ({ width: 30 })),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

const TAP = (x: number, y: number): InputAction => ({ type: 'primary', x, y });
const KEYBOARD_ENTER: InputAction = { type: 'primary', x: NaN, y: NaN };
const MOVE_DOWN: InputAction = { type: 'move', dx: 0, dy: 1 };
const MOVE_UP: InputAction = { type: 'move', dx: 0, dy: -1 };
const SECONDARY: InputAction = { type: 'secondary', x: 0, y: 0 };

function createScene() {
  const onCampaignSelect = vi.fn();
  const onBack = vi.fn();
  const scene = new CampaignSelectScene({ onCampaignSelect, onBack });
  scene.enter({ now: () => 0 });
  return { scene, onCampaignSelect, onBack };
}

beforeEach(() => {
  clearDlcRegistry();
});

// ═══════════════════════════════════════════════════════════════
// SECTION 1: buildCampaignList — pure function
// ═══════════════════════════════════════════════════════════════

describe('buildCampaignList — campaign generation', () => {
  it('always includes base campaign first', () => {
    const campaigns = buildCampaignList();
    expect(campaigns.length).toBeGreaterThanOrEqual(1);
    expect(campaigns[0]!.id).toBe('base');
    expect(campaigns[0]!.title).toBe('Memory Sea');
  });

  it('base campaign has 5 islands and 15 concepts', () => {
    const campaigns = buildCampaignList();
    expect(campaigns[0]!.islandCount).toBe(5);
    expect(campaigns[0]!.conceptCount).toBe(15);
  });

  it('includes Rocket Science DLC when registered', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const campaigns = buildCampaignList();
    expect(campaigns.length).toBe(2);
    expect(campaigns[1]!.id).toBe('rocket-science');
    expect(campaigns[1]!.title).toBe('Starboard Launch');
  });

  it('includes both DLCs when both registered', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    registerDlcPack(CYBERSECURITY_PACK);
    const campaigns = buildCampaignList();
    expect(campaigns.length).toBe(3);
    const ids = campaigns.map((c) => c.id);
    expect(ids).toContain('base');
    expect(ids).toContain('rocket-science');
    expect(ids).toContain('cybersecurity');
  });

  it('DLC campaigns have correct metadata', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const campaigns = buildCampaignList();
    const rocket = campaigns.find((c) => c.id === 'rocket-science')!;
    expect(rocket.islandCount).toBe(5);
    expect(rocket.conceptCount).toBe(15);
    expect(rocket.subtitle).toBe(ROCKET_SCIENCE_PACK.manifest.description);
  });

  it('every campaign has a non-empty color', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    registerDlcPack(CYBERSECURITY_PACK);
    const campaigns = buildCampaignList();
    for (const c of campaigns) {
      expect(c.color.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 2: computeCardRects — layout
// ═══════════════════════════════════════════════════════════════

describe('computeCardRects — layout', () => {
  it('returns one rect per campaign', () => {
    const rects = computeCardRects(3);
    expect(rects.length).toBe(3);
  });

  it('rects are vertically stacked (each y > previous y)', () => {
    const rects = computeCardRects(3);
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i]!.y).toBeGreaterThan(rects[i - 1]!.y);
    }
  });

  it('no rects overlap vertically', () => {
    const rects = computeCardRects(3);
    for (let i = 1; i < rects.length; i++) {
      const prevBottom = rects[i - 1]!.y + rects[i - 1]!.h;
      expect(rects[i]!.y).toBeGreaterThanOrEqual(prevBottom);
    }
  });

  it('all rects within game canvas (240×400)', () => {
    const rects = computeCardRects(3);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(240);
      expect(r.y + r.h).toBeLessThanOrEqual(400);
    }
  });

  it('all rects have consistent width and height', () => {
    const rects = computeCardRects(3);
    const widths = new Set(rects.map((r) => r.w));
    const heights = new Set(rects.map((r) => r.h));
    expect(widths.size).toBe(1);
    expect(heights.size).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 3: CampaignSelectScene — lifecycle
// ═══════════════════════════════════════════════════════════════

describe('CampaignSelectScene — lifecycle', () => {
  it('can be constructed and entered without error', () => {
    const { scene } = createScene();
    expect(scene).toBeDefined();
  });

  it('renders without throwing', () => {
    const { scene } = createScene();
    scene.update(0.016, []);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('renders with DLC packs registered', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    registerDlcPack(CYBERSECURITY_PACK);
    const { scene } = createScene();
    scene.update(0.016, []);
    expect(() => scene.render(makeCtx())).not.toThrow();
  });

  it('exit does not throw', () => {
    const { scene } = createScene();
    expect(() => scene.exit()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 4: CampaignSelectScene — interaction
// ═══════════════════════════════════════════════════════════════

describe('CampaignSelectScene — interaction', () => {
  it('pressing Enter selects base campaign by default', () => {
    const { scene, onCampaignSelect } = createScene();
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(onCampaignSelect).toHaveBeenCalledWith('base');
  });

  it('pressing secondary (Escape) calls onBack', () => {
    const { scene, onBack } = createScene();
    scene.update(0.016, [SECONDARY]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('tapping BACK button calls onBack', () => {
    const { scene, onBack } = createScene();
    scene.update(0.016, [TAP(30, 20)]); // BACK button area
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('arrow down + Enter selects second campaign (DLC)', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene, onCampaignSelect } = createScene();
    scene.update(0.016, [MOVE_DOWN]);
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(onCampaignSelect).toHaveBeenCalledWith('rocket-science');
  });

  it('arrow up from first wraps to last', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene, onCampaignSelect } = createScene();
    scene.update(0.016, [MOVE_UP]);
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(onCampaignSelect).toHaveBeenCalledWith('rocket-science');
  });

  it('tapping a campaign card selects that campaign', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene, onCampaignSelect } = createScene();
    // Second card: x=16, y=94+68+8=170, w=208, h=68 → tap center (120, 204)
    scene.update(0.016, [TAP(120, 204)]);
    expect(onCampaignSelect).toHaveBeenCalledWith('rocket-science');
  });

  it('tapping outside cards and buttons does nothing', () => {
    const { scene, onCampaignSelect, onBack } = createScene();
    scene.update(0.016, [TAP(0, 0)]);
    expect(onCampaignSelect).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 5: Rendering content
// ═══════════════════════════════════════════════════════════════

describe('CampaignSelectScene — rendered content', () => {
  it('renders CHOOSE YOUR VOYAGE header', () => {
    const { scene } = createScene();
    scene.update(0.016, []);
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('CHOOSE YOUR VOYAGE');
  });

  it('renders base campaign title', () => {
    const { scene } = createScene();
    scene.update(0.016, []);
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('Memory Sea');
  });

  it('renders DLC campaign title when registered', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    scene.update(0.016, []);
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('Starboard Launch');
  });

  it('renders island and concept counts', () => {
    const { scene } = createScene();
    scene.update(0.016, []);
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('5 islands · 15 concepts');
  });
});
