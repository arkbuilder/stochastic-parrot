import { describe, expect, it, vi } from 'vitest';
import { IslandScene } from '../../../src/scenes/island-scene';
import type { InputAction } from '../../../src/input/types';

/**
 * Verifies the "Learn" button behavior on the island scene:
 * - Minigames are NOT auto-triggered by walking near a landmark
 * - A "Learn" button appears when the player is within range
 * - Tapping the button launches the minigame
 */

function stubDeps(overrides: Record<string, unknown> = {}) {
  return {
    islandId: 'island_01',
    onThreatTriggered: vi.fn(),
    telemetry: { emit: vi.fn() } as any,
    audio: { play: vi.fn(), setMusicLayers: vi.fn(), resume: vi.fn(), playSong: vi.fn(), selectIslandTheme: vi.fn(), playFanfare: vi.fn(), applyEncounterPreset: vi.fn(), stopSong: vi.fn() } as any,
    onMinigameLaunch: vi.fn(),
    onConceptDiscovered: vi.fn(),
    ...overrides,
  };
}

function createScene(overrides: Record<string, unknown> = {}) {
  const deps = stubDeps(overrides);
  const scene = new IslandScene(deps);
  scene.enter({ now: () => 0 });
  // Advance past arrival phase (0.7s)
  scene.update(0.8, []);
  return { scene, deps };
}

// Island 01 first landmark: dock_crates at (52, 290)
// Learn button: centered on landmark x, positioned above at y-38
// Button rect: x=52-26=26, y=290-38=252, w=52, h=20
const LANDMARK_X = 52;
const LANDMARK_Y = 290;
const LEARN_BTN_CENTER_X = LANDMARK_X;
const LEARN_BTN_Y = LANDMARK_Y - 38;
const LEARN_BTN_W = 52;
const LEARN_BTN_H = 20;

function movePlayerTo(scene: IslandScene, x: number, y: number) {
  // Directly set player position (private, access via any)
  (scene as any).player.position.x = x;
  (scene as any).player.position.y = y;
}

function tapAt(x: number, y: number): InputAction[] {
  return [{ type: 'primary', x, y }];
}

describe('Island learn button (no auto-trigger)', () => {
  it('does NOT auto-launch minigame when walking near a landmark', () => {
    const { scene, deps } = createScene();

    // Move player directly onto the first landmark
    movePlayerTo(scene, LANDMARK_X, LANDMARK_Y);
    scene.update(0.016, []); // tick — proximity detected but should NOT auto-launch

    expect(deps.onMinigameLaunch).not.toHaveBeenCalled();
  });

  it('shows nearbyLandmarkId when player is within range', () => {
    const { scene } = createScene();

    movePlayerTo(scene, LANDMARK_X, LANDMARK_Y);
    scene.update(0.016, []);

    expect((scene as any).nearbyLandmarkId).toBe('dock_crates');
  });

  it('clears nearbyLandmarkId when player moves away', () => {
    const { scene } = createScene();

    // Move close
    movePlayerTo(scene, LANDMARK_X, LANDMARK_Y);
    scene.update(0.016, []);
    expect((scene as any).nearbyLandmarkId).toBe('dock_crates');

    // Move far away
    movePlayerTo(scene, 200, 100);
    scene.update(0.016, []);
    expect((scene as any).nearbyLandmarkId).toBeNull();
  });

  it('launches minigame when player taps the learn button', () => {
    const { scene, deps } = createScene();

    // Move player near landmark
    movePlayerTo(scene, LANDMARK_X, LANDMARK_Y);
    scene.update(0.016, []); // sets nearbyLandmarkId

    // Tap the learn button (center of button area)
    const tapX = LEARN_BTN_CENTER_X;
    const tapY = LEARN_BTN_Y + LEARN_BTN_H / 2;
    scene.update(0.016, tapAt(tapX, tapY));

    expect(deps.onMinigameLaunch).toHaveBeenCalledTimes(1);
    expect(deps.onMinigameLaunch).toHaveBeenCalledWith(
      'training_data',            // first concept on island_01
      'dock_crates',              // first landmark
      expect.any(Function),       // onComplete callback
    );
  });

  it('does NOT launch minigame when tapping outside the learn button', () => {
    const { scene, deps } = createScene();

    movePlayerTo(scene, LANDMARK_X, LANDMARK_Y);
    scene.update(0.016, []);

    // Tap far away from the button
    scene.update(0.016, tapAt(200, 100));
    expect(deps.onMinigameLaunch).not.toHaveBeenCalled();
  });

  it('completing the minigame callback unlocks the concept card', () => {
    const onMinigameLaunch = vi.fn();
    const { scene } = createScene({ onMinigameLaunch });

    movePlayerTo(scene, LANDMARK_X, LANDMARK_Y);
    scene.update(0.016, []);

    const tapX = LEARN_BTN_CENTER_X;
    const tapY = LEARN_BTN_Y + LEARN_BTN_H / 2;
    scene.update(0.016, tapAt(tapX, tapY));

    // Get the onComplete callback
    const onComplete = onMinigameLaunch.mock.calls[0]?.[2] as () => void;
    expect(onComplete).toBeDefined();

    // Concept not yet unlocked
    const cards = (scene as any).conceptCards;
    expect(cards[0].state.unlocked).toBe(false);

    // Call the completion callback
    onComplete();
    expect(cards[0].state.unlocked).toBe(true);
  });

  it('without onMinigameLaunch handler, tapping near landmark unlocks immediately', () => {
    const { scene } = createScene({ onMinigameLaunch: undefined });

    movePlayerTo(scene, LANDMARK_X, LANDMARK_Y);
    scene.update(0.016, []);

    // Tap the learn button
    const tapX = LEARN_BTN_CENTER_X;
    const tapY = LEARN_BTN_Y + LEARN_BTN_H / 2;
    scene.update(0.016, tapAt(tapX, tapY));

    const cards = (scene as any).conceptCards;
    expect(cards[0].state.unlocked).toBe(true);
  });
});
