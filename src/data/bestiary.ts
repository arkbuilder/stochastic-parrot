/**
 * Bestiary — Monster Library Data
 *
 * Catalogue of every creature, threat, and flora in the Memory Sea.
 * Used by BestiaryScene to display a browseable library.
 *
 * Three categories:
 *   - Island Critters: patrol enemies encountered during the encode phase
 *   - Sea Threats: encounter-level hazards faced during the recall phase
 *   - Island Flora: unique vegetation found on each island
 */

export type BestiaryCategory = 'critter' | 'threat' | 'flora' | 'terrain';

export interface BestiaryEntry {
  /** Unique key */
  id: string;
  /** Display name */
  name: string;
  /** Category for tab filtering */
  category: BestiaryCategory;
  /** Short 1-line flavour text */
  flavour: string;
  /** Behaviour description (what it does mechanically) */
  behaviour: string;
  /** Danger level 1–5 */
  danger: number;
  /** Island(s) where this creature appears */
  habitat: string[];
  /** Rendering hint — which draw function / encounter type to invoke */
  renderHint: string;
}

// ── Island Critters (encode phase) ───────────────────────────

const crab: BestiaryEntry = {
  id: 'crab',
  name: 'Scuttle Crab',
  category: 'critter',
  flavour: 'Angry sideways critters that guard the shoreline.',
  behaviour: 'Patrols between two points. Stuns on contact. Predictable path.',
  danger: 1,
  habitat: ['Bay of Learning', 'Driftwood Shallows', 'Coral Maze'],
  renderHint: 'crab',
};

const fireCrab: BestiaryEntry = {
  id: 'fire_crab',
  name: 'Fire Crab',
  category: 'critter',
  flavour: 'A gold-plated crab wreathed in flame. Speed is its weapon.',
  behaviour: 'Faster patrol than its cousin. Flaming claws have wider reach.',
  danger: 3,
  habitat: ['Coral Maze', 'Storm Bastion', "Kraken's Reach"],
  renderHint: 'fire_crab',
};

const jellyfish: BestiaryEntry = {
  id: 'jellyfish',
  name: 'Memory Jelly',
  category: 'critter',
  flavour: 'Drifting bells of purple light that erase short-term recall.',
  behaviour: 'Patrols slowly. Stuns on contact. Soft, pulsing movement.',
  danger: 2,
  habitat: ['Driftwood Shallows', 'Storm Bastion', 'Hidden Reef'],
  renderHint: 'jellyfish',
};

const shadowJelly: BestiaryEntry = {
  id: 'shadow_jelly',
  name: 'Shadow Jelly',
  category: 'critter',
  flavour: 'A dark bell that fades in and out of sight like a bad dream.',
  behaviour: 'Almost invisible. Phases between translucent and near-hidden.',
  danger: 3,
  habitat: ['Storm Bastion', "Kraken's Reach", 'Hidden Reef'],
  renderHint: 'shadow_jelly',
};

const burrower: BestiaryEntry = {
  id: 'burrower',
  name: 'Tunnel Lurker',
  category: 'critter',
  flavour: 'Burrows underground, then erupts beneath the unwary captain.',
  behaviour: 'Hides below ground. Emerges near the player. Chases, lunges, then retreats.',
  danger: 3,
  habitat: ['Coral Maze', "Kraken's Reach", 'Hidden Reef'],
  renderHint: 'burrower',
};

const sandWyrm: BestiaryEntry = {
  id: 'sand_wyrm',
  name: 'Sand Wyrm',
  category: 'critter',
  flavour: 'An enormous wyrm whose jaws can swallow a rowboat whole.',
  behaviour: 'Like the Lurker but bigger, faster, and harder to outrun.',
  danger: 4,
  habitat: ["Kraken's Reach", 'Hidden Reef'],
  renderHint: 'sand_wyrm',
};

const urchin: BestiaryEntry = {
  id: 'urchin',
  name: 'Reef Urchin',
  category: 'critter',
  flavour: 'Sits on the seabed, then bristles with venomous spines.',
  behaviour: 'Stationary. Periodically extends spikes in a wide area burst.',
  danger: 2,
  habitat: ['Coral Maze', 'Storm Bastion', 'Hidden Reef'],
  renderHint: 'urchin',
};

const ray: BestiaryEntry = {
  id: 'ray',
  name: 'Phantom Ray',
  category: 'critter',
  flavour: 'A ghostly stingray that glides silent and fast as moonlight.',
  behaviour: 'Fast diagonal patrol. Translucent and hard to track visually.',
  danger: 3,
  habitat: ['Storm Bastion', "Kraken's Reach", 'Hidden Reef'],
  renderHint: 'ray',
};

// ── Sea Threats (recall / encounter phase) ───────────────────

const cursedFog: BestiaryEntry = {
  id: 'cursed_fog',
  name: 'Cursed Fog',
  category: 'threat',
  flavour: 'A creeping wall of purple mist that swallows landmarks whole.',
  behaviour: 'Fog descends from the top. Recall concepts before landmarks vanish. Steady pressure.',
  danger: 2,
  habitat: ['Bay of Learning'],
  renderHint: 'fog',
};

const storm: BestiaryEntry = {
  id: 'storm',
  name: 'Memory Storm',
  category: 'threat',
  flavour: 'Lightning cracks the sky — landmarks visible only in the flash.',
  behaviour: 'Darkness hides landmarks. Brief lightning flashes reveal them. Recall during the flash.',
  danger: 3,
  habitat: ['Driftwood Shallows'],
  renderHint: 'storm',
};

const rivalBattle: BestiaryEntry = {
  id: 'rival_battle',
  name: 'Captain Null',
  category: 'threat',
  flavour: 'A rival pirate who memorises without understanding.',
  behaviour: 'Ship-to-ship battle. Correct recalls damage the enemy. Wrong answers cost health.',
  danger: 3,
  habitat: ['Coral Maze'],
  renderHint: 'battle',
};

const ruins: BestiaryEntry = {
  id: 'ruins',
  name: 'Ancient Ruins',
  category: 'threat',
  flavour: 'A stone temple built by the old cartographers. Knowledge flows in order.',
  behaviour: 'Sequence puzzle. Recall concepts in the correct slot order to unlock the chamber.',
  danger: 3,
  habitat: ['Storm Bastion', 'Hidden Reef'],
  renderHint: 'ruins',
};

const giantSquid: BestiaryEntry = {
  id: 'giant_squid',
  name: 'The Kraken',
  category: 'threat',
  flavour: "Guardian of the deep. Its tentacles grip every island's knowledge.",
  behaviour: 'Boss encounter. Tentacles grip landmarks from all prior islands. Recall to sever each one.',
  danger: 5,
  habitat: ["Kraken's Reach"],
  renderHint: 'squid',
};

// ── Island Flora (unique vegetation per island) ─────────────

const palmTree: BestiaryEntry = {
  id: 'palm_tree',
  name: 'Pirate Palm',
  category: 'flora',
  flavour: 'Tall, swaying palms that shade the bay. Coconuts occasionally drop.',
  behaviour: 'Decorative. Gentle sway in the breeze. Marks safe shoreline.',
  danger: 0,
  habitat: ['Bay of Learning'],
  renderHint: 'palm_tree',
};

const mangrove: BestiaryEntry = {
  id: 'mangrove',
  name: 'Driftwood Mangrove',
  category: 'flora',
  flavour: 'Gnarled roots reach into the shallows, sheltering tiny creatures.',
  behaviour: 'Tangled root network. Provides cover in shallow waters.',
  danger: 0,
  habitat: ['Driftwood Shallows'],
  renderHint: 'mangrove',
};

const coralFan: BestiaryEntry = {
  id: 'coral_fan',
  name: 'Coral Fan',
  category: 'flora',
  flavour: 'Vibrant branching coral that sways with the current like a living maze.',
  behaviour: 'Decorative. Pulses with colour in rhythm with the tides.',
  danger: 0,
  habitat: ['Coral Maze'],
  renderHint: 'coral_fan',
};

const stormPine: BestiaryEntry = {
  id: 'storm_pine',
  name: 'Storm Pine',
  category: 'flora',
  flavour: 'Wind-blasted conifers clinging to bastion cliffs, leaning seaward.',
  behaviour: 'Windswept silhouette. Bends in the storm but never breaks.',
  danger: 0,
  habitat: ['Storm Bastion'],
  renderHint: 'storm_pine',
};

const glowKelp: BestiaryEntry = {
  id: 'glow_kelp',
  name: 'Abyssal Glow Kelp',
  category: 'flora',
  flavour: 'Bioluminescent fronds that light the deep like drowned lanterns.',
  behaviour: 'Glows rhythmically. Brightens when the Kraken stirs.',
  danger: 0,
  habitat: ["Kraken's Reach"],
  renderHint: 'glow_kelp',
};

const seaAnemone: BestiaryEntry = {
  id: 'sea_anemone',
  name: 'Jewel Anemone',
  category: 'flora',
  flavour: 'Dazzling tentacles wave from hidden reef pools, beckoning explorers.',
  behaviour: 'Decorative. Tentacles retract when approached, then slowly bloom.',
  danger: 0,
  habitat: ['Hidden Reef'],
  renderHint: 'sea_anemone',
};

// ── Island Terrain (ground tile types) ───────────────────────

const terrainWater: BestiaryEntry = {
  id: 'terrain_water',
  name: 'Open Sea',
  category: 'terrain',
  flavour: 'The endless deep surrounding every island. Stay out of it.',
  behaviour: 'Impassable. Animated waves and foam mark the boundary.',
  danger: 0,
  habitat: ['Bay of Learning', 'Driftwood Shallows', 'Coral Maze', 'Storm Bastion', "Kraken's Reach", 'Hidden Reef'],
  renderHint: 'tile_water',
};

const terrainSand: BestiaryEntry = {
  id: 'terrain_sand',
  name: 'Sandy Shore',
  category: 'terrain',
  flavour: 'Warm beach sand between the tide-line and the interior.',
  behaviour: 'Safe to walk. Grain dots shimmer in the sun.',
  danger: 0,
  habitat: ['Bay of Learning', 'Driftwood Shallows', 'Coral Maze', 'Storm Bastion', "Kraken's Reach", 'Hidden Reef'],
  renderHint: 'tile_sand',
};

const terrainGrass: BestiaryEntry = {
  id: 'terrain_grass',
  name: 'Island Grass',
  category: 'terrain',
  flavour: 'Tough tropical grass that covers any island with soil.',
  behaviour: 'Main walking surface. Green tuft marks sway gently.',
  danger: 0,
  habitat: ['Bay of Learning', 'Driftwood Shallows', 'Coral Maze', 'Storm Bastion', "Kraken's Reach", 'Hidden Reef'],
  renderHint: 'tile_grass',
};

const terrainDock: BestiaryEntry = {
  id: 'terrain_dock',
  name: 'Wooden Dock',
  category: 'terrain',
  flavour: 'Salt-soaked planks nailed over the harbour. Creaks underfoot.',
  behaviour: 'Walkable. Plank-line pattern. Often found near arrival points.',
  danger: 0,
  habitat: ['Bay of Learning', 'Driftwood Shallows', 'Coral Maze', 'Storm Bastion', "Kraken's Reach", 'Hidden Reef'],
  renderHint: 'tile_dock',
};

const terrainCobble: BestiaryEntry = {
  id: 'terrain_cobble',
  name: 'Cobblestone Path',
  category: 'terrain',
  flavour: 'Hand-laid stone paths connecting structures across the isle.',
  behaviour: 'Walkable. Stone line pattern. Leads to key landmarks.',
  danger: 0,
  habitat: ['Coral Maze', 'Storm Bastion'],
  renderHint: 'tile_cobble',
};

const terrainTidePools: BestiaryEntry = {
  id: 'terrain_tide_pools',
  name: 'Tide Pools',
  category: 'terrain',
  flavour: 'Shallow rock pools teeming with tiny sea life.',
  behaviour: 'Walkable but slow. Bubbles rise from hidden crevices.',
  danger: 0,
  habitat: ['Driftwood Shallows'],
  renderHint: 'tile_tide_pools',
};

const terrainRuinsStone: BestiaryEntry = {
  id: 'terrain_ruins_stone',
  name: 'Ruins Flagstone',
  category: 'terrain',
  flavour: 'Cracked slabs from an ancient temple. Faint runes still glow.',
  behaviour: 'Walkable. Cracked grid pattern. Occasional arcane shimmer.',
  danger: 0,
  habitat: ['Storm Bastion'],
  renderHint: 'tile_ruins_stone',
};

const terrainVolcanic: BestiaryEntry = {
  id: 'terrain_volcanic',
  name: 'Volcanic Rock',
  category: 'terrain',
  flavour: 'Black basalt veined with molten ember light.',
  behaviour: 'Walkable. Cracks glow orange-red. Embers pulse.',
  danger: 0,
  habitat: ["Kraken's Reach"],
  renderHint: 'tile_volcanic',
};

const terrainReefPools: BestiaryEntry = {
  id: 'terrain_reef_pools',
  name: 'Reef Pools',
  category: 'terrain',
  flavour: 'Crystal-clear shallows dotted with living coral specks.',
  behaviour: 'Walkable. Coral specks shimmer pink, orange, and purple.',
  danger: 0,
  habitat: ['Hidden Reef'],
  renderHint: 'tile_reef_pools',
};

const terrainMossyStone: BestiaryEntry = {
  id: 'terrain_mossy_stone',
  name: 'Mossy Stone',
  category: 'terrain',
  flavour: 'Old stone overgrown with thick emerald moss.',
  behaviour: 'Walkable. Green patches creep across cracked rock.',
  danger: 0,
  habitat: ['Coral Maze', 'Storm Bastion', 'Hidden Reef'],
  renderHint: 'tile_mossy_stone',
};

// ── Exports ──────────────────────────────────────────────────

export const BESTIARY: BestiaryEntry[] = [
  crab,
  fireCrab,
  jellyfish,
  shadowJelly,
  burrower,
  sandWyrm,
  urchin,
  ray,
  cursedFog,
  storm,
  rivalBattle,
  ruins,
  giantSquid,
  palmTree,
  mangrove,
  coralFan,
  stormPine,
  glowKelp,
  seaAnemone,
  terrainWater,
  terrainSand,
  terrainGrass,
  terrainDock,
  terrainCobble,
  terrainTidePools,
  terrainRuinsStone,
  terrainVolcanic,
  terrainReefPools,
  terrainMossyStone,
];

export const CRITTERS: BestiaryEntry[] = BESTIARY.filter((e) => e.category === 'critter');
export const THREATS: BestiaryEntry[] = BESTIARY.filter((e) => e.category === 'threat');
export const FLORA: BestiaryEntry[] = BESTIARY.filter((e) => e.category === 'flora');
export const TERRAIN: BestiaryEntry[] = BESTIARY.filter((e) => e.category === 'terrain');
