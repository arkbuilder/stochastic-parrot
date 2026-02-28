import type { Entity, Vector2 } from './types';

export interface EnemyState {
  kind: 'crab' | 'jellyfish';
  patrolA: Vector2;
  patrolB: Vector2;
  targetIndex: 0 | 1;
  speed: number;
  animationTime: number;
  stunCooldown: number; // cooldown before can stun player again
}

export type EnemyEntity = Entity & { type: 'enemy'; state: EnemyState };

export function createEnemy(
  id: string,
  kind: EnemyState['kind'],
  ax: number, ay: number,
  bx: number, by: number,
  speed = 28,
): EnemyEntity {
  return {
    id,
    type: 'enemy',
    position: { x: ax, y: ay },
    bounds: { w: 14, h: 12 },
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
    },
  };
}

export function updateEnemy(enemy: EnemyEntity, dt: number): void {
  const s = enemy.state;
  s.animationTime += dt;
  if (s.stunCooldown > 0) s.stunCooldown = Math.max(0, s.stunCooldown - dt);

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
