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
export function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'crab' | 'jellyfish', t: number): void {
  if (kind === 'crab') {
    drawCrab(ctx, x, y, t);
  } else {
    drawJellyfish(ctx, x, y, t);
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

/* ── Powerup sprites ── */
export function drawPowerup(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'speed' | 'shield', t: number): void {
  const bob = Math.sin(t * 3 + x * 0.1) * 2;
  const glow = 0.3 + Math.sin(t * 4) * 0.15;
  const dy = y + bob;

  // Glow aura
  if (kind === 'speed') {
    ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
  } else {
    ctx.fillStyle = `rgba(56, 189, 248, ${glow})`;
  }
  ctx.beginPath();
  ctx.arc(x, dy, 10, 0, Math.PI * 2);
  ctx.fill();

  // Background circle
  ctx.fillStyle = kind === 'speed' ? '#92400e' : '#0c4a6e';
  ctx.beginPath();
  ctx.arc(x, dy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = kind === 'speed' ? '#fbbf24' : '#38bdf8';
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
  } else {
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
    // Inner shine
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
