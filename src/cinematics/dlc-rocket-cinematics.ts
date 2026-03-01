/**
 * Rocket Science DLC Cinematics — "Starboard Launch"
 *
 * Full narrative cinematic sequences for the 5-island rocket science DLC.
 * Follows a classic journey-arc:
 *   Act 1 (Stages 1–2): Building the Ship — wonder & discovery
 *   Act 2 (Stages 3–4): Voyage to the Stars — danger & awe
 *   Act 3 (Stage 5):    The Kraken's Void — boss confrontation & return
 *
 * Each island has intro + outro cinematics. The arc culminates with
 * the Space Kraken boss and a triumphant splashdown back to the sea.
 *
 * Coordinates are in 240×400 virtual space.
 */

import type { IslandCinematics } from './types';

// ── Act 1 — Building the Ship ────────────────────────────────

const dlcLaunchpadLagoon: IslandCinematics = {
  intro: {
    id: 'dlc_launchpad_lagoon_intro',
    beats: [
      {
        id: 'dlc_ll_i_1',
        durationS: 4,
        sky: 'dawn',
        characters: [
          { id: 'ship_loci', x: 40, y: 180, scale: 0.8, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 170, y: 130, scale: 1.2 },
        ],
        caption: 'Beyond the Memory Sea... a forgotten lagoon where rockets once launched.',
        waitForTap: true,
      },
      {
        id: 'dlc_ll_i_2',
        durationS: 3.5,
        sky: 'dawn',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1.2, anim: 'walk' },
          { id: 'bit', x: 140, y: 255, scale: 0.8, anim: 'wave' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'rocket', x: 190, y: 200, scale: 0.7 },
        ],
        caption: 'Captain Nemo spots a rusted rocket. A new journey begins!',
        waitForTap: true,
      },
      {
        id: 'dlc_ll_i_3',
        durationS: 3,
        sky: 'dawn',
        characters: [
          { id: 'nemo', x: 80, y: 290, scale: 1, anim: 'idle' },
          { id: 'bit', x: 120, y: 260, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 278, scale: 1.4 },
          { kind: 'fog_wall', x: 120, y: 80, scale: 0.8 },
        ],
        caption: 'Learn the basics of thrust, fuel, and payload to rebuild the ship.',
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'dlc_launchpad_lagoon_outro',
    beats: [
      {
        id: 'dlc_ll_o_1',
        durationS: 3,
        sky: 'day',
        characters: [
          { id: 'nemo', x: 110, y: 280, scale: 1.2, anim: 'celebrate' },
          { id: 'bit', x: 150, y: 250, scale: 0.8, anim: 'celebrate' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'star_chart', x: 120, y: 170, scale: 1.3 },
        ],
        caption: 'Engines tested! A star chart fragment found in the launchpad wreckage.',
        waitForTap: true,
      },
      {
        id: 'dlc_ll_o_2',
        durationS: 3,
        sky: 'day',
        characters: [
          { id: 'ship_loci', x: 60, y: 190, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'rocket', x: 170, y: 180, scale: 0.9 },
          { kind: 'exhaust_plume', x: 170, y: 210, scale: 0.5 },
        ],
        caption: 'The rocket sputters to life. Next stop: Booster Reef!',
        waitForTap: true,
      },
    ],
  },
};

const dlcBoosterReef: IslandCinematics = {
  intro: {
    id: 'dlc_booster_reef_intro',
    beats: [
      {
        id: 'dlc_br_i_1',
        durationS: 3.5,
        sky: 'storm',
        characters: [
          { id: 'ship_loci', x: 50, y: 200, scale: 0.8, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 160, y: 120, scale: 1.3 },
          { kind: 'lightning', x: 140, y: 40, scale: 1 },
        ],
        caption: 'Storm clouds over Booster Reef! The rocket needs more power.',
        shake: 0.1,
        waitForTap: true,
      },
      {
        id: 'dlc_br_i_2',
        durationS: 3,
        sky: 'storm',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 130, y: 268, scale: 1.5 },
          { kind: 'rocket', x: 50, y: 170, scale: 0.6 },
        ],
        caption: 'Staging, drag, escape velocity — master these to break free!',
        waitForTap: true,
      },
      {
        id: 'dlc_br_i_3',
        durationS: 2.5,
        sky: 'storm',
        characters: [
          { id: 'nemo', x: 120, y: 290, scale: 1.2, anim: 'walk' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 278, scale: 1.4 },
          { kind: 'lightning', x: 80, y: 30, scale: 1.2 },
        ],
        caption: 'The reef shakes with each lightning strike. Stay focused, captain!',
        shake: 0.15,
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'dlc_booster_reef_outro',
    beats: [
      {
        id: 'dlc_br_o_1',
        durationS: 3,
        sky: 'dusk',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1.2, anim: 'celebrate' },
          { id: 'bit', x: 145, y: 250, scale: 0.8, anim: 'wave' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
          { kind: 'star_chart', x: 120, y: 170, scale: 1.2 },
        ],
        caption: 'Boosters attached! Another star chart fragment recovered.',
        waitForTap: true,
      },
      {
        id: 'dlc_br_o_2',
        durationS: 3.5,
        sky: 'dusk',
        props: [
          { kind: 'rocket', x: 120, y: 160, scale: 1 },
          { kind: 'exhaust_plume', x: 120, y: 200, scale: 0.8 },
        ],
        caption: 'Escape velocity reached! The rocket punches through the atmosphere.',
        waitForTap: true,
      },
    ],
  },
};

// ── Act 2 — Voyage to the Stars ──────────────────────────────

const dlcOrbitAtoll: IslandCinematics = {
  intro: {
    id: 'dlc_orbit_atoll_intro',
    beats: [
      {
        id: 'dlc_oa_i_1',
        durationS: 3.5,
        sky: 'night',
        props: [
          { kind: 'orbit_ring', x: 120, y: 120, scale: 1.5 },
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
        ],
        tint: 'rgba(10,10,40,0.15)',
        caption: 'Orbit Atoll — an island adrift in space, circling forever.',
        waitForTap: true,
      },
      {
        id: 'dlc_oa_i_2',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'asteroid', x: 40, y: 100, scale: 1.2 },
          { kind: 'asteroid', x: 200, y: 80, scale: 0.8 },
        ],
        caption: 'Orbit, gravity, trajectory — the language of the stars.',
        waitForTap: true,
      },
      {
        id: 'dlc_oa_i_3',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'nemo', x: 90, y: 290, scale: 1, anim: 'walk' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'orbit_ring', x: 160, y: 100, scale: 1 },
        ],
        tint: 'rgba(30,20,80,0.1)',
        caption: 'Plot your course carefully. One wrong angle and you drift forever.',
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'dlc_orbit_atoll_outro',
    beats: [
      {
        id: 'dlc_oa_o_1',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'nemo', x: 110, y: 280, scale: 1.2, anim: 'celebrate' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'star_chart', x: 120, y: 170, scale: 1.3 },
        ],
        caption: 'Stable orbit achieved! The star chart grows clearer.',
        waitForTap: true,
      },
      {
        id: 'dlc_oa_o_2',
        durationS: 3,
        sky: 'dark_sea',
        props: [
          { kind: 'nebula_cloud', x: 120, y: 100, scale: 1.5 },
          { kind: 'asteroid', x: 180, y: 200, scale: 1 },
        ],
        tint: 'rgba(80,20,120,0.1)',
        caption: 'A glowing nebula beckons deeper into the void...',
        waitForTap: true,
      },
      {
        id: 'dlc_oa_o_3',
        durationS: 2.5,
        sky: 'dark_sea',
        props: [
          { kind: 'tentacle', x: 180, y: 300, scale: 1 },
        ],
        tint: 'rgba(10,5,30,0.3)',
        caption: 'Something vast stirs in the nebula. A tentacle? Out here?!',
        shake: 0.1,
        waitForTap: true,
      },
    ],
  },
};

const dlcNebulaShallows: IslandCinematics = {
  intro: {
    id: 'dlc_nebula_shallows_intro',
    beats: [
      {
        id: 'dlc_ns_i_1',
        durationS: 3.5,
        sky: 'dark_sea',
        props: [
          { kind: 'nebula_cloud', x: 80, y: 80, scale: 1.8 },
          { kind: 'nebula_cloud', x: 180, y: 120, scale: 1 },
        ],
        tint: 'rgba(100,30,150,0.12)',
        caption: 'The Nebula Shallows — where space dust glows like fireflies.',
        waitForTap: true,
      },
      {
        id: 'dlc_ns_i_2',
        durationS: 3,
        sky: 'dark_sea',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'asteroid', x: 30, y: 150, scale: 1 },
          { kind: 'asteroid', x: 210, y: 110, scale: 0.6 },
        ],
        caption: 'Vacuum, delta-v, gravity assists — advanced orbital mechanics.',
        waitForTap: true,
      },
      {
        id: 'dlc_ns_i_3',
        durationS: 3,
        sky: 'dark_sea',
        characters: [
          { id: 'nemo', x: 80, y: 290, scale: 1, anim: 'walk' },
        ],
        props: [
          { kind: 'island_silhouette', x: 80, y: 250, scale: 0.6 },
          { kind: 'tentacle', x: 200, y: 280, scale: 1.2 },
        ],
        tint: 'rgba(10,5,30,0.2)',
        caption: 'The void eel lurks here... and something far worse waits beyond.',
        shake: 0.1,
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'dlc_nebula_shallows_outro',
    beats: [
      {
        id: 'dlc_ns_o_1',
        durationS: 3,
        sky: 'dark_sea',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1.2, anim: 'celebrate' },
          { id: 'bit', x: 145, y: 250, scale: 0.8, anim: 'celebrate' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'star_chart', x: 120, y: 170, scale: 1.3 },
        ],
        caption: 'Navigation mastered! The star chart is nearly complete.',
        waitForTap: true,
      },
      {
        id: 'dlc_ns_o_2',
        durationS: 3.5,
        sky: 'dark_sea',
        props: [
          { kind: 'tentacle', x: 60, y: 270, scale: 1.3 },
          { kind: 'tentacle', x: 180, y: 290, scale: 1.5 },
          { kind: 'nebula_cloud', x: 120, y: 80, scale: 1.2 },
        ],
        tint: 'rgba(10,5,30,0.35)',
        caption: 'The void trembles. The Space Kraken guards the final passage.',
        shake: 0.2,
        waitForTap: true,
      },
    ],
  },
};

// ── Act 3 — The Kraken's Void ────────────────────────────────

const dlcKrakensVoid: IslandCinematics = {
  intro: {
    id: 'dlc_krakens_void_intro',
    beats: [
      {
        id: 'dlc_kv_i_1',
        durationS: 4,
        sky: 'dark_sea',
        props: [
          { kind: 'nebula_cloud', x: 60, y: 60, scale: 2 },
          { kind: 'asteroid', x: 200, y: 180, scale: 1.2 },
        ],
        tint: 'rgba(5,2,20,0.3)',
        caption: "The Kraken's Void — where no ship has returned.",
        waitForTap: true,
      },
      {
        id: 'dlc_kv_i_2',
        durationS: 3.5,
        sky: 'dark_sea',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
          { id: 'bit', x: 140, y: 255, scale: 0.7, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'tentacle', x: 30, y: 200, scale: 1 },
          { kind: 'tentacle', x: 210, y: 180, scale: 1.3 },
        ],
        tint: 'rgba(10,5,30,0.25)',
        caption: 'Heat shields, re-entry, splashdown — the knowledge to survive the return.',
        waitForTap: true,
      },
      {
        id: 'dlc_kv_i_3',
        durationS: 3,
        sky: 'dark_sea',
        characters: [
          { id: 'space_kraken', x: 120, y: 130, scale: 1.2, anim: 'emerge' },
        ],
        tint: 'rgba(10,5,30,0.4)',
        caption: 'The Space Kraken rises from the asteroid field!',
        shake: 0.35,
        waitForTap: true,
      },
      {
        id: 'dlc_kv_i_4',
        durationS: 2.5,
        sky: 'dark_sea',
        characters: [
          { id: 'nemo', x: 80, y: 290, scale: 1, anim: 'idle' },
          { id: 'space_kraken', x: 150, y: 120, scale: 1, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'asteroid', x: 40, y: 160, scale: 0.8 },
          { kind: 'asteroid', x: 210, y: 100, scale: 1 },
        ],
        tint: 'rgba(10,5,30,0.3)',
        caption: 'Only true knowledge of rockets can defeat this ancient terror!',
        shake: 0.2,
        waitForTap: true,
      },
    ],
  },
  outro: {
    id: 'dlc_krakens_void_outro',
    beats: [
      {
        id: 'dlc_kv_o_1',
        durationS: 3,
        sky: 'night',
        characters: [
          { id: 'space_kraken', x: 120, y: 100, scale: 0.8, anim: 'sink' },
        ],
        props: [
          { kind: 'asteroid', x: 60, y: 180, scale: 0.6 },
        ],
        caption: 'The Space Kraken is defeated! It sinks into the asteroid field.',
        shake: 0.15,
        waitForTap: true,
      },
      {
        id: 'dlc_kv_o_2',
        durationS: 3.5,
        sky: 'night',
        characters: [
          { id: 'nemo', x: 100, y: 280, scale: 1, anim: 'idle' },
        ],
        props: [
          { kind: 'island_silhouette', x: 120, y: 250, scale: 0.6 },
          { kind: 'rocket', x: 130, y: 160, scale: 1 },
          { kind: 'reentry_flame', x: 130, y: 200, scale: 1.2 },
        ],
        caption: 'Time to go home. The rocket angles back toward the atmosphere...',
        waitForTap: true,
      },
      {
        id: 'dlc_kv_o_3',
        durationS: 3,
        sky: 'dusk',
        props: [
          { kind: 'reentry_flame', x: 120, y: 120, scale: 1.5 },
          { kind: 'rocket', x: 120, y: 140, scale: 0.8 },
        ],
        tint: 'rgba(200,60,20,0.1)',
        caption: 'Re-entry! The heat shield glows white-hot against the sky.',
        shake: 0.1,
        waitForTap: true,
      },
      {
        id: 'dlc_kv_o_4',
        durationS: 3,
        sky: 'day',
        props: [
          { kind: 'parachute', x: 120, y: 130, scale: 1.3 },
        ],
        caption: 'Parachutes deploy! The capsule drifts down toward the ocean.',
        waitForTap: true,
      },
      {
        id: 'dlc_kv_o_5',
        durationS: 3.5,
        sky: 'dawn',
        characters: [
          { id: 'nemo', x: 100, y: 270, scale: 1.3, anim: 'celebrate' },
          { id: 'bit', x: 150, y: 240, scale: 0.9, anim: 'celebrate' },
        ],
        props: [
          { kind: 'splash', x: 120, y: 300, scale: 1.5 },
          { kind: 'star_chart', x: 120, y: 160, scale: 1.5 },
        ],
        caption: 'SPLASHDOWN! The star chart is complete. Welcome home, captain!',
        waitForTap: true,
      },
      {
        id: 'dlc_kv_o_6',
        durationS: 4,
        sky: 'dawn',
        characters: [
          { id: 'ship_loci', x: 120, y: 200, scale: 1, anim: 'idle' },
          { id: 'bit', x: 160, y: 175, scale: 0.6, anim: 'wave' },
        ],
        props: [
          { kind: 'sunrise', x: 120, y: 60, scale: 1.5 },
        ],
        caption: 'From launchpad to splashdown — a true rocket scientist sails on.',
        waitForTap: true,
      },
    ],
  },
};

// ── Export map ────────────────────────────────────────────────

export const DLC_ROCKET_CINEMATICS: Record<string, IslandCinematics> = {
  dlc_launchpad_lagoon: dlcLaunchpadLagoon,
  dlc_booster_reef: dlcBoosterReef,
  dlc_orbit_atoll: dlcOrbitAtoll,
  dlc_nebula_shallows: dlcNebulaShallows,
  dlc_krakens_void: dlcKrakensVoid,
};
