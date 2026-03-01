/**
 * Abyssal Gauntlet DLC Pack � Endless Roguelike Monster Hunt
 *
 * A fundamentally different campaign: NO learning concepts, landmarks,
 * or minigames. Pure combat/exploration in a Zelda NES-style endless
 * screen-by-screen world. The player moves their character between
 * connected island screens, fighting monsters that scale with distance
 * from spawn. High-score focused.
 *
 * The gauntlet scene generates screens procedurally � island templates
 * here serve as overworld routing metadata only.
 *
 * 6 template islands - 0 concepts - Tiers 1-3
 * Unlocked after completing the base AI/ML campaign.
 *
 * Stage 1 � Boneshore Landing   � Tier 1, Danger 1-2
 * Stage 2 � Ironwreck Shallows  � Tier 1, Danger 2-3
 * Stage 3 � Bloodtide Reef      � Tier 2, Danger 3
 * Stage 4 � Abyssal Trench      � Tier 2, Danger 3-4
 * Stage 5 � Leviathan's Maw     � Tier 3, Danger 4
 * Stage 6 � The Drowned Throne  � Tier 3, Danger 5  BOSS
 */

import type { DlcPack } from '../types';

export const ABYSSAL_GAUNTLET_PACK: DlcPack = {
  manifest: {
    id: 'abyssal-gauntlet',
    title: 'Abyssal Gauntlet',
    description: 'Endless roguelike monster hunt � slay yer way to glory!',
    version: '1.0.0',
    topic: 'Combat Mastery',
    conceptCount: 0,
    islandCount: 6,
    prerequisite: 'base_complete',
    tierRange: { min: 1, max: 3 },
  },
  content: {
    islands: [
      {
        id: 'dlc_boneshore_landing',
        name: 'Boneshore Landing',
        encounterType: 'battle',
        conceptIds: [],
        landmarks: [],
        reward: 'gauntlet_tooth',
        vegetation: ['dead_coral'],
      },
      {
        id: 'dlc_ironwreck_shallows',
        name: 'Ironwreck Shallows',
        encounterType: 'battle',
        conceptIds: [],
        landmarks: [],
        unlockAfter: 'dlc_boneshore_landing',
        reward: 'iron_shard',
        vegetation: ['dead_coral'],
      },
      {
        id: 'dlc_bloodtide_reef',
        name: 'Bloodtide Reef',
        encounterType: 'battle',
        conceptIds: [],
        landmarks: [],
        unlockAfter: 'dlc_ironwreck_shallows',
        reward: 'bloodstone',
        vegetation: ['blood_kelp'],
      },
      {
        id: 'dlc_abyssal_trench',
        name: 'Abyssal Trench',
        encounterType: 'squid',
        conceptIds: [],
        landmarks: [],
        unlockAfter: 'dlc_bloodtide_reef',
        reward: 'abyssal_scale',
        vegetation: ['bioluminescent_anemone'],
      },
      {
        id: 'dlc_leviathans_maw',
        name: "Leviathan's Maw",
        encounterType: 'storm',
        conceptIds: [],
        landmarks: [],
        unlockAfter: 'dlc_abyssal_trench',
        reward: 'leviathan_fang',
        vegetation: ['blood_kelp'],
      },
      {
        id: 'dlc_drowned_throne',
        name: 'The Drowned Throne',
        encounterType: 'squid',
        conceptIds: [],
        landmarks: [],
        unlockAfter: 'dlc_leviathans_maw',
        reward: 'crown_of_the_deep',
        vegetation: ['bioluminescent_anemone'],
      },
    ],

    // No learning concepts � pure combat DLC
    concepts: [],

    encounters: [
      {
        id: 'gauntlet_brawl_easy',
        type: 'battle',
        promptCount: 2,
        timeWindowMs: 10000,
        timeDecayPerPromptMs: 400,
        noviceAssistThreshold: 2,
        assistStrength: 'medium',
        expertParTimeMs: 14000,
      },
      {
        id: 'gauntlet_brawl_mid',
        type: 'battle',
        promptCount: 3,
        timeWindowMs: 8000,
        timeDecayPerPromptMs: 600,
        noviceAssistThreshold: 1,
        assistStrength: 'subtle',
        expertParTimeMs: 12000,
      },
      {
        id: 'gauntlet_brawl_hard',
        type: 'battle',
        promptCount: 4,
        timeWindowMs: 6000,
        timeDecayPerPromptMs: 800,
        noviceAssistThreshold: 1,
        assistStrength: 'subtle',
        expertParTimeMs: 10000,
      },
      {
        id: 'gauntlet_trench_horror',
        type: 'squid',
        promptCount: 4,
        timeWindowMs: 7000,
        timeDecayPerPromptMs: 700,
        noviceAssistThreshold: 1,
        assistStrength: 'subtle',
        expertParTimeMs: 11000,
      },
      {
        id: 'gauntlet_storm_fury',
        type: 'storm',
        promptCount: 4,
        timeWindowMs: 6500,
        timeDecayPerPromptMs: 750,
        noviceAssistThreshold: 1,
        assistStrength: 'subtle',
        expertParTimeMs: 10500,
      },
      {
        id: 'gauntlet_boss',
        type: 'squid',
        promptCount: 5,
        timeWindowMs: 5000,
        timeDecayPerPromptMs: 900,
        noviceAssistThreshold: 0,
        assistStrength: 'subtle',
        expertParTimeMs: 9000,
      },
    ],

    overworldNodes: [
      { islandId: 'dlc_boneshore_landing', name: 'Boneshore Landing', x: 110, y: 104 },
      { islandId: 'dlc_ironwreck_shallows', name: 'Ironwreck Shallows', x: 66, y: 148 },
      { islandId: 'dlc_bloodtide_reef', name: 'Bloodtide Reef', x: 154, y: 192 },
      { islandId: 'dlc_abyssal_trench', name: 'Abyssal Trench', x: 110, y: 236 },
      { islandId: 'dlc_leviathans_maw', name: "Leviathan's Maw", x: 66, y: 280 },
      { islandId: 'dlc_drowned_throne', name: 'The Drowned Throne', x: 154, y: 280 },
    ],

    bestiary: [
      {
        id: 'bone_rattler',
        name: 'Bone Rattler',
        category: 'critter',
        flavour: 'Animated bones that clatter across the shore hunting for fresh marrow.',
        behaviour: 'Fast patrol. Charges in a straight line when alerted.',
        danger: 1,
        habitat: ['Boneshore Landing'],
        renderHint: 'skeleton',
      },
      {
        id: 'rust_crab',
        name: 'Rust Crab',
        category: 'critter',
        flavour: "A massive hermit crab living inside a ship's boiler.",
        behaviour: 'Slow patrol. Hard shell � requires combo to crack.',
        danger: 2,
        habitat: ['Ironwreck Shallows'],
        renderHint: 'crab',
      },
      {
        id: 'bloodfin_shark',
        name: 'Bloodfin Shark',
        category: 'critter',
        flavour: 'Scarlet-finned shark drawn to the scent of battle.',
        behaviour: 'Fast circling patrol. Lunges with critical damage.',
        danger: 3,
        habitat: ['Bloodtide Reef'],
        renderHint: 'shark',
      },
      {
        id: 'trench_lurker',
        name: 'Trench Lurker',
        category: 'critter',
        flavour: 'A pale eel-like creature with bioluminescent lure dangling from its jaw.',
        behaviour: 'Ambush predator. Weak to light-based attacks.',
        danger: 4,
        habitat: ['Abyssal Trench'],
        renderHint: 'eel',
      },
      {
        id: 'storm_wraith',
        name: 'Storm Wraith',
        category: 'critter',
        flavour: 'A ghostly figure crackling with lightning, born from drowned sailors.',
        behaviour: 'Teleports between strikes. Vulnerable during cooldown.',
        danger: 4,
        habitat: ["Leviathan's Maw"],
        renderHint: 'wraith',
      },
      {
        id: 'drowned_king',
        name: 'The Drowned King',
        category: 'critter',
        flavour: 'Ancient monarch of the deep, wielding a coral trident and tidal magic.',
        behaviour: 'Boss. Three-phase fight � learn patterns to survive.',
        danger: 5,
        habitat: ['The Drowned Throne'],
        renderHint: 'boss_king',
      },
      {
        id: 'abyssal_whirlpool',
        name: 'Abyssal Whirlpool',
        category: 'threat',
        flavour: 'A spiralling vortex that drags ships into the deep.',
        behaviour: 'Pulls the player toward centre. Escape before it closes.',
        danger: 3,
        habitat: ['Abyssal Trench', "Leviathan's Maw"],
        renderHint: 'whirlpool',
      },
      {
        id: 'blood_tide',
        name: 'Blood Tide',
        category: 'threat',
        flavour: 'Crimson waves that surge without warning, sapping vitality.',
        behaviour: 'Periodic wave. Jump-dodge or lose health.',
        danger: 3,
        habitat: ['Bloodtide Reef', 'The Drowned Throne'],
        renderHint: 'wave',
      },
      {
        id: 'dead_coral',
        name: 'Dead Coral',
        category: 'flora',
        flavour: 'Bleached, brittle formations that crumble at a touch.',
        behaviour: 'Decorative. Can be smashed for minor score bonus.',
        danger: 0,
        habitat: ['Boneshore Landing', 'Ironwreck Shallows'],
        renderHint: 'dead_coral',
      },
      {
        id: 'blood_kelp',
        name: 'Blood Kelp',
        category: 'flora',
        flavour: 'Deep crimson fronds that sway hypnotically in the current.',
        behaviour: 'Decorative. Conceals critters behind it.',
        danger: 0,
        habitat: ['Bloodtide Reef', "Leviathan's Maw"],
        renderHint: 'blood_kelp',
      },
      {
        id: 'bioluminescent_anemone',
        name: 'Bioluminescent Anemone',
        category: 'flora',
        flavour: 'Glowing tendrils that pulse with eerie blue-green light.',
        behaviour: 'Decorative. Illuminates nearby area.',
        danger: 0,
        habitat: ['Abyssal Trench', 'The Drowned Throne'],
        renderHint: 'bioluminescent_anemone',
      },
      {
        id: 'bone_bridge',
        name: 'Bone Bridge',
        category: 'terrain',
        flavour: 'A rickety bridge made from the ribs of a leviathan.',
        behaviour: 'Connects islands. Crumbles under weight � cross quickly.',
        danger: 1,
        habitat: ['Boneshore Landing', 'Ironwreck Shallows', 'Bloodtide Reef'],
        renderHint: 'bridge',
      },
      {
        id: 'abyssal_chain',
        name: 'Abyssal Chain',
        category: 'terrain',
        flavour: 'Enormous rusted chains anchoring something unseen far below.',
        behaviour: 'Connects deeper islands. Swing across or fall.',
        danger: 2,
        habitat: ['Abyssal Trench', "Leviathan's Maw", 'The Drowned Throne'],
        renderHint: 'chain',
      },
    ],

    // No minigames � pure combat DLC
    minigames: [],
  },
};
