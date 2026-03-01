export interface OverworldNodeConfig {
  islandId: string;
  name: string;
  x: number;
  y: number;
  secret?: boolean;
}

export const OVERWORLD_NODES: OverworldNodeConfig[] = [
  { islandId: 'island_01', name: 'Bay of Learning', x: 66, y: 236 },
  { islandId: 'island_02', name: 'Driftwood Shallows', x: 110, y: 192 },
  { islandId: 'island_03', name: 'Coral Maze', x: 154, y: 236 },
  { islandId: 'island_04', name: 'Storm Bastion', x: 154, y: 148 },
  { islandId: 'island_05', name: "Kraken's Reach", x: 198, y: 104 },
  { islandId: 'hidden_reef', name: 'Hidden Reef', x: 22, y: 104, secret: true },
];

export const ISLAND_UPGRADE_REWARDS: Record<string, string> = {
  island_01: 'reinforced_mast',
  island_02: 'enchanted_cannon',
  island_03: 'ironclad_hull',
  island_04: 'golden_compass',
};
