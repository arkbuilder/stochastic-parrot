# About-the-Game DLC Briefs (Source-Grounded)

This doc summarizes DLC facts pulled from in-repo source files for About-the-Game content updates.

## 1) Abyssal Gauntlet (`abyssal-gauntlet`)

- **Title/name used in code:** `Abyssal Gauntlet` (manifest id `abyssal-gauntlet`; topic `Combat Mastery`). [src/dlc/packs/abyssal-gauntlet-pack.ts]
- **Core fantasy/theme:** Endless roguelike monster hunt in a Zelda NES-style screen-by-screen world; explicitly combat-first with no concept-learning flow. [src/dlc/packs/abyssal-gauntlet-pack.ts], [src/scenes/gauntlet-scene.ts]
- **Gameplay loop:**
  - Enter gauntlet campaign from DLC select and skip overworld to `GauntletScene`. [src/main.ts]
  - Move between adjacent 240×400 screens by crossing edges; each screen is procedurally generated from seeded coordinates. [src/scenes/gauntlet-scene.ts]
  - Fight scaling enemy waves, collect occasional powerups (`speed`, `shield`, `freeze`), and chase score/distance milestones. [src/scenes/gauntlet-scene.ts]
- **Unique mechanics/systems:**
  - No concepts, landmarks, or minigames (combat-only contract). [src/dlc/packs/abyssal-gauntlet-pack.ts], [tests/unit/dlc/abyssal-gauntlet-quality.test.ts]
  - Difficulty scales by Manhattan distance from spawn: enemy count and speed increase, enemy pools upgrade from `crab` to late-tier enemies (e.g., `ray`). [src/scenes/gauntlet-scene.ts], [tests/unit/scenes/gauntlet-scene.test.ts]
  - Deterministic procedural generation: tile layouts, vegetation, enemies, and powerup spawns are coordinate-seeded and reproducible. [src/scenes/gauntlet-scene.ts], [tests/unit/scenes/gauntlet-scene.test.ts]
  - Integrated combat overlay + persistent skill tree progression during run. [src/scenes/gauntlet-scene.ts], [tests/unit/scenes/gauntlet-scene.test.ts]
- **Progression/rewards:**
  - 6-stage linear island chain: Boneshore Landing → Ironwreck Shallows → Bloodtide Reef → Abyssal Trench → Leviathan’s Maw → The Drowned Throne. [src/dlc/packs/abyssal-gauntlet-pack.ts]
  - Unlock prerequisite: `base_complete`. [src/dlc/packs/abyssal-gauntlet-pack.ts], [tests/unit/dlc/abyssal-gauntlet-quality.test.ts]
  - Per-island unique rewards (`gauntlet_tooth`, `iron_shard`, `bloodstone`, `abyssal_scale`, `leviathan_fang`, `crown_of_the_deep`) and score/SP gains from combat outcomes. [src/dlc/packs/abyssal-gauntlet-pack.ts], [src/scenes/gauntlet-scene.ts], [tests/unit/dlc/abyssal-gauntlet-quality.test.ts]
- **Notable enemies/challenges:**
  - Bestiary includes escalating threats up to boss `The Drowned King` (danger 5), plus environmental hazards like `Abyssal Whirlpool` and `Blood Tide`. [src/dlc/packs/abyssal-gauntlet-pack.ts]
  - Encounter templates ramp pressure from `gauntlet_brawl_easy` to `gauntlet_boss` via higher prompt counts and tighter time windows. [src/dlc/packs/abyssal-gauntlet-pack.ts], [tests/unit/dlc/abyssal-gauntlet-quality.test.ts]
- **Player appeal / target playstyle:** High-replay, combat-first players who prefer run-based difficulty scaling, skill-tree optimization, and score chasing over concept/minigame learning. [src/scenes/gauntlet-scene.ts], [tests/unit/dlc/abyssal-gauntlet-quality.test.ts]

## 2) Starboard Launch (`rocket-science`)

- **Title/name used in code:** `Starboard Launch` (manifest id `rocket-science`; topic `Rocket Science`). [src/dlc/packs/rocket-science-pack.ts]
- **Core fantasy/theme:** Build and fly a pirate spaceship from launch fundamentals to deep-space survival, ending with a Space Kraken boss stage. [src/dlc/packs/rocket-science-pack.ts], [src/cinematics/dlc-rocket-cinematics.ts]
- **Gameplay loop:**
  - Standard island campaign flow (explore island, complete encounter type, play concept minigames) across 5 islands.
  - 15 concepts with 1:1 minigame coverage and staged tier progression. [src/dlc/packs/rocket-science-pack.ts], [tests/unit/dlc/rocket-science-quality.test.ts]
- **Unique mechanics/systems:**
  - Uses all five encounter types across DLC islands (`fog`, `storm`, `ruins`, `battle`, `squid`) with boss at final squid island. [src/dlc/packs/rocket-science-pack.ts], [tests/unit/dlc/rocket-science-quality.test.ts]
  - Broad minigame interaction mix (`sort`, `select`, `adjust`, `connect`) across concept set. [src/dlc/packs/rocket-science-pack.ts], [tests/unit/dlc/rocket-science-quality.test.ts]
  - Dedicated DLC cinematic sequences for all five rocket islands. [src/cinematics/dlc-rocket-cinematics.ts]
- **Progression/rewards:**
  - Linear unlock chain: Launchpad Lagoon → Booster Reef → Orbit Atoll → Nebula Shallows → Kraken’s Void. [src/dlc/packs/rocket-science-pack.ts]
  - Unlock prerequisite: `base_complete`. [src/dlc/packs/rocket-science-pack.ts]
  - Tier ramp by stage: tiers 1 (stages 1-2), tier 2 (stages 3-4), tier 3 (stage 5). [src/dlc/packs/rocket-science-pack.ts], [tests/unit/dlc/rocket-science-quality.test.ts]
  - Unique per-island rewards (`booster_blueprint`, `stage_separator_part`, `navigation_star_chart`, `nebula_compass`, `kraken_trophy`). [src/dlc/packs/rocket-science-pack.ts]
- **Notable enemies/challenges:**
  - Bestiary includes `Rocket Crab`, `Stellar Jelly`, `Void Eel`, and boss `Space Kraken` (danger 5), plus environmental entries like `Asteroid Field`. [src/dlc/packs/rocket-science-pack.ts]
  - Final stage combines advanced concepts (`heat_shield`, `reentry`, `splashdown`) with squid boss encounter. [src/dlc/packs/rocket-science-pack.ts], [tests/unit/dlc/rocket-science-quality.test.ts]
- **Player appeal / target playstyle:** Players who want a longer concept-heavy DLC (15 concepts) with varied encounter/minigame patterns and a full arc from basics to boss payoff. [src/dlc/packs/rocket-science-pack.ts], [tests/unit/dlc/rocket-science-quality.test.ts]

## 3) Cipher Seas (`cybersecurity`)

- **Title/name used in code:** `Cipher Seas` (manifest id `cybersecurity`; topic `Cybersecurity`). [src/dlc/packs/cybersecurity-pack.ts]
- **Core fantasy/theme:** Defensive security voyage against digital threats using pirate-world metaphors (encrypted cargo, phishing bait, fortress checks). [src/dlc/packs/cybersecurity-pack.ts]
- **Gameplay loop:**
  - Two-island concept campaign: encounter + concept minigame progression.
  - 6 concepts with one minigame each (no orphan concepts/minigames in tests). [src/dlc/packs/cybersecurity-pack.ts], [tests/unit/dlc/cybersecurity-quality.test.ts]
- **Unique mechanics/systems:**
  - Focused 2-stage structure with concise tier ramp from basics to applied controls.
  - Reuses base encounter template types (`fog`, `battle`) rather than adding custom encounter templates. [src/dlc/packs/cybersecurity-pack.ts]
  - Landmarks directly model security concepts (e.g., `cipher_lockbox`, `sea_wall`, `watchtower`) and are mapped bidirectionally in tests. [src/dlc/packs/cybersecurity-pack.ts], [tests/unit/dlc/cybersecurity-quality.test.ts]
- **Progression/rewards:**
  - Unlock chain: `dlc_cipher_cove` unlocks after `island_05`, then `dlc_fortress_harbor` unlocks after `dlc_cipher_cove`. [src/dlc/packs/cybersecurity-pack.ts], [tests/unit/dlc/cybersecurity-quality.test.ts]
  - Unlock prerequisite: `base_complete` in manifest. [src/dlc/packs/cybersecurity-pack.ts]
  - Rewards: `cipher_key_fragment` then `fortress_seal`. [src/dlc/packs/cybersecurity-pack.ts]
  - Tier split: island 1 concepts tier 1 (`encryption`, `phishing`, `firewall`), island 2 concepts tier 2 (`authentication`, `malware`, `zero_trust`). [src/dlc/packs/cybersecurity-pack.ts], [tests/unit/dlc/cybersecurity-quality.test.ts]
- **Notable enemies/challenges:**
  - Bestiary entries: `Cipher Crab`, `Phish Jelly`, and `Iron Kelp` (flora). [src/dlc/packs/cybersecurity-pack.ts]
  - Challenge styles include `sort`, `select`, and `connect` with validated answer integrity in tests. [src/dlc/packs/cybersecurity-pack.ts], [tests/unit/dlc/cybersecurity-quality.test.ts]
- **Player appeal / target playstyle:** Players wanting a shorter, structured concept DLC with immediate practical-security vocabulary and low campaign overhead (2 islands / 6 concepts). [src/dlc/packs/cybersecurity-pack.ts]
