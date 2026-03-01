import { describe, it, expect, vi } from 'vitest';
import { renderWeatherBackground, renderWeatherForeground } from '../../../src/rendering/weather';
import { createWeatherState, updateWeatherSystem, type WeatherState } from '../../../src/systems/weather-system';

// ── Canvas mock ──────────────────────────────────────────────

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
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

function tickedState(encounterType: 'fog' | 'storm' | 'battle' | 'ruins' | 'squid', ticks = 50): WeatherState {
  const state = createWeatherState(encounterType);
  for (let i = 0; i < ticks; i++) {
    updateWeatherSystem(state, 0.1, encounterType);
  }
  return state;
}

// ── renderWeatherBackground ──────────────────────────────────

describe('Weather Renderer — renderWeatherBackground', () => {
  it('renders without throwing for each encounter type', () => {
    const types: ('fog' | 'storm' | 'battle' | 'ruins' | 'squid')[] = ['fog', 'storm', 'battle', 'ruins', 'squid'];
    for (const type of types) {
      const state = tickedState(type);
      expect(() => renderWeatherBackground(makeCtx(), state, 240, 400)).not.toThrow();
    }
  });

  it('draws darken overlay when darkenOverlay > 0', () => {
    const state = tickedState('storm');
    const ctx = makeCtx();
    renderWeatherBackground(ctx, state, 240, 400);
    // If storm, darkenOverlay is > 0, so fillRect should be called for the overlay
    if (state.darkenOverlay > 0.01) {
      expect(ctx.fillRect).toHaveBeenCalled();
    }
  });

  it('draws fog blobs when fogOpacity > 0', () => {
    const state = tickedState('fog');
    const ctx = makeCtx();
    renderWeatherBackground(ctx, state, 240, 400);
    // Fog particles should produce ellipse calls
    const fogParticles = state.particles.filter((p) => p.kind === 'fog');
    if (fogParticles.length > 0 && state.fogOpacity > 0.01) {
      expect(ctx.ellipse).toHaveBeenCalled();
    }
  });

  it('draws lightning flash when active', () => {
    // Force a lightning state
    const state = createWeatherState('storm');
    state.lightning = {
      x: 120,
      segments: [{ x1: 120, y1: 0, x2: 125, y2: 30 }],
      flash: 0.8,
    };
    const ctx = makeCtx();
    renderWeatherBackground(ctx, state, 240, 400);
    expect(ctx.fillRect).toHaveBeenCalled(); // flash overlay
  });
});

// ── renderWeatherForeground ──────────────────────────────────

describe('Weather Renderer — renderWeatherForeground', () => {
  it('renders without throwing for each encounter type', () => {
    const types: ('fog' | 'storm' | 'battle' | 'ruins' | 'squid')[] = ['fog', 'storm', 'battle', 'ruins', 'squid'];
    for (const type of types) {
      const state = tickedState(type, 40);
      expect(() => renderWeatherForeground(makeCtx(), state, 240, 400)).not.toThrow();
    }
  });

  it('draws raindrop strokes for rain particles', () => {
    const state = tickedState('ruins', 60);
    const ctx = makeCtx();
    renderWeatherForeground(ctx, state, 240, 400);
    const drops = state.particles.filter((p) => p.kind === 'drop');
    if (drops.length > 0) {
      expect(ctx.stroke).toHaveBeenCalled();
    }
  });

  it('draws glow orbs with arc calls', () => {
    // Force glow particles
    const state = createWeatherState('battle');
    state.kind = 'glow';
    state.particles.push({
      x: 100, y: 200, vx: 0, vy: -5, life: 2,
      size: 3, kind: 'orb', alpha: 0.3,
    });
    const ctx = makeCtx();
    renderWeatherForeground(ctx, state, 240, 400);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('draws ash particles with ellipse', () => {
    const state = tickedState('squid', 40);
    const ctx = makeCtx();
    renderWeatherForeground(ctx, state, 240, 400);
    const ashParticles = state.particles.filter((p) => p.kind === 'ash');
    if (ashParticles.length > 0) {
      expect(ctx.ellipse).toHaveBeenCalled();
    }
  });

  it('draws lightning bolt segments when active', () => {
    const state = createWeatherState('storm');
    state.lightning = {
      x: 100,
      segments: [
        { x1: 100, y1: 0, x2: 105, y2: 20 },
        { x1: 105, y1: 20, x2: 98, y2: 40 },
      ],
      flash: 0.5,
    };
    const ctx = makeCtx();
    renderWeatherForeground(ctx, state, 240, 400);
    // Should draw bolt segments (moveTo + lineTo pairs)
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('handles empty particle array gracefully', () => {
    const state = createWeatherState('battle');
    expect(() => renderWeatherForeground(makeCtx(), state, 240, 400)).not.toThrow();
  });
});

// ── Edge cases ───────────────────────────────────────────────

describe('Weather Renderer — edge cases', () => {
  it('handles zero-size canvas without error', () => {
    const state = tickedState('storm', 20);
    expect(() => renderWeatherBackground(makeCtx(), state, 0, 0)).not.toThrow();
    expect(() => renderWeatherForeground(makeCtx(), state, 0, 0)).not.toThrow();
  });

  it('handles no lightning gracefully', () => {
    const state = createWeatherState('fog');
    state.lightning = null;
    expect(() => renderWeatherBackground(makeCtx(), state, 240, 400)).not.toThrow();
    expect(() => renderWeatherForeground(makeCtx(), state, 240, 400)).not.toThrow();
  });

  it('renders ripple particles without throwing', () => {
    const state = createWeatherState('ruins');
    state.particles.push({
      x: 50, y: 380, vx: 0, vy: 0, life: 0.2,
      size: 3, kind: 'ripple', alpha: 0.3,
    });
    expect(() => renderWeatherForeground(makeCtx(), state, 240, 400)).not.toThrow();
  });
});
