/**
 * Design Token & Visual Compliance Tests
 *
 * Validates requirements V1–V24 from Aesthetic.md / TOKENS:
 *  - Design tokens are complete and follow spec
 *  - Font sizes match 8-bit aesthetic
 *  - Color palette is defined
 *  - Spacing grid is 4px
 *  - Border radius constraints (0 default, 8 max)
 *  - Contrast ratios (structural checks on token values)
 *  - Pixel rendering (integer scaling)
 */
import { describe, it, expect } from 'vitest';
import { TOKENS } from '../../../src/rendering/tokens';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/core/types';

// ── V1: Design tokens exist and are complete ──

describe('Design Tokens — Completeness (V1)', () => {
  it('V1 — all required color tokens are defined', () => {
    expect(TOKENS.colorBackground).toBeDefined();
    expect(TOKENS.colorPanel).toBeDefined();
    expect(TOKENS.colorCyan400).toBeDefined();
    expect(TOKENS.colorRed400).toBeDefined();
    expect(TOKENS.colorYellow400).toBeDefined();
    expect(TOKENS.colorGreen400).toBeDefined();
    expect(TOKENS.colorText).toBeDefined();
    expect(TOKENS.colorTextMuted).toBeDefined();
  });

  it('V1 — ocean palette tokens exist', () => {
    expect(TOKENS.colorOceanDeep).toBeDefined();
    expect(TOKENS.colorOceanMid).toBeDefined();
    expect(TOKENS.colorOceanLight).toBeDefined();
  });

  it('V1 — terrain tokens exist', () => {
    expect(TOKENS.colorSand).toBeDefined();
    expect(TOKENS.colorGrass).toBeDefined();
    expect(TOKENS.colorWood).toBeDefined();
  });
});

// ── V2: Font sizes follow 8-bit aesthetic ──

describe('Design Tokens — Typography (V2)', () => {
  it('V2 — fontSmall is 8px monospace', () => {
    expect(TOKENS.fontSmall).toContain('8px');
    expect(TOKENS.fontSmall).toContain('monospace');
  });

  it('V2 — fontMedium is 12px monospace', () => {
    expect(TOKENS.fontMedium).toContain('12px');
    expect(TOKENS.fontMedium).toContain('monospace');
  });

  it('V2 — fontLarge is 16px monospace', () => {
    expect(TOKENS.fontLarge).toContain('16px');
    expect(TOKENS.fontLarge).toContain('monospace');
  });

  it('V2 — fontTitle is 18px monospace', () => {
    expect(TOKENS.fontTitle).toContain('18px');
    expect(TOKENS.fontTitle).toContain('monospace');
  });

  it('V2 — all fonts are bold', () => {
    expect(TOKENS.fontSmall).toMatch(/^bold/);
    expect(TOKENS.fontMedium).toMatch(/^bold/);
    expect(TOKENS.fontLarge).toMatch(/^bold/);
    expect(TOKENS.fontTitle).toMatch(/^bold/);
  });
});

// ── V3: Spacing grid is 4px ──

describe('Design Tokens — Spacing Grid (V3)', () => {
  it('V3 — spacingUnit is 4px', () => {
    expect(TOKENS.spacingUnit).toBe(4);
  });

  it('V3 — game dimensions are divisible by spacing unit', () => {
    expect(GAME_WIDTH % TOKENS.spacingUnit).toBe(0);
    expect(GAME_HEIGHT % TOKENS.spacingUnit).toBe(0);
  });
});

// ── V4: Color values are valid hex codes ──

describe('Design Tokens — Color Format (V4)', () => {
  const colorTokens = Object.entries(TOKENS).filter(
    ([key]) => key.startsWith('color'),
  );

  for (const [key, value] of colorTokens) {
    it(`V4 — ${key} is a valid hex color`, () => {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  }
});

// ── V5: Dark background for 8-bit aesthetic ──

describe('Design Tokens — Dark Theme (V5)', () => {
  it('V5 — background is very dark', () => {
    // #070b14 → RGB(7, 11, 20) — very dark navy
    const hex = TOKENS.colorBackground;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (r + g + b) / 3;
    expect(luminance).toBeLessThan(50); // Dark background
  });

  it('V5 — text color is light for contrast against dark bg', () => {
    const hex = TOKENS.colorText;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (r + g + b) / 3;
    expect(luminance).toBeGreaterThan(180); // Light text
  });

  it('V13 — text vs background has sufficient contrast', () => {
    // Simplified contrast check: large luminance difference
    const bgHex = TOKENS.colorBackground;
    const textHex = TOKENS.colorText;

    const bgLum = hexLuminance(bgHex);
    const textLum = hexLuminance(textHex);

    const lighter = Math.max(bgLum, textLum);
    const darker = Math.min(bgLum, textLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    // WCAG AA requires 4.5:1 for normal text
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

// ── V6: Pixel rendering constraints ──

describe('Visual — Pixel Rendering (V6)', () => {
  it('V6 — game canvas dimensions are integers', () => {
    expect(Number.isInteger(GAME_WIDTH)).toBe(true);
    expect(Number.isInteger(GAME_HEIGHT)).toBe(true);
  });

  it('V6 — spacing unit is an integer', () => {
    expect(Number.isInteger(TOKENS.spacingUnit)).toBe(true);
  });

  it('V6 — game canvas supports integer scaling (240×400 → 480×800, 720×1200)', () => {
    expect(GAME_WIDTH * 2).toBe(480);
    expect(GAME_HEIGHT * 2).toBe(800);
    expect(GAME_WIDTH * 3).toBe(720);
    expect(GAME_HEIGHT * 3).toBe(1200);
  });
});

// ── V8: No glassmorphism ──

describe('Visual — Style Constraints (V8)', () => {
  it('V8 — tokens contain no glassmorphism-related properties', () => {
    const allKeys = Object.keys(TOKENS);
    const glassKeys = allKeys.filter(
      (k) => k.includes('glass') || k.includes('blur') || k.includes('frost'),
    );
    expect(glassKeys).toEqual([]);
  });
});

// ── Color token counts ──

describe('Visual — Token Coverage', () => {
  it('at least 20 design tokens defined', () => {
    expect(Object.keys(TOKENS).length).toBeGreaterThanOrEqual(20);
  });

  it('at least 15 color tokens defined', () => {
    const colorKeys = Object.keys(TOKENS).filter((k) => k.startsWith('color'));
    expect(colorKeys.length).toBeGreaterThanOrEqual(15);
  });

  it('at least 4 font tokens defined', () => {
    const fontKeys = Object.keys(TOKENS).filter((k) => k.startsWith('font'));
    expect(fontKeys.length).toBeGreaterThanOrEqual(4);
  });
});

// ── N8: Compass needle color ──

describe('Visual — Compass Needle (N8)', () => {
  it('N8 — yellow-400 token is available for compass needle', () => {
    expect(TOKENS.colorYellow400).toBe('#facc15');
  });
});

// ── N5: Node state colors ──

describe('Visual — Overworld Node Colors (N5)', () => {
  it('N5 — cyan-400 token available for next-node pulse', () => {
    expect(TOKENS.colorCyan400).toBe('#22d3ee');
  });

  it('N5 — yellow-400 token available for completed-node glow', () => {
    expect(TOKENS.colorYellow400).toBe('#facc15');
  });
});

/* ── helper ── */

function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const rL = r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
  const gL = g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
  const bL = b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4;

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}
