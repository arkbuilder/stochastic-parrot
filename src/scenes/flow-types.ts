import type { LandmarkEntity } from '../entities/landmark';

export interface EncounterStartData {
  islandId: string;
  encounterType: 'fog' | 'storm' | 'battle' | 'ruins' | 'squid';
  landmarks: LandmarkEntity[];
  placedConceptIds: string[];
  startedAtMs: number;
  activeUpgrades: string[];
  conceptOriginIsland?: Record<string, string>;
}

export interface RewardData {
  islandId: string;
  islandScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  expertBonus: boolean;
  comboPeak: number;
  encounterType?: 'fog' | 'storm' | 'battle' | 'ruins' | 'squid';
}

export interface IslandResult {
  islandId: string;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface OverworldProgress {
  completedIslands: string[];
  unlockedIslands: string[];
  islandResults: IslandResult[];
  shipUpgrades: string[];
  expertBonusIslands: string[];
}
