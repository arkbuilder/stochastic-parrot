/**
 * Beat Renderer — procedural drawing for each cinematic layer.
 *
 * Draws sky presets, character sprites, prop elements, captions,
 * and overlay effects. Reuses draw.ts helpers wherever possible.
 */

import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import { TOKENS } from '../rendering/tokens';
import {
  drawSkyGradient, drawOceanGradient, drawStars,
  drawShip, drawPlayer, drawParrot,
  drawVignette, rgba, roundRect,
} from '../rendering/draw';
import type { SkyPreset, CharacterPlacement, PropPlacement, CinematicBeat } from './types';

// ── Sky presets ──────────────────────────────────────────────

const HORIZON_Y = 160;

const SKY_CONFIGS: Record<SkyPreset, { top: string; bottom: string; oceanY: number; stars: boolean; fogAlpha: number }> = {
  dawn:     { top: '#2d1b4e', bottom: '#f59e0b', oceanY: HORIZON_Y, stars: false, fogAlpha: 0 },
  day:      { top: '#0c4a6e', bottom: '#38bdf8', oceanY: HORIZON_Y, stars: false, fogAlpha: 0 },
  dusk:     { top: '#1e1b4b', bottom: '#c2410c', oceanY: HORIZON_Y, stars: true, fogAlpha: 0 },
  night:    { top: '#050d1a', bottom: '#11213c', oceanY: HORIZON_Y, stars: true, fogAlpha: 0 },
  storm:    { top: '#0f172a', bottom: '#1e293b', oceanY: HORIZON_Y, stars: false, fogAlpha: 0.15 },
  dark_sea: { top: '#030712', bottom: '#1e1b4b', oceanY: HORIZON_Y, stars: true, fogAlpha: 0.25 },
};

export function renderSky(ctx: CanvasRenderingContext2D, sky: SkyPreset, t: number): void {
  const cfg = SKY_CONFIGS[sky];
  drawSkyGradient(ctx, GAME_WIDTH, cfg.top, cfg.bottom, cfg.oceanY);

  if (cfg.stars) {
    drawStars(ctx, GAME_WIDTH, cfg.oceanY, t, 30);
  }

  // Ocean below horizon
  drawOceanGradient(ctx, GAME_WIDTH, cfg.oceanY, GAME_HEIGHT - cfg.oceanY, t);

  // Fog overlay for stormy / dark presets
  if (cfg.fogAlpha > 0) {
    ctx.fillStyle = rgba('#0f172a', cfg.fogAlpha + Math.sin(t * 0.8) * 0.05);
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // Dawn / dusk sun glow
  if (sky === 'dawn') {
    const sunY = HORIZON_Y - 8 + Math.sin(t * 0.3) * 2;
    const sunGlow = ctx.createRadialGradient(GAME_WIDTH / 2, sunY, 4, GAME_WIDTH / 2, sunY, 60);
    sunGlow.addColorStop(0, rgba('#fbbf24', 0.8));
    sunGlow.addColorStop(0.3, rgba('#f59e0b', 0.3));
    sunGlow.addColorStop(1, rgba('#f59e0b', 0));
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, sunY - 60, GAME_WIDTH, 120);
    // Sun disc
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, sunY, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  if (sky === 'storm') {
    // Occasional lightning shimmer
    const flash = Math.sin(t * 7) > 0.96 ? 0.15 : 0;
    if (flash > 0) {
      ctx.fillStyle = rgba('#e0f2fe', flash);
      ctx.fillRect(0, 0, GAME_WIDTH, cfg.oceanY);
    }
    // Storm clouds
    for (let i = 0; i < 5; i++) {
      const cx = (30 + i * 50 + Math.sin(t * 0.2 + i * 2) * 15) % (GAME_WIDTH + 30) - 15;
      const cy = 30 + Math.sin(t * 0.4 + i * 1.7) * 8;
      ctx.fillStyle = rgba('#1e293b', 0.4);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Character rendering ──────────────────────────────────────

export function renderCharacter(ctx: CanvasRenderingContext2D, char: CharacterPlacement, t: number): void {
  ctx.save();
  const s = char.scale ?? 1;
  ctx.translate(char.x, char.y);
  if (s !== 1) ctx.scale(s, s);
  if (char.flipX) ctx.scale(-1, 1);

  switch (char.id) {
    case 'nemo':
      drawPlayer(ctx, 0, 0, t);
      break;
    case 'bit':
      drawParrot(ctx, 0, 0, t);
      break;
    case 'ship_loci':
      drawShip(ctx, 0, 0, t, true, false);
      break;
    case 'ship_overfit':
      renderNullShip(ctx, t);
      break;
    case 'null':
      renderNullCaptain(ctx, char.anim ?? 'idle', t);
      break;
    case 'kraken':
    case 'space_kraken':
      renderKraken(ctx, t);
      break;
  }
  ctx.restore();
}

function renderNullShip(ctx: CanvasRenderingContext2D, t: number): void {
  const bob = Math.sin(t * 1.8) * 2;
  ctx.save();
  ctx.translate(0, bob);
  // Dark hull
  ctx.fillStyle = '#4a1c1c';
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-10, 7);
  ctx.lineTo(10, 7);
  ctx.lineTo(12, 0);
  ctx.lineTo(10, -2);
  ctx.lineTo(-10, -2);
  ctx.closePath();
  ctx.fill();
  // Red sail
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(1, -18);
  ctx.lineTo(10, -9);
  ctx.lineTo(1, -3);
  ctx.closePath();
  ctx.fill();
  // Mast
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, -20);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Skull flag
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-3, -22, 6, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(-1, -21, 1, 1);
  ctx.fillRect(1, -21, 1, 1);
  ctx.restore();
}

function renderNullCaptain(ctx: CanvasRenderingContext2D, anim: string, t: number): void {
  const bob = Math.sin(t * 2.5) * 1;
  // Body — red coat
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, -6, -12 + bob, 12, 14, 3);
  ctx.fill();
  // Head — bald
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -14 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  // Eye patch
  ctx.fillStyle = '#000';
  ctx.fillRect(-4, -15 + bob, 4, 2);
  // Good eye
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(1, -15 + bob, 2, 2);
  // Legs
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(-4, 2 + bob, 3, 4);
  ctx.fillRect(1, 2 + bob, 3, 4);

  // Animation hint
  if (anim === 'fist_shake') {
    const shake = Math.sin(t * 12) * 3;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(7 + shake, -10 + bob, 4, 4);
  }
}

function renderKraken(ctx: CanvasRenderingContext2D, t: number): void {
  // Tentacles
  for (let i = 0; i < 4; i++) {
    const sway = Math.sin(t * 2 + i * 1.5) * 8;
    const tipSway = Math.sin(t * 3 + i * 0.8) * 4;
    ctx.strokeStyle = rgba('#ec4899', 0.6 + i * 0.05);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12 + i * 8, 0);
    ctx.quadraticCurveTo(-12 + i * 8 + sway, -20, -12 + i * 8 + tipSway, -40);
    ctx.stroke();
  }
  // Eye
  const eyePulse = 0.6 + Math.sin(t * 3) * 0.3;
  ctx.fillStyle = rgba('#fbbf24', eyePulse);
  ctx.beginPath();
  ctx.arc(4, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(4, -8, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
}

// ── Prop rendering ───────────────────────────────────────────

export function renderProp(ctx: CanvasRenderingContext2D, prop: PropPlacement, t: number): void {
  const s = prop.scale ?? 1;
  ctx.save();
  ctx.translate(prop.x, prop.y);
  if (s !== 1) ctx.scale(s, s);

  switch (prop.kind) {
    case 'island_silhouette':
      drawIslandSilhouette(ctx);
      break;
    case 'fog_wall':
      drawFogWall(ctx, t);
      break;
    case 'lightning':
      drawLightningBolt(ctx, t);
      break;
    case 'tentacle':
      drawTentacle(ctx, t);
      break;
    case 'chart_fragment':
      drawChartFragment(ctx, t);
      break;
    case 'golden_chart':
      drawGoldenChart(ctx, t);
      break;
    case 'wreckage':
      drawWreckage(ctx);
      break;
    case 'sunrise':
      drawSunrise(ctx, t);
      break;
    case 'cannon_flash':
      drawCannonFlash(ctx, t);
      break;
    case 'rocket':
      drawRocket(ctx, t);
      break;
    case 'exhaust_plume':
      drawExhaustPlume(ctx, t);
      break;
    case 'asteroid':
      drawAsteroid(ctx);
      break;
    case 'nebula_cloud':
      drawNebulaCloud(ctx, t);
      break;
    case 'star_chart':
      drawStarChart(ctx, t);
      break;
    case 'orbit_ring':
      drawOrbitRing(ctx, t);
      break;
    case 'reentry_flame':
      drawReentryFlame(ctx, t);
      break;
    case 'parachute':
      drawParachute(ctx, t);
      break;
    case 'splash':
      drawSplash(ctx, t);
      break;
  }

  ctx.restore();
}

function drawIslandSilhouette(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1a2744';
  ctx.beginPath();
  ctx.moveTo(-30, 10);
  ctx.quadraticCurveTo(-20, -20, 0, -25);
  ctx.quadraticCurveTo(20, -20, 30, 10);
  ctx.closePath();
  ctx.fill();
  // Beach line
  ctx.fillStyle = '#d4a76a';
  ctx.fillRect(-25, 6, 50, 4);
}

function drawFogWall(ctx: CanvasRenderingContext2D, t: number): void {
  for (let i = 0; i < 5; i++) {
    const alpha = 0.15 + Math.sin(t * 0.5 + i) * 0.05;
    ctx.fillStyle = rgba('#64748b', alpha);
    ctx.beginPath();
    ctx.ellipse(i * 20 - 40, Math.sin(t * 0.4 + i * 2) * 5, 30, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLightningBolt(ctx: CanvasRenderingContext2D, t: number): void {
  const flash = Math.sin(t * 8) > 0.9 ? 1 : 0;
  if (flash < 0.5) return;
  ctx.strokeStyle = rgba('#e0f2fe', 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(-4, -22);
  ctx.lineTo(3, -20);
  ctx.lineTo(-2, 0);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawTentacle(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 2) * 10;
  ctx.strokeStyle = rgba('#ec4899', 0.7);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.quadraticCurveTo(sway, -10, sway * 0.5, -40);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawChartFragment(ctx: CanvasRenderingContext2D, t: number): void {
  const glow = 0.6 + Math.sin(t * 3) * 0.3;
  // Parchment
  ctx.fillStyle = rgba('#fde047', glow);
  roundRect(ctx, -8, -6, 16, 12, 2);
  ctx.fill();
  ctx.strokeStyle = rgba('#92400e', 0.8);
  roundRect(ctx, -8, -6, 16, 12, 2);
  ctx.stroke();
  // Lines on parchment
  ctx.strokeStyle = rgba('#92400e', 0.4);
  ctx.beginPath();
  ctx.moveTo(-5, -2); ctx.lineTo(5, -2);
  ctx.moveTo(-5, 1); ctx.lineTo(3, 1);
  ctx.stroke();
}

function drawGoldenChart(ctx: CanvasRenderingContext2D, t: number): void {
  const glow = 0.7 + Math.sin(t * 2) * 0.3;
  // Glow aura
  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
  grad.addColorStop(0, rgba('#fbbf24', glow * 0.4));
  grad.addColorStop(1, rgba('#fbbf24', 0));
  ctx.fillStyle = grad;
  ctx.fillRect(-24, -24, 48, 48);
  // Chart
  ctx.fillStyle = rgba('#fbbf24', glow);
  roundRect(ctx, -12, -9, 24, 18, 3);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  roundRect(ctx, -12, -9, 24, 18, 3);
  ctx.stroke();
  // Map lines
  ctx.strokeStyle = rgba('#78350f', 0.6);
  ctx.beginPath();
  ctx.moveTo(-8, -4); ctx.lineTo(8, -4);
  ctx.moveTo(-8, 0); ctx.lineTo(6, 0);
  ctx.moveTo(-8, 4); ctx.lineTo(4, 4);
  ctx.stroke();
  // Star marker
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(4, -4, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWreckage(ctx: CanvasRenderingContext2D): void {
  // Broken hull
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(-10, 5);
  ctx.lineTo(-8, -3);
  ctx.lineTo(4, -5);
  ctx.lineTo(8, 2);
  ctx.lineTo(5, 8);
  ctx.closePath();
  ctx.fill();
  // Broken mast
  ctx.strokeStyle = '#4a1c1c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2, -3);
  ctx.lineTo(3, -14);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Tattered red sail
  ctx.fillStyle = rgba('#ef4444', 0.5);
  ctx.beginPath();
  ctx.moveTo(3, -14);
  ctx.lineTo(8, -8);
  ctx.lineTo(4, -6);
  ctx.closePath();
  ctx.fill();
}

function drawSunrise(ctx: CanvasRenderingContext2D, t: number): void {
  const pulse = 0.6 + Math.sin(t * 0.5) * 0.3;
  const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 80);
  grad.addColorStop(0, rgba('#fbbf24', pulse));
  grad.addColorStop(0.4, rgba('#f59e0b', pulse * 0.4));
  grad.addColorStop(1, rgba('#f59e0b', 0));
  ctx.fillStyle = grad;
  ctx.fillRect(-80, -80, 160, 160);
  // Sun disc
  ctx.fillStyle = rgba('#fde047', pulse);
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawCannonFlash(ctx: CanvasRenderingContext2D, t: number): void {
  const flash = Math.sin(t * 6) > 0.85 ? 1 : 0;
  if (flash < 0.5) return;
  ctx.fillStyle = rgba('#fbbf24', 0.8);
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ── Rocket DLC props ─────────────────────────────────────────

function drawRocket(ctx: CanvasRenderingContext2D, t: number): void {
  const hover = Math.sin(t * 1.5) * 2;
  ctx.translate(0, hover);
  // Body
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-6, 14);
  ctx.lineTo(6, 14);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();
  // Nose cone
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(-4, -10);
  ctx.lineTo(4, -10);
  ctx.closePath();
  ctx.fill();
  // Fins
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(-6, 10); ctx.lineTo(-12, 18); ctx.lineTo(-6, 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, 10); ctx.lineTo(12, 18); ctx.lineTo(6, 14);
  ctx.closePath();
  ctx.fill();
  // Window
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawExhaustPlume(ctx: CanvasRenderingContext2D, t: number): void {
  const flicker = 0.6 + Math.sin(t * 10) * 0.3;
  // Outer flame
  ctx.fillStyle = rgba('#f97316', flicker);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 18 + Math.sin(t * 8) * 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Inner flame
  ctx.fillStyle = rgba('#fde047', flicker * 0.8);
  ctx.beginPath();
  ctx.ellipse(0, -4, 4, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAsteroid(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-3, -8);
  ctx.lineTo(5, -6);
  ctx.lineTo(8, 0);
  ctx.lineTo(5, 7);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fill();
  // Craters
  ctx.fillStyle = '#4b5563';
  ctx.beginPath();
  ctx.arc(-2, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawNebulaCloud(ctx: CanvasRenderingContext2D, t: number): void {
  const pulse = 0.3 + Math.sin(t * 0.6) * 0.15;
  // Purple nebula layers
  for (let i = 0; i < 4; i++) {
    const offset = Math.sin(t * 0.3 + i * 1.5) * 8;
    ctx.fillStyle = rgba('#a855f7', pulse - i * 0.05);
    ctx.beginPath();
    ctx.ellipse(offset + i * 10 - 15, Math.sin(t * 0.4 + i) * 4, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStarChart(ctx: CanvasRenderingContext2D, t: number): void {
  const glow = 0.7 + Math.sin(t * 2) * 0.3;
  // Dark parchment
  ctx.fillStyle = rgba('#1e1b4b', glow);
  roundRect(ctx, -14, -10, 28, 20, 3);
  ctx.fill();
  ctx.strokeStyle = rgba('#818cf8', 0.6);
  roundRect(ctx, -14, -10, 28, 20, 3);
  ctx.stroke();
  // Star dots
  ctx.fillStyle = rgba('#fde047', glow);
  const stars = [[-8, -5], [-3, -2], [4, -6], [6, 2], [-5, 4], [0, 5]];
  for (const [sx, sy] of stars) {
    ctx.beginPath();
    ctx.arc(sx!, sy!, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  // Constellation lines
  ctx.strokeStyle = rgba('#818cf8', 0.4);
  ctx.beginPath();
  ctx.moveTo(-8, -5); ctx.lineTo(-3, -2); ctx.lineTo(4, -6);
  ctx.moveTo(-3, -2); ctx.lineTo(0, 5);
  ctx.stroke();
}

function drawOrbitRing(ctx: CanvasRenderingContext2D, t: number): void {
  const angle = t * 0.5;
  ctx.strokeStyle = rgba('#38bdf8', 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 10, angle, 0, Math.PI * 2);
  ctx.stroke();
  // Orbiting dot
  const dotX = Math.cos(t * 1.5) * 30;
  const dotY = Math.sin(t * 1.5) * 10;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
}

function drawReentryFlame(ctx: CanvasRenderingContext2D, t: number): void {
  const flicker = 0.7 + Math.sin(t * 12) * 0.2;
  // Shockwave arc
  ctx.strokeStyle = rgba('#ef4444', flicker);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 14, -0.8, 0.8);
  ctx.stroke();
  // Heat glow
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
  grad.addColorStop(0, rgba('#fbbf24', flicker * 0.6));
  grad.addColorStop(1, rgba('#ef4444', 0));
  ctx.fillStyle = grad;
  ctx.fillRect(-16, -16, 32, 32);
  ctx.lineWidth = 1;
}

function drawParachute(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 1.2) * 3;
  // Canopy
  ctx.fillStyle = rgba('#f97316', 0.8);
  ctx.beginPath();
  ctx.arc(sway, -12, 12, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // Stripes
  ctx.fillStyle = rgba('#ffffff', 0.6);
  ctx.beginPath();
  ctx.arc(sway, -12, 12, Math.PI + 0.5, Math.PI + 1.2);
  ctx.lineTo(sway, -12);
  ctx.closePath();
  ctx.fill();
  // Lines
  ctx.strokeStyle = rgba('#78350f', 0.6);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(sway - 10, -6); ctx.lineTo(0, 8);
  ctx.moveTo(sway + 10, -6); ctx.lineTo(0, 8);
  ctx.moveTo(sway, -6); ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Capsule
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(0, 10, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSplash(ctx: CanvasRenderingContext2D, t: number): void {
  const spread = 0.5 + Math.sin(t * 3) * 0.3;
  // Water spray arcs
  ctx.strokeStyle = rgba('#38bdf8', 0.6);
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    const angle = i * 0.4;
    const h = 12 * spread;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(i * 8, -h, i * 14 * spread, 2);
    ctx.stroke();
  }
  // Water droplets
  ctx.fillStyle = rgba('#38bdf8', 0.5);
  for (let i = 0; i < 5; i++) {
    const dx = (Math.sin(t * 4 + i * 1.7) * 10);
    const dy = -Math.abs(Math.cos(t * 3 + i * 1.3)) * 8;
    ctx.beginPath();
    ctx.arc(dx, dy, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 1;
}

// ── Caption rendering ────────────────────────────────────────

export function renderCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  typewriterProgress: number,
  t: number,
): void {
  const visible = text.slice(0, typewriterProgress);
  if (!visible) return;

  // Dark panel at bottom
  const panelH = 48;
  const panelY = GAME_HEIGHT - panelH - 8;
  ctx.fillStyle = rgba('#0f172a', 0.88);
  roundRect(ctx, 12, panelY, GAME_WIDTH - 24, panelH, 6);
  ctx.fill();
  ctx.strokeStyle = rgba(TOKENS.colorCyan400, 0.3);
  roundRect(ctx, 12, panelY, GAME_WIDTH - 24, panelH, 6);
  ctx.stroke();

  // Text
  ctx.fillStyle = TOKENS.colorText;
  ctx.font = TOKENS.fontSmall;
  ctx.textAlign = 'center';

  // Wrap text
  const maxW = GAME_WIDTH - 48;
  const words = visible.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineH = 11;
  const startY = panelY + panelH / 2 - ((lines.length - 1) * lineH) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i]!, GAME_WIDTH / 2, startY + i * lineH);
  }

  // Blinking cursor
  if (typewriterProgress < text.length) {
    const blink = Math.sin(t * 6) > 0;
    if (blink) {
      const lastLine = lines[lines.length - 1] ?? '';
      const lastW = ctx.measureText(lastLine).width;
      const cursorX = GAME_WIDTH / 2 + lastW / 2 + 2;
      const cursorY = startY + (lines.length - 1) * lineH;
      ctx.fillStyle = TOKENS.colorCyan400;
      ctx.fillRect(cursorX, cursorY - 6, 1, 8);
    }
  }
}

// ── "Tap to continue" prompt ─────────────────────────────────

export function renderTapPrompt(ctx: CanvasRenderingContext2D, t: number): void {
  const alpha = 0.4 + Math.sin(t * 3) * 0.3;
  ctx.fillStyle = rgba(TOKENS.colorTextMuted, alpha);
  ctx.font = TOKENS.fontSmall;
  ctx.textAlign = 'center';
  ctx.fillText('tap to continue', GAME_WIDTH / 2, GAME_HEIGHT - 14);
}

// ── Full beat render ─────────────────────────────────────────

export function renderBeat(
  ctx: CanvasRenderingContext2D,
  beat: CinematicBeat,
  t: number,
  typewriterProgress: number,
  shakeOffset: { x: number; y: number },
): void {
  ctx.save();
  // Camera shake
  if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
    ctx.translate(shakeOffset.x, shakeOffset.y);
  }

  // Sky / environment
  renderSky(ctx, beat.sky, t);

  // Props (behind characters)
  if (beat.props) {
    for (const prop of beat.props) {
      renderProp(ctx, prop, t);
    }
  }

  // Characters
  if (beat.characters) {
    for (const char of beat.characters) {
      renderCharacter(ctx, char, t);
    }
  }

  // Tint overlay
  if (beat.tint) {
    ctx.fillStyle = beat.tint;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  ctx.restore();

  // Vignette (on top, unshaken)
  drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.4);

  // Caption
  if (beat.caption) {
    renderCaption(ctx, beat.caption, typewriterProgress, t);
  }
}
