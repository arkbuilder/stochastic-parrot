/**
 * draw.ts — Higher-quality drawing helpers for Canvas 2D.
 * Replaces raw fillRect calls with shapes that read as characters,
 * landmarks, ships, UI elements, and environmental details.
 */

/* ── Colour helpers ── */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Rounded rectangle ── */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Gradient backgrounds ── */
export function drawSkyGradient(ctx: CanvasRenderingContext2D, w: number, topColor: string, bottomColor: string, height: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, height);
}

export function drawOceanGradient(ctx: CanvasRenderingContext2D, w: number, y: number, h: number, t: number): void {
  // Deep-to-surface gradient
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#1a5f8a');
  grad.addColorStop(0.15, '#1a4a6e');
  grad.addColorStop(0.4, '#0d3b66');
  grad.addColorStop(1, '#041528');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, w, h);

  // ── Layer 1: deep undulating swells (slow, wide) ──
  for (let band = 0; band < 4; band++) {
    const bandY = y + 6 + band * (h / 4);
    const alpha = 0.04 + band * 0.025;
    ctx.fillStyle = `rgba(60,160,210,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(0, bandY + 8);
    for (let px = 0; px <= w; px += 3) {
      const offset = Math.sin((px * 0.025) + t * 0.6 + band * 1.8) * 5
                   + Math.sin((px * 0.015) + t * 0.35 + band * 0.9) * 3;
      ctx.lineTo(px, bandY + offset);
    }
    ctx.lineTo(w, bandY + 20);
    ctx.lineTo(0, bandY + 20);
    ctx.closePath();
    ctx.fill();
  }

  // ── Layer 2: mid-range waves (animated sine bands with shading) ──
  ctx.strokeStyle = 'rgba(100,190,230,0.14)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 8; row++) {
    const wy = y + 10 + row * (h / 8);
    ctx.beginPath();
    for (let px = 0; px < w; px += 2) {
      const offset = Math.sin((px + t * 38 + row * 32) * 0.055) * 3.5
                   + Math.sin((px * 0.12) + t * 1.2 + row * 0.7) * 1.5;
      if (px === 0) ctx.moveTo(px, wy + offset);
      else ctx.lineTo(px, wy + offset);
    }
    ctx.stroke();
  }

  // ── Layer 3: foam caps (bright dots that move along wave crests) ──
  ctx.fillStyle = 'rgba(220,240,255,0.25)';
  for (let fi = 0; fi < 12; fi++) {
    const fx = ((fi * 23 + t * 12) % (w + 20)) - 10;
    const band = fi % 5;
    const fy = y + 6 + band * (h / 5)
             + Math.sin(fx * 0.04 + t * 0.8 + fi) * 4;
    const foamSize = 1.2 + Math.sin(t * 2.5 + fi * 3) * 0.6;
    ctx.beginPath();
    ctx.arc(fx, fy, foamSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Layer 4: sparkle reflections (brief bright flashes) ──
  for (let si = 0; si < 6; si++) {
    const phase = t * 1.4 + si * 2.3;
    const sparkleAlpha = Math.max(0, Math.sin(phase) * 0.4 - 0.15);
    if (sparkleAlpha > 0) {
      const sx = (si * 41 + Math.floor(t * 3) * 17) % w;
      const sy = y + 4 + (si * 31) % (h * 0.6);
      ctx.fillStyle = `rgba(255,255,255,${sparkleAlpha.toFixed(2)})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }
}

/* ── Player character (Nemo) ── */
export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number): void {
  const bob = Math.sin(animTime * 3) * 1.5;
  // Body
  ctx.fillStyle = '#f59e0b';
  roundRect(ctx, x - 6, y - 12 + bob, 12, 14, 3);
  ctx.fill();
  // Head
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x, y - 14 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  // Hat (pirate bandana)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x - 5, y - 19 + bob, 10, 3);
  // Eyes
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(x - 3, y - 15 + bob, 2, 2);
  ctx.fillRect(x + 1, y - 15 + bob, 2, 2);
  // Legs
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x - 4, y + 2 + bob, 3, 4);
  ctx.fillRect(x + 1, y + 2 + bob, 3, 4);
}

/* ── Parrot companion ── */
export function drawParrot(ctx: CanvasRenderingContext2D, x: number, y: number, animTime: number): void {
  const wingFlap = Math.sin(animTime * 8) * 2;
  // Body
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(x + 3, y - 3 + wingFlap, 3, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(x, y - 7, 3, 0, Math.PI * 2);
  ctx.fill();
  // Beak
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 7);
  ctx.lineTo(x + 6, y - 6);
  ctx.lineTo(x + 3, y - 5);
  ctx.closePath();
  ctx.fill();
  // Eye
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y - 8, 1.5, 1.5);
}

/* ── Landmark icons (distinct per type) ── */
export function drawLandmark(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  landmarkId: string, filled: boolean, glowIntensity: number, t: number,
  scale = 1.0,
): void {
  const s = scale;

  // Glow pulse
  if (glowIntensity > 0) {
    const pulse = 0.4 + Math.sin(t * 4) * 0.2;
    ctx.fillStyle = rgba(filled ? '#facc15' : '#22d3ee', pulse * glowIntensity);
    ctx.beginPath();
    ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Get landmark accent color for visual distinction
  const accent = getLandmarkAccent(landmarkId);

  // Base platform
  ctx.fillStyle = filled ? '#78350f' : accent.bg;
  roundRect(ctx, x - 12 * s, y - 12 * s, 24 * s, 24 * s, 4 * s);
  ctx.fill();
  ctx.strokeStyle = filled ? '#facc15' : accent.border;
  ctx.lineWidth = 1.5 * s;
  roundRect(ctx, x - 12 * s, y - 12 * s, 24 * s, 24 * s, 4 * s);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Icon varies by landmark type
  ctx.fillStyle = filled ? '#fbbf24' : accent.icon;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(-x, -y);
  if (landmarkId.includes('crate') || landmarkId.includes('dock')) {
    drawCrateIcon(ctx, x, y);
  } else if (landmarkId.includes('chart') || landmarkId.includes('map')) {
    drawScrollIcon(ctx, x, y);
  } else if (landmarkId.includes('cannon')) {
    drawCannonIcon(ctx, x, y);
  } else if (landmarkId.includes('compass')) {
    drawCompassIcon(ctx, x, y);
  } else if (landmarkId.includes('market') || landmarkId.includes('stall')) {
    drawBinsIcon(ctx, x, y);
  } else if (landmarkId.includes('wheel') || landmarkId.includes('tide')) {
    drawWheelIcon(ctx, x, y);
  } else if (landmarkId.includes('chest') || landmarkId.includes('barnacle')) {
    drawChestIcon(ctx, x, y);
  } else if (landmarkId.includes('bell') || landmarkId.includes('tower')) {
    drawBellIcon(ctx, x, y);
  } else if (landmarkId.includes('scale') || landmarkId.includes('treasure')) {
    drawScaleIcon(ctx, x, y);
  } else if (landmarkId.includes('nest') || landmarkId.includes('crow')) {
    drawNestIcon(ctx, x, y);
  } else if (landmarkId.includes('net') || landmarkId.includes('twin')) {
    drawNetIcon(ctx, x, y);
  } else if (landmarkId.includes('rigging') || landmarkId.includes('web')) {
    drawWebIcon(ctx, x, y);
  } else if (landmarkId.includes('anchor') || landmarkId.includes('winch')) {
    drawAnchorIcon(ctx, x, y);
  } else if (landmarkId.includes('key') || landmarkId.includes('shrine')) {
    drawKeyIcon(ctx, x, y);
  } else if (landmarkId === 'island_01') {
    drawIslandAnchorEmblem(ctx, x, y);
  } else if (landmarkId === 'island_02') {
    drawIslandCompassEmblem(ctx, x, y);
  } else if (landmarkId === 'island_03') {
    drawIslandCoralEmblem(ctx, x, y);
  } else if (landmarkId === 'island_04') {
    drawIslandBastionEmblem(ctx, x, y);
  } else if (landmarkId === 'island_05') {
    drawIslandKrakenEmblem(ctx, x, y);
  } else {
    // Default diamond
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x + 6, y);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x - 6, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Returns unique accent colours per landmark type for visual distinction */
function getLandmarkAccent(landmarkId: string): { bg: string; border: string; icon: string } {
  if (landmarkId.includes('crate') || landmarkId.includes('dock')) {
    return { bg: '#3b2210', border: '#f59e0b', icon: '#fbbf24' }; // warm amber
  }
  if (landmarkId.includes('chart') || landmarkId.includes('map')) {
    return { bg: '#1e3a4f', border: '#67e8f9', icon: '#a5f3fc' }; // light cyan
  }
  if (landmarkId.includes('cannon')) {
    return { bg: '#2d1b1b', border: '#ef4444', icon: '#fca5a5' }; // red
  }
  if (landmarkId.includes('compass')) {
    return { bg: '#1e2a3f', border: '#818cf8', icon: '#c7d2fe' }; // indigo
  }
  if (landmarkId.includes('market') || landmarkId.includes('stall')) {
    return { bg: '#2a2410', border: '#facc15', icon: '#fde68a' }; // yellow
  }
  if (landmarkId.includes('wheel') || landmarkId.includes('tide')) {
    return { bg: '#102a2a', border: '#2dd4bf', icon: '#99f6e4' }; // teal
  }
  if (landmarkId.includes('chest') || landmarkId.includes('barnacle')) {
    return { bg: '#3b2a10', border: '#f97316', icon: '#fdba74' }; // orange
  }
  if (landmarkId.includes('bell') || landmarkId.includes('tower')) {
    return { bg: '#2a1e3a', border: '#c084fc', icon: '#e9d5ff' }; // purple
  }
  if (landmarkId.includes('scale') || landmarkId.includes('treasure')) {
    return { bg: '#1e3020', border: '#4ade80', icon: '#bbf7d0' }; // green
  }
  if (landmarkId.includes('nest') || landmarkId.includes('crow')) {
    return { bg: '#2a2020', border: '#fb923c', icon: '#fed7aa' }; // peach
  }
  if (landmarkId.includes('net') || landmarkId.includes('twin')) {
    return { bg: '#1e2a30', border: '#38bdf8', icon: '#bae6fd' }; // sky blue
  }
  if (landmarkId.includes('rigging') || landmarkId.includes('web')) {
    return { bg: '#2a2030', border: '#a78bfa', icon: '#ddd6fe' }; // violet
  }
  if (landmarkId.includes('anchor') || landmarkId.includes('winch')) {
    return { bg: '#1e2e2e', border: '#34d399', icon: '#a7f3d0' }; // emerald
  }
  if (landmarkId.includes('key') || landmarkId.includes('shrine')) {
    return { bg: '#3a2a10', border: '#fbbf24', icon: '#fef08a' }; // gold
  }
  return { bg: '#1e3a5f', border: '#22d3ee', icon: '#67e8f9' }; // default cyan
}

/** Get the icon-drawing function name for a landmark (used by tests) */
export function getLandmarkIconName(landmarkId: string): string {
  if (landmarkId.includes('crate') || landmarkId.includes('dock')) return 'crate';
  if (landmarkId.includes('chart') || landmarkId.includes('map')) return 'scroll';
  if (landmarkId.includes('cannon')) return 'cannon';
  if (landmarkId.includes('compass')) return 'compass';
  if (landmarkId.includes('market') || landmarkId.includes('stall')) return 'bins';
  if (landmarkId.includes('wheel') || landmarkId.includes('tide')) return 'wheel';
  if (landmarkId.includes('chest') || landmarkId.includes('barnacle')) return 'chest';
  if (landmarkId.includes('bell') || landmarkId.includes('tower')) return 'bell';
  if (landmarkId.includes('scale') || landmarkId.includes('treasure')) return 'scale';
  if (landmarkId.includes('nest') || landmarkId.includes('crow')) return 'nest';
  if (landmarkId.includes('net') || landmarkId.includes('twin')) return 'net';
  if (landmarkId.includes('rigging') || landmarkId.includes('web')) return 'web';
  if (landmarkId.includes('anchor') || landmarkId.includes('winch')) return 'anchor';
  if (landmarkId.includes('key') || landmarkId.includes('shrine')) return 'key';
  if (landmarkId === 'island_01') return 'island_anchor';
  if (landmarkId === 'island_02') return 'island_compass';
  if (landmarkId === 'island_03') return 'island_coral';
  if (landmarkId === 'island_04') return 'island_bastion';
  if (landmarkId === 'island_05') return 'island_kraken';
  return 'default';
}

function drawCrateIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx - 6, cy - 5, 12, 10);
  ctx.strokeStyle = '#92400e';
  ctx.strokeRect(cx - 6, cy - 5, 12, 10);
  ctx.beginPath(); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.stroke();
}

function drawScrollIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx - 5, cy - 6, 10, 12);
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - 3, cy - 4 + i * 4, 6, 1);
  }
}

function drawCannonIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx - 2, cy - 6, 4, 10);
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCompassIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5);
  ctx.lineTo(cx + 2, cy);
  ctx.lineTo(cx, cy + 1);
  ctx.closePath();
  ctx.fill();
}

function drawBinsIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx - 7, cy - 4, 5, 8);
  ctx.fillRect(cx - 1, cy - 4, 5, 8);
  ctx.fillRect(cx + 5, cy - 4, 4, 8);
}

function drawWheelIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();
  for (let a = 0; a < 4; a++) {
    const angle = (a * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 7, cy + Math.sin(angle) * 7);
    ctx.stroke();
  }
}

function drawChestIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  roundRect(ctx, cx - 6, cy - 3, 12, 8, 2);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(cx - 1, cy - 1, 2, 4);
  // Lid
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 6, Math.PI, 0);
  ctx.fill();
}

function drawBellIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 4);
  ctx.quadraticCurveTo(cx - 5, cy - 6, cx, cy - 7);
  ctx.quadraticCurveTo(cx + 5, cy - 6, cx + 5, cy + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + 5, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawScaleIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx - 0.5, cy - 7, 1, 12);
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 4);
  ctx.lineTo(cx + 6, cy - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 6, cy - 2, 3, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 6, cy - 2, 3, 0, Math.PI);
  ctx.stroke();
}

function drawNestIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI);
  ctx.fill();
  // Bird silhouette
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawNetIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.strokeStyle = ctx.fillStyle;
  for (let i = -6; i <= 6; i += 3) {
    ctx.beginPath(); ctx.moveTo(cx + i, cy - 6); ctx.lineTo(cx + i, cy + 6); ctx.stroke();
  }
  for (let j = -6; j <= 6; j += 3) {
    ctx.beginPath(); ctx.moveTo(cx - 6, cy + j); ctx.lineTo(cx + 6, cy + j); ctx.stroke();
  }
}

function drawWebIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.strokeStyle = ctx.fillStyle;
  for (let a = 0; a < 6; a++) {
    const angle = (a * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 7, cy + Math.sin(angle) * 7);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAnchorIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx - 0.5, cy - 6, 1, 12);
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 4, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 3);
  ctx.lineTo(cx + 4, cy - 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - 7, 1.5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawKeyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 1, cy + 1, 2, 8);
  ctx.fillRect(cx + 1, cy + 5, 3, 1.5);
  ctx.fillRect(cx + 1, cy + 7, 2, 1.5);
}

/* ── Island Emblem Icons (for Kraken encounter) ── */

/** Island 1 — Bay of Learning: anchor shape */
function drawIslandAnchorEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 1, cy - 2, 2, 8);
  ctx.beginPath();
  ctx.arc(cx, cy + 6, 4, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(cx - 5, cy - 1, 10, 2);
}

/** Island 2 — Driftwood Shallows: compass star */
function drawIslandCompassEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 2, cy - 1); ctx.lineTo(cx + 7, cy);
  ctx.lineTo(cx + 2, cy + 1); ctx.lineTo(cx, cy + 7); ctx.lineTo(cx - 2, cy + 1);
  ctx.lineTo(cx - 7, cy); ctx.lineTo(cx - 2, cy - 1); ctx.closePath();
  ctx.fill();
}

/** Island 3 — Coral Maze: branching coral */
function drawIslandCoralEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy + 6); ctx.lineTo(cx, cy - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx - 4, cy - 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 4, cy - 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 1); ctx.lineTo(cx - 3, cy - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 1); ctx.lineTo(cx + 3, cy - 2); ctx.stroke();
  ctx.lineWidth = 1;
}

/** Island 4 — Storm Bastion: tower/fortress */
function drawIslandBastionEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillRect(cx - 4, cy - 2, 8, 8);
  ctx.fillRect(cx - 5, cy - 4, 2, 3);
  ctx.fillRect(cx - 1, cy - 4, 2, 3);
  ctx.fillRect(cx + 3, cy - 4, 2, 3);
  ctx.fillRect(cx - 6, cy + 5, 12, 2);
}

/** Island 5 — Kraken's Reach: tentacle swirl */
function drawIslandKrakenEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 2, cy, 6, Math.PI, Math.PI * 2.3);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
}

/* ── Ship (overworld) ── */
export function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, hasMast: boolean, hasLantern: boolean): void {
  const bob = Math.sin(t * 2) * 2;
  const tilt = Math.sin(t * 1.5) * 0.08;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(tilt);

  // Hull
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-8, 6);
  ctx.lineTo(8, 6);
  ctx.lineTo(10, 0);
  ctx.lineTo(8, -2);
  ctx.lineTo(-8, -2);
  ctx.closePath();
  ctx.fill();

  // Deck highlight
  ctx.fillStyle = '#b45309';
  ctx.fillRect(-7, -2, 14, 2);

  // Mast
  const mastH = hasMast ? 18 : 14;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, -mastH);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Sail
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(1, -mastH + 2);
  ctx.lineTo(8, -mastH / 2);
  ctx.lineTo(1, -4);
  ctx.closePath();
  ctx.fill();

  // Flag / lantern glow
  if (hasLantern) {
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(0, -mastH - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba('#ec4899', 0.25);
    ctx.beginPath();
    ctx.arc(0, -mastH - 2, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-1, -mastH - 3, 5, 3);
  }

  ctx.restore();
}

/* ── Concept card (tray) ── */
export function drawConceptCard(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  glyph: string, conceptName: string, highlighted: boolean,
): void {
  // Card background
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, highlighted ? '#1e3a5f' : '#1f2937');
  grad.addColorStop(1, highlighted ? '#0f2a4e' : '#111827');
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();

  // Border
  ctx.strokeStyle = highlighted ? '#facc15' : '#22d3ee';
  ctx.lineWidth = highlighted ? 2 : 1;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Icon glyph
  ctx.fillStyle = highlighted ? '#fbbf24' : '#67e8f9';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x + w / 2, y + h / 2 - 3);

  // Name (truncated)
  ctx.fillStyle = '#94a3b8';
  ctx.font = '6px monospace';
  const displayName = conceptName.length > 8 ? conceptName.slice(0, 7) + '…' : conceptName;
  ctx.fillText(displayName, x + w / 2, y + h - 5);
  ctx.textBaseline = 'alphabetic';
}

/* ── Button ── */
export function drawButton(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  label: string, selected: boolean, fontSize = 12,
): void {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, selected ? '#1e3a5f' : '#1f2937');
  grad.addColorStop(1, selected ? '#0c2748' : '#111827');
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();

  ctx.strokeStyle = selected ? '#facc15' : '#22d3ee';
  ctx.lineWidth = selected ? 2 : 1;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.fillStyle = selected ? '#fbbf24' : '#e5e7eb';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.textBaseline = 'alphabetic';
}

/* ── Pulsing arrow indicator ── */
export function drawPulsingArrow(
  ctx: CanvasRenderingContext2D, x: number, y: number, t: number,
  direction: 'down' | 'up' | 'left' | 'right',
): void {
  const pulse = Math.sin(t * 5) * 3;
  const alpha = 0.6 + Math.sin(t * 4) * 0.3;
  ctx.fillStyle = rgba('#facc15', alpha);

  ctx.save();
  ctx.translate(x, y);
  switch (direction) {
    case 'down': break;
    case 'up': ctx.rotate(Math.PI); break;
    case 'left': ctx.rotate(Math.PI / 2); break;
    case 'right': ctx.rotate(-Math.PI / 2); break;
  }

  ctx.beginPath();
  ctx.moveTo(0, 6 + pulse);
  ctx.lineTo(-6, -2 + pulse);
  ctx.lineTo(6, -2 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ── Tutorial hint bubble (no text, icon-based) ── */
export function drawHintBubble(
  ctx: CanvasRenderingContext2D, x: number, y: number, icon: 'tap' | 'drag' | 'walk',
  t: number,
): void {
  const alpha = 0.7 + Math.sin(t * 3) * 0.2;
  ctx.fillStyle = rgba('#1e293b', 0.85);
  roundRect(ctx, x - 16, y - 14, 32, 24, 6);
  ctx.fill();
  ctx.strokeStyle = rgba('#facc15', alpha);
  roundRect(ctx, x - 16, y - 14, 32, 24, 6);
  ctx.stroke();

  ctx.fillStyle = rgba('#fbbf24', alpha);
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  switch (icon) {
    case 'tap': ctx.fillText('👆', x, y - 2); break;
    case 'drag': ctx.fillText('↕', x, y - 2); break;
    case 'walk': ctx.fillText('→', x, y - 2); break;
  }
  ctx.textBaseline = 'alphabetic';
}

/* ── Progress dots ── */
export function drawProgressDots(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  current: number, total: number,
): void {
  const spacing = 10;
  const startX = x - ((total - 1) * spacing) / 2;
  for (let i = 0; i < total; i++) {
    ctx.fillStyle = i < current ? '#facc15' : i === current ? '#22d3ee' : '#334155';
    ctx.beginPath();
    ctx.arc(startX + i * spacing, y, i === current ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── Vignette overlay ── */
export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, intensity = 0.4): void {
  const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/* ── Enemy sprites ── */
export function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string, t: number, burrowPhase?: string, burrowTimer?: number, spikesOut?: boolean): void {
  switch (kind) {
    case 'crab':        drawCrab(ctx, x, y, t); break;
    case 'fire_crab':   drawFireCrab(ctx, x, y, t); break;
    case 'jellyfish':   drawJellyfish(ctx, x, y, t); break;
    case 'shadow_jelly': drawShadowJelly(ctx, x, y, t); break;
    case 'burrower':    drawBurrower(ctx, x, y, t, burrowPhase ?? 'chasing', burrowTimer ?? 0); break;
    case 'sand_wyrm':   drawSandWyrm(ctx, x, y, t, burrowPhase ?? 'chasing', burrowTimer ?? 0); break;
    case 'urchin':      drawUrchin(ctx, x, y, t, spikesOut ?? false); break;
    case 'ray':         drawRay(ctx, x, y, t); break;
    default:            drawCrab(ctx, x, y, t); break;
  }
}

function drawCrab(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number): void {
  const scuttle = Math.sin(t * 6) * 1.5;
  // Body
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.ellipse(cx, cy + scuttle * 0.3, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shell highlight
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1 + scuttle * 0.3, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes (on stalks)
  const eyeBob = Math.sin(t * 4) * 0.8;
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath(); ctx.arc(cx - 4, cy - 5 + eyeBob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy - 5 + eyeBob, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(cx - 4.5, cy - 5.5 + eyeBob, 1.5, 1.5);
  ctx.fillRect(cx + 3.5, cy - 5.5 + eyeBob, 1.5, 1.5);
  // Claws
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  const clawAngle = Math.sin(t * 3) * 0.3;
  // Left claw
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy);
  ctx.lineTo(cx - 11, cy - 3 + scuttle);
  ctx.lineTo(cx - 9, cy - 5 + scuttle + clawAngle * 3);
  ctx.stroke();
  // Right claw
  ctx.beginPath();
  ctx.moveTo(cx + 7, cy);
  ctx.lineTo(cx + 11, cy - 3 + scuttle);
  ctx.lineTo(cx + 9, cy - 5 + scuttle - clawAngle * 3);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Legs (3 per side)
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const legPhase = Math.sin(t * 8 + i * 1.2) * 2;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy + 2 + i * 2); ctx.lineTo(cx - 9, cy + 4 + i * 2 + legPhase); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 5, cy + 2 + i * 2); ctx.lineTo(cx + 9, cy + 4 + i * 2 - legPhase); ctx.stroke();
  }
}

function drawJellyfish(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number): void {
  const pulse = Math.sin(t * 3) * 2;
  // Bell
  ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 6 + pulse * 0.5, Math.PI, 0);
  ctx.quadraticCurveTo(cx + 7, cy + 1, cx, cy + 2);
  ctx.quadraticCurveTo(cx - 7, cy + 1, cx - 6 - pulse * 0.5, cy - 2);
  ctx.fill();
  // Bell highlight
  ctx.fillStyle = 'rgba(216, 180, 254, 0.5)';
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 3, Math.PI, 0);
  ctx.fill();
  // Tentacles
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const tx = cx - 4 + i * 3;
    ctx.beginPath();
    ctx.moveTo(tx, cy + 2);
    for (let seg = 1; seg <= 3; seg++) {
      const sx = tx + Math.sin(t * 2 + i + seg) * 3;
      const sy = cy + 2 + seg * 4;
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 2, cy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 2, cy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(cx - 2.5, cy - 3.5, 1, 1);
  ctx.fillRect(cx + 1.5, cy - 3.5, 1, 1);
}

function drawBurrower(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, phase: string, timer: number): void {
  // Emergence animation: slide up from underground
  let yOff = 0;
  let bodyAlpha = 1;

  if (phase === 'emerging') {
    const prog = 1 - Math.max(0, timer / 0.6);
    yOff = (1 - prog) * 14; // slide up from below
    bodyAlpha = prog;
  } else if (phase === 'retreating') {
    const prog = Math.max(0, timer / 0.5);
    yOff = (1 - prog) * 14;
    bodyAlpha = prog;
  }

  const drawY = cy + yOff;

  // Dirt particles when emerging/retreating
  if (phase === 'emerging' || phase === 'retreating') {
    for (let i = 0; i < 4; i++) {
      const dx = (Math.random() - 0.5) * 16;
      const dy2 = Math.random() * 6;
      ctx.fillStyle = `rgba(139, 111, 71, ${0.4 * bodyAlpha})`;
      ctx.fillRect(cx + dx, drawY + 4 + dy2, 2, 2);
    }
  }

  // Warning indicator when hidden (rumbling ground)
  if (phase === 'hidden' && timer < 1.0) {
    const shake = Math.sin(t * 20) * 1.5;
    ctx.fillStyle = 'rgba(139, 111, 71, 0.3)';
    ctx.beginPath();
    ctx.ellipse(cx + shake, cy + 2, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crack lines
    ctx.strokeStyle = 'rgba(90, 70, 40, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - 5 + shake, cy + 1); ctx.lineTo(cx + 5 + shake, cy + 3); ctx.stroke();
    ctx.lineWidth = 1;
  }

  if (phase === 'hidden') return;

  ctx.save();
  ctx.globalAlpha = bodyAlpha;

  // Body — sandworm/mole creature
  const lunge = phase === 'lunging' ? Math.sin(t * 12) * 2 : 0;

  // Main body (dark green-brown)
  ctx.fillStyle = '#5c4a2a';
  ctx.beginPath();
  ctx.ellipse(cx, drawY + lunge * 0.3, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Segmented rings
  ctx.strokeStyle = '#4a3a1e';
  ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, drawY + i * 3 + lunge * 0.3, 7, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Gaping mouth (red interior)
  const mouthOpen = phase === 'lunging' ? 5 : phase === 'chasing' ? 3 + Math.sin(t * 4) : 2;
  ctx.fillStyle = '#8b1a1a';
  ctx.beginPath();
  ctx.arc(cx, drawY - 5 + lunge, mouthOpen, 0, Math.PI * 2);
  ctx.fill();
  // Teeth
  ctx.fillStyle = '#f5f0dc';
  const teethCount = 6;
  for (let i = 0; i < teethCount; i++) {
    const angle = (i / teethCount) * Math.PI * 2;
    const tx = cx + Math.cos(angle) * (mouthOpen - 0.5);
    const ty = drawY - 5 + lunge + Math.sin(angle) * (mouthOpen - 0.5);
    ctx.fillRect(tx - 0.5, ty - 0.5, 1.5, 1.5);
  }

  // Eyes (beady, on sides of head)
  ctx.fillStyle = '#fde047';
  ctx.beginPath(); ctx.arc(cx - 5, drawY - 3 + lunge * 0.5, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, drawY - 3 + lunge * 0.5, 2, 0, Math.PI * 2); ctx.fill();
  // Pupils (track player direction — for now just dots)
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(cx - 5.5, drawY - 3.5 + lunge * 0.5, 1.5, 1.5);
  ctx.fillRect(cx + 4.5, drawY - 3.5 + lunge * 0.5, 1.5, 1.5);

  // Angry brows when chasing/lunging
  if (phase === 'chasing' || phase === 'lunging') {
    ctx.strokeStyle = '#3d2a0a';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 7, drawY - 6 + lunge * 0.5); ctx.lineTo(cx - 3, drawY - 5 + lunge * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 7, drawY - 6 + lunge * 0.5); ctx.lineTo(cx + 3, drawY - 5 + lunge * 0.5); ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ── Fire Crab — gold-plated aggressive crab with flame highlights ── */
function drawFireCrab(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number): void {
  const scuttle = Math.sin(t * 8) * 2; // faster scuttle than normal crab
  // Body
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(cx, cy + scuttle * 0.3, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Gold shell highlight
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1 + scuttle * 0.3, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Flame aura
  const flameAlpha = 0.2 + Math.sin(t * 6) * 0.1;
  ctx.fillStyle = `rgba(239, 68, 68, ${flameAlpha})`;
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 10, 0, Math.PI * 2);
  ctx.fill();
  // Eyes (angry red)
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath(); ctx.arc(cx - 4, cy - 5 + Math.sin(t * 4) * 0.8, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy - 5 + Math.sin(t * 4) * 0.8, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(cx - 4.5, cy - 5.5 + Math.sin(t * 4) * 0.8, 1.5, 1.5);
  ctx.fillRect(cx + 3.5, cy - 5.5 + Math.sin(t * 4) * 0.8, 1.5, 1.5);
  // Flaming claws
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  const clawAngle = Math.sin(t * 4) * 0.4;
  ctx.beginPath(); ctx.moveTo(cx - 7, cy); ctx.lineTo(cx - 12, cy - 4 + scuttle); ctx.lineTo(cx - 9, cy - 6 + scuttle + clawAngle * 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 7, cy); ctx.lineTo(cx + 12, cy - 4 + scuttle); ctx.lineTo(cx + 9, cy - 6 + scuttle - clawAngle * 3); ctx.stroke();
  ctx.lineWidth = 1;
  // Flame tips on claws
  const tipFlicker = Math.sin(t * 12) * 1.5;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(cx - 9, cy - 7 + scuttle + tipFlicker, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy - 7 + scuttle - tipFlicker, 1.5, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const legPhase = Math.sin(t * 10 + i * 1.2) * 2;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy + 2 + i * 2); ctx.lineTo(cx - 9, cy + 4 + i * 2 + legPhase); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 5, cy + 2 + i * 2); ctx.lineTo(cx + 9, cy + 4 + i * 2 - legPhase); ctx.stroke();
  }
}

/* ── Shadow Jelly — dark translucent jellyfish, hard to see ── */
function drawShadowJelly(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number): void {
  const pulse = Math.sin(t * 2.5) * 2;
  const fadeAlpha = 0.35 + Math.sin(t * 1.5) * 0.15; // fades in and out
  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  // Dark bell
  ctx.fillStyle = 'rgba(30, 27, 75, 0.8)';
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 6 + pulse * 0.5, Math.PI, 0);
  ctx.quadraticCurveTo(cx + 7, cy + 1, cx, cy + 2);
  ctx.quadraticCurveTo(cx - 7, cy + 1, cx - 6 - pulse * 0.5, cy - 2);
  ctx.fill();
  // Dark purple highlight
  ctx.fillStyle = 'rgba(88, 28, 135, 0.5)';
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 3, Math.PI, 0);
  ctx.fill();
  // Shadow tentacles
  ctx.strokeStyle = 'rgba(30, 27, 75, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const tx = cx - 5 + i * 2.5;
    ctx.beginPath();
    ctx.moveTo(tx, cy + 2);
    for (let seg = 1; seg <= 4; seg++) {
      ctx.lineTo(tx + Math.sin(t * 1.5 + i + seg) * 3, cy + 2 + seg * 4);
    }
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  // Glowing eyes
  ctx.globalAlpha = fadeAlpha + 0.3;
  ctx.fillStyle = '#c084fc';
  ctx.beginPath(); ctx.arc(cx - 2, cy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 2, cy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ── Sand Wyrm — larger, more dangerous burrower variant ── */
function drawSandWyrm(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, phase: string, timer: number): void {
  let yOff = 0;
  let bodyAlpha = 1;

  if (phase === 'emerging') {
    const prog = 1 - Math.max(0, timer / 0.4);
    yOff = (1 - prog) * 16;
    bodyAlpha = prog;
  } else if (phase === 'retreating') {
    const prog = Math.max(0, timer / 0.5);
    yOff = (1 - prog) * 16;
    bodyAlpha = prog;
  }

  const drawY = cy + yOff;

  // Sand/dirt particles when emerging/retreating (more than regular burrower)
  if (phase === 'emerging' || phase === 'retreating') {
    for (let i = 0; i < 6; i++) {
      const dx = (Math.random() - 0.5) * 22;
      const dy2 = Math.random() * 8;
      ctx.fillStyle = `rgba(194, 164, 108, ${0.5 * bodyAlpha})`;
      ctx.fillRect(cx + dx, drawY + 4 + dy2, 2.5, 2.5);
    }
  }

  // Warning rumble (sand-colored)
  if (phase === 'hidden' && timer < 1.0) {
    const shake = Math.sin(t * 24) * 2;
    ctx.fillStyle = 'rgba(194, 164, 108, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx + shake, cy + 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 130, 80, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 8 + shake, cy); ctx.lineTo(cx + 8 + shake, cy + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 5 + shake, cy - 1); ctx.lineTo(cx - 5 + shake, cy + 4); ctx.stroke();
    ctx.lineWidth = 1;
  }

  if (phase === 'hidden') return;

  ctx.save();
  ctx.globalAlpha = bodyAlpha;

  const lunge = phase === 'lunging' ? Math.sin(t * 14) * 2.5 : 0;

  // Body — sandy-tan, larger than burrower
  ctx.fillStyle = '#c2a46c';
  ctx.beginPath();
  ctx.ellipse(cx, drawY + lunge * 0.3, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Segmented rings (sand-colored)
  ctx.strokeStyle = '#a0825a';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, drawY + i * 3 + lunge * 0.3, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Larger gaping mouth
  const mouthOpen = phase === 'lunging' ? 7 : phase === 'chasing' ? 4 + Math.sin(t * 4) : 3;
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.arc(cx, drawY - 6 + lunge, mouthOpen, 0, Math.PI * 2);
  ctx.fill();
  // Teeth — larger
  ctx.fillStyle = '#fef3c7';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const tx = cx + Math.cos(angle) * (mouthOpen - 0.5);
    const ty = drawY - 6 + lunge + Math.sin(angle) * (mouthOpen - 0.5);
    ctx.fillRect(tx - 0.7, ty - 0.7, 2, 2);
  }

  // Eyes (amber, larger)
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(cx - 6, drawY - 4 + lunge * 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6, drawY - 4 + lunge * 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(cx - 6.5, drawY - 4.5 + lunge * 0.5, 2, 2);
  ctx.fillRect(cx + 5.5, drawY - 4.5 + lunge * 0.5, 2, 2);

  // Angry brows
  if (phase === 'chasing' || phase === 'lunging') {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 9, drawY - 7 + lunge * 0.5); ctx.lineTo(cx - 4, drawY - 6 + lunge * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 9, drawY - 7 + lunge * 0.5); ctx.lineTo(cx + 4, drawY - 6 + lunge * 0.5); ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ── Reef Urchin — stationary with periodic spike burst ── */
function drawUrchin(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, spikesOut: boolean): void {
  const breathe = Math.sin(t * 2) * 1;
  const bodyR = 6 + breathe;

  // Glow when spikes are out
  if (spikesOut) {
    const glowPulse = 0.15 + Math.sin(t * 8) * 0.08;
    ctx.fillStyle = `rgba(239, 68, 68, ${glowPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body — dark purple sphere
  ctx.fillStyle = '#581c87';
  ctx.beginPath();
  ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(cx - 1, cy - 2, bodyR * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Spikes
  const spikeCount = 12;
  const spikeLen = spikesOut ? 8 + Math.sin(t * 6) * 1.5 : 3;
  ctx.strokeStyle = spikesOut ? '#ef4444' : '#7c3aed';
  ctx.lineWidth = spikesOut ? 1.5 : 1;
  for (let i = 0; i < spikeCount; i++) {
    const angle = (i / spikeCount) * Math.PI * 2 + Math.sin(t * 3 + i) * 0.1;
    const sx = cx + Math.cos(angle) * bodyR;
    const sy = cy + Math.sin(angle) * bodyR;
    const ex = cx + Math.cos(angle) * (bodyR + spikeLen);
    const ey = cy + Math.sin(angle) * (bodyR + spikeLen);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Dot eyes
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.arc(cx - 2, cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 2, cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
}

/* ── Phantom Ray — fast translucent stingray ── */
function drawRay(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number): void {
  const glide = Math.sin(t * 2) * 1.5;
  const wingFlap = Math.sin(t * 3) * 3;
  ctx.save();
  ctx.globalAlpha = 0.55 + Math.sin(t * 1.5) * 0.15;

  // Body — elongated diamond
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5 + glide);         // nose
  ctx.lineTo(cx - 12, cy + wingFlap);      // left wing tip
  ctx.lineTo(cx, cy + 7 + glide);          // tail base
  ctx.lineTo(cx + 12, cy - wingFlap);      // right wing tip
  ctx.closePath();
  ctx.fill();

  // Wing highlights
  ctx.fillStyle = 'rgba(125, 211, 252, 0.4)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 3 + glide);
  ctx.lineTo(cx - 8, cy + wingFlap * 0.5);
  ctx.lineTo(cx, cy + 4 + glide);
  ctx.lineTo(cx + 8, cy - wingFlap * 0.5);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 7 + glide);
  ctx.quadraticCurveTo(cx + Math.sin(t * 4) * 4, cy + 14 + glide, cx + Math.sin(t * 3) * 3, cy + 18 + glide);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Eyes
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath(); ctx.arc(cx - 3, cy - 1 + glide, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, cy - 1 + glide, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0c4a6e';
  ctx.fillRect(cx - 3.5, cy - 1.5 + glide, 1, 1);
  ctx.fillRect(cx + 2.5, cy - 1.5 + glide, 1, 1);

  // Sparkle trail
  ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
  for (let i = 0; i < 3; i++) {
    const sx = cx + Math.sin(t * 2 + i * 2) * 3;
    const sy = cy + 10 + i * 5 + glide;
    const sr = 1 + Math.sin(t * 4 + i) * 0.5;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

/* ── Powerup sprites ── */
export function drawPowerup(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'speed' | 'shield' | 'freeze' | 'reveal', t: number): void {
  const bob = Math.sin(t * 3 + x * 0.1) * 2;
  const glow = 0.3 + Math.sin(t * 4) * 0.15;
  const dy = y + bob;

  // Glow aura (color by kind)
  const glowColors: Record<string, string> = {
    speed: `rgba(251, 191, 36, ${glow})`,
    shield: `rgba(56, 189, 248, ${glow})`,
    freeze: `rgba(147, 197, 253, ${glow})`,
    reveal: `rgba(74, 222, 128, ${glow})`,
  };
  ctx.fillStyle = glowColors[kind] ?? glowColors.speed!;
  ctx.beginPath();
  ctx.arc(x, dy, 10, 0, Math.PI * 2);
  ctx.fill();

  // Background circle (color by kind)
  const bgColors: Record<string, string> = { speed: '#92400e', shield: '#0c4a6e', freeze: '#1e3a5f', reveal: '#14532d' };
  const borderColors: Record<string, string> = { speed: '#fbbf24', shield: '#38bdf8', freeze: '#93c5fd', reveal: '#4ade80' };
  ctx.fillStyle = bgColors[kind] ?? '#333';
  ctx.beginPath();
  ctx.arc(x, dy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = borderColors[kind] ?? '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, dy, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;

  if (kind === 'speed') {
    // Lightning bolt
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x + 1, dy - 5);
    ctx.lineTo(x - 2, dy);
    ctx.lineTo(x + 0.5, dy);
    ctx.lineTo(x - 1, dy + 5);
    ctx.lineTo(x + 2, dy);
    ctx.lineTo(x - 0.5, dy);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'shield') {
    // Shield shape
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(x, dy - 4);
    ctx.lineTo(x + 4, dy - 2);
    ctx.lineTo(x + 3, dy + 3);
    ctx.lineTo(x, dy + 5);
    ctx.lineTo(x - 3, dy + 3);
    ctx.lineTo(x - 4, dy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.moveTo(x, dy - 2);
    ctx.lineTo(x + 2, dy - 1);
    ctx.lineTo(x + 1.5, dy + 1.5);
    ctx.lineTo(x, dy + 2.5);
    ctx.lineTo(x - 1.5, dy + 1.5);
    ctx.lineTo(x - 2, dy - 1);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'freeze') {
    // Snowflake icon
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 4, dy + Math.sin(angle) * 4);
      ctx.lineTo(x - Math.cos(angle) * 4, dy - Math.sin(angle) * 4);
      ctx.stroke();
      // Branch tips
      for (const dir of [-1, 1]) {
        const tipA = angle + dir * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * 3, dy + Math.sin(angle) * 3);
        ctx.lineTo(x + Math.cos(angle) * 3 + Math.cos(tipA) * 1.5, dy + Math.sin(angle) * 3 + Math.sin(tipA) * 1.5);
        ctx.stroke();
      }
    }
    ctx.lineWidth = 1;
  } else {
    // Reveal — eye icon
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(x - 4, dy);
    ctx.quadraticCurveTo(x, dy - 4, x + 4, dy);
    ctx.quadraticCurveTo(x, dy + 4, x - 4, dy);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(x, dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Glint
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 0.5, dy - 1.5, 1, 1);
  }
}

/* ── Stun effect overlay ── */
export function drawStunEffect(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  // Spinning stars around player
  for (let i = 0; i < 3; i++) {
    const angle = t * 5 + (i * Math.PI * 2) / 3;
    const sx = x + Math.cos(angle) * 10;
    const sy = y - 14 + Math.sin(angle) * 5;
    const alpha = 0.5 + Math.sin(t * 8 + i) * 0.3;
    ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
    // 4-point star
    ctx.beginPath();
    ctx.moveTo(sx, sy - 2.5);
    ctx.lineTo(sx + 1, sy - 1);
    ctx.lineTo(sx + 2.5, sy);
    ctx.lineTo(sx + 1, sy + 1);
    ctx.lineTo(sx, sy + 2.5);
    ctx.lineTo(sx - 1, sy + 1);
    ctx.lineTo(sx - 2.5, sy);
    ctx.lineTo(sx - 1, sy - 1);
    ctx.closePath();
    ctx.fill();
  }
}

/* ── Freeze overlay (enemies frozen) ── */
export function drawFreezeOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
  // Blue tint pulse across the screen
  ctx.fillStyle = `rgba(147,197,253,${0.04 * alpha})`;
  ctx.fillRect(0, 0, w, h);
  // Snowflake particles drifting
  for (let i = 0; i < 6; i++) {
    const sx = ((t * 15 + i * 43) % w);
    const sy = ((t * 20 + i * 67) % (h * 0.7)) + 10;
    const sa = 0.3 * alpha;
    ctx.fillStyle = `rgba(200,220,255,${sa})`;
    ctx.fillRect(sx, sy, 2, 2);
    ctx.fillRect(sx - 1, sy + 1, 1, 1);
    ctx.fillRect(sx + 2, sy + 1, 1, 1);
  }
}

/* ── Reveal trail (glowing line to target landmark) ── */
export function drawRevealTrail(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, t: number, alpha: number): void {
  // Dashed glowing green line from player to target
  const segments = 12;
  ctx.strokeStyle = `rgba(74,222,128,${0.6 * alpha})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.lineDashOffset = -t * 20;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1;

  // Pulsing ring at target
  const pulse = 6 + Math.sin(t * 4) * 3;
  ctx.strokeStyle = `rgba(74,222,128,${0.5 * alpha})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(toX, toY, pulse, 0, Math.PI * 2);
  ctx.stroke();

  // Eye icon above target
  const eyeY = toY - 18;
  ctx.fillStyle = `rgba(74,222,128,${0.7 * alpha})`;
  ctx.beginPath();
  ctx.moveTo(toX - 5, eyeY);
  ctx.quadraticCurveTo(toX, eyeY - 4, toX + 5, eyeY);
  ctx.quadraticCurveTo(toX, eyeY + 4, toX - 5, eyeY);
  ctx.fill();
  ctx.fillStyle = `rgba(20,83,45,${0.7 * alpha})`;
  ctx.beginPath();
  ctx.arc(toX, eyeY, 1.5, 0, Math.PI * 2);
  ctx.fill();
  void segments;
  ctx.lineWidth = 1;
}

/* ── Stars background ── */
const STAR_CACHE: Array<{ x: number; y: number; s: number; b: number }> = [];
export function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, count = 40): void {
  while (STAR_CACHE.length < count) {
    STAR_CACHE.push({
      x: Math.random() * w,
      y: Math.random() * h * 0.5,
      s: 0.5 + Math.random() * 1.5,
      b: Math.random(),
    });
  }

  for (const star of STAR_CACHE) {
    const flicker = 0.4 + Math.sin(t * 2 + star.b * 10) * 0.3;
    ctx.fillStyle = rgba('#e2e8f0', flicker);
    ctx.fillRect(star.x, star.y, star.s, star.s);
  }
}

/* ── Flora sprites ── */

/**
 * drawFlora — Renders a flora sprite by kind at the given centre position.
 * Used in bestiary detail/list views and on the island scene for decoration.
 */
export function drawFlora(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  kind: string, t: number, scale = 1,
): void {
  ctx.save();
  ctx.translate(x, y);
  if (scale !== 1) ctx.scale(scale, scale);

  switch (kind) {
    case 'palm_tree': drawPalmTree(ctx, t); break;
    case 'mangrove': drawMangrove(ctx, t); break;
    case 'coral_fan': drawCoralFan(ctx, t); break;
    case 'storm_pine': drawStormPine(ctx, t); break;
    case 'glow_kelp': drawGlowKelp(ctx, t); break;
    case 'sea_anemone': drawSeaAnemone(ctx, t); break;
    default: /* unknown kind — draw a simple bush */
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(-1, -2, 2, 6);
      break;
  }

  ctx.restore();
}

function drawPalmTree(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 1.2) * 2;
  // Trunk
  ctx.fillStyle = '#8b6f47';
  ctx.fillRect(-2, -6, 4, 14);
  ctx.fillStyle = '#7a5e3a';
  ctx.fillRect(-1, -4, 2, 10);

  // Fronds (3 drooping leaves)
  ctx.strokeStyle = '#2d6a4f';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(i * 8 + sway, -14, i * 12 + sway * 1.5, -6);
    ctx.stroke();
  }
  // Top tuft
  ctx.fillStyle = '#358a5b';
  ctx.beginPath();
  ctx.arc(sway * 0.5, -8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;

  // Coconut
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.arc(2, -5, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMangrove(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 0.8) * 1;

  // Tangled roots
  ctx.strokeStyle = '#5c3a1e';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(angle) * 6,
      4 + Math.abs(Math.sin(angle)) * 3,
      Math.cos(angle) * 10,
      8,
    );
    ctx.stroke();
  }

  // Main trunk
  ctx.fillStyle = '#6b4a30';
  ctx.fillRect(-2, -8, 3, 10);

  // Canopy (dense lozenge)
  ctx.fillStyle = '#1b5e3a';
  ctx.beginPath();
  ctx.ellipse(sway, -10, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d6a4f';
  ctx.beginPath();
  ctx.ellipse(sway - 2, -12, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
}

function drawCoralFan(ctx: CanvasRenderingContext2D, t: number): void {
  const pulse = Math.sin(t * 2) * 0.3;

  // Base rock
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.ellipse(0, 4, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fan branches (3 coloured coral arms)
  const colours = ['#f472b6', '#fb923c', '#c084fc'];
  for (let i = 0; i < 3; i++) {
    const angle = ((i - 1) * 0.45) + Math.sin(t * 1.5 + i) * 0.1;
    ctx.strokeStyle = colours[i]!;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    const endX = Math.sin(angle) * (10 + pulse * 2);
    const endY = -10 - i * 2 + pulse;
    ctx.quadraticCurveTo(Math.sin(angle) * 5, -4, endX, endY);
    ctx.stroke();

    // Tiny polyps at branch tips
    ctx.fillStyle = colours[i]!;
    ctx.beginPath();
    ctx.arc(endX, endY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 1;
}

function drawStormPine(ctx: CanvasRenderingContext2D, t: number): void {
  const windBend = Math.sin(t * 1.8) * 3;

  // Trunk (slightly curved by wind)
  ctx.strokeStyle = '#5c3a1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(windBend * 0.3, -2, windBend * 0.5, -10);
  ctx.stroke();

  // Triangular foliage layers (wind-bent)
  const layers = [
    { y: -4, w: 10, h: 6 },
    { y: -8, w: 8, h: 5 },
    { y: -12, w: 5, h: 4 },
  ];
  for (const layer of layers) {
    ctx.fillStyle = '#1b4332';
    ctx.beginPath();
    ctx.moveTo(windBend * 0.5, layer.y - layer.h);
    ctx.lineTo(-layer.w / 2 + windBend * 0.3, layer.y);
    ctx.lineTo(layer.w / 2 + windBend * 0.7, layer.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.lineWidth = 1;
}

function drawGlowKelp(ctx: CanvasRenderingContext2D, t: number): void {
  // 3 fronds swaying
  const fronds = [
    { ox: -3, phase: 0, color: '#06b6d4' },
    { ox: 0, phase: 1.2, color: '#22d3ee' },
    { ox: 3, phase: 2.4, color: '#67e8f9' },
  ];

  for (const frond of fronds) {
    const sway = Math.sin(t * 1.3 + frond.phase) * 3;
    const glow = 0.5 + Math.sin(t * 2.5 + frond.phase) * 0.3;

    // Glow aura
    ctx.fillStyle = rgba(frond.color, glow * 0.25);
    ctx.beginPath();
    ctx.ellipse(frond.ox + sway * 0.5, -4, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stalk
    ctx.strokeStyle = rgba(frond.color, glow);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frond.ox, 6);
    ctx.quadraticCurveTo(frond.ox + sway * 0.5, -2, frond.ox + sway, -12);
    ctx.stroke();

    // Bulb at top
    ctx.fillStyle = rgba(frond.color, glow + 0.1);
    ctx.beginPath();
    ctx.arc(frond.ox + sway, -12, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 1;
}

function drawSeaAnemone(ctx: CanvasRenderingContext2D, t: number): void {
  // Base disc
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.ellipse(0, 4, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tentacles (7 waving fingers)
  const tentacleColors = ['#f472b6', '#a78bfa', '#fb923c', '#4ade80', '#f472b6', '#67e8f9', '#fde047'];
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI - Math.PI * 0.5;
    const sway = Math.sin(t * 2 + i * 0.9) * 2;
    const length = 8 + Math.sin(t * 1.5 + i) * 2;
    const tipX = Math.cos(angle) * length + sway;
    const tipY = -Math.abs(Math.sin(angle)) * length - 2;

    ctx.strokeStyle = tentacleColors[i]!;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 3, 2 - Math.abs(Math.sin(angle)) * 2);
    ctx.quadraticCurveTo(
      Math.cos(angle) * (length * 0.5) + sway * 0.5,
      tipY * 0.5,
      tipX,
      tipY,
    );
    ctx.stroke();

    // Tiny glow dot at tip
    ctx.fillStyle = tentacleColors[i]!;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 1;
}

/* ── Terrain tile previews ── */

/**
 * drawTerrain — Renders a terrain tile preview swatch at the given centre.
 * Used in bestiary detail/list views for the terrain tab.
 */
export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  kind: string, t: number, scale = 1,
): void {
  ctx.save();
  ctx.translate(x, y);
  if (scale !== 1) ctx.scale(scale, scale);

  switch (kind) {
    case 'tile_water': drawTerrainWater(ctx, t); break;
    case 'tile_sand': drawTerrainSand(ctx, t); break;
    case 'tile_grass': drawTerrainGrass(ctx, t); break;
    case 'tile_dock': drawTerrainDock(ctx); break;
    case 'tile_cobble': drawTerrainCobble(ctx); break;
    case 'tile_tide_pools': drawTerrainTidePools(ctx, t); break;
    case 'tile_ruins_stone': drawTerrainRuinsStone(ctx, t); break;
    case 'tile_volcanic': drawTerrainVolcanic(ctx, t); break;
    case 'tile_reef_pools': drawTerrainReefPools(ctx, t); break;
    case 'tile_mossy_stone': drawTerrainMossyStone(ctx); break;
    default:
      ctx.fillStyle = '#444';
      ctx.fillRect(-6, -6, 12, 12);
      break;
  }

  ctx.restore();
}

function drawTerrainWater(ctx: CanvasRenderingContext2D, t: number): void {
  // Blue tile with animated wave
  ctx.fillStyle = '#0d3b66';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillStyle = '#1a4a6e';
  ctx.fillRect(-8, -8, 16, 6);
  const wave = Math.sin(t * 2) * 2;
  ctx.strokeStyle = 'rgba(100,190,230,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, -1 + wave);
  ctx.quadraticCurveTo(-2, -3 + wave, 0, -1 + wave);
  ctx.quadraticCurveTo(4, 1 + wave, 8, -1 + wave);
  ctx.stroke();
  // Foam dot
  ctx.fillStyle = 'rgba(220,240,255,0.5)';
  ctx.fillRect(2 + Math.sin(t) * 2, 3, 2, 1);
  ctx.lineWidth = 1;
}

function drawTerrainSand(ctx: CanvasRenderingContext2D, _t: number): void {
  ctx.fillStyle = '#d4a76a';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillStyle = '#e0be88';
  ctx.fillRect(-6, -5, 5, 3);
  // Grain dots
  ctx.fillStyle = '#c49a56';
  ctx.fillRect(-3, 2, 1, 1);
  ctx.fillRect(3, -3, 1, 1);
  ctx.fillRect(-1, 5, 1, 1);
  ctx.fillRect(5, 1, 1, 1);
}

function drawTerrainGrass(ctx: CanvasRenderingContext2D, _t: number): void {
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillStyle = '#40916c';
  ctx.fillRect(-5, -6, 4, 4);
  // Tufts
  ctx.fillStyle = '#52b788';
  ctx.fillRect(-4, -2, 1, 2);
  ctx.fillRect(-3, -3, 1, 1);
  ctx.fillRect(3, 2, 1, 2);
  ctx.fillRect(4, 1, 1, 1);
}

function drawTerrainDock(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8b6f47';
  ctx.fillRect(-8, -8, 16, 16);
  // Plank lines
  ctx.strokeStyle = '#6d5535';
  ctx.lineWidth = 0.5;
  for (let ly = -6; ly <= 6; ly += 4) {
    ctx.beginPath();
    ctx.moveTo(-8, ly);
    ctx.lineTo(8, ly);
    ctx.stroke();
  }
  // Nail dots
  ctx.fillStyle = '#926e3e';
  ctx.fillRect(-5, -4, 1, 1);
  ctx.fillRect(4, 0, 1, 1);
  ctx.lineWidth = 1;
}

function drawTerrainCobble(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(-8, -8, 16, 16);
  // Stone grid
  ctx.strokeStyle = '#4e342e';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
  ctx.moveTo(0, -8); ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(-6, -6, 5, 5);
  ctx.fillRect(1, 1, 5, 5);
  ctx.lineWidth = 1;
}

function drawTerrainTidePools(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#1a6e8a';
  ctx.fillRect(-8, -8, 16, 16);
  // Shimmer
  const shimmer = Math.sin(t * 2.2) * 0.15 + 0.2;
  ctx.fillStyle = `rgba(68,184,212,${shimmer.toFixed(3)})`;
  ctx.fillRect(-6, -5, 12, 10);
  // Bubbles
  ctx.fillStyle = 'rgba(200,240,255,0.4)';
  ctx.beginPath();
  ctx.arc(-2 + Math.sin(t * 1.5) * 1, -2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, 3 + Math.sin(t * 2) * 1, 1, 0, Math.PI * 2);
  ctx.fill();
}

function drawTerrainRuinsStone(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#5c5470';
  ctx.fillRect(-8, -8, 16, 16);
  // Crack lines
  ctx.strokeStyle = '#3d3655';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(1, 8);
  ctx.moveTo(-8, 0); ctx.lineTo(8, 1);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Rune glow
  const glow = Math.sin(t * 1.5) * 0.2 + 0.25;
  ctx.fillStyle = `rgba(142,127,170,${glow.toFixed(3)})`;
  ctx.fillRect(-2, -2, 4, 4);
}

function drawTerrainVolcanic(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#3a2520';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillStyle = '#5c3a30';
  ctx.fillRect(-6, -6, 6, 4);
  // Cracks
  ctx.strokeStyle = '#251510';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-5, 2); ctx.lineTo(5, -3);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Ember glow
  const ember = Math.sin(t * 1.8) * 0.25 + 0.35;
  ctx.fillStyle = `rgba(232,93,58,${ember.toFixed(3)})`;
  ctx.fillRect(-3, 1, 2, 1);
  ctx.fillRect(2, -2, 1, 2);
}

function drawTerrainReefPools(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#2a5a6a';
  ctx.fillRect(-8, -8, 16, 16);
  // Shimmer
  const shimmer = Math.sin(t * 1.6) * 0.1 + 0.1;
  ctx.fillStyle = `rgba(58,122,138,${shimmer.toFixed(3)})`;
  ctx.fillRect(-6, -5, 12, 10);
  // Coral specks
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(-3, 2, 2, 1);
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(2, -3, 1, 2);
  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(5, 3, 1, 1);
}

function drawTerrainMossyStone(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1e5040';
  ctx.fillRect(-8, -8, 16, 16);
  // Stone crack
  ctx.strokeStyle = '#0e3828';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(8, 1);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Moss patches
  ctx.fillStyle = '#6ecc9a';
  ctx.fillRect(-5, -5, 3, 2);
  ctx.fillRect(2, 2, 3, 2);
  ctx.fillRect(-2, 4, 2, 1);
}
