import { GameLoop } from './core/game-loop';
import { SceneManager } from './core/scene-manager';
import { GAME_HEIGHT, GAME_WIDTH, type SceneContext } from './core/types';
import { InputManager } from './input/input-manager';
import { Renderer } from './rendering/renderer';
import { TOKENS } from './rendering/tokens';
import { BootScene } from './scenes/boot-scene';
import { MenuScene } from './scenes/menu-scene';
import { StateMachine } from './core/state-machine';

const canvasElement = document.getElementById('game-canvas');
if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Missing #game-canvas element');
}

const canvas = canvasElement;

const renderer = new Renderer(canvas);
const inputManager = new InputManager(canvas);
const stateMachine = new StateMachine();

stateMachine.subscribe((record) => {
  console.info('[state_transition]', record);
});

const sceneContext: SceneContext = {
  now: () => performance.now(),
};

const sceneManager = new SceneManager(sceneContext);

const menuScene = new MenuScene(() => {
  if (stateMachine.canTransition('play')) {
    stateMachine.transition('play', 'menu_start_pressed');
  }
});

const bootScene = new BootScene(() => {
  if (stateMachine.canTransition('menu')) {
    stateMachine.transition('menu', 'boot_complete');
  }
  sceneManager.replace(menuScene);
});

sceneManager.push(bootScene);

const loop = new GameLoop(sceneManager, inputManager, renderer);
loop.start();

function applyPortraitScale(): void {
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  canvas.style.width = `${Math.floor(GAME_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(GAME_HEIGHT * scale)}px`;
  canvas.style.backgroundColor = TOKENS.colorBackground;
}

window.addEventListener('resize', applyPortraitScale);
applyPortraitScale();
