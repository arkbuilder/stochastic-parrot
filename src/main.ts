import { GameLoop } from './core/game-loop';
import { SceneManager } from './core/scene-manager';
import { GAME_HEIGHT, GAME_WIDTH, type SceneContext } from './core/types';
import { InputManager } from './input/input-manager';
import { Renderer } from './rendering/renderer';
import { TOKENS } from './rendering/tokens';
import { BootScene } from './scenes/boot-scene';
import { MenuScene } from './scenes/menu-scene';
import { StateMachine } from './core/state-machine';
import { EncounterScene } from './scenes/encounter-scene';
import { IslandScene } from './scenes/island-scene';
import { RewardScene } from './scenes/reward-scene';
import { AudioManager } from './audio/audio-manager';
import { TelemetryClient } from './telemetry/telemetry-client';
import { ConsoleSink } from './telemetry/console-sink';
import { ApiClient } from './persistence/api-client';
import { LocalStore } from './persistence/local-store';
import type { RewardData } from './scenes/flow-types';

type DebugController = {
  completeEncoding: () => void;
  winEncounter: () => void;
};

const canvasElement = document.getElementById('game-canvas');
if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Missing #game-canvas element');
}

const canvas = canvasElement;

const renderer = new Renderer(canvas);
const inputManager = new InputManager(canvas);
const stateMachine = new StateMachine();
const audioManager = new AudioManager();
const telemetry = new TelemetryClient(new ConsoleSink());
const apiClient = new ApiClient();
const localStore = new LocalStore();
const debugController: DebugController = {
  completeEncoding: () => undefined,
  winEncounter: () => undefined,
};

(window as Window & { __dr_debug?: DebugController }).__dr_debug = debugController;

stateMachine.subscribe((record) => {
  console.info('[state_transition]', record);
});

const sceneContext: SceneContext = {
  now: () => performance.now(),
};

const sceneManager = new SceneManager(sceneContext);

function goToMenu(): void {
  sceneManager.replace(menuScene);
  if (stateMachine.current !== 'menu' && stateMachine.canTransition('menu')) {
    stateMachine.transition('menu', 'return_to_menu');
  }
  (window as Window & { __dr_scene?: string }).__dr_scene = 'menu';
}

function persistReward(reward: RewardData): void {
  const scorePayload = {
    playerId: 'player_local',
    boardType: 'island' as const,
    islandId: reward.islandId,
    score: reward.islandScore,
    timeMs: Math.max(1, Math.floor(performance.now())),
    accuracyPct: reward.expertBonus ? 100 : 75,
    grade: reward.grade,
    checksum: btoa(`${reward.islandId}:${reward.islandScore}:${reward.grade}`),
  };

  const progressPayload = {
    playerId: 'player_local',
    islandId: reward.islandId,
    status: 'completed' as const,
    bestGrade: reward.grade,
    bestScore: reward.islandScore,
    chartFragment: 1 as const,
    expertBonus: reward.expertBonus ? (1 as const) : (0 as const),
    attempts: 1,
  };

  void apiClient.submitScore(scorePayload).catch(() => localStore.saveScore(scorePayload));
  void apiClient
    .submitProgress(progressPayload)
    .catch(() => localStore.saveProgress(progressPayload));
}

function startIsland1(): void {
  void audioManager.resume();

  const islandScene = new IslandScene({
    telemetry,
    audio: audioManager,
    onThreatTriggered: (encounterData) => {
      const encounterScene = new EncounterScene(encounterData, {
        telemetry,
        audio: audioManager,
        onResolved: (reward) => {
          debugController.winEncounter = () => undefined;
          const rewardScene = new RewardScene(reward, {
            telemetry,
            audio: audioManager,
            onContinue: () => {
              persistReward(reward);
              void telemetry.flush();
              goToMenu();
            },
          });
          sceneManager.replace(rewardScene);
          (window as Window & { __dr_scene?: string }).__dr_scene = 'reward';
        },
      });

      sceneManager.replace(encounterScene);
      debugController.winEncounter = () => encounterScene.debugForceWinEncounter();
      (window as Window & { __dr_scene?: string }).__dr_scene = 'encounter';
    },
  });

  sceneManager.replace(islandScene);
  debugController.completeEncoding = () => islandScene.debugForceCompleteEncoding();
  (window as Window & { __dr_scene?: string }).__dr_scene = 'island';
}

const menuScene = new MenuScene(() => {
  if (stateMachine.canTransition('play')) {
    stateMachine.transition('play', 'menu_start_pressed');
  }

  startIsland1();
});

const bootScene = new BootScene(() => {
  if (stateMachine.canTransition('menu')) {
    stateMachine.transition('menu', 'boot_complete');
  }
  goToMenu();
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

window.addEventListener('beforeunload', () => {
  void telemetry.flush();
});
