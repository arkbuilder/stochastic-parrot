import { describe, it, expect } from 'vitest';
import {
  createWeatherState,
  updateWeatherSystem,
  type WeatherState,
  type WeatherKind,
  type EncounterWeatherType,
} from '../../../src/systems/weather-system';

// ── Factory helpers ──────────────────────────────────────────

function tickWeather(encounterType: EncounterWeatherType, dt: number, ticks = 1): WeatherState {
  const state = createWeatherState(encounterType);
  for (let i = 0; i < ticks; i++) {
    updateWeatherSystem(state, dt, encounterType);
  }
  return state;
}

// ── Creation ─────────────────────────────────────────────────

describe('Weather System — createWeatherState', () => {
  const encounterTypes: EncounterWeatherType[] = ['fog', 'storm', 'battle', 'ruins', 'squid'];

  it('creates a valid state for each encounter type', () => {
    for (const enc of encounterTypes) {
      const state = createWeatherState(enc);
      expect(state.kind).toBeTruthy();
      expect(state.intensity).toBeGreaterThan(0);
      expect(state.intensity).toBeLessThanOrEqual(1);
      expect(state.particles).toEqual([]);
      expect(state.elapsed).toBe(0);
    }
  });

  it('fog encounter starts with fog weather (fog rendering disabled)', () => {
    const state = createWeatherState('fog');
    expect(state.kind).toBe('fog');
    // Fog rendering is disabled — fogOpacity forced to 0
    expect(state.fogOpacity).toBe(0);
  });

  it('storm encounter starts with storm weather', () => {
    const state = createWeatherState('storm');
    expect(state.kind).toBe('storm');
    expect(state.darkenOverlay).toBeGreaterThan(0);
  });

  it('battle encounter starts with clear weather', () => {
    const state = createWeatherState('battle');
    expect(state.kind).toBe('clear');
  });

  it('ruins encounter starts with rain weather', () => {
    const state = createWeatherState('ruins');
    expect(state.kind).toBe('rain');
  });

  it('squid encounter starts with ash weather', () => {
    const state = createWeatherState('squid');
    expect(state.kind).toBe('ash');
  });
});

// ── Update loop ──────────────────────────────────────────────

describe('Weather System — updateWeatherSystem', () => {
  it('advances elapsed time', () => {
    const state = createWeatherState('fog');
    updateWeatherSystem(state, 0.5, 'fog');
    expect(state.elapsed).toBeCloseTo(0.5, 4);
  });

  it('spawns particles over time', () => {
    const state = tickWeather('storm', 0.1, 20);
    expect(state.particles.length).toBeGreaterThan(0);
  });

  it('rain produces drop particles', () => {
    const state = tickWeather('ruins', 0.05, 60);
    const drops = state.particles.filter((p) => p.kind === 'drop' || p.kind === 'ripple');
    expect(drops.length).toBeGreaterThan(0);
  });

  it('fog particles are no longer spawned (fog disabled)', () => {
    const state = tickWeather('fog', 0.1, 40);
    const fogParticles = state.particles.filter((p) => p.kind === 'fog');
    expect(fogParticles.length).toBe(0);
  });

  it('ash produces ash particles', () => {
    const state = tickWeather('squid', 0.1, 20);
    const ashParticles = state.particles.filter((p) => p.kind === 'ash');
    expect(ashParticles.length).toBeGreaterThan(0);
  });

  it('clear produces mote particles', () => {
    const state = tickWeather('battle', 0.1, 60);
    const motes = state.particles.filter((p) => p.kind === 'mote');
    expect(motes.length).toBeGreaterThan(0);
  });

  it('does not exceed MAX_PARTICLES (120)', () => {
    const state = tickWeather('storm', 0.1, 200);
    expect(state.particles.length).toBeLessThanOrEqual(120);
  });

  it('wind oscillates over time', () => {
    const state = createWeatherState('storm');
    const winds: number[] = [];
    for (let i = 0; i < 50; i++) {
      updateWeatherSystem(state, 0.2, 'storm');
      winds.push(state.windX);
    }
    // Wind should vary — not all the same value
    const unique = new Set(winds.map((w) => w.toFixed(3)));
    expect(unique.size).toBeGreaterThan(1);
  });

  it('removes dead particles (life <= 0)', () => {
    const state = createWeatherState('fog');
    // Manually add a dying particle
    state.particles.push({
      x: 100, y: 100, vx: 0, vy: 0, life: 0.01,
      size: 10, kind: 'fog', alpha: 0.1,
    });
    updateWeatherSystem(state, 0.5, 'fog');
    const stillAlive = state.particles.filter((p) => p.life <= 0);
    expect(stillAlive.length).toBe(0);
  });

  it('removes off-screen particles', () => {
    const state = createWeatherState('fog');
    state.particles.push({
      x: 300, y: 100, vx: 50, vy: 0, life: 5,
      size: 1, kind: 'drop', alpha: 0.5,
    });
    updateWeatherSystem(state, 0.5, 'fog');
    const offscreen = state.particles.filter((p) => p.x > 260);
    expect(offscreen.length).toBe(0);
  });
});

// ── Lightning ────────────────────────────────────────────────

describe('Weather System — lightning', () => {
  it('storm weather can produce lightning', () => {
    // Run many ticks to give RNG a chance (stochastic — needs generous attempts)
    let sawLightning = false;
    for (let attempt = 0; attempt < 80 && !sawLightning; attempt++) {
      const state = tickWeather('storm', 0.1, 100);
      if (state.lightning) sawLightning = true;
    }
    expect(sawLightning).toBe(true);
  });

  it('lightning has segments and a flash value', () => {
    // Brute-force find one
    let bolt = null;
    for (let attempt = 0; attempt < 50 && !bolt; attempt++) {
      const state = tickWeather('storm', 0.1, 80);
      bolt = state.lightning;
    }
    if (bolt) {
      expect(bolt.segments.length).toBeGreaterThan(0);
      expect(bolt.flash).toBeGreaterThanOrEqual(0);
      expect(bolt.x).toBeGreaterThanOrEqual(0);
    }
  });

  it('non-storm weather has no lightning', () => {
    const state = tickWeather('fog', 0.1, 100);
    expect(state.lightning).toBeNull();
  });
});

// ── Weather transitions ──────────────────────────────────────

describe('Weather System — transitions', () => {
  it('weather kind can shift from primary (stochastic)', () => {
    // Over many ticks, the weather should occasionally shift
    const kinds = new Set<WeatherKind>();
    for (let attempt = 0; attempt < 10; attempt++) {
      const state = createWeatherState('fog');
      for (let i = 0; i < 200; i++) {
        updateWeatherSystem(state, 0.1, 'fog');
        kinds.add(state.kind);
      }
    }
    // Should see at least the primary kind
    expect(kinds.has('fog')).toBe(true);
    // Given enough iterations, at least one transition likely occurred
    // (not strictly guaranteed, but 2000 ticks × 0.04 chance = ~80 expected)
    expect(kinds.size).toBeGreaterThan(1);
  });

  it('weather drifts back to primary kind', () => {
    const state = createWeatherState('storm');
    // Force a shift away
    state.kind = 'clear';
    // Run many ticks — should drift back
    let driftedBack = false;
    for (let i = 0; i < 500; i++) {
      updateWeatherSystem(state, 0.1, 'storm');
      if (state.kind === 'storm') { driftedBack = true; break; }
    }
    expect(driftedBack).toBe(true);
  });
});

// ── Fog and darken values ────────────────────────────────────

describe('Weather System — fog and darkness', () => {
  it('fog weather has zero fogOpacity (fog disabled)', () => {
    const state = tickWeather('fog', 0.1, 10);
    expect(state.fogOpacity).toBe(0);
  });

  it('storm weather has positive darkenOverlay', () => {
    const state = tickWeather('storm', 0.1, 5);
    expect(state.darkenOverlay).toBeGreaterThan(0);
  });

  it('clear weather has zero darkenOverlay', () => {
    const state = createWeatherState('battle');
    // Keep it clear
    updateWeatherSystem(state, 0.01, 'battle');
    if (state.kind === 'clear') {
      expect(state.darkenOverlay).toBe(0);
    }
  });
});

// ── Particle structure ───────────────────────────────────────

describe('Weather System — particle structure', () => {
  it('every particle has required fields', () => {
    const state = tickWeather('ruins', 0.05, 60);
    for (const p of state.particles) {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
      expect(typeof p.vx).toBe('number');
      expect(typeof p.vy).toBe('number');
      expect(p.life).toBeGreaterThan(0);
      expect(p.size).toBeGreaterThan(0);
      expect(typeof p.kind).toBe('string');
      expect(p.alpha).toBeGreaterThanOrEqual(0);
    }
  });

  it('particle kinds are valid', () => {
    const validKinds = ['drop', 'mote', 'fog', 'ash', 'orb', 'ripple', 'splash'];
    for (const enc of ['fog', 'storm', 'battle', 'ruins', 'squid'] as EncounterWeatherType[]) {
      const state = tickWeather(enc, 0.1, 30);
      for (const p of state.particles) {
        expect(validKinds, `Unexpected kind "${p.kind}" in ${enc}`).toContain(p.kind);
      }
    }
  });
});
