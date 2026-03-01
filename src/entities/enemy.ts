import type { Entity, Vector2 } from './types';

export type EnemyKind =
  | 'crab' | 'jellyfish' | 'burrower'
  | 'fire_crab' | 'shadow_jelly' | 'sand_wyrm'
  | 'urchin' | 'ray';

export interface EnemyState {
  kind: EnemyKind;
  patrolA: Vector2;
  patrolB: Vector2;
  targetIndex: 0 | 1;
  speed: number;
  animationTime: number;
  stunCooldown: number; // cooldown before can stun player again
  /** Burrower-specific: current behaviour phase */
  burrowPhase: 'hidden' | 'emerging' | 'chasing' | 'lunging' | 'retreating';
  /** Burrower: timer for phase transitions */
  burrowTimer: number;
  /** Burrower: player position snapshot for lunge target */
  lungeTarget: Vector2;
  /** Whether this enemy has been defeated by a quiz */
  defeated: boolean;
  /** Urchin: spike burst phase timer */
  spikeTimer: number;
  /** Urchin: whether spikes are extended */
  spikesOut: boolean;
}

export type EnemyEntity = Entity & { type: 'enemy'; state: EnemyState };

export function createEnemy(
  id: string,
  kind: EnemyState['kind'],
  ax: number, ay: number,
  bx: number, by: number,
  speed = 28,
): EnemyEntity {
  const isBurrowerType = kind === 'burrower' || kind === 'sand_wyrm';
  return {
    id,
    type: 'enemy',
    position: { x: ax, y: ay },
    bounds: { w: kind === 'urchin' ? 18 : 14, h: kind === 'urchin' ? 18 : 12 },
    visible: true,
    interactive: false,
    state: {
      kind,
      patrolA: { x: ax, y: ay },
      patrolB: { x: bx, y: by },
      targetIndex: 1,
      speed,
      animationTime: 0,
      stunCooldown: 0,
      burrowPhase: isBurrowerType ? 'hidden' : 'chasing',
      burrowTimer: isBurrowerType ? 2.0 + Math.random() * 2 : 0,
      lungeTarget: { x: 0, y: 0 },
      defeated: false,
      spikeTimer: kind === 'urchin' ? 1.5 + Math.random() * 2 : 0,
      spikesOut: false,
    },
  };
}

export function updateEnemy(enemy: EnemyEntity, dt: number, playerPos?: Vector2): void {
  const s = enemy.state;
  s.animationTime += dt;
  if (s.stunCooldown > 0) s.stunCooldown = Math.max(0, s.stunCooldown - dt);
  if (s.defeated) return;

  // Burrower-type enemies (burrower + sand_wyrm) use burrow state machine
  if (s.kind === 'burrower' || s.kind === 'sand_wyrm') {
    updateBurrower(enemy, dt, playerPos);
    return;
  }

  // Urchin — stationary, cycles spike burst
  if (s.kind === 'urchin') {
    updateUrchin(enemy, dt);
    return;
  }

  // All patrol-type enemies: crab, fire_crab, jellyfish, shadow_jelly, ray
  const target = s.targetIndex === 0 ? s.patrolA : s.patrolB;
  const dx = target.x - enemy.position.x;
  const dy = target.y - enemy.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 2) {
    s.targetIndex = s.targetIndex === 0 ? 1 : 0;
    return;
  }

  const move = Math.min(s.speed * dt, dist);
  enemy.position.x += (dx / dist) * move;
  enemy.position.y += (dy / dist) * move;
}

function updateBurrower(enemy: EnemyEntity, dt: number, playerPos?: Vector2): void {
  const s = enemy.state;
  s.burrowTimer -= dt;
  const isWyrm = s.kind === 'sand_wyrm';

  switch (s.burrowPhase) {
    case 'hidden':
      enemy.visible = false;
      if (s.burrowTimer <= 0) {
        // Emerge near the player if available, otherwise at patrol midpoint
        if (playerPos) {
          const spread = isWyrm ? 35 : 50; // wyrm emerges closer
          const offsetX = (Math.random() - 0.5) * spread;
          const offsetY = (Math.random() - 0.5) * (spread * 0.6);
          enemy.position.x = clampX(playerPos.x + offsetX);
          enemy.position.y = clampY(playerPos.y + offsetY);
        } else {
          enemy.position.x = (s.patrolA.x + s.patrolB.x) / 2;
          enemy.position.y = (s.patrolA.y + s.patrolB.y) / 2;
        }
        s.burrowPhase = 'emerging';
        s.burrowTimer = isWyrm ? 0.4 : 0.6; // wyrm emerges faster
        enemy.visible = true;
      }
      break;

    case 'emerging':
      // Rising up animation — handled by render
      if (s.burrowTimer <= 0) {
        s.burrowPhase = 'chasing';
        s.burrowTimer = isWyrm ? 4.0 : 3.0; // wyrm chases longer
      }
      break;

    case 'chasing':
      // Move toward player
      if (playerPos) {
        const dx = playerPos.x - enemy.position.x;
        const dy = playerPos.y - enemy.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
          const chaseMult = isWyrm ? 1.6 : 1.3; // wyrm chases faster
          const chase = Math.min(s.speed * chaseMult * dt, dist);
          enemy.position.x += (dx / dist) * chase;
          enemy.position.y += (dy / dist) * chase;
        }
        // Close enough to lunge — wyrm lunges from further away
        const lungeRange = isWyrm ? 35 : 25;
        if (dist < lungeRange) {
          s.burrowPhase = 'lunging';
          s.lungeTarget = { x: playerPos.x, y: playerPos.y };
          s.burrowTimer = isWyrm ? 0.5 : 0.4;
        }
      }
      if (s.burrowTimer <= 0) {
        s.burrowPhase = 'retreating';
        s.burrowTimer = 0.5;
      }
      break;

    case 'lunging': {
      // Quick dash toward lunge target
      const lx = s.lungeTarget.x - enemy.position.x;
      const ly = s.lungeTarget.y - enemy.position.y;
      const ld = Math.sqrt(lx * lx + ly * ly);
      if (ld > 1) {
        const lungeSpeed = s.speed * 4 * dt;
        enemy.position.x += (lx / ld) * Math.min(lungeSpeed, ld);
        enemy.position.y += (ly / ld) * Math.min(lungeSpeed, ld);
      }
      if (s.burrowTimer <= 0) {
        s.burrowPhase = 'retreating';
        s.burrowTimer = 0.5;
      }
      break;
    }

    case 'retreating':
      // Sinking back underground
      if (s.burrowTimer <= 0) {
        s.burrowPhase = 'hidden';
        s.burrowTimer = 2.5 + Math.random() * 2; // random hide time
        enemy.visible = false;
      }
      break;
  }
}

function updateUrchin(enemy: EnemyEntity, dt: number): void {
  const s = enemy.state;
  s.spikeTimer -= dt;
  if (s.spikeTimer <= 0) {
    s.spikesOut = !s.spikesOut;
    // Spikes out for 1.5s, retracted for 2-3s
    s.spikeTimer = s.spikesOut ? 1.5 : (2 + Math.random());
    // Wider hitbox when spikes are out
    enemy.bounds.w = s.spikesOut ? 24 : 18;
    enemy.bounds.h = s.spikesOut ? 24 : 18;
  }
}

function clampX(x: number): number { return Math.max(16, Math.min(224, x)); }
function clampY(y: number): number { return Math.max(40, Math.min(320, y)); }

