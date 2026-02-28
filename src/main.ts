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
import { CONCEPTS } from './data/concepts';
import { createLandmark } from './entities/landmark';
import { ISLAND_UPGRADE_REWARDS } from './data/progression';
import { UPGRADES } from './data/upgrades';
import { gradeFromRatio } from './systems/scoring-system';
import type { EncounterStartData, OverworldProgress, RewardData } from './scenes/flow-types';

type DebugController = {
  completeEncoding: () => void;
  winEncounter: () => void;
  sailToIsland: (islandId: string) => void;
};

type IslandResult = {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  timeMs: number;
  accuracyPct: number;
  expertBonus: boolean;
};

const PLAYER_ID = 'player_local';
const MAIN_ISLAND_IDS = ['island_01', 'island_02', 'island_03', 'island_04', 'island_05'];

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
  expertBonusIslands: new Set<string>(),
  islandResults: new Map<string, IslandResult>(),
  shipUpgrades: new Set<string>(),
  conceptRecallCounts: new Map<string, number>(),
};

let activeIslandStartMs = 0;

function allMainExpertBonusesEarned(): boolean {
  return MAIN_ISLAND_IDS.every((islandId) => progressState.expertBonusIslands.has(islandId));
}

function getUnlockedIslands(): string[] {
  const unlocked: string[] = [];

  for (const island of ISLANDS) {
    if (island.id === 'hidden_reef') {
      if (progressState.shipUpgrades.has('ghostlight_lantern') && progressState.completedIslands.has('island_05')) {
        unlocked.push(island.id);
      }
      continue;
    }

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
    expertBonusIslands: Array.from(progressState.expertBonusIslands),
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
    availableIslands: getUnlockedIslands().filter((id) => id.startsWith('island_')),
    onBack: () => goToMenu(),
  });

  sceneManager.replace(leaderboardScene);
  debugController.sailToIsland = () => undefined;
  (window as Window & { __dr_scene?: string }).__dr_scene = 'leaderboard';
}

function mapGradeToAccuracy(grade: 'S' | 'A' | 'B' | 'C' | 'D', expertBonus: boolean): number {
  if (expertBonus) {
    return 100;
  }

  if (grade === 'S') {
    return 97;
  }
  if (grade === 'A') {
    return 88;
  }
  if (grade === 'B') {
    return 74;
  }
  if (grade === 'C') {
    return 58;
  }
  return 45;
}

function getAggregateStats(): { totalScore: number; totalTimeMs: number; accuracyPct: number; totalGrade: 'S' | 'A' | 'B' | 'C' | 'D' } {
  const results = Array.from(progressState.islandResults.values());
  const totalScore = results.reduce((acc, result) => acc + result.score, 0);
  const totalTimeMs = results.reduce((acc, result) => acc + result.timeMs, 0);
  const accuracyPct = results.length > 0 ? results.reduce((acc, result) => acc + result.accuracyPct, 0) / results.length : 0;

  const maxApprox = MAIN_ISLAND_IDS.length * 1400;
  const totalGrade = gradeFromRatio(Math.min(1, totalScore / maxApprox));

  return { totalScore, totalTimeMs, accuracyPct, totalGrade };
}

async function submitScoreRecord(payload: {
  boardType: 'island' | 'total' | 'speed' | 'accuracy';
  islandId?: string;
  score: number;
  timeMs: number;
  accuracyPct: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}): Promise<void> {
  const checksum = await computeScoreChecksum({
    playerId: PLAYER_ID,
    boardType: payload.boardType,
    islandId: payload.islandId,
    score: payload.score,
    timeMs: payload.timeMs,
    accuracyPct: payload.accuracyPct,
    grade: payload.grade,
  });

  const fullPayload = {
    playerId: PLAYER_ID,
    boardType: payload.boardType,
    islandId: payload.islandId,
    score: payload.score,
    timeMs: payload.timeMs,
    accuracyPct: payload.accuracyPct,
    grade: payload.grade,
    checksum,
  };

  await apiClient
    .submitScore(fullPayload)
    .then(() => {
      telemetry.emit(TELEMETRY_EVENTS.leaderboardEntrySubmitted, {
        board_type: payload.boardType,
        island_id: payload.islandId ?? null,
        score: payload.score,
        time_ms: payload.timeMs,
      });
    })
    .catch(() => localStore.saveScore(fullPayload));
}

function getConceptMasteryPayloadForIsland(islandId: string) {
  const island = ISLANDS.find((entry) => entry.id === islandId);
  if (!island) {
    return [];
  }

  return island.conceptIds.map((conceptId) => {
    const count = (progressState.conceptRecallCounts.get(conceptId) ?? 0) + 1;
    progressState.conceptRecallCounts.set(conceptId, count);

    return {
      conceptId,
      masteryLevel: (count >= 3 ? 'mastered' : 'recalled') as 'recalled' | 'mastered',
      recallCount: count,
    };
  });
}

async function persistReward(reward: RewardData): Promise<void> {
  const islandResult = progressState.islandResults.get(reward.islandId);
  const accuracyPct = islandResult?.accuracyPct ?? mapGradeToAccuracy(reward.grade, reward.expertBonus);
  const elapsedMs = islandResult?.timeMs ?? Math.max(1, Math.floor(performance.now()));

  await submitScoreRecord({
    boardType: 'island',
    islandId: reward.islandId,
    score: reward.islandScore,
    timeMs: elapsedMs,
    accuracyPct,
    grade: reward.grade,
  });

  const aggregate = getAggregateStats();
  await submitScoreRecord({
    boardType: 'total',
    score: aggregate.totalScore,
    timeMs: aggregate.totalTimeMs,
    accuracyPct: aggregate.accuracyPct,
    grade: aggregate.totalGrade,
  });
  await submitScoreRecord({
    boardType: 'speed',
    score: aggregate.totalScore,
    timeMs: aggregate.totalTimeMs,
    accuracyPct: aggregate.accuracyPct,
    grade: aggregate.totalGrade,
  });
  await submitScoreRecord({
    boardType: 'accuracy',
    score: Math.round(aggregate.accuracyPct * 100),
    timeMs: aggregate.totalTimeMs,
    accuracyPct: aggregate.accuracyPct,
    grade: aggregate.totalGrade,
  });

  const progressPayload = {
    playerId: PLAYER_ID,
    islandId: reward.islandId,
    status: 'completed' as const,
    bestGrade: reward.grade,
    bestScore: reward.islandScore,
    chartFragment: 1 as const,
    expertBonus: reward.expertBonus ? (1 as const) : (0 as const),
    attempts: 1,
    conceptMastery: getConceptMasteryPayloadForIsland(reward.islandId),
  };

  await apiClient.submitProgress(progressPayload).catch(() => localStore.saveProgress(progressPayload));
}

function applyUpgrade(upgradeId: string, islandId: string): void {
  if (progressState.shipUpgrades.has(upgradeId)) {
    return;
  }

  progressState.shipUpgrades.add(upgradeId);
  const definition = UPGRADES.find((entry) => entry.id === upgradeId);
  telemetry.emit(TELEMETRY_EVENTS.upgradeEarned, {
    upgrade_id: upgradeId,
    island_id: islandId,
    rarity: definition?.rarity ?? 'common',
  });
}

function applyRewardLocally(reward: RewardData): void {
  progressState.completedIslands.add(reward.islandId);

  const elapsedMs = Math.max(1, Math.floor(performance.now() - activeIslandStartMs));
  progressState.islandResults.set(reward.islandId, {
    score: reward.islandScore,
    grade: reward.grade,
    timeMs: elapsedMs,
    accuracyPct: mapGradeToAccuracy(reward.grade, reward.expertBonus),
    expertBonus: reward.expertBonus,
  });

  if (reward.expertBonus && MAIN_ISLAND_IDS.includes(reward.islandId)) {
    progressState.expertBonusIslands.add(reward.islandId);
  }

  const upgradeId = ISLAND_UPGRADE_REWARDS[reward.islandId];
  if (upgradeId) {
    applyUpgrade(upgradeId, reward.islandId);
  }

  if (allMainExpertBonusesEarned()) {
    applyUpgrade('ghostlight_lantern', reward.islandId);
  }

  telemetry.emit(TELEMETRY_EVENTS.islandComplete, {
    island_id: reward.islandId,
    total_ms: elapsedMs,
    expert_bonus: reward.expertBonus,
    chart_fragments_total: progressState.completedIslands.size,
  });
}

function buildSquidEncounterData(base: EncounterStartData): EncounterStartData {
  const sourceConcepts = CONCEPTS.filter(
    (concept) =>
      MAIN_ISLAND_IDS.includes(concept.islandId) &&
      (progressState.completedIslands.has(concept.islandId) || concept.islandId === base.islandId),
  ).slice(0, 8);

  const conceptOriginIsland: Record<string, string> = {};
  for (const concept of sourceConcepts) {
    conceptOriginIsland[concept.id] = concept.islandId;
  }

  const islandIds = MAIN_ISLAND_IDS.filter(
    (islandId) => progressState.completedIslands.has(islandId) || islandId === base.islandId,
  );

  const spacing = islandIds.length > 1 ? 168 / (islandIds.length - 1) : 0;
  const tentacleLandmarks = islandIds.map((islandId, index) => {
    const x = Math.floor(36 + spacing * index);
    const y = 220;
    return createLandmark(islandId, islandId, x, y);
  });

  return {
    ...base,
    landmarks: tentacleLandmarks,
    placedConceptIds: sourceConcepts.map((concept) => concept.id),
    conceptOriginIsland,
  };
}

function shouldGoToLeaderboardAfterReward(reward: RewardData): boolean {
  if (reward.islandId === 'hidden_reef') {
    return true;
  }

  if (reward.islandId === 'island_05') {
    const hiddenUnlocked = getUnlockedIslands().includes('hidden_reef');
    const hiddenCompleted = progressState.completedIslands.has('hidden_reef');
    return !hiddenUnlocked || hiddenCompleted;
  }

  return false;
}

function startIsland(islandId: string): void {
  void audioManager.resume();
  activeIslandStartMs = performance.now();

  const islandScene = new IslandScene({
    islandId,
    telemetry,
    audio: audioManager,
    onThreatTriggered: (encounterData) => {
      const withUpgrades: EncounterStartData = {
        ...encounterData,
        activeUpgrades: Array.from(progressState.shipUpgrades),
      };

      const finalEncounterData =
        withUpgrades.encounterType === 'squid' ? buildSquidEncounterData(withUpgrades) : withUpgrades;

      const encounterScene = new EncounterScene(finalEncounterData, {
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

              if (shouldGoToLeaderboardAfterReward(reward)) {
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

function hydrateAwardedUpgradesFromProgress(): void {
  for (const islandId of progressState.completedIslands) {
    const upgradeId = ISLAND_UPGRADE_REWARDS[islandId];
    if (upgradeId) {
      progressState.shipUpgrades.add(upgradeId);
    }
  }

  if (allMainExpertBonusesEarned()) {
    progressState.shipUpgrades.add('ghostlight_lantern');
  }
}

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
          timeMs: 0,
          accuracyPct: mapGradeToAccuracy(entry.bestGrade, entry.expertBonus === 1),
          expertBonus: entry.expertBonus === 1,
        });
      }
      if (entry.expertBonus === 1) {
        progressState.expertBonusIslands.add(entry.islandId);
      }
    }
  } catch {
    // offline mode
  }

  hydrateAwardedUpgradesFromProgress();

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
