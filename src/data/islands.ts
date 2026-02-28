export interface LandmarkConfig {
  id: string;
  conceptId: string;
  x: number;
  y: number;
}

export interface IslandConfig {
  id: string;
  name: string;
  encounterType: 'fog' | 'storm' | 'battle' | 'ruins' | 'squid';
  conceptIds: string[];
  landmarks: LandmarkConfig[];
  unlockAfter?: string;
  reward: string;
}

export const ISLANDS: IslandConfig[] = [
  {
    id: 'island_01',
    name: 'Bay of Learning',
    encounterType: 'fog',
    conceptIds: ['training_data', 'model', 'inference'],
    landmarks: [
      { id: 'dock_crates', conceptId: 'training_data', x: 52, y: 290 },
      { id: 'chart_table', conceptId: 'model', x: 120, y: 220 },
      { id: 'cannon', conceptId: 'inference', x: 185, y: 260 },
    ],
    reward: 'chart_fragment_a',
  },
  {
    id: 'island_02',
    name: 'Driftwood Shallows',
    encounterType: 'storm',
    conceptIds: ['bias', 'classification', 'feedback_loop'],
    landmarks: [
      { id: 'compass_pedestal', conceptId: 'bias', x: 60, y: 280 },
      { id: 'market_stalls', conceptId: 'classification', x: 120, y: 210 },
      { id: 'tidewheel', conceptId: 'feedback_loop', x: 180, y: 250 },
    ],
    unlockAfter: 'island_01',
    reward: 'chart_fragment_b',
  },
  {
    id: 'island_03',
    name: 'Coral Maze',
    encounterType: 'battle',
    conceptIds: ['overfitting', 'underfitting', 'training_vs_testing'],
    landmarks: [
      { id: 'barnacle_chest', conceptId: 'overfitting', x: 58, y: 300 },
      { id: 'blank_map_frame', conceptId: 'underfitting', x: 121, y: 225 },
      { id: 'twin_net_posts', conceptId: 'training_vs_testing', x: 182, y: 250 },
    ],
    unlockAfter: 'island_02',
    reward: 'chart_fragment_c',
  },
  {
    id: 'island_04',
    name: 'Storm Bastion',
    encounterType: 'ruins',
    conceptIds: ['reinforcement', 'reward_function', 'agent'],
    landmarks: [
      { id: 'reward_bell_tower', conceptId: 'reinforcement', x: 50, y: 300 },
      { id: 'treasure_scale', conceptId: 'reward_function', x: 122, y: 215 },
      { id: 'crows_nest', conceptId: 'agent', x: 190, y: 245 },
    ],
    unlockAfter: 'island_03',
    reward: 'chart_fragment_d',
  },
  {
    id: 'island_05',
    name: "Kraken's Reach",
    encounterType: 'squid',
    conceptIds: ['neural_network', 'gradient_descent', 'generalization'],
    landmarks: [
      { id: 'rigging_web', conceptId: 'neural_network', x: 50, y: 290 },
      { id: 'anchor_winch', conceptId: 'gradient_descent', x: 124, y: 220 },
      { id: 'master_key_shrine', conceptId: 'generalization', x: 189, y: 250 },
    ],
    unlockAfter: 'island_04',
    reward: 'golden_chart',
  },
];
