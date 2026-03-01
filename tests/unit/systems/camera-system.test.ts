import { describe, expect, it } from 'vitest';
import { updateCameraSystem, type CameraState } from '../../../src/systems/camera-system';
import { createPlayer } from '../../../src/entities/player';

describe('updateCameraSystem', () => {
  function makeCamera(): CameraState {
    return { x: 0, y: 0 };
  }

  it('centers camera on player', () => {
    const camera = makeCamera();
    const player = createPlayer(120, 200);
    updateCameraSystem(camera, player, 480, 800);
    // desiredX = 120 - 120 = 0, desiredY = 200 - 200 = 0
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
  });

  it('clamps camera to left/top (no negative)', () => {
    const camera = makeCamera();
    const player = createPlayer(50, 50);
    updateCameraSystem(camera, player, 480, 800);
    expect(camera.x).toBeGreaterThanOrEqual(0);
    expect(camera.y).toBeGreaterThanOrEqual(0);
  });

  it('clamps camera to right/bottom bound', () => {
    const camera = makeCamera();
    const player = createPlayer(460, 780);
    updateCameraSystem(camera, player, 480, 800);
    expect(camera.x).toBeLessThanOrEqual(480 - 240);
    expect(camera.y).toBeLessThanOrEqual(800 - 400);
  });

  it('stays at origin when world fits viewport exactly', () => {
    const camera = makeCamera();
    const player = createPlayer(120, 200);
    updateCameraSystem(camera, player, 240, 400);
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
  });

  it('returns the camera object', () => {
    const camera = makeCamera();
    const player = createPlayer(100, 200);
    const result = updateCameraSystem(camera, player, 480, 800);
    expect(result).toBe(camera);
  });
});
