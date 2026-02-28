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
import { OverworldScene } from './scenes/overworld-scene';
import { LeaderboardScene } from './scenes/leaderboard-scene';
import { AudioManager } from './audio/audio-manager';
import { TelemetryClient } from './telemetry/telemetry-client';
import { ConsoleSink } from './telemetry/console-sink';
import { ApiClient } from './persistence/api-client';
import { LocalStore } from './persistence/local-store';
import { computeScoreChecksum } from './persistence/checksum';
import { TELEMETRY_EVENTS } from './telemetry/events';
import { ISLANDS } from './data/islands';
import type { OverworldProgress, RewardData } from './scenes/flow-types';

type DebugController = {
  completeEncoding: () => void;
  winEncounter: () => void;
  sailToIsland: (islandId: string) => void;
};

const PLAYER_ID = 'player_local';

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
  sailToIsland: () => undefined,
};

(window as Window & { __dr_debug?: DebugController }).__dr_debug = debugController;

stateMachine.subscribe((record) => {
  console.info('[state_transition]', record);
});

const sceneContext: SceneContext = {
  now: () => performance.now(),
};

const sceneManager = new SceneManager(sceneContext);

const progressState = {
  completedIslands: new Set<string>(),
  islandResults: new Map<string, { score: number; grade: 'S' | 'A' | 'B' | 'C' | 'D' }>(),
  shipUpgrades: new Set<string>(),
};

function getUnlockedIslands(): string[] {
  const unlocked: string[] = [];

  for (const island of ISLANDS) {
    if (!island.unlockAfter || progressState.completedIslands.has(island.unlockAfter)) {
      unlocked.push(island.id);
    }
  }

  return unlocked;
}

function getOverworldProgressSnapshot(): OverworldProgress {
  return {
    completedIslands: Array.from(progressState.completedIslands),
    unlockedIslands: getUnlockedIslands(),
    islandResults: Array.from(progressState.islandResults.entries()).map(([islandId, result]) => ({
      islandId,
      score: result.score,
      grade: result.grade,
    })),
    shipUpgrades: Array.from(progressState.shipUpgrades),
  };
}

function goToMenu(): void {
  sceneManager.replace(menuScene);
  if (stateMachine.current !== 'menu' && stateMachine.canTransition('menu')) {
    stateMachine.transition('menu', 'return_to_menu');
  }
  debugController.sailToIsland = () => undefined;
  (window as Window & { __dr_scene?: string }).__dr_scene = 'menu';
}

function goToOverworld(fromIslandId?: string): void {
  const overworldScene = new OverworldScene({
    progress: getOverworldProgressSnapshot(),
    fromIslandId,
    telemetry,
    audio: audioManager,
    onIslandArrive: (islandId) => {
      startIsland(islandId);
    },
  });

  sceneManager.replace(overworldScene);
  debugController.sailToIsland = (islandId) => {
    if (getUnlockedIslands().includes(islandId)) {
      startIsland(islandId);
    }
  };
  (window as Window & { __dr_scene?: string }).__dr_scene = 'overworld';
}

function goToLeaderboard(): void {
  const leaderboardScene = new LeaderboardScene({
    telemetry,
    audio: audioManager,
    apiClient,
    localStore,
    playerId: PLAYER_ID,
    onBack: () => goToMenu(),
  });

  sceneManager.replace(leaderboardScene);
  debugController.sailToIsland = () => undefined;
  (window as Window & { __dr_scene?: string }).__dr_scene = 'leaderboard';
}

async function persistReward(reward: RewardData): Promise<void> {
  const scoreBase = {
    playerId: PLAYER_ID,
    boardType: 'island' as const,
    islandId: reward.islandId,
    score: reward.islandScore,
    timeMs: Math.max(1, Math.floor(performance.now())),
    accuracyPct: reward.expertBonus ? 100 : 75,
    grade: reward.grade,
  };

  const scorePayload = {
    ...scoreBase,
    checksum: await computeScoreChecksum(scoreBase),
  };

  const progressPayload = {
    playerId: PLAYER_ID,
    islandId: reward.islandId,
    status: 'completed' as const,
    bestGrade: reward.grade,
    bestScore: reward.islandScore,
    chartFragment: 1 as const,
    expertBonus: reward.expertBonus ? (1 as const) : (0 as const),
    attempts: 1,
  };

  await apiClient
    .submitScore(scorePayload)
    .then(() => {
      telemetry.emit(TELEMETRY_EVENTS.leaderboardEntrySubmitted, {
        board_type: 'island',
        island_id: reward.islandId,
        score: reward.islandScore,
      });
    })
    .catch(() => localStore.saveScore(scorePayload));

  await apiClient.submitProgress(progressPayload).catch(() => localStore.saveProgress(progressPayload));
}

function applyRewardLocally(reward: RewardData): void {
  progressState.completedIslands.add(reward.islandId);
  progressState.islandResults.set(reward.islandId, {
    score: reward.islandScore,
    grade: reward.grade,
  });

  if (reward.islandId === 'island_01' && !progressState.shipUpgrades.has('reinforced_mast')) {
    progressState.shipUpgrades.add('reinforced_mast');
    telemetry.emit(TELEMETRY_EVENTS.upgradeEarned, {
      upgrade_id: 'reinforced_mast',
      island_id: reward.islandId,
      rarity: 'common',
    });
  }

  telemetry.emit(TELEMETRY_EVENTS.islandComplete, {
    island_id: reward.islandId,
    total_ms: Math.floor(performance.now()),
    expert_bonus: reward.expertBonus,
    chart_fragments_total: progressState.completedIslands.size,
  });
}

function startIsland(islandId: string): void {
  void audioManager.resume();

  const islandScene = new IslandScene({
    islandId,
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
              applyRewardLocally(reward);
              void persistReward(reward);
              void telemetry.flush();

              if (reward.islandId === 'island_02') {
                goToLeaderboard();
                return;
              }

              goToOverworld(reward.islandId);
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
  debugController.sailToIsland = () => undefined;
  (window as Window & { __dr_scene?: string }).__dr_scene = 'island';
}

const menuScene = new MenuScene(
  () => {
    if (stateMachine.canTransition('play') && stateMachine.current === 'menu') {
      stateMachine.transition('play', 'menu_start_pressed');
    }

    goToOverworld();
  },
  () => {
    goToLeaderboard();
  },
);

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

async function hydrateProgress(): Promise<void> {
  try {
    const response = await apiClient.getProgress(PLAYER_ID);
    for (const entry of response.progress) {
      if (entry.status === 'completed') {
        progressState.completedIslands.add(entry.islandId);
      }
      if (entry.bestGrade) {
        progressState.islandResults.set(entry.islandId, {
          score: entry.bestScore,
          grade: entry.bestGrade,
        });
      }
      if (entry.islandId === 'island_01' && entry.status === 'completed') {
        progressState.shipUpgrades.add('reinforced_mast');
      }
    }
  } catch {
    // offline mode
  }

  const drainResult = await localStore.drainQueue(apiClient);
  if (drainResult.sent > 0 || drainResult.failed > 0) {
    telemetry.emit(TELEMETRY_EVENTS.rewardUsed, {
      queued_sent: drainResult.sent,
      queued_failed: drainResult.failed,
    });
  }
}

void hydrateProgress();
window.addEventListener('online', () => {
  void localStore.drainQueue(apiClient);
});

window.addEventListener('beforeunload', () => {
  void telemetry.flush();
});
