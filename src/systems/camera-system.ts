import type { PlayerEntity } from '../entities/player';
import { clamp } from '../utils/math';

export interface CameraState {
  x: number;
  y: number;
}

export function updateCameraSystem(
  camera: CameraState,
  player: PlayerEntity,
  worldWidth: number,
  worldHeight: number,
): CameraState {
  const desiredX = player.position.x - 120;
  const desiredY = player.position.y - 200;

  camera.x = clamp(desiredX, 0, Math.max(0, worldWidth - 240));
  camera.y = clamp(desiredY, 0, Math.max(0, worldHeight - 400));
  return camera;
}
