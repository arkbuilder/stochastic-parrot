export interface ConceptDefinition {
  id: string;
  name: string;
  islandId: string;
  metaphorObject: string;
  landmarkId: string;
  tier: 1 | 2 | 3;
}

export const CONCEPTS: ConceptDefinition[] = [
  { id: 'training_data', name: 'Training Data', islandId: 'island_01', metaphorObject: 'Fish Crates', landmarkId: 'dock_crates', tier: 1 },
  { id: 'model', name: 'Model', islandId: 'island_01', metaphorObject: 'Navigational Chart', landmarkId: 'chart_table', tier: 1 },
  { id: 'inference', name: 'Inference', islandId: 'island_01', metaphorObject: 'Loaded Cannon', landmarkId: 'cannon', tier: 1 },
  { id: 'bias', name: 'Bias', islandId: 'island_02', metaphorObject: 'Crooked Compass', landmarkId: 'compass_pedestal', tier: 1 },
  { id: 'classification', name: 'Classification', islandId: 'island_02', metaphorObject: 'Sorting Bins', landmarkId: 'market_stalls', tier: 1 },
  { id: 'feedback_loop', name: 'Feedback Loop', islandId: 'island_02', metaphorObject: 'Tidewheel', landmarkId: 'tidewheel', tier: 1 },
  { id: 'overfitting', name: 'Overfitting', islandId: 'island_03', metaphorObject: 'Barnacle Chest', landmarkId: 'barnacle_chest', tier: 2 },
  { id: 'underfitting', name: 'Underfitting', islandId: 'island_03', metaphorObject: 'Blank Map Frame', landmarkId: 'blank_map_frame', tier: 2 },
  { id: 'training_vs_testing', name: 'Training vs Testing', islandId: 'island_03', metaphorObject: 'Twin Nets', landmarkId: 'twin_net_posts', tier: 2 },
  { id: 'reinforcement', name: 'Reinforcement', islandId: 'island_04', metaphorObject: 'Reward Bell', landmarkId: 'reward_bell_tower', tier: 2 },
  { id: 'reward_function', name: 'Reward Function', islandId: 'island_04', metaphorObject: 'Treasure Scale', landmarkId: 'treasure_scale', tier: 2 },
  { id: 'agent', name: 'Agent', islandId: 'island_04', metaphorObject: 'Crow\'s Nest Parrot', landmarkId: 'crows_nest', tier: 2 },
  { id: 'neural_network', name: 'Neural Network', islandId: 'island_05', metaphorObject: 'Rigging Web', landmarkId: 'rigging_web', tier: 3 },
  { id: 'gradient_descent', name: 'Gradient Descent', islandId: 'island_05', metaphorObject: 'Anchor Winch', landmarkId: 'anchor_winch', tier: 3 },
  { id: 'generalization', name: 'Generalization', islandId: 'island_05', metaphorObject: 'Master Key Shrine', landmarkId: 'master_key_shrine', tier: 3 },
];
