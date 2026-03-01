/**
 * Island Cinematics — story beats for every island intro & outro.
 *
 * Follows the three-act structure from Design/NarrativeStructure.md:
 *   Act 1 (Islands 1–2): Learning to Learn
 *   Act 2 (Islands 3–4): The Rival Appears
 *   Act 3 (Island 5):    The Kraken's Test
 *   Bonus: Hidden Reef
 *
 * Coordinates are in 240×400 virtual space.
 */

import type { IslandCinematics } from './types';
import { DLC_ROCKET_CINEMATICS } from './dlc-rocket-cinematics';

// ── Act 1 — The Chart Begins ─────────────────────────────────

const island01: IslandCinematics = {
  intro: {
    id: 'island_01_intro',
    beats: [
      {
        id: 'i01_i_1',
        durationS: 4,
        sky: 'dawn',
        characters: [
          { id: 'ship_loci', x: 40, y: 180, scale: 0.8, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 170, y: 130, scale: 1.2 },
        ],
        caption: 'The Memory Sea... a cursed archipelago where knowledge dissolves into the fog.',
        waitForTap: true,
      },
      {
        id: 'i01_i_2',
        durationS: 3.5,
        sky: 'dawn',
        characters: [
          { id: 'nemo', x: 120, y: 280, scale: 1.2, anim: 'idle' },
          { id: 'bit', x: 155, y: 250, scale: 0.8, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
        ],
        caption: 'Captain Nemo arrives at the Bay of Learning, chart nearly blank.',
        waitForTap: true,
      },
      {
        id: 'i01_i_3',
        durationS: 3,
        sky: 'dawn',
        characters: [
          { id: 'nemo', x: 80, y: 290, scale: 1, anim: 'walk' },
          { id: 'bit', x: 115, y: 260, scale: 0.7, anim: 'wave' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 278, scale: 1.4 },
          { kind: 'fog_wall', x: 120, y: 80, scale: 1 },
        ],
        caption: 'Place knowledge in landmarks... or the fog will take it.',
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'island_01_outro',
    beats: [
      {
        id: 'i01_o_1',
        durationS: 3,
        sky: 'day',
        characters: [
          { id: 'nemo', x: 120, y: 280, scale: 1.2, anim: 'celebrate' },
          { id: 'bit', x: 160, y: 250, scale: 0.8, anim: 'wave' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'chart_fragment', x: 120, y: 180, scale: 1.2 },
        ],
        caption: 'A chart fragment recovered! The first region takes shape.',
        waitForTap: true,
      },
      {
        id: 'i01_o_2',
        durationS: 3.5,
        sky: 'day',
        characters: [
          { id: 'ship_loci', x: 60, y: 190, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 190, y: 140, scale: 0.8 },
        ],
        caption: 'Another island appears through the mist...',
        waitForTap: true,
      },
      {
        id: 'i01_o_3',
        durationS: 2.5,
        sky: 'night',
        props: [
          { kind: 'tentacle', x: 180, y: 300, scale: 1.5 },
        ],
        tint: 'rgba(10,5,30,0.4)',
        caption: 'Something stirs beneath the waves...',
        shake: 0.15,
        waitForTap: true,
      },
    ],
  },
};

const island02: IslandCinematics = {
  intro: {
    id: 'island_02_intro',
    beats: [
      {
        id: 'i02_i_1',
        durationS: 3.5,
        sky: 'storm',
        characters: [
          { id: 'ship_loci', x: 50, y: 200, scale: 0.8, anim: 'idle' },
        ],
        props: [
          { kind: 'lightning', x: 160, y: 40, scale: 1 },
        ],
        caption: 'Dark clouds gather over Driftwood Shallows.',
        shake: 0.1,
        waitForTap: true,
      },
      {
        id: 'i02_i_2',
        durationS: 3,
        sky: 'storm',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'fog_wall', x: 120, y: 60, scale: 0.8 },
        ],
        caption: 'The storm scatters memory. Knowledge is harder to hold here.',
        waitForTap: true,
      },
      {
        id: 'i02_i_3',
        durationS: 2.5,
        sky: 'storm',
        characters: [
          { id: 'nemo', x: 120, y: 290, scale: 1.2, anim: 'walk' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 278, scale: 1.4 },
          { kind: 'lightning', x: 80, y: 30, scale: 1.2 },
        ],
        caption: 'Anchor your knowledge to the landmarks — or lose it to the wind.',
        shake: 0.15,
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'island_02_outro',
    beats: [
      {
        id: 'i02_o_1',
        durationS: 3,
        sky: 'dusk',
        characters: [
          { id: 'nemo', x: 110, y: 280, scale: 1.2, anim: 'celebrate' },
          { id: 'bit', x: 150, y: 245, scale: 0.8, anim: 'celebrate' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'chart_fragment', x: 120, y: 170, scale: 1.2 },
        ],
        caption: 'The storm breaks! Another chart fragment secured.',
        waitForTap: true,
      },
      {
        id: 'i02_o_2',
        durationS: 3,
        sky: 'dusk',
        characters: [
          { id: 'ship_loci', x: 80, y: 190, scale: 0.7, anim: 'idle' },
          { id: 'bit', x: 130, y: 170, scale: 0.5, anim: 'wave' },
        ],
        caption: 'Confidence grows. The method works — even in chaos.',
        waitForTap: true,
      },
    ],
  },
};

// ── Act 2 — The Rival Appears ────────────────────────────────

const island03: IslandCinematics = {
  intro: {
    id: 'island_03_intro',
    beats: [
      {
        id: 'i03_i_1',
        durationS: 3.5,
        sky: 'day',
        characters: [
          { id: 'ship_loci', x: 30, y: 200, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 170, y: 130, scale: 1.3 },
        ],
        caption: 'The Coral Maze... a treacherous reef ahead.',
        waitForTap: true,
      },
      {
        id: 'i03_i_2',
        durationS: 3.5,
        sky: 'day',
        characters: [
          { id: 'ship_overfit', x: 190, y: 170, scale: 0.8, anim: 'idle' },
        ],
        tint: 'rgba(200,40,40,0.08)',
        caption: 'A red-sailed ship on the horizon! Captain Null is here.',
        waitForTap: true,
      },
      {
        id: 'i03_i_3',
        durationS: 3,
        sky: 'day',
        characters: [
          { id: 'nemo', x: 70, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 105, y: 250, scale: 0.7, anim: 'idle' },
          { id: 'null', x: 190, y: 260, scale: 0.9, flipX: true, anim: 'fist_shake' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
        ],
        caption: "Null's crew already scattered the maze. Time to set things straight.",
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'island_03_outro',
    beats: [
      {
        id: 'i03_o_1',
        durationS: 3,
        sky: 'dusk',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1.2, anim: 'celebrate' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'cannon_flash', x: 120, y: 200, scale: 1 },
        ],
        caption: 'Victory! A cannon upgrade earned from the battle.',
        waitForTap: true,
      },
      {
        id: 'i03_o_2',
        durationS: 3,
        sky: 'dusk',
        characters: [
          { id: 'ship_overfit', x: 200, y: 180, scale: 0.6, anim: 'idle' },
          { id: 'null', x: 200, y: 150, scale: 0.5, anim: 'fist_shake' },
        ],
        caption: 'Null retreats to the horizon, shaking his fist...',
        waitForTap: true,
      },
      {
        id: 'i03_o_3',
        durationS: 2.5,
        sky: 'dusk',
        characters: [
          { id: 'bit', x: 130, y: 250, scale: 0.8, anim: 'wave' },
        ],
        props: [
          { kind: 'chart_fragment', x: 120, y: 170, scale: 1.2 },
        ],
        caption: 'Method beats brute force. Another fragment secured.',
        waitForTap: true,
      },
    ],
  },
};

const island04: IslandCinematics = {
  intro: {
    id: 'island_04_intro',
    beats: [
      {
        id: 'i04_i_1',
        durationS: 3.5,
        sky: 'dusk',
        characters: [
          { id: 'ship_loci', x: 40, y: 190, scale: 0.8, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 170, y: 120, scale: 1.4 },
        ],
        tint: 'rgba(80,40,120,0.1)',
        caption: 'Storm Bastion — ancient ruins built by the first cartographers.',
        waitForTap: true,
      },
      {
        id: 'i04_i_2',
        durationS: 3,
        sky: 'dusk',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'walk' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
        ],
        caption: 'The ruins hold secrets... knowledge must be recalled in sequence.',
        waitForTap: true,
      },
      {
        id: 'i04_i_3',
        durationS: 2.5,
        sky: 'night',
        props: [
          { kind: 'fog_wall', x: 120, y: 100, scale: 1 },
        ],
        tint: 'rgba(20,10,40,0.2)',
        caption: 'Locked chambers await. Only structured memory opens the way.',
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'island_04_outro',
    beats: [
      {
        id: 'i04_o_1',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'nemo', x: 120, y: 280, scale: 1.2, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'chart_fragment', x: 120, y: 170, scale: 1.3 },
        ],
        caption: 'A journal fragment from the original cartographers...',
        waitForTap: true,
      },
      {
        id: 'i04_o_2',
        durationS: 3.5,
        sky: 'dark_sea',
        props: [
          { kind: 'tentacle', x: 60, y: 280, scale: 1.2 },
          { kind: 'tentacle', x: 180, y: 300, scale: 1.4 },
        ],
        tint: 'rgba(10,5,30,0.3)',
        caption: 'The journal warns: the Kraken guards the final island.',
        shake: 0.1,
        waitForTap: true,
      },
      {
        id: 'i04_o_3',
        durationS: 3,
        sky: 'dark_sea',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
        ],
        caption: 'Only one who masters all knowledge can pass the Kraken.',
        waitForTap: true,
      },
    ],
  },
};

// ── Act 3 — The Kraken's Test ────────────────────────────────

const island05: IslandCinematics = {
  intro: {
    id: 'island_05_intro',
    beats: [
      {
        id: 'i05_i_1',
        durationS: 4,
        sky: 'dark_sea',
        characters: [
          { id: 'ship_loci', x: 50, y: 200, scale: 0.8, anim: 'idle' },
        ],
        tint: 'rgba(5,2,20,0.3)',
        caption: "The sea darkens. Kraken's Reach lies ahead.",
        waitForTap: true,
      },
      {
        id: 'i05_i_2',
        durationS: 3.5,
        sky: 'dark_sea',
        props: [
          { kind: 'wreckage', x: 160, y: 220, scale: 1.2 },
        ],
        tint: 'rgba(100,20,20,0.15)',
        caption: "Null's ship... wrecked on the rocks. Brute force failed him.",
        shake: 0.1,
        waitForTap: true,
      },
      {
        id: 'i05_i_3',
        durationS: 3,
        sky: 'dark_sea',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'tentacle', x: 40, y: 150, scale: 1 },
        ],
        tint: 'rgba(10,5,30,0.2)',
        caption: 'The final concepts — the most abstract. Stay sharp.',
        waitForTap: true,
      },
      {
        id: 'i05_i_4',
        durationS: 3,
        sky: 'dark_sea',
        characters: [
          { id: 'kraken', x: 120, y: 140, scale: 1, anim: 'emerge' },
        ],
        tint: 'rgba(10,5,30,0.35)',
        caption: 'The Kraken rises...',
        shake: 0.3,
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'island_05_outro',
    beats: [
      {
        id: 'i05_o_1',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'kraken', x: 120, y: 100, scale: 0.8, anim: 'sink' },
        ],
        caption: 'The Kraken is repelled! Tentacles sink below the waves.',
        shake: 0.2,
        waitForTap: true,
      },
      {
        id: 'i05_o_2',
        durationS: 3.5,
        sky: 'dawn',
        characters: [
          { id: 'nemo', x: 100, y: 270, scale: 1.3, anim: 'celebrate' },
          { id: 'bit', x: 150, y: 240, scale: 0.9, anim: 'celebrate' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 258, scale: 1.5 },
          { kind: 'golden_chart', x: 120, y: 160, scale: 1.3 },
        ],
        caption: 'The Golden Chart is complete! Every island mapped.',
        waitForTap: true,
      },
      {
        id: 'i05_o_3',
        durationS: 4,
        sky: 'dawn',
        characters: [
          { id: 'ship_loci', x: 120, y: 200, scale: 1, anim: 'idle' },
          { id: 'bit', x: 160, y: 175, scale: 0.6, anim: 'wave' },
        ],
        props: [
          { kind: 'sunrise', x: 120, y: 60, scale: 1.5 },
        ],
        caption: 'Captain Nemo, the Dead Reckoner, sails into the sunrise.',
        waitForTap: true,
      },
      {
        id: 'i05_o_4',
        durationS: 3.5,
        sky: 'dawn',
        props: [
          { kind: 'fog_wall', x: 120, y: 120, scale: 1.5 },
          { kind: 'island_silhouette', x: 180, y: 150, scale: 0.6 },
        ],
        caption: 'Beyond the horizon... new seas, new mysteries.',
        waitForTap: true,
      },
    ],
  },
};

// ── Bonus — Hidden Reef ──────────────────────────────────────

const hiddenReef: IslandCinematics = {
  intro: {
    id: 'hidden_reef_intro',
    beats: [
      {
        id: 'hr_i_1',
        durationS: 3.5,
        sky: 'night',
        characters: [
          { id: 'ship_loci', x: 50, y: 195, scale: 0.8, anim: 'idle' },
        ],
        props: [
          { kind: 'fog_wall', x: 150, y: 100, scale: 1.2 },
        ],
        tint: 'rgba(30,60,80,0.2)',
        caption: 'A reef hidden in the deep fog... marked on no chart.',
        waitForTap: true,
      },
      {
        id: 'hr_i_2',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'nemo', x: 110, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 150, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
        ],
        caption: 'Old concepts resurface here. True mastery means remembering everything.',
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'hidden_reef_outro',
    beats: [
      {
        id: 'hr_o_1',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'nemo', x: 120, y: 280, scale: 1.2, anim: 'celebrate' },
          { id: 'bit', x: 160, y: 248, scale: 0.8, anim: 'celebrate' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
        ],
        caption: 'The Hidden Reef conquered! A true master of the Memory Sea.',
        waitForTap: true,
      },
      {
        id: 'hr_o_2',
        durationS: 3,
        sky: 'dawn',
        characters: [
          { id: 'ship_loci', x: 120, y: 195, scale: 0.9, anim: 'idle' },
        ],
        props: [
          { kind: 'sunrise', x: 120, y: 60, scale: 1.3 },
        ],
        caption: 'The sea remembers those who remember it.',
        waitForTap: true,
      },
    ],
  },
};

// ── Export map ────────────────────────────────────────────────

export const ISLAND_CINEMATICS: Record<string, IslandCinematics> = {
  island_01: island01,
  island_02: island02,
  island_03: island03,
  island_04: island04,
  island_05: island05,
  hidden_reef: hiddenReef,
  ...DLC_ROCKET_CINEMATICS,
};
