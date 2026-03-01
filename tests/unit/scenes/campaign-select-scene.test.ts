/**
 * Campaign Select Scene — Unit Tests (Carousel Layout)
 *
 * Tests the campaign selection carousel between main menu and gameplay:
 * - buildCampaignList() pure function
 * - computeDotPositions() layout logic
 * - CampaignSelectScene interaction (carousel navigation, activation, back)
 * - DLC registration affects available campaigns
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CampaignSelectScene,
  buildCampaignList,
  computeDotPositions,
  CARD_RECT,
  ARROW_LEFT_RECT,
  ARROW_RIGHT_RECT,
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
const MOVE_RIGHT: InputAction = { type: 'move', dx: 1, dy: 0 };
const MOVE_LEFT: InputAction = { type: 'move', dx: -1, dy: 0 };
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
// SECTION 2: computeDotPositions — layout
// ═══════════════════════════════════════════════════════════════

describe('computeDotPositions — carousel dots', () => {
  it('returns one x-position per campaign', () => {
    const dots = computeDotPositions(3);
    expect(dots.length).toBe(3);
  });

  it('dots are horizontally spaced (each x > previous x)', () => {
    const dots = computeDotPositions(4);
    for (let i = 1; i < dots.length; i++) {
      expect(dots[i]!).toBeGreaterThan(dots[i - 1]!);
    }
  });

  it('dots are centred within game width (240)', () => {
    const dots = computeDotPositions(3);
    const first = dots[0]!;
    const last = dots[dots.length - 1]!;
    const centre = (first + last) / 2;
    expect(centre).toBeCloseTo(120, 0);
  });

  it('card rect is within game canvas (240×400)', () => {
    expect(CARD_RECT.x).toBeGreaterThanOrEqual(0);
    expect(CARD_RECT.y).toBeGreaterThanOrEqual(0);
    expect(CARD_RECT.x + CARD_RECT.w).toBeLessThanOrEqual(240);
    expect(CARD_RECT.y + CARD_RECT.h).toBeLessThanOrEqual(400);
  });

  it('arrow regions do not overlap the card', () => {
    const cardRight = CARD_RECT.x + CARD_RECT.w;
    const arrowLeftRight = ARROW_LEFT_RECT.x + ARROW_LEFT_RECT.w;
    expect(arrowLeftRight).toBeLessThanOrEqual(CARD_RECT.x);
    expect(ARROW_RIGHT_RECT.x).toBeGreaterThanOrEqual(cardRight);
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
// SECTION 4: CampaignSelectScene — interaction (carousel)
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

  it('arrow right + Enter selects second campaign (DLC)', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene, onCampaignSelect } = createScene();
    scene.update(0.016, [MOVE_RIGHT]);
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(onCampaignSelect).toHaveBeenCalledWith('rocket-science');
  });

  it('arrow left from first wraps to last', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene, onCampaignSelect } = createScene();
    scene.update(0.016, [MOVE_LEFT]);
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(onCampaignSelect).toHaveBeenCalledWith('rocket-science');
  });

  it('tapping the card rect activates the current campaign', () => {
    const { scene, onCampaignSelect } = createScene();
    // Center of CARD_RECT (x=28, y=100, w=184, h=200) → (120, 200)
    scene.update(0.016, [TAP(120, 200)]);
    expect(onCampaignSelect).toHaveBeenCalledWith('base');
  });

  it('tapping right arrow advances carousel', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene, onCampaignSelect } = createScene();
    // ARROW_RIGHT_RECT (x=212, y=160, w=28, h=80) → center (226, 200)
    scene.update(0.016, [TAP(226, 200)]);
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(onCampaignSelect).toHaveBeenCalledWith('rocket-science');
  });

  it('tapping left arrow moves carousel back', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene, onCampaignSelect } = createScene();
    // ARROW_LEFT_RECT (x=0, y=160, w=28, h=80) → center (14, 200)
    scene.update(0.016, [TAP(14, 200)]);
    // Wraps from index 0 to index 1 (last)
    scene.update(0.016, [KEYBOARD_ENTER]);
    expect(onCampaignSelect).toHaveBeenCalledWith('rocket-science');
  });

  it('tapping outside card and arrows does nothing', () => {
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

  it('renders DLC campaign title when navigated to', () => {
    registerDlcPack(ROCKET_SCIENCE_PACK);
    const { scene } = createScene();
    scene.update(0.016, [MOVE_RIGHT]); // Navigate to DLC card
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
    expect(texts).toContain('5 islands');
    expect(texts).toContain('15 concepts');
  });

  it('renders SET SAIL prompt on card', () => {
    const { scene } = createScene();
    scene.update(0.016, []);
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts.some((t: string) => typeof t === 'string' && t.includes('SET SAIL'))).toBe(true);
  });

  it('renders navigation hint with left/right arrows', () => {
    const { scene } = createScene();
    scene.update(0.016, []);
    const ctx = makeCtx();
    scene.render(ctx);
    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(texts.some((t: string) => typeof t === 'string' && t.includes('browse'))).toBe(true);
  });
});
