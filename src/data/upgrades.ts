export interface UpgradeDefinition {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAfterIsland: string;
  effects: string[];
}

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: 'reinforced_mast',
    name: 'Reinforced Mast',
    rarity: 'common',
    unlockedAfterIsland: 'island_01',
    effects: ['sail_speed_1.2x', 'bit_assist_speed_up'],
  },
  {
    id: 'enchanted_cannon',
    name: 'Enchanted Cannon',
    rarity: 'uncommon',
    unlockedAfterIsland: 'island_02',
    effects: ['battle_error_tolerance_plus_1'],
  },
  {
    id: 'ironclad_hull',
    name: 'Ironclad Hull',
    rarity: 'rare',
    unlockedAfterIsland: 'island_03',
    effects: ['storm_resistance_plus_1'],
  },
  {
    id: 'golden_compass',
    name: 'Golden Compass',
    rarity: 'epic',
    unlockedAfterIsland: 'island_04',
    effects: ['recall_window_plus_2_seconds'],
  },
  {
    id: 'ghostlight_lantern',
    name: 'Ghostlight Lantern',
    rarity: 'legendary',
    unlockedAfterIsland: 'expert_completion',
    effects: ['unlock_hidden_reef', 'clear_fog_of_war'],
  },
];
