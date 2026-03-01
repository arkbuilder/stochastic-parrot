/**
 * Weather System — manages dynamic weather state per island.
 *
 * Weather is driven by the island's encounter type but transitions
 * dynamically over time for surprise-and-delight moments.
 * The system produces a WeatherState that rendering consumes.
 *
 * Layering: systems/ → may import from data/, utils/, rendering/tokens only.
 */

// ── Weather types ───────────────────────────────────────────

export type WeatherKind =
  | 'clear'     // sunny, drifting light motes
  | 'drizzle'   // gentle rain, slight haze
  | 'rain'      // heavier rain, puddle ripples
  | 'storm'     // driving rain, lightning, dark overlay
  | 'fog'       // rolling fog banks, reduced visibility
  | 'ash'       // volcanic ash particles
  | 'glow';     // mystical floating light orbs

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 0..1, dies at 0
  size: number;
  kind: 'drop' | 'mote' | 'fog' | 'ash' | 'orb' | 'ripple' | 'splash';
  alpha: number;
}

export interface LightningBolt {
  x: number;
  segments: { x1: number; y1: number; x2: number; y2: number }[];
  flash: number;    // brightness 1→0
}

export interface WeatherState {
  kind: WeatherKind;
  intensity: number;         // 0..1 — drives particle density, darkness overlay, etc.
  windX: number;             // horizontal wind bias (-1 left .. +1 right)
  particles: WeatherParticle[];
  lightning: LightningBolt | null;
  fogOpacity: number;        // 0..1
  darkenOverlay: number;     // 0..1 — how much to darken the scene
  elapsed: number;
}

// ── Encounter → weather preset mapping ───────────────────────

export type EncounterWeatherType = 'fog' | 'storm' | 'battle' | 'ruins' | 'squid';

interface WeatherPreset {
  primary: WeatherKind;
  intensity: number;
  windRange: [number, number];
  transitionChance: number;   // per second, chance of brief weather shift
  transitionKinds: WeatherKind[];
}

const WEATHER_PRESETS: Record<EncounterWeatherType, WeatherPreset> = {
  fog:     { primary: 'fog',     intensity: 0.7,  windRange: [-0.1, 0.1], transitionChance: 0.04, transitionKinds: ['drizzle', 'clear'] },
  storm:   { primary: 'storm',   intensity: 0.85, windRange: [-0.6, 0.6], transitionChance: 0.06, transitionKinds: ['rain', 'drizzle'] },
  battle:  { primary: 'clear',   intensity: 0.3,  windRange: [-0.2, 0.2], transitionChance: 0.05, transitionKinds: ['drizzle', 'glow'] },
  ruins:   { primary: 'rain',    intensity: 0.5,  windRange: [-0.3, 0.3], transitionChance: 0.05, transitionKinds: ['fog', 'storm'] },
  squid:   { primary: 'ash',     intensity: 0.6,  windRange: [-0.4, 0.2], transitionChance: 0.03, transitionKinds: ['fog', 'glow'] },
};

// ── Particle pool limits ─────────────────────────────────────

const MAX_PARTICLES = 120;
const SPAWN_RATES: Record<WeatherKind, number> = {
  clear:   6,     // gentle motes per second
  drizzle: 30,
  rain:    60,
  storm:   80,
  fog:     8,
  ash:     20,
  glow:    5,
};

const GAME_W = 240;
const GAME_H = 400;

// ── Public API ───────────────────────────────────────────────

export function createWeatherState(encounterType: EncounterWeatherType): WeatherState {
  const preset = WEATHER_PRESETS[encounterType];
  return {
    kind: preset.primary,
    intensity: preset.intensity,
    windX: 0,
    particles: [],
    lightning: null,
    fogOpacity: 0, // fog rendering disabled
    darkenOverlay: preset.primary === 'storm' ? 0.15 : preset.primary === 'rain' ? 0.08 : 0,
    elapsed: 0,
  };
}

export function updateWeatherSystem(
  state: WeatherState,
  dt: number,
  encounterType: EncounterWeatherType,
): void {
  state.elapsed += dt;
  const preset = WEATHER_PRESETS[encounterType];

  // ── Wind oscillation ──
  const windCenter = (preset.windRange[0] + preset.windRange[1]) / 2;
  const windAmp = (preset.windRange[1] - preset.windRange[0]) / 2;
  state.windX = windCenter + Math.sin(state.elapsed * 0.7) * windAmp;

  // ── Transition logic (surprise shifts) ──
  if (Math.random() < preset.transitionChance * dt && preset.transitionKinds.length > 0) {
    const pick = preset.transitionKinds[Math.floor(Math.random() * preset.transitionKinds.length)];
    state.kind = pick;
    state.intensity = preset.intensity * (0.3 + Math.random() * 0.4);
  }
  // Drift back to primary
  if (state.kind !== preset.primary && Math.random() < 0.15 * dt) {
    state.kind = preset.primary;
    state.intensity = preset.intensity;
  }

  // ── Derived state ──
  // Fog rendering disabled — force fogOpacity to 0
  state.fogOpacity = 0;
  state.darkenOverlay = state.kind === 'storm' ? 0.12 + state.intensity * 0.08
    : state.kind === 'rain' ? 0.06 + state.intensity * 0.04
    : state.kind === 'fog' ? 0.04
    : 0;

  // ── Spawn particles ──
  const rate = SPAWN_RATES[state.kind] * state.intensity;
  const toSpawn = Math.floor(rate * dt + (Math.random() < (rate * dt % 1) ? 1 : 0));

  for (let i = 0; i < toSpawn && state.particles.length < MAX_PARTICLES; i++) {
    const p = spawnParticle(state.kind, state.windX);
    if (p) state.particles.push(p);
  }

  // ── Update particles ──
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * (p.kind === 'ripple' || p.kind === 'splash' ? 3.0 : 0.5);
    p.alpha = Math.min(p.life, 1) * state.intensity;

    // Remove dead or off-screen
    if (p.life <= 0 || p.y > GAME_H + 10 || p.x < -20 || p.x > GAME_W + 20) {
      state.particles.splice(i, 1);
      continue;
    }

    // Rain drops that hit ground → spawn ripple
    if ((p.kind === 'drop') && p.y > GAME_H - 10 - Math.random() * 60) {
      p.kind = 'ripple';
      p.vx = 0;
      p.vy = 0;
      p.life = 0.3;
      p.size = 2 + Math.random() * 2;
    }
  }

  // ── Lightning (storm only) ──
  if (state.kind === 'storm') {
    if (state.lightning) {
      state.lightning.flash -= dt * 3.5;
      if (state.lightning.flash <= 0) {
        state.lightning = null;
      }
    }
    if (!state.lightning && Math.random() < 0.25 * dt * state.intensity) {
      state.lightning = generateLightning();
    }
  } else {
    state.lightning = null;
  }
}

// ── Particle factories ───────────────────────────────────────

function spawnParticle(kind: WeatherKind, windX: number): WeatherParticle {
  switch (kind) {
    case 'clear':
      return {
        x: Math.random() * GAME_W,
        y: Math.random() * GAME_H,
        vx: windX * 8 + (Math.random() - 0.5) * 4,
        vy: -4 + Math.random() * 2,
        life: 2 + Math.random() * 3,
        size: 1 + Math.random() * 1.5,
        kind: 'mote',
        alpha: 0.3 + Math.random() * 0.3,
      };

    case 'drizzle':
      return {
        x: Math.random() * (GAME_W + 30) - 15,
        y: -4,
        vx: windX * 20 + (Math.random() - 0.5) * 6,
        vy: 80 + Math.random() * 40,
        life: 2,
        size: 1,
        kind: 'drop',
        alpha: 0.25 + Math.random() * 0.15,
      };

    case 'rain':
      return {
        x: Math.random() * (GAME_W + 40) - 20,
        y: -6,
        vx: windX * 40 + (Math.random() - 0.5) * 10,
        vy: 140 + Math.random() * 60,
        life: 2,
        size: 1.5,
        kind: 'drop',
        alpha: 0.35 + Math.random() * 0.2,
      };

    case 'storm':
      return {
        x: Math.random() * (GAME_W + 60) - 30,
        y: -8,
        vx: windX * 60 + (Math.random() - 0.5) * 20,
        vy: 200 + Math.random() * 80,
        life: 1.5,
        size: 2,
        kind: 'drop',
        alpha: 0.4 + Math.random() * 0.2,
      };

    case 'fog':
      // Fog particles disabled — skip spawning
      return null as unknown as WeatherParticle;

    case 'ash':
      return {
        x: Math.random() * GAME_W,
        y: -4,
        vx: windX * 15 + (Math.random() - 0.5) * 12,
        vy: 20 + Math.random() * 30,
        life: 3 + Math.random() * 3,
        size: 1 + Math.random() * 2,
        kind: 'ash',
        alpha: 0.3 + Math.random() * 0.3,
      };

    case 'glow':
      return {
        x: Math.random() * GAME_W,
        y: 60 + Math.random() * (GAME_H - 120),
        vx: (Math.random() - 0.5) * 6,
        vy: -8 + Math.random() * 4,
        life: 3 + Math.random() * 4,
        size: 2 + Math.random() * 3,
        kind: 'orb',
        alpha: 0.15 + Math.random() * 0.2,
      };
  }
}

// ── Lightning generator ──────────────────────────────────────

function generateLightning(): LightningBolt {
  const x = 20 + Math.random() * (GAME_W - 40);
  const segments: LightningBolt['segments'] = [];
  let cx = x;
  let cy = 0;
  const endY = 60 + Math.random() * 100;

  while (cy < endY) {
    const nx = cx + (Math.random() - 0.5) * 18;
    const ny = cy + 6 + Math.random() * 12;
    segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
    cx = nx;
    cy = ny;

    // Random branch
    if (Math.random() < 0.25) {
      const bx = cx + (Math.random() - 0.5) * 24;
      const by = cy + 8 + Math.random() * 10;
      segments.push({ x1: cx, y1: cy, x2: bx, y2: by });
    }
  }

  return { x, segments, flash: 1 };
}
