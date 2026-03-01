/**
 * Gauntlet Scene — Endless combat/exploration, Zelda NES screen-by-screen.
 *
 * The player navigates a grid of "screens" (each 240×400). Walking to the
 * edge of one screen transitions to an adjacent screen. Every screen has
 * enemies whose quantity and power scale with the Manhattan distance from
 * the spawn screen (0,0). There are no concepts, landmarks, minigames, or
 * learning content — pure combat exploration and high-score chasing.
 *
 * Reuses: player/parrot entities, movement system, enemy entities + AI,
 *   combat overlay (island-combat), skill tree, particles, weather,
 *   powerups, tile-map rendering, vegetation, draw helpers.
 *
 * Layering: scenes/ → may import from entities/, systems/, rendering/,
 *   data/, core/, input/, audio/, telemetry/.
 */

import type { Scene } from '../core/types';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/types';
import { createPlayer, createParrot } from '../entities';
import { createEnemy, updateEnemy, type EnemyEntity, type EnemyKind } from '../entities/enemy';
import { createPowerup, type PowerupEntity, type PowerupKind } from '../entities/powerup';
import type { InputAction } from '../input/types';
import { ParticleSystem } from '../rendering/particles';
import { TileMap, type TileMapLayout } from '../rendering/tile-map';
import { TOKENS } from '../rendering/tokens';
import {
  drawPlayer, drawParrot, drawVignette, drawButton, rgba, roundRect,
  drawEnemy, drawPowerup, drawStunEffect, drawFreezeOverlay, drawFlora,
} from '../rendering/draw';
// Animation is inline (no landmarks/cards to animate in gauntlet)
import { updateMovementSystem } from '../systems/movement-system';
import { createWeatherState, updateWeatherSystem, type WeatherState } from '../systems/weather-system';
import { renderWeatherBackground, renderWeatherForeground } from '../rendering/weather';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import {
  createCombatState, updateCombat, getCombatButtonRects, getDefeatButtonRects,
  restartCombat, applyPointPowerup, getEnemyDisplayName,
  type CombatState, type CombatInput, type CombatResult, VICTORY_BONUS,
  POINT_POWERUP_COST, DEFEAT_DISPLAY_DURATION, CRIT_THRESHOLD,
} from '../systems/island-combat';
import {
  type SkillTreeState, type SkillBonuses, type SkillId,
  createSkillTree, getSkillBonuses, addSkillPoints, canUnlockSkill,
  unlockSkill, getAvailableSkills, getSkillDefinition, SKILL_DEFINITIONS,
  SP_PER_ENEMY_KILL, getDefaultBonuses,
} from '../systems/skill-tree';

// ── Constants ────────────────────────────────────────────────

/** Pixel margin from screen edge that triggers a screen transition */
const EDGE_THRESHOLD = 6;

/** Play area bounds (same as movement-system clamp) */
const MIN_X = 8;
const MAX_X = 220;
const MIN_Y = 64;
const MAX_Y = 308;

/** Transition animation duration in seconds */
const TRANSITION_DURATION = 0.8;

/** Base enemy count on the spawn screen (distance 0) */
const BASE_ENEMY_COUNT = 2;

/** Additional enemies per Manhattan distance from origin */
const ENEMIES_PER_DISTANCE = 0.8;

/** Maximum enemies on a single screen */
const MAX_ENEMIES_PER_SCREEN = 8;

/** Powerup spawn chance per screen (0..1) */
const POWERUP_CHANCE = 0.5;

/** Max powerups per screen */
const MAX_POWERUPS = 2;

const PAUSE_BUTTON = { x: 206, y: 8, w: 24, h: 22 };
const SKILL_BUTTON = { x: 8, y: 8, w: 36, h: 20 };
const SKILL_CLOSE_BUTTON = { x: 90, y: 370, w: 60, h: 22 };

// ── Simple seeded RNG for deterministic per-screen content ───

function screenSeed(sx: number, sy: number): number {
  let h = (sx * 374761 + sy * 668265 + 12345) | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return ((h >> 16) ^ h) & 0x7fffffff;
}

function seededRandom(seed: number, index: number): number {
  let h = (seed + index * 16807) | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return (((h >> 16) ^ h) & 0x7fffffff) / 0x7fffffff;
}

// ── Deps ─────────────────────────────────────────────────────

export interface GauntletSceneDeps {
  telemetry: TelemetryClient;
  audio: AudioManager;
  onPause?: () => void;
  onGameOver?: (score: number, screensVisited: number) => void;
  /** Persistent skill tree state (shared across the run) */
  skillTree?: SkillTreeState;
}

// ── Helper ───────────────────────────────────────────────────

function hitTest(px: number, py: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

/** Evaluate a cubic Bézier at parameter t ∈ [0,1]. */
function cubicBezierPoint(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  t: number,
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3,
    y: mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3,
  };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Manhattan distance from origin */
function screenDistance(sx: number, sy: number): number {
  return Math.abs(sx) + Math.abs(sy);
}

// ── Enemy kind selection by difficulty ───────────────────────

const ENEMY_TIERS: EnemyKind[][] = [
  ['crab'],                                           // distance 0
  ['crab', 'fire_crab'],                              // distance 1
  ['crab', 'fire_crab', 'jellyfish'],                 // distance 2
  ['fire_crab', 'jellyfish', 'burrower'],             // distance 3
  ['fire_crab', 'jellyfish', 'burrower', 'shadow_jelly'], // distance 4
  ['jellyfish', 'burrower', 'shadow_jelly', 'sand_wyrm'], // distance 5
  ['burrower', 'shadow_jelly', 'sand_wyrm', 'urchin'],    // distance 6
  ['shadow_jelly', 'sand_wyrm', 'urchin', 'ray'],         // distance 7+
];

function getEnemyPool(dist: number): EnemyKind[] {
  const idx = Math.min(dist, ENEMY_TIERS.length - 1);
  return ENEMY_TIERS[idx]!;
}

// ── Tile map templates by distance tier ──────────────────────

function generateScreenLayout(sx: number, sy: number): TileMapLayout {
  const seed = screenSeed(sx, sy);
  const dist = screenDistance(sx, sy);

  // Pick a dominant ground tile based on distance
  const groundTiles = ['S', 'G', 'D', 'R', 'V', 'M'];
  const ground = groundTiles[seed % groundTiles.length]!;
  const accent = dist > 3 ? 'V' : dist > 1 ? 'R' : 'T';

  const rows: string[] = [];
  for (let row = 0; row < 25; row++) {
    if (row < 4 || row > 22) {
      rows.push('WWWWWWWWWWWWWWW');
    } else {
      let line = '';
      for (let col = 0; col < 15; col++) {
        // Water borders
        if (col === 0 || col === 14) {
          line += 'W';
        } else if (col === 1 || col === 13) {
          // Sandy shore along edges
          line += 'S';
        } else {
          // Sprinkle some accent tiles
          const tileRnd = seededRandom(seed, row * 15 + col);
          if (tileRnd < 0.08) {
            line += accent;
          } else {
            line += ground;
          }
        }
      }
      rows.push(line);
    }
  }

  return { tileSize: 16, width: 15, height: 25, rows };
}

// ── Vegetation generation ────────────────────────────────────

function generateVegetation(sx: number, sy: number): Array<{ x: number; y: number; kind: string; scale: number }> {
  const seed = screenSeed(sx, sy);
  const count = 3 + (seed % 5);
  const kinds = ['palm', 'bush', 'fern', 'dead_tree', 'mushroom'];
  const sprites: Array<{ x: number; y: number; kind: string; scale: number }> = [];

  for (let i = 0; i < count; i++) {
    const rx = seededRandom(seed, 100 + i);
    const ry = seededRandom(seed, 200 + i);
    sprites.push({
      x: 24 + rx * 192,
      y: 80 + ry * 200,
      kind: kinds[Math.floor(seededRandom(seed, 300 + i) * kinds.length)]!,
      scale: 0.8 + seededRandom(seed, 400 + i) * 0.4,
    });
  }
  return sprites;
}

// ══════════════════════════════════════════════════════════════
// MAIN SCENE CLASS
// ══════════════════════════════════════════════════════════════

export class GauntletScene implements Scene {
  // ── Player / entities ──
  private readonly player = createPlayer(GAME_WIDTH / 2, GAME_HEIGHT - 80);
  private readonly parrot = createParrot(GAME_WIDTH / 2 - 6, GAME_HEIGHT - 92);
  private readonly particles = new ParticleSystem();

  // ── Screen-based world ──
  private screenX = 0;
  private screenY = 0;
  private enemies: EnemyEntity[] = [];
  private powerups: PowerupEntity[] = [];
  private tileMap: TileMap;
  private vegetationSprites: Array<{ x: number; y: number; kind: string; scale: number }> = [];

  // ── Transition animation ──
  private transitioning = false;
  private transitionTimer = 0;
  private transitionDx = 0;
  private transitionDy = 0;
  private transitionSwapped = false;

  // ── Weather ──
  private readonly weatherState: WeatherState;

  // ── Combat overlay ──
  private combatState: CombatState | null = null;
  private combatEnemyId = '';
  private combatChargeHeld = false;
  private combatShakeTimer = 0;
  private combatDamageTexts: Array<{ x: number; y: number; text: string; timer: number; color: string; dy: number }> = [];
  private combatImmunityTimer = 0;

  // ── Player state ──
  private playerStunTimer = 0;
  private playerShielded = false;
  private playerSpeedBoost = false;
  private speedBoostTimer = 0;
  private shieldTimer = 0;
  private freezeTimer = 0;

  // ── Score ──
  private score = 0;
  private screensVisited = 1;
  private furthestDistance = 0;
  private killCount = 0;
  private scorePopups: Array<{ x: number; y: number; text: string; timer: number }> = [];

  // ── Skill tree ──
  private readonly skillTree: SkillTreeState;
  private skillTreeOpen = false;
  private skillBonuses: SkillBonuses;

  // ── Arrival overlay ──
  private arrivalElapsed = 0;
  private screenArrivalName = 'Abyssal Gauntlet';

  // ── Timing ──
  private nowMs = 0;

  // ── Visited screens (for tracking) ──
  private readonly visitedScreens = new Set<string>();

  constructor(private readonly deps: GauntletSceneDeps) {
    this.skillTree = deps.skillTree ?? createSkillTree();
    this.skillBonuses = getSkillBonuses(this.skillTree);
    this.weatherState = createWeatherState('battle');
    this.tileMap = new TileMap(generateScreenLayout(0, 0));
    this.vegetationSprites = generateVegetation(0, 0);
    this.visitedScreens.add('0,0');
    this.populateScreen();
  }

  // ── Scene lifecycle ────────────────────────────────────────

  enter(_ctx: unknown): void {
    this.arrivalElapsed = 0;
    this.screenArrivalName = 'Abyssal Gauntlet';
  }

  exit(): void {
    // no-op
  }

  // ── Update ─────────────────────────────────────────────────

  update(dt: number, actions: InputAction[]): void {
    this.nowMs += dt * 1000;
    this.arrivalElapsed += dt;

    // ── Score popups fade ──
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i]!;
      popup.timer -= dt;
      popup.y -= dt * 20;
      if (popup.timer <= 0) this.scorePopups.splice(i, 1);
    }

    // ── Combat overlay blocks everything ──
    if (this.combatState) {
      this.updateCombatOverlay(dt, actions);
      return;
    }

    // ── Skill tree overlay blocks gameplay ──
    if (this.skillTreeOpen) {
      this.updateSkillTree(actions);
      return;
    }

    // ── Transition animation blocks gameplay ──
    if (this.transitioning) {
      this.transitionTimer -= dt;
      const progress = 1 - (this.transitionTimer / TRANSITION_DURATION);
      if (progress >= 0.45 && !this.transitionSwapped) {
        this.executeScreenSwap();
      }
      if (this.transitionTimer <= 0) {
        this.transitioning = false;
      }
      return;
    }

    // ── Pause button ──
    for (const action of actions) {
      if (action.type === 'primary' && hitTest(action.x, action.y, PAUSE_BUTTON)) {
        this.deps.onPause?.();
        return;
      }
      // Skill tree button
      if (action.type === 'primary' && hitTest(action.x, action.y, SKILL_BUTTON)) {
        this.skillTreeOpen = true;
        return;
      }
    }

    // ── Stun recovery ──
    if (this.playerStunTimer > 0) {
      this.playerStunTimer -= dt;
      this.player.state.animationTime += dt;
      this.parrot.state.animationTime += dt;
      return;
    }

    // ── Powerup timers ──
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) this.playerSpeedBoost = false;
    }
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) this.playerShielded = false;
    }
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
    }
    if (this.combatImmunityTimer > 0) {
      this.combatImmunityTimer -= dt;
    }

    // ── Movement ──
    const baseSpeed = this.playerSpeedBoost ? 1.5 : 1;
    const prevSpeed = this.player.state.speed;
    this.player.state.speed = 55 * baseSpeed;
    updateMovementSystem(this.player, this.parrot, actions, dt);
    this.player.state.speed = prevSpeed || 55;

    // ── Edge detection → screen transition ──
    this.checkScreenTransition();

    // ── Enemy update + collision ──
    for (const enemy of this.enemies) {
      if (enemy.state.defeated) continue;

      if (this.freezeTimer <= 0) {
        updateEnemy(enemy, dt, {
          x: this.player.position.x,
          y: this.player.position.y,
        });
      }

      // Collision check
      if (this.combatImmunityTimer <= 0) {
        const ex = enemy.position.x - this.player.position.x;
        const ey = enemy.position.y - (this.player.position.y - 4);
        const dist = Math.sqrt(ex * ex + ey * ey);
        const collisionRadius = enemy.state.kind === 'burrower' && enemy.state.burrowPhase === 'hidden' ? 0 : 12;

        if (dist < collisionRadius) {
          if (this.playerShielded) {
            // Shield absorbs the hit
            this.playerShielded = false;
            this.shieldTimer = 0;
            enemy.state.defeated = true;
            this.particles.emitSparkle(enemy.position.x, enemy.position.y);
            this.addScore(25, enemy.position.x, enemy.position.y);
            this.killCount += 1;
          } else {
            // Start combat
            this.triggerCombat(enemy);
          }
        }
      }
    }

    // ── Powerup collection ──
    for (const pu of this.powerups) {
      if (pu.state.collected) continue;
      const dx = pu.position.x - this.player.position.x;
      const dy = pu.position.y - (this.player.position.y - 4);
      if (Math.sqrt(dx * dx + dy * dy) < 14) {
        pu.state.collected = true;
        this.particles.emitSparkle(pu.position.x, pu.position.y);
        this.applyPowerup(pu.state.kind);
      }
    }

    // ── Animation, weather, particles ──
    this.player.state.animationTime += dt;
    this.parrot.state.animationTime += dt;
    updateWeatherSystem(this.weatherState, dt, 'battle');
    this.particles.update(dt);
  }

  // ── Render ─────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.nowMs / 1000;

    // Sky
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Weather background
    renderWeatherBackground(ctx, this.weatherState, GAME_WIDTH, GAME_HEIGHT);

    // Tile map
    this.tileMap.render(ctx, 0, 0, t);

    // Vegetation
    for (const v of this.vegetationSprites) {
      drawFlora(ctx, v.x, v.y, v.kind, t, v.scale);
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (enemy.state.defeated) continue;
      const frozen = this.freezeTimer > 0;
      if (frozen) ctx.globalAlpha = 0.6;
      drawEnemy(ctx, enemy.position.x, enemy.position.y, enemy.state.kind, t,
        enemy.state.burrowPhase, enemy.state.burrowTimer, enemy.state.spikesOut);
      if (frozen) {
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
    }

    // Powerups
    for (const pu of this.powerups) {
      if (!pu.state.collected) {
        drawPowerup(ctx, pu.position.x, pu.position.y, pu.state.kind, t);
      }
    }

    // Freeze overlay
    if (this.freezeTimer > 0) {
      const fadeAlpha = Math.min(1, this.freezeTimer / 0.5);
      drawFreezeOverlay(ctx, GAME_WIDTH, GAME_HEIGHT, t, fadeAlpha);
    }

    // Player + parrot
    drawPlayer(ctx, this.player.position.x, this.player.position.y, this.player.state.animationTime);
    drawParrot(ctx, this.parrot.position.x, this.parrot.position.y, this.parrot.state.animationTime);

    // Stun effect
    if (this.playerStunTimer > 0) {
      drawStunEffect(ctx, this.player.position.x, this.player.position.y, t);
    }

    // Shield indicator
    if (this.playerShielded) {
      const shieldAlpha = 0.2 + Math.sin(t * 3) * 0.1;
      ctx.strokeStyle = `rgba(56, 189, 248, ${shieldAlpha + 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.player.position.x, this.player.position.y - 4, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    this.particles.render(ctx);

    // Weather foreground
    renderWeatherForeground(ctx, this.weatherState, GAME_WIDTH, GAME_HEIGHT);

    // ── HUD ──
    this.renderGauntletHud(ctx, t);

    // ── Arrival overlay ──
    if (this.arrivalElapsed < 1.2) {
      const arrivalAlpha = Math.max(0, 1 - this.arrivalElapsed / 0.7);
      ctx.fillStyle = rgba('#070b14', arrivalAlpha * 0.7);
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      const nameAlpha = Math.min(1, this.arrivalElapsed / 0.4);
      ctx.fillStyle = rgba('#facc15', nameAlpha);
      ctx.font = TOKENS.fontLarge;
      ctx.textAlign = 'center';
      ctx.fillText(this.screenArrivalName, GAME_WIDTH / 2, 180);

      ctx.fillStyle = rgba('#ef4444', nameAlpha * 0.7);
      ctx.font = TOKENS.fontSmall;
      ctx.fillText('Slay yer way to glory!', GAME_WIDTH / 2, 200);
    }

    // ── Tentacle transition animation ──
    if (this.transitioning) {
      this.renderTentacleTransition(ctx, t);
    }

    // Pause button
    ctx.fillStyle = TOKENS.colorPanel;
    roundRect(ctx, PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.w, PAUSE_BUTTON.h, 4);
    ctx.fill();
    ctx.strokeStyle = TOKENS.colorCyan400;
    roundRect(ctx, PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.w, PAUSE_BUTTON.h, 4);
    ctx.stroke();
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('II', PAUSE_BUTTON.x + 12, PAUSE_BUTTON.y + 15);

    // Skill tree button
    const spCount = this.skillTree.skillPoints;
    drawButton(ctx, SKILL_BUTTON.x, SKILL_BUTTON.y, SKILL_BUTTON.w, SKILL_BUTTON.h,
      spCount > 0 ? `SK ${spCount}` : 'SK', spCount > 0, 8);

    drawVignette(ctx, GAME_WIDTH, GAME_HEIGHT, 0.25);

    // Score popups
    this.renderScorePopups(ctx);

    // Combat overlay
    this.renderCombatOverlay(ctx);

    // Skill tree overlay
    this.renderSkillTreeOverlay(ctx);
  }

  // ── Gauntlet-specific HUD ──────────────────────────────────

  private renderGauntletHud(ctx: CanvasRenderingContext2D, _t: number): void {
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`★ ${Math.floor(this.score)}`, 50, 16);

    // Screen coordinate display
    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'right';
    ctx.fillText(`(${this.screenX}, ${this.screenY})`, GAME_WIDTH - 32, 16);

    // Kill counter
    ctx.textAlign = 'left';
    ctx.fillStyle = TOKENS.colorRed400;
    ctx.fillText(`☠ ${this.killCount}`, 50, 30);

    // Distance indicator
    const dist = screenDistance(this.screenX, this.screenY);
    ctx.fillStyle = dist > 4 ? TOKENS.colorRed400 : dist > 2 ? TOKENS.colorYellow400 : TOKENS.colorGreen400;
    ctx.textAlign = 'right';
    ctx.fillText(`Depth ${dist}`, GAME_WIDTH - 32, 30);

    // Directional arrows at edges
    this.renderEdgeArrows(ctx);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  /** Small arrows at edges showing which direction the player can go */
  private renderEdgeArrows(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = rgba('#facc15', 0.35);
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Left arrow
    ctx.fillText('◀', 6, GAME_HEIGHT / 2);
    // Right arrow
    ctx.fillText('▶', GAME_WIDTH - 6, GAME_HEIGHT / 2);
    // Up arrow
    ctx.fillText('▲', GAME_WIDTH / 2, MIN_Y + 4);
    // Down arrow
    ctx.fillText('▼', GAME_WIDTH / 2, MAX_Y + 8);
  }

  // ── Screen transition ──────────────────────────────────────

  private checkScreenTransition(): void {
    const px = this.player.position.x;
    const py = this.player.position.y;

    if (px <= MIN_X + EDGE_THRESHOLD) {
      this.startTransition(-1, 0);
    } else if (px >= MAX_X - EDGE_THRESHOLD) {
      this.startTransition(1, 0);
    } else if (py <= MIN_Y + EDGE_THRESHOLD) {
      this.startTransition(0, -1);
    } else if (py >= MAX_Y - EDGE_THRESHOLD) {
      this.startTransition(0, 1);
    }
  }

  private startTransition(dx: number, dy: number): void {
    this.transitioning = true;
    this.transitionTimer = TRANSITION_DURATION;
    this.transitionDx = dx;
    this.transitionDy = dy;
    this.transitionSwapped = false;
  }

  private executeScreenSwap(): void {
    this.transitionSwapped = true;
    this.screenX += this.transitionDx;
    this.screenY += this.transitionDy;

    // Track visited screens
    const key = `${this.screenX},${this.screenY}`;
    if (!this.visitedScreens.has(key)) {
      this.visitedScreens.add(key);
      this.screensVisited += 1;
    }

    const dist = screenDistance(this.screenX, this.screenY);
    if (dist > this.furthestDistance) {
      this.furthestDistance = dist;
      this.addScore(50 * dist, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    }

    // Place player on opposite edge
    if (this.transitionDx < 0) {
      this.player.position.x = MAX_X - EDGE_THRESHOLD - 4;
    } else if (this.transitionDx > 0) {
      this.player.position.x = MIN_X + EDGE_THRESHOLD + 4;
    }
    if (this.transitionDy < 0) {
      this.player.position.y = MAX_Y - EDGE_THRESHOLD - 4;
    } else if (this.transitionDy > 0) {
      this.player.position.y = MIN_Y + EDGE_THRESHOLD + 4;
    }

    // Parrot follows
    this.parrot.position.x = this.player.position.x - 6;
    this.parrot.position.y = this.player.position.y - 12;

    // Reset targeting
    this.player.state.targetX = this.player.position.x;
    this.player.state.targetY = this.player.position.y;

    // Load new screen
    this.tileMap = new TileMap(generateScreenLayout(this.screenX, this.screenY));
    this.vegetationSprites = generateVegetation(this.screenX, this.screenY);
    this.populateScreen();

    // Screen arrival
    this.arrivalElapsed = 0;
    this.screenArrivalName = this.getScreenName();

    // Reset timers
    this.combatImmunityTimer = 0.5;
  }

  // ── Tentacle transition rendering ──────────────────────────

  private renderTentacleTransition(ctx: CanvasRenderingContext2D, t: number): void {
    const progress = 1 - (this.transitionTimer / TRANSITION_DURATION);

    // Compute tentacle reach: 0→1→0 over the transition
    let reach: number;
    if (progress < 0.35) {
      reach = easeOutCubic(progress / 0.35);
    } else if (progress < 0.65) {
      reach = 1;
    } else {
      reach = 1 - easeOutCubic((progress - 0.65) / 0.35);
    }

    const dx = this.transitionDx;
    const dy = this.transitionDy;

    // ── Ink wash overlay that follows the tentacles ──
    const washAlpha = Math.min(0.7, reach * 0.75);
    if (dx !== 0) {
      // Horizontal transition: gradient from the arrival edge
      const washW = reach * GAME_WIDTH * 0.85;
      const gradX0 = dx > 0 ? GAME_WIDTH : 0;
      const gradX1 = dx > 0 ? GAME_WIDTH - washW : washW;
      const grad = ctx.createLinearGradient(gradX0, 0, gradX1, 0);
      grad.addColorStop(0, rgba('#070b14', washAlpha));
      grad.addColorStop(0.6, rgba('#0b1628', washAlpha * 0.6));
      grad.addColorStop(1, rgba('#070b14', 0));
      ctx.fillStyle = grad;
      if (dx > 0) {
        ctx.fillRect(GAME_WIDTH - washW, 0, washW, GAME_HEIGHT);
      } else {
        ctx.fillRect(0, 0, washW, GAME_HEIGHT);
      }
    } else {
      // Vertical transition: gradient from the arrival edge
      const washH = reach * GAME_HEIGHT * 0.85;
      const gradY0 = dy > 0 ? GAME_HEIGHT : 0;
      const gradY1 = dy > 0 ? GAME_HEIGHT - washH : washH;
      const grad = ctx.createLinearGradient(0, gradY0, 0, gradY1);
      grad.addColorStop(0, rgba('#070b14', washAlpha));
      grad.addColorStop(0.6, rgba('#0b1628', washAlpha * 0.6));
      grad.addColorStop(1, rgba('#070b14', 0));
      ctx.fillStyle = grad;
      if (dy > 0) {
        ctx.fillRect(0, GAME_HEIGHT - washH, GAME_WIDTH, washH);
      } else {
        ctx.fillRect(0, 0, GAME_WIDTH, washH);
      }
    }

    // ── Tentacles ──
    const configs = [
      { posFrac: 0.15, phase: 0.0, thick: 7,  reachMult: 0.70 },
      { posFrac: 0.32, phase: 1.2, thick: 10, reachMult: 0.85 },
      { posFrac: 0.50, phase: 2.5, thick: 12, reachMult: 1.00 },
      { posFrac: 0.68, phase: 3.8, thick: 9,  reachMult: 0.78 },
      { posFrac: 0.85, phase: 5.0, thick: 7,  reachMult: 0.62 },
    ];

    for (const cfg of configs) {
      const wave = Math.sin(t * 0.8 + cfg.phase) * 6;
      const crossWave = Math.sin(t * 1.1 + cfg.phase * 0.7) * 8;

      if (dx !== 0) {
        // Horizontal tentacles (spread along Y axis)
        const posY = GAME_HEIGHT * cfg.posFrac;
        const baseX = dx > 0 ? GAME_WIDTH + 25 : -25;
        const maxReach = GAME_WIDTH * 0.75 * cfg.reachMult;
        const gripX = dx > 0
          ? GAME_WIDTH - reach * maxReach
          : reach * maxReach;
        this.drawGauntletTentacle(
          ctx, t, baseX, posY, gripX, posY + wave + crossWave,
          cfg.thick, cfg.phase, dx > 0,
        );
      } else {
        // Vertical tentacles (spread along X axis)
        const posX = GAME_WIDTH * cfg.posFrac;
        const baseY = dy > 0 ? GAME_HEIGHT + 25 : -25;
        const maxReach = GAME_HEIGHT * 0.75 * cfg.reachMult;
        const gripY = dy > 0
          ? GAME_HEIGHT - reach * maxReach
          : reach * maxReach;
        this.drawGauntletTentacle(
          ctx, t, posX + crossWave, baseY, posX + wave, gripY,
          cfg.thick, cfg.phase, dy > 0,
        );
      }
    }

    // ── Player-grab tentacle ──
    // One special tentacle reaches for the player, picks them up, and sets them down
    this.renderPlayerGrabTentacle(ctx, t, progress, reach, dx, dy);
  }

  /**
   * A single thick tentacle that grabs the player sprite, lifts them
   * during the mid-transition, then sets them back down on the new screen.
   */
  private renderPlayerGrabTentacle(
    ctx: CanvasRenderingContext2D,
    t: number, progress: number, reach: number,
    dx: number, dy: number,
  ): void {
    const px = this.player.position.x;
    const py = this.player.position.y;

    // Phases: 0–0.30 reach toward player, 0.30–0.40 grab & lift,
    //         0.40–0.60 hold up (screen swaps underneath),
    //         0.60–0.75 lower, 0.75–1.0 retract
    let grabReach: number;   // 0→1 how far the tentacle has extended
    let liftAmount: number;  // 0→1 how high the player is lifted
    let isHolding: boolean;
    if (progress < 0.30) {
      grabReach = easeOutCubic(progress / 0.30);
      liftAmount = 0;
      isHolding = false;
    } else if (progress < 0.40) {
      grabReach = 1;
      liftAmount = easeOutCubic((progress - 0.30) / 0.10);
      isHolding = true;
    } else if (progress < 0.60) {
      grabReach = 1;
      liftAmount = 1;
      isHolding = true;
    } else if (progress < 0.75) {
      grabReach = 1;
      liftAmount = 1 - easeOutCubic((progress - 0.60) / 0.15);
      isHolding = true;
    } else {
      grabReach = 1 - easeOutCubic((progress - 0.75) / 0.25);
      liftAmount = 0;
      isHolding = false;
    }

    const liftPx = liftAmount * 40;

    // Tentacle base: comes from the transition direction edge
    let baseX: number, baseY: number;
    if (dx !== 0) {
      baseX = dx > 0 ? GAME_WIDTH + 30 : -30;
      baseY = py + 20;
    } else {
      baseX = px + (px < GAME_WIDTH / 2 ? -30 : 30);
      baseY = dy > 0 ? GAME_HEIGHT + 30 : -30;
    }

    // Grip position — interpolates toward the player as grabReach goes 0→1
    const gripX = baseX + (px - baseX) * grabReach;
    const gripY = baseY + ((py - liftPx) - baseY) * grabReach;

    // Only draw when there's meaningful reach
    if (grabReach > 0.02) {
      this.drawGauntletTentacle(
        ctx, t, baseX, baseY, gripX, gripY,
        14, 4.2, dx > 0 || dy > 0,
      );
    }

    // When holding, re-draw the player lifted above the tentacle tip
    if (isHolding && grabReach > 0.8) {
      drawPlayer(ctx, px, py - liftPx, this.player.state.animationTime);
      drawParrot(ctx, px - 6, py - liftPx - 12, this.parrot.state.animationTime);
    }
  }

  /**
   * Draw a single tapered tentacle from (baseX,baseY) to (gripX,gripY).
   * Adapted from IntroScene's Kraken curtain-pull tentacles.
   */
  private drawGauntletTentacle(
    ctx: CanvasRenderingContext2D,
    t: number,
    baseX: number, baseY: number,
    gripX: number, gripY: number,
    thickness: number,
    phase: number,
    flipSuckers: boolean,
  ): void {
    const ddx = gripX - baseX;
    const ddy = gripY - baseY;

    const wave1 = Math.sin(t * 1.5 + phase) * 12;
    const wave2 = Math.sin(t * 1.8 + phase + 1.2) * 10;

    // Control points offset perpendicular to the tentacle direction
    const cp1x = baseX + ddx * 0.35;
    const cp1y = baseY + ddy * 0.35 - 20 + wave1;
    const cp2x = baseX + ddx * 0.65;
    const cp2y = baseY + ddy * 0.65 + 15 + wave2;

    ctx.save();
    ctx.lineCap = 'round';

    // Tapered tentacle body via segmented strokes
    const SEGS = 12;
    for (let i = 0; i < SEGS; i++) {
      const t1 = i / SEGS;
      const t2 = (i + 1) / SEGS;
      const p1 = cubicBezierPoint(baseX, baseY, cp1x, cp1y, cp2x, cp2y, gripX, gripY, t1);
      const p2 = cubicBezierPoint(baseX, baseY, cp1x, cp1y, cp2x, cp2y, gripX, gripY, t2);
      const w = thickness * (1 - t2 * 0.7);

      // Dark outline
      ctx.strokeStyle = '#0e3a2f';
      ctx.lineWidth = w + 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Fleshy body
      ctx.strokeStyle = '#1a6b55';
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Specular highlight
      ctx.strokeStyle = 'rgba(60,180,130,0.35)';
      ctx.lineWidth = w * 0.3;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y - w * 0.15);
      ctx.lineTo(p2.x, p2.y - w * 0.15);
      ctx.stroke();
    }

    // Suckers along inner side
    const sign = flipSuckers ? -1 : 1;
    for (let i = 2; i < SEGS; i += 2) {
      const st = i / SEGS;
      const p = cubicBezierPoint(baseX, baseY, cp1x, cp1y, cp2x, cp2y, gripX, gripY, st);
      const w = thickness * (1 - st * 0.7);
      const suckerR = w * 0.22;
      if (suckerR < 0.8) continue;
      const ox = sign * w * 0.3;
      // Outer ring
      ctx.fillStyle = '#d4b8be';
      ctx.beginPath();
      ctx.arc(p.x + ox, p.y, suckerR, 0, Math.PI * 2);
      ctx.fill();
      // Dark centre
      ctx.fillStyle = '#9a7078';
      ctx.beginPath();
      ctx.arc(p.x + ox, p.y, suckerR * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Curled tip — organic spiral that coils inward
    const tipP = cubicBezierPoint(baseX, baseY, cp1x, cp1y, cp2x, cp2y, gripX, gripY, 1);
    const preTip = cubicBezierPoint(baseX, baseY, cp1x, cp1y, cp2x, cp2y, gripX, gripY, 0.92);
    // Derive curl direction from the tentacle's approach angle
    const approachAngle = Math.atan2(tipP.y - preTip.y, tipP.x - preTip.x);
    const curlSign = flipSuckers ? 1 : -1;
    const spiralSegs = 8;
    const spiralLen = 12 + Math.sin(t * 2 + phase) * 3;
    ctx.strokeStyle = '#1a6b55';
    ctx.lineWidth = thickness * 0.25;
    ctx.beginPath();
    ctx.moveTo(tipP.x, tipP.y);
    for (let s = 1; s <= spiralSegs; s++) {
      const frac = s / spiralSegs;
      const r = spiralLen * frac * (1 - frac * 0.3);
      const angle = approachAngle + curlSign * frac * Math.PI * 1.6
        + Math.sin(t * 1.4 + phase) * 0.3;
      ctx.lineTo(
        tipP.x + Math.cos(angle) * r,
        tipP.y + Math.sin(angle) * r,
      );
      ctx.lineWidth = Math.max(0.5, thickness * 0.25 * (1 - frac * 0.8));
    }
    ctx.stroke();

    // Tiny sucker at the spiral tip
    const lastAngle = approachAngle + curlSign * Math.PI * 1.6
      + Math.sin(t * 1.4 + phase) * 0.3;
    const lastR = spiralLen * (1 - 0.3);
    ctx.fillStyle = '#d4b8be';
    ctx.beginPath();
    ctx.arc(
      tipP.x + Math.cos(lastAngle) * lastR,
      tipP.y + Math.sin(lastAngle) * lastR,
      1.2, 0, Math.PI * 2,
    );
    ctx.fill();

    ctx.restore();
  }

  /** Generate a flavourful screen name based on coordinates */
  private getScreenName(): string {
    const dist = screenDistance(this.screenX, this.screenY);
    if (dist === 0) return 'Spawn Point';
    const prefixes = ['Bone', 'Blood', 'Iron', 'Shadow', 'Storm', 'Abyss', 'Wreck', 'Crimson'];
    const suffixes = ['Shore', 'Reef', 'Trench', 'Maw', 'Deep', 'Hollow', 'Ruins', 'Gate'];
    const seed = screenSeed(this.screenX, this.screenY);
    return `${prefixes[seed % prefixes.length]} ${suffixes[(seed >> 4) % suffixes.length]}`;
  }

  // ── Screen population ──────────────────────────────────────

  private populateScreen(): void {
    const dist = screenDistance(this.screenX, this.screenY);
    const seed = screenSeed(this.screenX, this.screenY);
    const pool = getEnemyPool(dist);

    // Enemies
    const count = Math.min(
      MAX_ENEMIES_PER_SCREEN,
      Math.floor(BASE_ENEMY_COUNT + dist * ENEMIES_PER_DISTANCE),
    );

    this.enemies = [];
    for (let i = 0; i < count; i++) {
      const kind = pool[Math.floor(seededRandom(seed, i) * pool.length)]!;
      const ax = 24 + seededRandom(seed, 10 + i) * 180;
      const ay = 80 + seededRandom(seed, 20 + i) * 200;
      const bx = 24 + seededRandom(seed, 30 + i) * 180;
      const by = 80 + seededRandom(seed, 40 + i) * 200;
      const baseSpeed = 15 + dist * 3;
      const speed = baseSpeed + seededRandom(seed, 50 + i) * 10;

      this.enemies.push(createEnemy(`gauntlet_e_${i}`, kind, ax, ay, bx, by, speed));
    }

    // Powerups (chance-based)
    this.powerups = [];
    const kinds: PowerupKind[] = ['speed', 'shield', 'freeze'];
    for (let i = 0; i < MAX_POWERUPS; i++) {
      if (seededRandom(seed, 60 + i) < POWERUP_CHANCE) {
        const kind = kinds[Math.floor(seededRandom(seed, 70 + i) * kinds.length)]!;
        const px = 30 + seededRandom(seed, 80 + i) * 170;
        const py = 90 + seededRandom(seed, 90 + i) * 180;
        this.powerups.push(createPowerup(`gauntlet_p_${i}`, kind, px, py));
      }
    }
  }

  // ── Powerup effects ────────────────────────────────────────

  private applyPowerup(kind: PowerupKind): void {
    switch (kind) {
      case 'speed':
        this.playerSpeedBoost = true;
        this.speedBoostTimer = 5;
        break;
      case 'shield':
        this.playerShielded = true;
        this.shieldTimer = 8;
        break;
      case 'freeze':
        this.freezeTimer = 4;
        break;
    }
  }

  // ── Combat ─────────────────────────────────────────────────

  private triggerCombat(enemy: EnemyEntity): void {
    this.skillBonuses = getSkillBonuses(this.skillTree);
    this.combatState = createCombatState(enemy.state.kind, this.skillBonuses);
    this.combatEnemyId = enemy.id;
    this.combatChargeHeld = false;
    this.combatShakeTimer = 0;
    this.combatDamageTexts = [];
  }

  private updateCombatOverlay(dt: number, actions: InputAction[]): void {
    const cs = this.combatState;
    if (!cs) return;

    // Fade combat damage texts
    for (let i = this.combatDamageTexts.length - 1; i >= 0; i--) {
      const ft = this.combatDamageTexts[i]!;
      ft.timer -= dt;
      ft.y += ft.dy * dt;
      if (ft.timer <= 0) this.combatDamageTexts.splice(i, 1);
    }

    // Screen shake fade
    if (this.combatShakeTimer > 0) this.combatShakeTimer -= dt;

    // ── Defeat screen ──
    if (cs.phase === 'defeat') {
      if (cs.phaseTimer > 0) {
        updateCombat(cs, dt, { attackTapped: false, chargeStarted: false, chargeHeld: false, chargeReleased: false, defendTapped: false }, this.skillBonuses);
        return;
      }
      // Check buttons
      for (const action of actions) {
        if (action.type !== 'primary') continue;
        const dbtns = getDefeatButtonRects();
        if (hitTest(action.x, action.y, dbtns.retry)) {
          restartCombat(cs, this.skillBonuses);
          this.combatDamageTexts = [];
        } else if (hitTest(action.x, action.y, dbtns.powerup) && this.score >= POINT_POWERUP_COST) {
          this.score -= POINT_POWERUP_COST;
          applyPointPowerup(cs);
        }
      }
      updateCombat(cs, dt, { attackTapped: false, chargeStarted: false, chargeHeld: false, chargeReleased: false, defendTapped: false }, this.skillBonuses);
      return;
    }

    // ── Victory auto-close ──
    if (cs.phase === 'victory') {
      const result = updateCombat(cs, dt, { attackTapped: false, chargeStarted: false, chargeHeld: false, chargeReleased: false, defendTapped: false }, this.skillBonuses);
      if (result.done) {
        // Award points + SP
        const enemy = this.enemies.find((e) => e.id === this.combatEnemyId);
        if (enemy) {
          enemy.state.defeated = true;
          this.particles.emitSparkle(enemy.position.x, enemy.position.y);
          addSkillPoints(this.skillTree, SP_PER_ENEMY_KILL);
          this.skillBonuses = getSkillBonuses(this.skillTree);
          const bonus = VICTORY_BONUS + this.skillBonuses.victoryBonusAdd;
          this.addScore(bonus, enemy.position.x, enemy.position.y);
          this.killCount += 1;
        }
        this.combatState = null;
        this.combatImmunityTimer = 1;
      }
      return;
    }

    // ── Player input handling ──
    const btns = getCombatButtonRects();
    const input: CombatInput = {
      attackTapped: false,
      chargeStarted: false,
      chargeHeld: this.combatChargeHeld,
      chargeReleased: false,
      defendTapped: false,
    };

    for (const action of actions) {
      if (action.type === 'primary') {
        if (hitTest(action.x, action.y, btns.attack)) {
          input.attackTapped = true;
        } else if (hitTest(action.x, action.y, btns.charge)) {
          input.chargeStarted = true;
          input.chargeHeld = true;
          this.combatChargeHeld = true;
        } else if (hitTest(action.x, action.y, btns.defend)) {
          input.defendTapped = true;
        }
      }
      if (action.type === 'primary_end') {
        if (this.combatChargeHeld) {
          input.chargeReleased = true;
          input.chargeHeld = false;
          this.combatChargeHeld = false;
        }
      }
      // Keyboard: left=attack, right=charge, down=defend (via move actions)
      if (action.type === 'move' && action.dx < 0) {
        input.attackTapped = true;
      }
      if (action.type === 'move' && action.dx > 0 && !this.combatChargeHeld) {
        input.chargeStarted = true;
        input.chargeHeld = true;
        this.combatChargeHeld = true;
      }
      if (action.type === 'move' && action.dy > 0) {
        input.defendTapped = true;
      }
    }

    // Snapshot HP for damage numbers
    const prevEnemyHp = cs.enemyHp;
    const prevPlayerHp = cs.playerHp;
    const result = updateCombat(cs, dt, input, this.skillBonuses);

    // Damage numbers
    if (cs.enemyHp < prevEnemyHp) {
      const dmg = Math.round((prevEnemyHp - cs.enemyHp) * 100);
      const color = cs.lastCrit ? '#f97316' : '#fbbf24';
      const text = cs.lastCrit ? `${dmg} CRIT!` : `${dmg}`;
      this.combatDamageTexts.push({ x: GAME_WIDTH / 2, y: 150, text, timer: 0.8, color, dy: -30 });
    }
    if (cs.playerHp < prevPlayerHp) {
      const dmg = Math.round((prevPlayerHp - cs.playerHp) * 100);
      this.combatDamageTexts.push({ x: GAME_WIDTH / 2, y: 280, text: `${dmg}`, timer: 0.8, color: '#ef4444', dy: -20 });
      this.combatShakeTimer = 0.18;
    }
  }

  // ── Combat rendering (identical to island scene) ───────────

  private renderCombatOverlay(ctx: CanvasRenderingContext2D): void {
    const cs = this.combatState;
    if (!cs) return;

    const t = this.nowMs / 1000;

    ctx.save();

    // Screen shake
    if (this.combatShakeTimer > 0) {
      const intensity = this.combatShakeTimer / 0.18 * 3;
      ctx.translate(
        Math.sin(t * 60) * intensity,
        Math.cos(t * 45) * intensity * 0.6,
      );
    }

    // Dim background
    const fadeIn = Math.min(1, t / 0.3);
    ctx.fillStyle = rgba('#070b14', 0.70 * fadeIn);
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Score
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`★ ${Math.floor(this.score)}`, 10, 16);

    // Title
    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText('COMBAT!', GAME_WIDTH / 2, 40);

    // Enemy sprite
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 120);
    if (cs.phase === 'player_attack' && cs.phaseTimer > 0.15) {
      ctx.translate(Math.sin(t * 50) * 3, 0);
    }
    ctx.scale(2.5, 2.5);
    drawEnemy(ctx, 0, 0, cs.enemyKind, t);
    ctx.restore();

    // Enemy name + HP bar
    const barW = 120;
    const barH = 10;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = 170;

    ctx.fillStyle = TOKENS.colorTextMuted;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText(getEnemyDisplayName(cs.enemyKind), GAME_WIDTH / 2, barY - 16);

    ctx.fillStyle = '#1f2937';
    roundRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();
    const hpW = Math.max(0, cs.enemyHp * barW);
    const recentHit = cs.phase === 'player_attack' && cs.phaseTimer > 0.2;
    ctx.fillStyle = recentHit ? '#ff6b6b' : cs.enemyHp > 0.3 ? TOKENS.colorRed400 : '#ef4444';
    if (hpW > 0) {
      roundRect(ctx, barX, barY, hpW, barH, 3);
      ctx.fill();
    }
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('ENEMY', GAME_WIDTH / 2, barY - 6);

    // Hit flash
    if (cs.phase === 'player_attack') {
      const flashAlpha = cs.phaseTimer / 0.3;
      const flashColor = cs.lastCrit ? '#f97316' : '#fbbf24';
      ctx.fillStyle = rgba(flashColor, flashAlpha * 0.4);
      ctx.fillRect(0, 60, GAME_WIDTH, 130);
    }

    // Player HP bar
    const pBarY = 270;
    ctx.fillStyle = '#1f2937';
    roundRect(ctx, barX, pBarY, barW, barH, 3);
    ctx.fill();
    const pHpRatio = cs.maxPlayerHp > 0 ? cs.playerHp / cs.maxPlayerHp : cs.playerHp;
    const pHpW = Math.max(0, Math.min(1, pHpRatio) * barW);
    const pBarColor = pHpRatio > 0.5 ? TOKENS.colorGreen400
      : pHpRatio > 0.25 ? TOKENS.colorYellow400 : TOKENS.colorRed400;
    ctx.fillStyle = pBarColor;
    if (pHpW > 0) {
      roundRect(ctx, barX, pBarY, pHpW, barH, 3);
      ctx.fill();
    }
    if (cs.lastDamageToPlayer > 0 && cs.phase === 'player_turn') {
      ctx.fillStyle = rgba('#ef4444', 0.2);
      ctx.fillRect(barX, pBarY, barW, barH);
    }
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'center';
    ctx.fillText('YOU', GAME_WIDTH / 2, pBarY - 6);

    // Enemy turn indicator
    if (cs.phase === 'enemy_turn') {
      const shake = Math.sin(t * 30) * 2;
      ctx.fillStyle = rgba('#ef4444', 0.6);
      ctx.font = TOKENS.fontMedium;
      ctx.fillText('Enemy attacks!', GAME_WIDTH / 2 + shake, 300);
    }

    // Charge meter
    if (cs.phase === 'charging') {
      const meterX = 50;
      const meterY = 300;
      const meterW = 140;
      const meterH = 14;
      ctx.fillStyle = '#1f2937';
      roundRect(ctx, meterX, meterY, meterW, meterH, 4);
      ctx.fill();
      const fillW = cs.charge * meterW;
      const chargeColor = cs.charge < 0.5 ? TOKENS.colorCyan400
        : cs.charge < 0.85 ? TOKENS.colorYellow400 : TOKENS.colorGreen400;
      ctx.fillStyle = chargeColor;
      if (fillW > 0) {
        roundRect(ctx, meterX, meterY, fillW, meterH, 4);
        ctx.fill();
      }
      const critX = meterX + CRIT_THRESHOLD * meterW;
      ctx.strokeStyle = rgba('#facc15', 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(critX, meterY - 2);
      ctx.lineTo(critX, meterY + meterH + 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      if (cs.charge >= CRIT_THRESHOLD) {
        ctx.fillStyle = rgba('#f97316', 0.6 + Math.sin(t * 8) * 0.4);
        ctx.font = TOKENS.fontSmall;
        ctx.textAlign = 'center';
        ctx.fillText('CRIT!', meterX + meterW / 2, meterY + meterH + 12);
      }
      const pulse = 0.6 + Math.sin(t * 6) * 0.4;
      ctx.fillStyle = rgba('#facc15', pulse);
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText('CHARGING...', GAME_WIDTH / 2, meterY - 6);
    }

    // Action buttons
    const btns = getCombatButtonRects();
    const isPlayerTurn = cs.phase === 'player_turn' || cs.phase === 'charging';
    const canAct = isPlayerTurn && cs.phase !== 'charging';
    drawButton(ctx, btns.attack.x, btns.attack.y, btns.attack.w, btns.attack.h, 'ATK', canAct, 10);
    drawButton(ctx, btns.charge.x, btns.charge.y, btns.charge.w, btns.charge.h, 'CHG', cs.phase === 'charging', 10);
    drawButton(ctx, btns.defend.x, btns.defend.y, btns.defend.w, btns.defend.h, 'DEF', canAct, 10);
    if (!isPlayerTurn && cs.phase !== 'victory' && cs.phase !== 'defeat') {
      ctx.fillStyle = rgba('#070b14', 0.45);
      ctx.fillRect(btns.attack.x, btns.attack.y, btns.defend.x + btns.defend.w - btns.attack.x, btns.attack.h);
    }

    // Turn counter + bonus damage
    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'right';
    ctx.fillText(`Turn ${cs.turnCount + 1}`, GAME_WIDTH - 12, 330);
    if (cs.bonusDamage > 0) {
      ctx.fillStyle = TOKENS.colorCyan400;
      ctx.fillText(`⚡+${Math.round(cs.bonusDamage * 100)}%`, GAME_WIDTH - 12, 344);
    }
    ctx.textAlign = 'center';

    // Critical hit flash
    if (cs.lastCrit && cs.phase === 'player_attack') {
      const critAlpha = cs.phaseTimer / 0.3;
      ctx.fillStyle = rgba('#f97316', critAlpha);
      ctx.font = TOKENS.fontTitle;
      ctx.fillText('CRITICAL!', GAME_WIDTH / 2, 250);
    }

    // Defending indicator
    if (cs.defending && cs.phase === 'enemy_turn') {
      ctx.fillStyle = rgba('#38bdf8', 0.8);
      ctx.font = TOKENS.fontMedium;
      ctx.fillText('🛡 DEFENDING', GAME_WIDTH / 2, 250);
    }

    // Floating damage numbers
    for (const ft of this.combatDamageTexts) {
      const alpha = Math.min(1, ft.timer / 0.3);
      ctx.fillStyle = rgba(ft.color, alpha);
      ctx.font = TOKENS.fontMedium;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    // Victory flash
    if (cs.phase === 'victory') {
      const vAlpha = Math.min(1, cs.phaseTimer / 0.3);
      ctx.fillStyle = rgba('#22c55e', vAlpha * 0.3);
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = rgba('#facc15', vAlpha);
      ctx.font = TOKENS.fontTitle;
      ctx.fillText('VICTORY!', GAME_WIDTH / 2, 200);
      ctx.font = TOKENS.fontMedium;
      ctx.fillStyle = rgba('#4ade80', vAlpha);
      ctx.fillText(`+${VICTORY_BONUS + this.skillBonuses.victoryBonusAdd} POINTS`, GAME_WIDTH / 2, 225);
    }

    // Defeat screen
    if (cs.phase === 'defeat') {
      const dAlpha = Math.min(1, (DEFEAT_DISPLAY_DURATION - cs.phaseTimer) / 0.3);
      ctx.fillStyle = rgba('#7f1d1d', dAlpha * 0.4);
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = rgba('#ef4444', dAlpha);
      ctx.font = TOKENS.fontTitle;
      ctx.fillText('DEFEATED!', GAME_WIDTH / 2, 195);
      ctx.fillStyle = rgba('#fca5a5', dAlpha * 0.7);
      ctx.font = TOKENS.fontSmall;
      ctx.fillText(`by ${getEnemyDisplayName(cs.enemyKind)}`, GAME_WIDTH / 2, 215);

      if (cs.phaseTimer <= 0) {
        const dbtns = getDefeatButtonRects();
        drawButton(ctx, dbtns.retry.x, dbtns.retry.y, dbtns.retry.w, dbtns.retry.h, 'RETRY', true, 10);
        const canPowerup = this.score >= POINT_POWERUP_COST;
        drawButton(ctx, dbtns.powerup.x, dbtns.powerup.y, dbtns.powerup.w, dbtns.powerup.h,
          `⚡${POINT_POWERUP_COST}pts`, canPowerup, 10);

        ctx.font = TOKENS.fontSmall;
        ctx.fillStyle = rgba('#fbbf24', dAlpha);
        if (cs.retryCount > 0) {
          ctx.fillText(`Attempt ${cs.retryCount + 1}`, GAME_WIDTH / 2, 260);
        }
        if (cs.bonusDamage > 0) {
          ctx.fillStyle = rgba('#38bdf8', dAlpha);
          ctx.fillText(`Bonus: +${Math.round(cs.bonusDamage * 100)}% dmg`, GAME_WIDTH / 2, 320);
        }
      }
    }

    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  // ── Score helpers ──────────────────────────────────────────

  private addScore(points: number, x: number, y: number): void {
    this.score += points;
    this.scorePopups.push({ x, y: y - 10, text: `+${points}`, timer: 1.0 });
  }

  private renderScorePopups(ctx: CanvasRenderingContext2D): void {
    for (const popup of this.scorePopups) {
      const alpha = Math.min(1, popup.timer / 0.5);
      ctx.fillStyle = rgba('#facc15', alpha);
      ctx.font = TOKENS.fontLarge;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  // ── Skill tree overlay (same as island scene) ──────────────

  private updateSkillTree(actions: InputAction[]): void {
    for (const action of actions) {
      if (action.type !== 'primary') continue;
      // Close button
      if (hitTest(action.x, action.y, SKILL_CLOSE_BUTTON)) {
        this.skillTreeOpen = false;
        return;
      }
      // Skill nodes
      const available = getAvailableSkills(this.skillTree);
      for (const skillId of SKILL_DEFINITIONS.map((d) => d.id)) {
        const pos = this.getSkillNodePosition(skillId);
        const rect = { x: pos.x - 18, y: pos.y - 14, w: 36, h: 28 };
        if (hitTest(action.x, action.y, rect) && available.includes(skillId)) {
          unlockSkill(this.skillTree, skillId);
          this.skillBonuses = getSkillBonuses(this.skillTree);
          this.particles.emitSparkle(pos.x, pos.y);
        }
      }
    }
  }

  private getSkillNodePosition(skillId: SkillId): { x: number; y: number } {
    const positions: Record<SkillId, { x: number; y: number }> = {
      sharp_cutlass:  { x: 60, y: 120 },
      swift_charge:   { x: 60, y: 180 },
      thunder_strike: { x: 60, y: 240 },
      plunder:        { x: 180, y: 180 },
      iron_hull:      { x: 180, y: 120 },
      sea_legs:       { x: 180, y: 240 },
    };
    return positions[skillId];
  }

  private renderSkillTreeOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.skillTreeOpen) return;
    const t = this.nowMs / 1000;

    ctx.fillStyle = rgba('#070b14', 0.85);
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontLarge;
    ctx.textAlign = 'center';
    ctx.fillText('SKILL TREE', GAME_WIDTH / 2, 50);

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText(`SP: ${this.skillTree.skillPoints}`, GAME_WIDTH / 2, 70);

    const available = getAvailableSkills(this.skillTree);

    // Draw prerequisite lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (const def of SKILL_DEFINITIONS) {
      if (!def.prerequisite) continue;
      const from = this.getSkillNodePosition(def.prerequisite.skillId);
      const to = this.getSkillNodePosition(def.id);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Draw skill nodes
    for (const def of SKILL_DEFINITIONS) {
      const pos = this.getSkillNodePosition(def.id);
      const level = this.skillTree.skills[def.id];
      const isAvail = available.includes(def.id);
      const maxed = level >= def.maxLevel;

      // Node background
      ctx.fillStyle = maxed ? '#166534' : isAvail ? '#1e3a5f' : '#1f2937';
      roundRect(ctx, pos.x - 18, pos.y - 14, 36, 28, 6);
      ctx.fill();

      // Pulsing border for available
      if (isAvail) {
        const pulse = 0.4 + Math.sin(t * 3) * 0.3;
        ctx.strokeStyle = rgba('#facc15', pulse);
        ctx.lineWidth = 1.5;
        roundRect(ctx, pos.x - 18, pos.y - 14, 36, 28, 6);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // Icon
      ctx.fillStyle = maxed ? '#4ade80' : TOKENS.colorText;
      ctx.font = TOKENS.fontMedium;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, pos.x, pos.y - 2);

      // Level indicator
      ctx.fillStyle = TOKENS.colorTextMuted;
      ctx.font = TOKENS.fontSmall;
      ctx.fillText(`${level}/${def.maxLevel}`, pos.x, pos.y + 18);

      // Name below
      ctx.fillStyle = TOKENS.colorText;
      ctx.fillText(def.name, pos.x, pos.y + 30);
    }

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // Close button
    drawButton(ctx, SKILL_CLOSE_BUTTON.x, SKILL_CLOSE_BUTTON.y, SKILL_CLOSE_BUTTON.w, SKILL_CLOSE_BUTTON.h, 'CLOSE', true, 8);
  }

  // ── Public accessors (for testing) ─────────────────────────

  getScore(): number { return this.score; }
  getScreenX(): number { return this.screenX; }
  getScreenY(): number { return this.screenY; }
  getKillCount(): number { return this.killCount; }
  getScreensVisited(): number { return this.screensVisited; }
  getFurthestDistance(): number { return this.furthestDistance; }
  getEnemies(): readonly EnemyEntity[] { return this.enemies; }
  getPowerups(): readonly PowerupEntity[] { return this.powerups; }
  isInCombat(): boolean { return this.combatState !== null; }
  isTransitioning(): boolean { return this.transitioning; }
  isSkillTreeOpen(): boolean { return this.skillTreeOpen; }
  getSkillTreeState(): SkillTreeState { return this.skillTree; }
  getPlayer(): { x: number; y: number } { return { x: this.player.position.x, y: this.player.position.y }; }
  getVegetation(): readonly { x: number; y: number; kind: string; scale: number }[] { return this.vegetationSprites; }
  isPlayerStunned(): boolean { return this.playerStunTimer > 0; }
  isPlayerShielded(): boolean { return this.playerShielded; }
  isPlayerSpeedBoosted(): boolean { return this.playerSpeedBoost; }
  isFrozen(): boolean { return this.freezeTimer > 0; }

  /** Expose for testing: force screen population for a specific coordinate */
  debugSetScreen(sx: number, sy: number): void {
    this.screenX = sx;
    this.screenY = sy;
    this.tileMap = new TileMap(generateScreenLayout(sx, sy));
    this.vegetationSprites = generateVegetation(sx, sy);
    this.populateScreen();
  }
}

// ── Exported helpers for testing ─────────────────────────────

export { screenDistance, screenSeed, seededRandom, getEnemyPool, generateScreenLayout, generateVegetation };
export { BASE_ENEMY_COUNT, ENEMIES_PER_DISTANCE, MAX_ENEMIES_PER_SCREEN };
export { EDGE_THRESHOLD, TRANSITION_DURATION, POWERUP_CHANCE, MAX_POWERUPS };
export { ENEMY_TIERS };
