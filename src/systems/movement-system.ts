import type { InputAction } from '../input/types';
import type { ParrotEntity } from '../entities/parrot';
import type { PlayerEntity } from '../entities/player';
import { clamp, distance, normalize } from '../utils/math';

export function updateMovementSystem(
  player: PlayerEntity,
  parrot: ParrotEntity,
  actions: InputAction[],
  dt: number,
): void {
  const moveAction = actions.find((action) => action.type === 'move');
  const tapAction = actions.find((action) => action.type === 'primary' && action.y < 320);

  if (moveAction && moveAction.type === 'move') {
    player.state.targetX = clamp(player.position.x + moveAction.dx * 22, 8, 220);
    player.state.targetY = clamp(player.position.y + moveAction.dy * 22, 64, 308);
  }

  if (tapAction && tapAction.type === 'primary') {
    player.state.targetX = clamp(tapAction.x, 8, 220);
    player.state.targetY = clamp(tapAction.y, 64, 308);
  }

  const toTarget = {
    x: player.state.targetX - player.position.x,
    y: player.state.targetY - player.position.y,
  };

  const targetDistance = distance(player.position, { x: player.state.targetX, y: player.state.targetY });
  if (targetDistance > 1.5) {
    const direction = normalize(toTarget.x, toTarget.y);
    player.position.x = clamp(player.position.x + direction.x * player.state.speed * dt, 8, 220);
    player.position.y = clamp(player.position.y + direction.y * player.state.speed * dt, 64, 308);
    player.state.animationTime += dt;
  }

  if (parrot.state.mode === 'idle') {
    parrot.state.targetX = player.position.x - 6;
    parrot.state.targetY = player.position.y - 10;
  }

  const parrotDelta = {
    x: parrot.state.targetX - parrot.position.x,
    y: parrot.state.targetY - parrot.position.y,
  };

  const parrotDirection = normalize(parrotDelta.x, parrotDelta.y);
  parrot.position.x += parrotDirection.x * parrot.state.speed * dt;
  parrot.position.y += parrotDirection.y * parrot.state.speed * dt;
  parrot.state.animationTime += dt;

  if (distance(parrot.position, { x: parrot.state.targetX, y: parrot.state.targetY }) < 2) {
    parrot.state.mode = 'idle';
  }
}
