/**
 * Rocket Science DLC Pack — "Starboard Launch"
 *
 * The pirate builds a spaceship to reach outer space but must first
 * learn the basics of rockets across 5 stages. The final boss is
 * the legendary Space Kraken, lurking in the void.
 *
 * 5 islands · 15 concepts · Tiers 1-3
 * Unlocked after completing the base AI/ML campaign.
 *
 * Stage 1 — Launchpad Lagoon  (Thrust, Propellant, Payload)
 * Stage 2 — Booster Reef      (Staging, Drag, Escape Velocity)
 * Stage 3 — Orbit Atoll        (Orbit, Gravity, Trajectory)
 * Stage 4 — Nebula Shallows    (Vacuum, Delta-V, Gravity Assist)
 * Stage 5 — Kraken's Void      (Heat Shield, Re-entry, Splashdown) — BOSS
 */

import type { DlcPack } from '../types';

export const ROCKET_SCIENCE_PACK: DlcPack = {
  manifest: {
    id: 'rocket-science',
    title: 'Starboard Launch',
    description: 'Build a ship to the stars — but first, learn to fly!',
    version: '1.0.0',
    topic: 'Rocket Science',
    conceptCount: 15,
    islandCount: 5,
    prerequisite: 'base_complete',
    tierRange: { min: 1, max: 3 },
  },
  content: {
    // ══════════════════════════════════════════════════════════
    // ISLANDS
    // ══════════════════════════════════════════════════════════
    islands: [
      // ── Stage 1 ──
      {
        id: 'dlc_launchpad_lagoon',
        name: 'Launchpad Lagoon',
        encounterType: 'fog',
        conceptIds: ['thrust', 'propellant', 'payload'],
        landmarks: [
          { id: 'rocket_nozzle', conceptId: 'thrust', x: 50, y: 290 },
          { id: 'fuel_barrels', conceptId: 'propellant', x: 120, y: 225 },
          { id: 'cargo_crate', conceptId: 'payload', x: 190, y: 260 },
        ],
        reward: 'booster_blueprint',
        vegetation: ['palm_tree'],
      },
      // ── Stage 2 ──
      {
        id: 'dlc_booster_reef',
        name: 'Booster Reef',
        encounterType: 'storm',
        conceptIds: ['staging', 'drag', 'escape_velocity'],
        landmarks: [
          { id: 'stage_separator', conceptId: 'staging', x: 55, y: 285 },
          { id: 'wind_tunnel', conceptId: 'drag', x: 125, y: 218 },
          { id: 'speed_gate', conceptId: 'escape_velocity', x: 185, y: 250 },
        ],
        unlockAfter: 'dlc_launchpad_lagoon',
        reward: 'stage_separator_part',
        vegetation: ['storm_pine'],
      },
      // ── Stage 3 ──
      {
        id: 'dlc_orbit_atoll',
        name: 'Orbit Atoll',
        encounterType: 'ruins',
        conceptIds: ['orbit', 'gravity', 'trajectory'],
        landmarks: [
          { id: 'ring_platform', conceptId: 'orbit', x: 52, y: 292 },
          { id: 'anchor_stone', conceptId: 'gravity', x: 118, y: 222 },
          { id: 'trajectory_arc', conceptId: 'trajectory', x: 188, y: 255 },
        ],
        unlockAfter: 'dlc_booster_reef',
        reward: 'navigation_star_chart',
        vegetation: ['glow_kelp'],
      },
      // ── Stage 4 ──
      {
        id: 'dlc_nebula_shallows',
        name: 'Nebula Shallows',
        encounterType: 'battle',
        conceptIds: ['vacuum', 'delta_v', 'gravity_assist'],
        landmarks: [
          { id: 'void_bell_jar', conceptId: 'vacuum', x: 48, y: 288 },
          { id: 'delta_v_gauge', conceptId: 'delta_v', x: 122, y: 220 },
          { id: 'slingshot_rock', conceptId: 'gravity_assist', x: 192, y: 252 },
        ],
        unlockAfter: 'dlc_orbit_atoll',
        reward: 'nebula_compass',
        vegetation: ['storm_pine'],
      },
      // ── Stage 5 — BOSS: Space Kraken ──
      {
        id: 'dlc_krakens_void',
        name: "Kraken's Void",
        encounterType: 'squid',
        conceptIds: ['heat_shield', 'reentry', 'splashdown'],
        landmarks: [
          { id: 'ablative_plate', conceptId: 'heat_shield', x: 54, y: 294 },
          { id: 'flame_corridor', conceptId: 'reentry', x: 120, y: 216 },
          { id: 'splash_zone', conceptId: 'splashdown', x: 186, y: 258 },
        ],
        unlockAfter: 'dlc_nebula_shallows',
        reward: 'kraken_trophy',
        vegetation: ['dead_coral'],
      },
    ],

    // ══════════════════════════════════════════════════════════
    // CONCEPTS  (15 total — 3 per island)
    // ══════════════════════════════════════════════════════════
    concepts: [
      // Stage 1 — Launchpad Lagoon
      { id: 'thrust', name: 'Thrust', islandId: 'dlc_launchpad_lagoon', metaphorObject: 'Rocket Nozzle', landmarkId: 'rocket_nozzle', tier: 1 },
      { id: 'propellant', name: 'Propellant', islandId: 'dlc_launchpad_lagoon', metaphorObject: 'Fuel Barrels', landmarkId: 'fuel_barrels', tier: 1 },
      { id: 'payload', name: 'Payload', islandId: 'dlc_launchpad_lagoon', metaphorObject: 'Cargo Crate', landmarkId: 'cargo_crate', tier: 1 },

      // Stage 2 — Booster Reef
      { id: 'staging', name: 'Staging', islandId: 'dlc_booster_reef', metaphorObject: 'Stage Separator', landmarkId: 'stage_separator', tier: 1 },
      { id: 'drag', name: 'Drag', islandId: 'dlc_booster_reef', metaphorObject: 'Wind Tunnel', landmarkId: 'wind_tunnel', tier: 1 },
      { id: 'escape_velocity', name: 'Escape Velocity', islandId: 'dlc_booster_reef', metaphorObject: 'Speed Gate', landmarkId: 'speed_gate', tier: 1 },

      // Stage 3 — Orbit Atoll
      { id: 'orbit', name: 'Orbit', islandId: 'dlc_orbit_atoll', metaphorObject: 'Ring Platform', landmarkId: 'ring_platform', tier: 2 },
      { id: 'gravity', name: 'Gravity', islandId: 'dlc_orbit_atoll', metaphorObject: 'Anchor Stone', landmarkId: 'anchor_stone', tier: 2 },
      { id: 'trajectory', name: 'Trajectory', islandId: 'dlc_orbit_atoll', metaphorObject: 'Trajectory Arc', landmarkId: 'trajectory_arc', tier: 2 },

      // Stage 4 — Nebula Shallows
      { id: 'vacuum', name: 'Vacuum', islandId: 'dlc_nebula_shallows', metaphorObject: 'Void Bell Jar', landmarkId: 'void_bell_jar', tier: 2 },
      { id: 'delta_v', name: 'Delta-V', islandId: 'dlc_nebula_shallows', metaphorObject: 'Delta-V Gauge', landmarkId: 'delta_v_gauge', tier: 2 },
      { id: 'gravity_assist', name: 'Gravity Assist', islandId: 'dlc_nebula_shallows', metaphorObject: 'Slingshot Rock', landmarkId: 'slingshot_rock', tier: 2 },

      // Stage 5 — Kraken's Void (BOSS)
      { id: 'heat_shield', name: 'Heat Shield', islandId: 'dlc_krakens_void', metaphorObject: 'Ablative Plate', landmarkId: 'ablative_plate', tier: 3 },
      { id: 'reentry', name: 'Re-entry', islandId: 'dlc_krakens_void', metaphorObject: 'Flame Corridor', landmarkId: 'flame_corridor', tier: 3 },
      { id: 'splashdown', name: 'Splashdown', islandId: 'dlc_krakens_void', metaphorObject: 'Splash Zone', landmarkId: 'splash_zone', tier: 3 },
    ],

    // ══════════════════════════════════════════════════════════
    // ENCOUNTERS — reuses base types + adds a unique boss
    // ══════════════════════════════════════════════════════════
    encounters: [],

    // ══════════════════════════════════════════════════════════
    // OVERWORLD NODES
    // ══════════════════════════════════════════════════════════
    overworldNodes: [
      { islandId: 'dlc_launchpad_lagoon', name: 'Launchpad Lagoon', x: 60, y: 90 },
      { islandId: 'dlc_booster_reef', name: 'Booster Reef', x: 100, y: 70 },
      { islandId: 'dlc_orbit_atoll', name: 'Orbit Atoll', x: 140, y: 50 },
      { islandId: 'dlc_nebula_shallows', name: 'Nebula Shallows', x: 180, y: 35 },
      { islandId: 'dlc_krakens_void', name: "Kraken's Void", x: 210, y: 20 },
    ],

    // ══════════════════════════════════════════════════════════
    // BESTIARY
    // ══════════════════════════════════════════════════════════
    bestiary: [
      {
        id: 'rocket_crab',
        name: 'Rocket Crab',
        category: 'critter',
        flavour: 'A crab with exhaust vents on its shell — surprisingly fast.',
        behaviour: 'Jet-dashes between patrol points. Stuns on contact.',
        danger: 2,
        habitat: ['Launchpad Lagoon', 'Booster Reef'],
        renderHint: 'fire_crab',
      },
      {
        id: 'stellar_jelly',
        name: 'Stellar Jelly',
        category: 'critter',
        flavour: 'A translucent jellyfish that glows like a distant star.',
        behaviour: 'Floats in gentle arcs. Contact causes a gravity pull.',
        danger: 2,
        habitat: ['Orbit Atoll', 'Nebula Shallows'],
        renderHint: 'jellyfish',
      },
      {
        id: 'void_eel',
        name: 'Void Eel',
        category: 'threat',
        flavour: 'Black as the space between stars. Strikes from nowhere.',
        behaviour: 'Ambush predator. Appears when the player stops moving.',
        danger: 4,
        habitat: ['Nebula Shallows', "Kraken's Void"],
        renderHint: 'snake',
      },
      {
        id: 'space_kraken',
        name: 'Space Kraken',
        category: 'threat',
        flavour: 'The ancient terror of the void — tentacles span asteroids.',
        behaviour: 'Boss. Phase-shifts between grabbing, ink-blasting, and roaring.',
        danger: 5,
        habitat: ["Kraken's Void"],
        renderHint: 'squid',
      },
      {
        id: 'nebula_kelp',
        name: 'Nebula Kelp',
        category: 'flora',
        flavour: 'Luminescent fronds that drift in zero-gravity currents.',
        behaviour: 'Decorative. Sways gently. Marks safe zones.',
        danger: 0,
        habitat: ['Nebula Shallows', "Kraken's Void"],
        renderHint: 'glow_kelp',
      },
      {
        id: 'launch_coral',
        name: 'Launch Coral',
        category: 'flora',
        flavour: 'Coral formations shaped by centuries of rocket exhaust.',
        behaviour: 'Decorative. Crumbles into sparks when brushed.',
        danger: 0,
        habitat: ['Launchpad Lagoon', 'Booster Reef'],
        renderHint: 'dead_coral',
      },
      {
        id: 'asteroid_field',
        name: 'Asteroid Field',
        category: 'terrain',
        flavour: 'Tumbling rocks that fill the space around the atoll.',
        behaviour: 'Obstacle. Rocks drift slowly; collision stuns.',
        danger: 3,
        habitat: ['Orbit Atoll', 'Nebula Shallows', "Kraken's Void"],
        renderHint: 'reef',
      },
    ],

    // ══════════════════════════════════════════════════════════
    // MINIGAMES  (15 — one per concept)
    // ══════════════════════════════════════════════════════════
    minigames: [
      // ──────────────────────────────────────────────────────
      // STAGE 1 — Launchpad Lagoon
      // ──────────────────────────────────────────────────────
      {
        conceptId: 'thrust',
        conceptName: 'Thrust',
        metaphor: 'Rocket Nozzle',
        dialog: [
          { speaker: 'parrot', text: 'Squawk! Look at the nozzle on that ship — it pushes us forward!' },
          { speaker: 'parrot', text: 'The force that propels a rocket upward — what is it called?' },
          {
            speaker: 'parrot',
            text: 'What say ye?',
            choices: ['Thrust', 'Drift', 'Anchor'],
            correctChoice: 0,
            wrongFeedback: 'Nah — the force that pushes a rocket is called thrust!',
            correctFeedback: 'Aye! Thrust is the force generated by the engine to lift off!',
          },
          { speaker: 'narrator', text: 'Thrust = the force produced by a rocket engine to propel the vehicle.' },
        ],
        challenge: {
          type: 'adjust',
          instruction: 'Increase the thrust gauge until the rocket can lift off!',
          items: ['🔥 0%', '🔥 25%', '🔥 50%', '🔥 75%', '🔥 100%'],
          answer: 4,
          successText: 'Full thrust! The rocket lifts off the pad!',
          hintText: 'You need maximum thrust to overcome gravity.',
        },
        wrapUp: 'Remember: without thrust, no pirate reaches the stars!',
      },
      {
        conceptId: 'propellant',
        conceptName: 'Propellant',
        metaphor: 'Fuel Barrels',
        dialog: [
          { speaker: 'parrot', text: 'These barrels hold the fuel — she won\'t fly without \'em!' },
          { speaker: 'parrot', text: 'What ye burn in the engine to create thrust — what is it?' },
          {
            speaker: 'parrot',
            text: 'Yer answer?',
            choices: ['Ballast', 'Propellant', 'Cargo'],
            correctChoice: 1,
            wrongFeedback: 'Nah — the stuff that burns to make thrust is propellant!',
            correctFeedback: 'Aye! Propellant is the fuel and oxidizer that burn to create thrust!',
          },
          { speaker: 'narrator', text: 'Propellant = the chemical mixture burned in a rocket engine to generate thrust.' },
        ],
        challenge: {
          type: 'sort',
          instruction: 'Load only the fuel barrels onto the rocket — leave the water barrels!',
          items: ['🛢️ Fuel', '💧 Water', '🛢️ Fuel', '💧 Water', '🛢️ Fuel'],
          answer: [0, 2, 4],
          successText: 'All fuel loaded! The tanks are full!',
          hintText: 'Look for the oil drum icon — those are fuel.',
        },
        wrapUp: 'A rocket without propellant is just a fancy cannon, captain!',
      },
      {
        conceptId: 'payload',
        conceptName: 'Payload',
        metaphor: 'Cargo Crate',
        dialog: [
          { speaker: 'parrot', text: 'What\'s in the crate? That\'s what we\'re launching into space!' },
          { speaker: 'parrot', text: 'The cargo a rocket carries to its destination — what is that called?' },
          {
            speaker: 'parrot',
            text: 'What be it?',
            choices: ['Payload', 'Ballast', 'Anchor'],
            correctChoice: 0,
            wrongFeedback: 'Nah — the cargo a rocket carries is the payload!',
            correctFeedback: 'Aye! The payload is what the rocket delivers — satellites, supplies, or pirates!',
          },
          { speaker: 'narrator', text: 'Payload = the cargo carried by a rocket to its destination (satellite, crew, etc.).' },
        ],
        challenge: {
          type: 'select',
          instruction: 'Which crate is the correct payload for this mission?',
          items: ['🪨 Rocks', '🛰️ Satellite', '🐟 Fish'],
          answer: 1,
          successText: 'Satellite loaded — mission ready!',
          hintText: 'Rockets carry payloads like satellites to space.',
        },
        wrapUp: 'Every launch has a purpose — the payload is the whole reason ye fly!',
      },

      // ──────────────────────────────────────────────────────
      // STAGE 2 — Booster Reef
      // ──────────────────────────────────────────────────────
      {
        conceptId: 'staging',
        conceptName: 'Staging',
        metaphor: 'Stage Separator',
        dialog: [
          { speaker: 'parrot', text: 'See that seam on the rocket? It splits apart mid-flight!' },
          { speaker: 'parrot', text: 'Dropping empty fuel sections to get lighter — what process is that?' },
          {
            speaker: 'parrot',
            text: 'What say ye?',
            choices: ['Staging', 'Sinking', 'Stacking'],
            correctChoice: 0,
            wrongFeedback: 'Nah — dropping spent sections is called staging!',
            correctFeedback: 'Aye! Staging drops empty segments so the rocket gets lighter and faster!',
          },
          { speaker: 'narrator', text: 'Staging = discarding spent rocket sections during ascent to reduce mass.' },
        ],
        challenge: {
          type: 'sort',
          instruction: 'Drop the stages in the correct order — first stage fires first!',
          items: ['1️⃣ Stage 1', '2️⃣ Stage 2', '3️⃣ Stage 3'],
          answer: [0, 1, 2],
          successText: 'Perfect staging sequence! Each booster dropped on time!',
          hintText: 'Stage 1 fires and drops first, then Stage 2, then Stage 3.',
        },
        wrapUp: 'Drop the dead weight, captain — staging makes the journey possible!',
      },
      {
        conceptId: 'drag',
        conceptName: 'Drag',
        metaphor: 'Wind Tunnel',
        dialog: [
          { speaker: 'parrot', text: 'Feel that resistance? The air pushes back against us!' },
          { speaker: 'parrot', text: 'The force that opposes a rocket moving through air — what is it?' },
          {
            speaker: 'parrot',
            text: 'Yer answer?',
            choices: ['Lift', 'Drag', 'Spin'],
            correctChoice: 1,
            wrongFeedback: 'Nah — the air pushing back is called drag!',
            correctFeedback: 'Aye! Drag is air resistance that slows the rocket down!',
          },
          { speaker: 'narrator', text: 'Drag = the aerodynamic force that opposes a vehicle\'s motion through the atmosphere.' },
        ],
        challenge: {
          type: 'select',
          instruction: 'Which rocket shape has the LEAST drag?',
          items: ['📦 Flat Box', '🔷 Pointed Cone', '⭕ Sphere'],
          answer: 1,
          successText: 'A pointed nose cone slices through the air!',
          hintText: 'Streamlined shapes reduce drag.',
        },
        wrapUp: 'Sleek and sharp cuts through the wind — that\'s how ye beat drag!',
      },
      {
        conceptId: 'escape_velocity',
        conceptName: 'Escape Velocity',
        metaphor: 'Speed Gate',
        dialog: [
          { speaker: 'parrot', text: 'That speed gate only opens if ye go fast enough!' },
          { speaker: 'parrot', text: 'The minimum speed needed to break free of a planet\'s gravity — what is it?' },
          {
            speaker: 'parrot',
            text: 'What be it called?',
            choices: ['Top Speed', 'Escape Velocity', 'Cruising Speed'],
            correctChoice: 1,
            wrongFeedback: 'Nah — the speed needed to break free is escape velocity!',
            correctFeedback: 'Aye! Escape velocity is the speed ye need to leave a planet\'s pull!',
          },
          { speaker: 'narrator', text: 'Escape Velocity = the minimum speed needed to escape a celestial body\'s gravitational pull.' },
        ],
        challenge: {
          type: 'adjust',
          instruction: 'Set the speed dial to reach escape velocity!',
          items: ['🐢 Slow', '🚶 Walking', '🚗 Driving', '✈️ Flying', '🚀 Escape!'],
          answer: 4,
          successText: 'Ye broke free from the planet\'s grip!',
          hintText: 'You need the fastest setting to escape gravity.',
        },
        wrapUp: 'On Earth, escape velocity is about 11.2 km/s — hold on to yer hat!',
      },

      // ──────────────────────────────────────────────────────
      // STAGE 3 — Orbit Atoll
      // ──────────────────────────────────────────────────────
      {
        conceptId: 'orbit',
        conceptName: 'Orbit',
        metaphor: 'Ring Platform',
        dialog: [
          { speaker: 'parrot', text: 'See that ring around the island? Things go round and round!' },
          { speaker: 'parrot', text: 'Falling around a body fast enough that ye never hit the ground — what is that path?' },
          {
            speaker: 'parrot',
            text: 'What say ye?',
            choices: ['Orbit', 'Spiral', 'Bounce'],
            correctChoice: 0,
            wrongFeedback: 'Nah — that curved path around a body is called an orbit!',
            correctFeedback: 'Aye! An orbit is the curved path of an object around a celestial body!',
          },
          { speaker: 'narrator', text: 'Orbit = a curved path where an object continuously falls around a larger body due to gravity.' },
        ],
        challenge: {
          type: 'connect',
          instruction: 'Match each satellite to its orbit path!',
          items: ['🛰️ Low Sat', '🛰️ Medium Sat', '🛰️ High Sat', '⭕ Low Orbit', '⭕ Medium Orbit', '⭕ High Orbit'],
          answer: [[0, 3], [1, 4], [2, 5]],
          successText: 'Every satellite found its orbit!',
          hintText: 'Match low to low, medium to medium, high to high.',
        },
        wrapUp: 'An orbit is just falling with style, captain!',
      },
      {
        conceptId: 'gravity',
        conceptName: 'Gravity',
        metaphor: 'Anchor Stone',
        dialog: [
          { speaker: 'parrot', text: 'That stone pulls everything toward it — just like a planet!' },
          { speaker: 'parrot', text: 'The force that pulls objects toward each other — what is it called?' },
          {
            speaker: 'parrot',
            text: 'Yer answer?',
            choices: ['Magnetism', 'Gravity', 'Wind'],
            correctChoice: 1,
            wrongFeedback: 'Nah — the universal pulling force is gravity!',
            correctFeedback: 'Aye! Gravity is the force that pulls all objects with mass toward each other!',
          },
          { speaker: 'narrator', text: 'Gravity = the universal force of attraction between all objects with mass.' },
        ],
        challenge: {
          type: 'sort',
          instruction: 'Rank these by gravity strength — strongest first!',
          items: ['🪐 Jupiter', '🌍 Earth', '🌙 Moon'],
          answer: [0, 1, 2],
          successText: 'Correct! Bigger bodies have stronger gravity!',
          hintText: 'More mass = stronger gravitational pull.',
        },
        wrapUp: 'Gravity holds the whole universe together — respect it, captain!',
      },
      {
        conceptId: 'trajectory',
        conceptName: 'Trajectory',
        metaphor: 'Trajectory Arc',
        dialog: [
          { speaker: 'parrot', text: 'See that glowing arc? It shows where the cannonball will go!' },
          { speaker: 'parrot', text: 'The path an object follows through space — what is it called?' },
          {
            speaker: 'parrot',
            text: 'What be it?',
            choices: ['Trajectory', 'Tunnel', 'Trail'],
            correctChoice: 0,
            wrongFeedback: 'Nah — the calculated flight path is a trajectory!',
            correctFeedback: 'Aye! A trajectory is the planned path through space!',
          },
          { speaker: 'narrator', text: 'Trajectory = the path a projectile or spacecraft follows through space.' },
        ],
        challenge: {
          type: 'select',
          instruction: 'Which arc will hit the target planet?',
          items: ['↗️ Too high', '➡️ Just right', '↘️ Too low'],
          answer: 1,
          successText: 'Perfect trajectory — direct hit on the target!',
          hintText: 'You need the middle path — not too high, not too low.',
        },
        wrapUp: 'Plot yer trajectory carefully, or ye\'ll drift into the void!',
      },

      // ──────────────────────────────────────────────────────
      // STAGE 4 — Nebula Shallows
      // ──────────────────────────────────────────────────────
      {
        conceptId: 'vacuum',
        conceptName: 'Vacuum',
        metaphor: 'Void Bell Jar',
        dialog: [
          { speaker: 'parrot', text: 'Hear that silence? There\'s NOTHING in that jar — no air at all!' },
          { speaker: 'parrot', text: 'A region with no matter, no air, no sound — what is it called?' },
          {
            speaker: 'parrot',
            text: 'What say ye?',
            choices: ['Vacuum', 'Bubble', 'Cloud'],
            correctChoice: 0,
            wrongFeedback: 'Nah — a space with no matter is a vacuum!',
            correctFeedback: 'Aye! A vacuum is empty space with no air or matter!',
          },
          { speaker: 'narrator', text: 'Vacuum = a region of space devoid of matter, including air.' },
        ],
        challenge: {
          type: 'sort',
          instruction: 'Put these in order from most air to least air!',
          items: ['🌊 Sea Level', '⛰️ Mountain Top', '🚀 Edge of Space', '🌌 Deep Space'],
          answer: [0, 1, 2, 3],
          successText: 'Correct! Air thins out until there is nothing — vacuum!',
          hintText: 'Higher up = less air. Space = no air at all.',
        },
        wrapUp: 'In the vacuum of space, no one can hear ye squawk!',
      },
      {
        conceptId: 'delta_v',
        conceptName: 'Delta-V',
        metaphor: 'Delta-V Gauge',
        dialog: [
          { speaker: 'parrot', text: 'Check that gauge — it measures how much speed change we have left!' },
          { speaker: 'parrot', text: 'The total change in velocity a rocket can achieve — what is it called?' },
          {
            speaker: 'parrot',
            text: 'What be it?',
            choices: ['Delta-V', 'Top Speed', 'Acceleration'],
            correctChoice: 0,
            wrongFeedback: 'Nah — the total available speed-change budget is called Delta-V!',
            correctFeedback: 'Aye! Delta-V is yer total speed-change budget for the whole mission!',
          },
          { speaker: 'narrator', text: 'Delta-V (Δv) = the total change in velocity a spacecraft can achieve with its fuel.' },
        ],
        challenge: {
          type: 'adjust',
          instruction: 'Set the Delta-V budget to reach Mars!',
          items: ['⛽ 1 km/s', '⛽ 3 km/s', '⛽ 6 km/s', '⛽ 9 km/s', '⛽ 12 km/s'],
          answer: 3,
          successText: 'Enough Delta-V to reach Mars and back!',
          hintText: 'A Mars mission needs roughly 9 km/s of Delta-V.',
        },
        wrapUp: 'Budget yer Delta-V wisely — run out and ye float forever!',
      },
      {
        conceptId: 'gravity_assist',
        conceptName: 'Gravity Assist',
        metaphor: 'Slingshot Rock',
        dialog: [
          { speaker: 'parrot', text: 'That rock swings things around and flings \'em faster!' },
          { speaker: 'parrot', text: 'Using a planet\'s gravity to speed up or redirect — what is that maneuver?' },
          {
            speaker: 'parrot',
            text: 'Yer answer?',
            choices: ['Gravity Assist', 'Speed Bump', 'Brake Check'],
            correctChoice: 0,
            wrongFeedback: 'Nah — swinging around a planet for speed is a gravity assist!',
            correctFeedback: 'Aye! A gravity assist uses a planet\'s pull to slingshot the ship faster!',
          },
          { speaker: 'narrator', text: 'Gravity Assist = using a planet\'s gravitational field to change a spacecraft\'s speed and direction.' },
        ],
        challenge: {
          type: 'connect',
          instruction: 'Match each spacecraft to the planet it should slingshot around!',
          items: ['🚀 Voyager', '🚀 Cassini', '🚀 New Horizons', '🪐 Jupiter', '🪐 Saturn', '🪐 Jupiter'],
          answer: [[0, 3], [1, 4], [2, 5]],
          successText: 'Perfect slingshots — each probe gained speed!',
          hintText: 'Voyager used Jupiter, Cassini used Saturn, New Horizons used Jupiter.',
        },
        wrapUp: 'Why burn fuel when ye can borrow speed from a planet? Clever, captain!',
      },

      // ──────────────────────────────────────────────────────
      // STAGE 5 — Kraken's Void (BOSS)
      // ──────────────────────────────────────────────────────
      {
        conceptId: 'heat_shield',
        conceptName: 'Heat Shield',
        metaphor: 'Ablative Plate',
        dialog: [
          { speaker: 'parrot', text: 'That plate glows red-hot! It protects the ship from burning up!' },
          { speaker: 'parrot', text: 'The protective layer that absorbs extreme heat during re-entry — what is it?' },
          {
            speaker: 'parrot',
            text: 'What say ye?',
            choices: ['Heat Shield', 'Sail', 'Anchor'],
            correctChoice: 0,
            wrongFeedback: 'Nah — the layer that absorbs re-entry heat is the heat shield!',
            correctFeedback: 'Aye! The heat shield protects the capsule from the inferno of re-entry!',
          },
          { speaker: 'narrator', text: 'Heat Shield = an ablative layer that absorbs and dissipates extreme heat during atmospheric re-entry.' },
        ],
        challenge: {
          type: 'select',
          instruction: 'Which material makes the best heat shield?',
          items: ['🧊 Ice Block', '🪵 Wooden Plank', '🔥 Ablative Ceramic'],
          answer: 2,
          successText: 'Ablative ceramic burns away slowly, protecting the capsule!',
          hintText: 'The shield needs to withstand thousands of degrees.',
        },
        wrapUp: 'Without a heat shield, ye\'d cook like a fish on a griddle, captain!',
      },
      {
        conceptId: 'reentry',
        conceptName: 'Re-entry',
        metaphor: 'Flame Corridor',
        dialog: [
          { speaker: 'parrot', text: 'The flame corridor! This is where the ship returns to the atmosphere!' },
          { speaker: 'parrot', text: 'The process of a spacecraft returning through the atmosphere — what is it?' },
          {
            speaker: 'parrot',
            text: 'What be it called?',
            choices: ['Takeoff', 'Re-entry', 'Docking'],
            correctChoice: 1,
            wrongFeedback: 'Nah — coming back through the atmosphere is re-entry!',
            correctFeedback: 'Aye! Re-entry is the fiery return through the atmosphere!',
          },
          { speaker: 'narrator', text: 'Re-entry = a spacecraft\'s return into a planet\'s atmosphere at extreme speed and temperature.' },
        ],
        challenge: {
          type: 'sort',
          instruction: 'Put the re-entry steps in order!',
          items: ['🔥 Hit atmosphere', '☄️ Peak heating', '🪂 Deploy chute', '🌊 Splashdown'],
          answer: [0, 1, 2, 3],
          successText: 'Perfect re-entry sequence — the crew is safe!',
          hintText: 'First you hit air, then max heat, then parachute, then water.',
        },
        wrapUp: 'Re-entry is the most dangerous part — angle it wrong and ye burn up!',
      },
      {
        conceptId: 'splashdown',
        conceptName: 'Splashdown',
        metaphor: 'Splash Zone',
        dialog: [
          { speaker: 'parrot', text: 'SPLASH! The capsule hits the water — the crew made it home!' },
          { speaker: 'parrot', text: 'A spacecraft landing in the ocean at the end of its mission — what is that?' },
          {
            speaker: 'parrot',
            text: 'What say ye?',
            choices: ['Touchdown', 'Splashdown', 'Crash Landing'],
            correctChoice: 1,
            wrongFeedback: 'Nah — landing in the ocean is called a splashdown!',
            correctFeedback: 'Aye! Splashdown is the ocean landing that ends the mission!',
          },
          { speaker: 'narrator', text: 'Splashdown = the method of landing a spacecraft in a body of water.' },
        ],
        challenge: {
          type: 'select',
          instruction: 'Where should the capsule aim for splashdown?',
          items: ['🏔️ Mountain', '🌊 Ocean', '🏙️ City'],
          answer: 1,
          successText: 'Safe splashdown in the ocean! Mission complete!',
          hintText: 'Water cushions the landing better than land.',
        },
        wrapUp: 'From launchpad to splashdown — ye\'ve mastered the full journey, captain! Now face the Kraken!',
      },
    ],
  },
};
