/**
 * Game Over Cinematic — "The Voyage Complete"
 *
 * A long-form cinematic sequence that plays after the player completes
 * the final island (or hidden reef), before the leaderboard.
 *
 * Structured using Save the Cat beat sheet (Blake Snyder) to deliver
 * a movie-quality retrospective that rewards the player's full journey.
 *
 * Beat sheet mapping (18 beats):
 *   1  Opening Image        — The sea before the journey
 *   2  Theme Stated         — "Memory is the compass"
 *   3  Set-Up               — Bay of Learning, first steps
 *   4  Set-Up (continued)   — Driftwood Shallows, first storm
 *   5  Catalyst             — Red sail on the horizon (Null appears)
 *   6  Debate               — Face to face with the rival
 *   7  Break Into Two       — Committed to the uncharted voyage
 *   8  B Story              — Bit the companion, always at Nemo's side
 *   9  Fun and Games        — Conquering islands, placing knowledge
 *  10  Fun and Games (cont) — The chart grows, mastery builds
 *  11  Midpoint             — Golden Chart nearly complete (false victory)
 *  12  Bad Guys Close In    — Storm and tentacles, Kraken foreshadowed
 *  13  All Is Lost          — Null's wreck, Kraken rises from the deep
 *  14  Dark Night of Soul   — Nemo alone on the dark sea
 *  15  Break Into Three     — Armed with knowledge, Nemo rises
 *  16  Finale               — The Kraken battle, lightning and memory
 *  17  Finale (resolution)  — Victory, the sea calms, dawn breaks
 *  18  Final Image          — Dead Reckoner sails into the sunrise
 *
 * Pacing notes:
 *   - Acts 1–2 (beats 1–8) build steadily: 3–4s per beat
 *   - Midpoint (beat 11) lingers: 4.5s, waitForTap
 *   - "All Is Lost" / "Dark Night" (beats 13–14): slow, heavy, 4–5s
 *   - Finale (beats 16–17): fast and intense, 3s with shake
 *   - Final Image (beat 18): 5s with waitForTap — the curtain call
 *
 * Total estimated duration: ~70s auto-play, ~90–110s with taps.
 */

import type { CinematicSequence } from './types';

// ── Save the Cat: The Voyage Complete ────────────────────────

export const GAME_OVER_CINEMATIC: CinematicSequence = {
  id: 'game_over_voyage_complete',
  beats: [

    // ────────────────────────────────────────────────────────
    // ACT 1 — THE ORDINARY WORLD (beats 1–4)
    // ────────────────────────────────────────────────────────

    // Beat 1 — Opening Image
    // The Memory Sea before the adventure. Empty, quiet, full of potential.
    {
      id: 'go_01_opening_image',
      durationS: 4,
      sky: 'dawn',
      characters: [
        { id: 'ship_loci', x: 60, y: 220, scale: 0.6, anim: 'idle' },
      ],
      props: [
        { kind: 'fog_wall', x: 180, y: 100, scale: 1.4 },
      ],
      tint: 'rgba(255,220,180,0.08)',
      caption: 'The Memory Sea... where it all began.',
      waitForTap: true,
    },

    // Beat 2 — Theme Stated
    // The thematic premise: structured memory beats brute force.
    {
      id: 'go_02_theme_stated',
      durationS: 3.5,
      sky: 'dawn',
      characters: [
        { id: 'nemo', x: 100, y: 280, scale: 1.1, anim: 'idle' },
        { id: 'bit', x: 148, y: 252, scale: 0.7, anim: 'idle' },
      ],
      props: [
        { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
      ],
      caption: 'A captain who charts knowledge into the world itself.',
      waitForTap: true,
    },

    // Beat 3 — Set-Up: Bay of Learning
    // The player's first island, their first placed concept.
    {
      id: 'go_03_setup_bay',
      durationS: 3.5,
      sky: 'day',
      characters: [
        { id: 'nemo', x: 80, y: 290, scale: 1, anim: 'walk' },
      ],
      props: [
        { kind: 'island_silhouette', x: 120, y: 278, scale: 1.4 },
        { kind: 'chart_fragment', x: 190, y: 300, scale: 0.8 },
      ],
      caption: 'The Bay of Learning — where the first memories took root.',
    },

    // Beat 4 — Set-Up (continued): Driftwood Shallows
    // The first real challenge. Storms test what was learned.
    {
      id: 'go_04_setup_shallows',
      durationS: 3.5,
      sky: 'storm',
      characters: [
        { id: 'ship_loci', x: 100, y: 200, scale: 0.8, anim: 'idle' },
      ],
      props: [
        { kind: 'chart_fragment', x: 170, y: 310, scale: 0.7 },
        { kind: 'lightning', x: 60, y: 50, scale: 1 },
      ],
      shake: 0.15,
      caption: 'Driftwood Shallows. The storm scattered everything — but memory held.',
    },

    // ────────────────────────────────────────────────────────
    // ACT 1→2 TRANSITION (beats 5–7)
    // ────────────────────────────────────────────────────────

    // Beat 5 — Catalyst: The Red Sail
    // Captain Null appears — the inciting incident that changes everything.
    {
      id: 'go_05_catalyst',
      durationS: 4,
      sky: 'dusk',
      characters: [
        { id: 'ship_overfit', x: 170, y: 180, scale: 0.9, anim: 'idle' },
      ],
      props: [
        { kind: 'fog_wall', x: 60, y: 120, scale: 1.2 },
      ],
      tint: 'rgba(180,60,40,0.1)',
      caption: 'A red sail on the horizon. Captain Null — the one who memorises without understanding.',
      waitForTap: true,
    },

    // Beat 6 — Debate: Face to Face
    // Nemo and Null confront each other. Tension builds.
    {
      id: 'go_06_debate',
      durationS: 3.5,
      sky: 'dusk',
      characters: [
        { id: 'nemo', x: 60, y: 275, scale: 1.1, anim: 'idle' },
        { id: 'null', x: 170, y: 275, scale: 1.1, anim: 'fist_shake', flipX: true },
      ],
      props: [
        { kind: 'island_silhouette', x: 115, y: 263, scale: 2 },
      ],
      tint: 'rgba(120,50,30,0.12)',
      caption: 'Brute force against method. Only one approach survives the sea.',
      waitForTap: true,
    },

    // Beat 7 — Break Into Two: Into the Unknown
    // Nemo commits. Ship Loci sails into uncharted waters.
    {
      id: 'go_07_break_into_two',
      durationS: 3.5,
      sky: 'night',
      characters: [
        { id: 'ship_loci', x: 110, y: 200, scale: 0.9, anim: 'idle' },
      ],
      props: [
        { kind: 'fog_wall', x: 120, y: 90, scale: 1.5 },
      ],
      tint: 'rgba(20,30,60,0.15)',
      caption: 'No turning back. The uncharted sea awaits.',
    },

    // ────────────────────────────────────────────────────────
    // ACT 2 — FUN & GAMES (beats 8–11)
    // ────────────────────────────────────────────────────────

    // Beat 8 — B Story: The Companion
    // Bit the parrot — always at Nemo's side, carrying the theme.
    {
      id: 'go_08_b_story',
      durationS: 3.5,
      sky: 'night',
      characters: [
        { id: 'nemo', x: 100, y: 275, scale: 1.2, anim: 'idle' },
        { id: 'bit', x: 148, y: 245, scale: 0.9, anim: 'wave' },
      ],
      props: [
        { kind: 'island_silhouette', x: 130, y: 263, scale: 1.5 },
      ],
      caption: 'Through every storm, every battle — Bit never left.',
      waitForTap: true,
    },

    // Beat 9 — Fun and Games: Island Conquering
    // The promise of the premise — placing concepts, surviving encounters.
    {
      id: 'go_09_fun_and_games',
      durationS: 3,
      sky: 'day',
      characters: [
        { id: 'nemo', x: 80, y: 280, scale: 1, anim: 'celebrate' },
        { id: 'bit', x: 128, y: 248, scale: 0.6, anim: 'celebrate' },
      ],
      props: [
        { kind: 'island_silhouette', x: 120, y: 268, scale: 1.5 },
        { kind: 'chart_fragment', x: 200, y: 290, scale: 0.7 },
      ],
      caption: 'Island after island fell. Knowledge anchored, threats repelled.',
    },

    // Beat 10 — Fun and Games (continued): Chart Growing
    // The chart fills in — visual progress montage.
    {
      id: 'go_10_chart_growing',
      durationS: 3,
      sky: 'day',
      characters: [
        { id: 'ship_loci', x: 120, y: 200, scale: 0.8, anim: 'idle' },
      ],
      props: [
        { kind: 'chart_fragment', x: 50, y: 300, scale: 0.6 },
        { kind: 'chart_fragment', x: 190, y: 310, scale: 0.6 },
        { kind: 'island_silhouette', x: 60, y: 150, scale: 0.7 },
        { kind: 'island_silhouette', x: 180, y: 140, scale: 0.6 },
      ],
      caption: 'The chart filled in, piece by piece. The sea revealed its secrets.',
    },

    // Beat 11 — Midpoint: False Victory
    // The Golden Chart is nearly complete. A moment of triumph — but premature.
    {
      id: 'go_11_midpoint',
      durationS: 4.5,
      sky: 'dusk',
      characters: [
        { id: 'nemo', x: 100, y: 275, scale: 1.2, anim: 'celebrate' },
        { id: 'bit', x: 145, y: 245, scale: 0.7, anim: 'celebrate' },
      ],
      props: [
        { kind: 'island_silhouette', x: 120, y: 263, scale: 1.5 },
        { kind: 'golden_chart', x: 120, y: 160, scale: 1.1 },
      ],
      tint: 'rgba(255,200,60,0.08)',
      caption: 'The Golden Chart — almost complete. Victory felt so close...',
      waitForTap: true,
    },

    // ────────────────────────────────────────────────────────
    // ACT 2B — THINGS GET WORSE (beats 12–14)
    // ────────────────────────────────────────────────────────

    // Beat 12 — Bad Guys Close In: Storm & Tentacles
    // The Kraken's presence grows. The sea turns hostile.
    {
      id: 'go_12_bad_guys',
      durationS: 3.5,
      sky: 'storm',
      characters: [
        { id: 'ship_loci', x: 110, y: 210, scale: 0.8, anim: 'idle' },
      ],
      props: [
        { kind: 'tentacle', x: 40, y: 260, scale: 1.1 },
        { kind: 'lightning', x: 170, y: 40, scale: 1 },
        { kind: 'tentacle', x: 200, y: 280, scale: 0.9 },
      ],
      shake: 0.25,
      tint: 'rgba(20,10,30,0.15)',
      caption: 'The deep stirred. Something ancient waited below.',
    },

    // Beat 13 — All Is Lost: Null's Wreck / Kraken Rises
    // The rival failed. Even brute force wasn't enough. The true threat emerges.
    {
      id: 'go_13_all_is_lost',
      durationS: 4.5,
      sky: 'dark_sea',
      characters: [
        { id: 'kraken', x: 120, y: 140, scale: 1.2, anim: 'emerge' },
      ],
      props: [
        { kind: 'wreckage', x: 60, y: 300, scale: 0.9 },
        { kind: 'tentacle', x: 190, y: 250, scale: 1 },
      ],
      shake: 0.3,
      tint: 'rgba(10,5,20,0.2)',
      caption: "Null's ship lay broken. The Kraken rose — the sea's final guardian.",
      waitForTap: true,
    },

    // Beat 14 — Dark Night of the Soul
    // Nemo alone. The weight of the journey. Can structured memory truly prevail?
    {
      id: 'go_14_dark_night',
      durationS: 4.5,
      sky: 'dark_sea',
      characters: [
        { id: 'nemo', x: 120, y: 290, scale: 1, anim: 'idle' },
      ],
      props: [
        { kind: 'fog_wall', x: 120, y: 100, scale: 1.6 },
      ],
      tint: 'rgba(10,10,30,0.25)',
      caption: 'Alone in the dark. Every concept, every memory — it all came down to this.',
      waitForTap: true,
    },

    // ────────────────────────────────────────────────────────
    // ACT 3 — THE FINALE (beats 15–18)
    // ────────────────────────────────────────────────────────

    // Beat 15 — Break Into Three: Armed with Knowledge
    // The synthesis moment. Nemo rises, combining everything learned.
    {
      id: 'go_15_break_into_three',
      durationS: 3.5,
      sky: 'storm',
      characters: [
        { id: 'nemo', x: 100, y: 270, scale: 1.3, anim: 'celebrate' },
        { id: 'bit', x: 150, y: 240, scale: 0.8, anim: 'wave' },
      ],
      props: [
        { kind: 'island_silhouette', x: 120, y: 258, scale: 1.5 },
        { kind: 'chart_fragment', x: 50, y: 310, scale: 0.6 },
        { kind: 'chart_fragment', x: 190, y: 320, scale: 0.5 },
      ],
      caption: 'But Nemo remembered. Every landmark. Every concept. Every anchor.',
      waitForTap: true,
    },

    // Beat 16 — Finale: The Kraken Battle
    // Fast, intense, the culmination. Memory vs. the guardian.
    {
      id: 'go_16_finale_battle',
      durationS: 3,
      sky: 'storm',
      characters: [
        { id: 'ship_loci', x: 60, y: 210, scale: 0.6, anim: 'idle' },
        { id: 'nemo', x: 60, y: 205, scale: 1.1, anim: 'fist_shake' },
        { id: 'kraken', x: 160, y: 120, scale: 1.3, anim: 'idle' },
      ],
      props: [
        { kind: 'lightning', x: 120, y: 30, scale: 1.2 },
        { kind: 'tentacle', x: 30, y: 220, scale: 1 },
        { kind: 'cannon_flash', x: 100, y: 250, scale: 0.8 },
      ],
      shake: 0.4,
      tint: 'rgba(40,20,60,0.12)',
      caption: 'The Kraken struck — and Nemo answered with everything.',
    },

    // Beat 17 — Finale (resolution): Victory
    // The battle is won. The sea calms. Dawn breaks over the Memory Sea.
    {
      id: 'go_17_victory',
      durationS: 4,
      sky: 'dawn',
      characters: [
        { id: 'nemo', x: 100, y: 270, scale: 1.3, anim: 'celebrate' },
        { id: 'bit', x: 150, y: 238, scale: 0.9, anim: 'celebrate' },
      ],
      props: [
        { kind: 'island_silhouette', x: 120, y: 258, scale: 1.5 },
        { kind: 'sunrise', x: 120, y: 55, scale: 1.4 },
      ],
      tint: 'rgba(255,200,100,0.06)',
      caption: 'The Kraken fell. The sea remembered those who remembered it.',
      waitForTap: true,
    },

    // Beat 18 — Final Image: The Dead Reckoner
    // Mirror of the Opening Image, transformed. The chart is complete.
    // Ship Loci sails into the sunrise. New seas beckon beyond.
    {
      id: 'go_18_final_image',
      durationS: 5,
      sky: 'dawn',
      characters: [
        { id: 'ship_loci', x: 110, y: 195, scale: 1, anim: 'idle' },
        { id: 'bit', x: 155, y: 170, scale: 0.6, anim: 'wave' },
      ],
      props: [
        { kind: 'golden_chart', x: 120, y: 310, scale: 1.2 },
        { kind: 'sunrise', x: 120, y: 50, scale: 1.6 },
      ],
      tint: 'rgba(255,230,180,0.1)',
      caption: 'Captain Nemo — the Dead Reckoner. The Golden Chart complete. New seas await.',
      waitForTap: true,
    },
  ],
};
