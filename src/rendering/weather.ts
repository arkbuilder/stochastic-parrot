/**
 * Weather Renderer — Canvas 2D drawing for all weather effects.
 *
 * Consumes a WeatherState produced by the weather system.
 * All functions are pure draw calls — no state mutation.
 *
 * Layering: rendering/ — may import from rendering/tokens, utils/, data/.
 */

import type { WeatherState, WeatherParticle, LightningBolt } from '../systems/weather-system';
import { TOKENS } from './tokens';

// ── Hex helpers (inlined for zero-dep) ───────────────────────

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Main entry point ─────────────────────────────────────────

/**
 * Render the background weather layer (fog/darkness overlay, behind entities).
 * Call this AFTER the tile map and vegetation but BEFORE landmarks/player.
 */
export function renderWeatherBackground(
  ctx: CanvasRenderingContext2D,
  state: WeatherState,
  w: number,
  h: number,
): void {
  // ── Darken overlay ──
  if (state.darkenOverlay > 0.01) {
    ctx.fillStyle = rgba('#070b14', state.darkenOverlay);
    ctx.fillRect(0, 0, w, h);
  }

  // ── Fog banks (disabled — visual noise with current art style) ──
  // if (state.fogOpacity > 0.01) {
  //   for (const p of state.particles) {
  //     if (p.kind === 'fog') drawFogBlob(ctx, p);
  //   }
  // }

  // ── Lightning flash (scene-wide burst) ──
  if (state.lightning && state.lightning.flash > 0.05) {
    drawLightningFlash(ctx, state.lightning, w, h);
  }
}

/**
 * Render the foreground weather layer (rain, ash, motes, orbs).
 * Call this AFTER particles/enemies but BEFORE HUD/vignette.
 */
export function renderWeatherForeground(
  ctx: CanvasRenderingContext2D,
  state: WeatherState,
  w: number,
  h: number,
): void {
  for (const p of state.particles) {
    switch (p.kind) {
      case 'drop':
        drawRaindrop(ctx, p, state.windX);
        break;
      case 'mote':
        drawSunMote(ctx, p, state.elapsed);
        break;
      case 'ash':
        drawAshParticle(ctx, p, state.elapsed);
        break;
      case 'orb':
        drawGlowOrb(ctx, p, state.elapsed);
        break;
      case 'ripple':
        drawRipple(ctx, p);
        break;
      case 'splash':
        drawSplash(ctx, p);
        break;
      // fog is rendered in background pass
    }
  }

  // ── Lightning bolt segments ──
  if (state.lightning && state.lightning.flash > 0.15) {
    drawLightningBolt(ctx, state.lightning);
  }
}

// ── Individual effect renderers ──────────────────────────────

function drawRaindrop(ctx: CanvasRenderingContext2D, p: WeatherParticle, windX: number): void {
  const angle = Math.atan2(p.vy, p.vx);
  const len = p.size * 3;

  ctx.strokeStyle = rgba('#a5c4e0', p.alpha);
  ctx.lineWidth = p.size * 0.5;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - Math.cos(angle) * len, p.y - Math.sin(angle) * len);
  ctx.stroke();
}

function drawSunMote(ctx: CanvasRenderingContext2D, p: WeatherParticle, t: number): void {
  const pulse = 0.6 + Math.sin(t * 3 + p.x * 0.1) * 0.4;
  const radius = p.size * pulse;
  const alpha = p.alpha * pulse;

  ctx.fillStyle = rgba(TOKENS.colorYellow300, alpha);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Soft outer glow
  ctx.fillStyle = rgba(TOKENS.colorYellow400, alpha * 0.3);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawAshParticle(ctx: CanvasRenderingContext2D, p: WeatherParticle, t: number): void {
  // Ash drifts and tumbles — elliptical shape that rotates
  const angle = t * 2 + p.x * 0.3 + p.y * 0.2;
  const rx = p.size;
  const ry = p.size * 0.4;

  ctx.fillStyle = rgba('#9ca3af', p.alpha);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fill();

  // Hot ember core on some
  if (p.size > 1.8) {
    ctx.fillStyle = rgba('#f97316', p.alpha * 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlowOrb(ctx: CanvasRenderingContext2D, p: WeatherParticle, t: number): void {
  const pulse = 0.5 + Math.sin(t * 2 + p.y * 0.05) * 0.5;
  const radius = p.size * pulse;
  const alpha = p.alpha * (0.4 + pulse * 0.6);

  // Outer glow (largest, most transparent)
  ctx.fillStyle = rgba(TOKENS.colorCyan300, alpha * 0.15);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * 5, 0, Math.PI * 2);
  ctx.fill();

  // Mid glow
  ctx.fillStyle = rgba(TOKENS.colorCyan400, alpha * 0.3);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = rgba('#ffffff', alpha * 0.7);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Fog motes — each fog "particle" spawns a cluster of small
 * translucent circles at deterministic offsets (seeded from
 * position so the pattern is stable frame-to-frame).
 */
const FOG_MOTE_COUNT = 6;

function drawFogBlob(ctx: CanvasRenderingContext2D, p: WeatherParticle): void {
  const baseAlpha = p.alpha * 0.55;
  // Seed scatter from particle position so it doesn't jitter.
  const seed = (p.x * 7.3 + p.y * 3.1) | 0;
  for (let i = 0; i < FOG_MOTE_COUNT; i++) {
    // Deterministic pseudo-random offsets per mote
    const hash = Math.sin(seed + i * 91.7) * 4371.13;
    const frac = hash - Math.floor(hash);           // 0..1
    const hash2 = Math.sin(seed + i * 47.3) * 2719.97;
    const frac2 = hash2 - Math.floor(hash2);         // 0..1
    const dx = (frac - 0.5) * p.size * 1.6;
    const dy = (frac2 - 0.5) * p.size * 0.7;
    const r  = 2 + frac * 4;                         // radius 2..6
    const a  = baseAlpha * (0.5 + frac2 * 0.5);      // vary opacity
    ctx.fillStyle = rgba('#94a3b8', a);
    ctx.beginPath();
    ctx.arc(p.x + dx, p.y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRipple(ctx: CanvasRenderingContext2D, p: WeatherParticle): void {
  const expand = 1 - p.life;  // grows as life shrinks (0→1)
  const radius = p.size + expand * 3;
  ctx.strokeStyle = rgba('#a5c4e0', p.alpha * p.life);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, radius, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSplash(ctx: CanvasRenderingContext2D, p: WeatherParticle): void {
  ctx.fillStyle = rgba('#bfdbfe', p.alpha * p.life);
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawLightningFlash(
  ctx: CanvasRenderingContext2D,
  bolt: LightningBolt,
  w: number,
  h: number,
): void {
  // Full-scene white flash
  ctx.fillStyle = rgba('#e0f2fe', bolt.flash * 0.10);
  ctx.fillRect(0, 0, w, h);
}

function drawLightningBolt(ctx: CanvasRenderingContext2D, bolt: LightningBolt): void {
  // Outer glow
  ctx.strokeStyle = rgba('#7dd3fc', bolt.flash * 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const seg of bolt.segments) {
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
  }
  ctx.stroke();

  // Bright core
  ctx.strokeStyle = rgba('#ffffff', bolt.flash * 0.8);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const seg of bolt.segments) {
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}
