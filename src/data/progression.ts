export interface OverworldNodeConfig {
  islandId: string;
  name: string;
  x: number;
  y: number;
  secret?: boolean;
}

export const OVERWORLD_NODES: OverworldNodeConfig[] = [
  { islandId: 'island_01', name: 'Bay of Learning', x: 56, y: 246 },
  { islandId: 'island_02', name: 'Driftwood Shallows', x: 108, y: 194 },
  { islandId: 'island_03', name: 'Coral Maze', x: 152, y: 232 },
  { islandId: 'island_04', name: 'Storm Bastion', x: 178, y: 166 },
  { islandId: 'island_05', name: "Kraken's Reach", x: 206, y: 106 },
  { islandId: 'hidden_reef', name: 'Hidden Reef', x: 34, y: 122, secret: true },
];

export const ISLAND_UPGRADE_REWARDS: Record<string, string> = {
  island_01: 'reinforced_mast',
  island_02: 'enchanted_cannon',
  island_03: 'ironclad_hull',
  island_04: 'golden_compass',
};
