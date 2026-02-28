import type { LandmarkEntity } from '../entities/landmark';

export interface EncounterStartData {
  islandId: string;
  landmarks: LandmarkEntity[];
  placedConceptIds: string[];
  startedAtMs: number;
}

export interface RewardData {
  islandId: string;
  islandScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  expertBonus: boolean;
  comboPeak: number;
}
