# Design Folder — Dead Reckoning: Memory Sea

This folder contains the complete game design documentation for *Dead Reckoning: Memory Sea*, an 8-bit pirate adventure that teaches AI/ML concepts through the Method of Loci memory technique.

## Source of Truth Hierarchy

1. **`GameDesign.md`** — Canonical framework (onboarding GDRD, non-negotiable principles P1–P5, telemetry spec, acceptance tests). All other files must comply.
2. **`GameHook.md`** — Story hook, core fantasy, vertical slice definition.
3. **`Research.md`** — Academic framework (SMB 1-1 analysis, DbC, FSM, PCG theory).
4. **`Aesthetic.md`** — Production design tokens (`arcade-midnight` theme, all visual system values).
5. **Game-specific design files** (below) — Implement the framework with pirate/memory-sea content.

If any game-specific file contradicts `GameDesign.md`, the framework doc wins.

## Recommended Reading Order

For agents or contributors building the game, read in this order:

| Order | File | What You Learn |
|---|---|---|
| 1 | `GameDesign.md` | Framework rules, constraints, telemetry spec |
| 2 | `GameHook.md` | What the game IS — title, loop, fantasy |
| 3 | `CoreInteraction.md` | How place/recall works — most dev-blocking spec |
| 4 | `OnboardingLevel.md` | Island 1 beat-by-beat walkthrough |
| 5 | `ConceptCurriculum.md` | All 15 AI/ML concepts and metaphor mappings |
| 6 | `EncounterDesign.md` | 5 encounter types with tuning knobs |
| 7 | `IslandProgression.md` | 5-island sequence, pacing, unlock logic |
| 8 | `Characters.md` | Full character roster and visual specs |
| 9 | `NarrativeStructure.md` | 3-act story arc and lore delivery |
| 10 | `OverworldNavigation.md` | Sailing mechanics and map design |
| 11 | `ShipUpgrades.md` | 5 reward upgrades |
| 12 | `InventoryAndHUD.md` | HUD layouts and UI component specs |
| 13 | `ScoringAndProgression.md` | Points model, leaderboards, grades |
| 14 | `AudioDirection.md` | Music layers, SFX catalog |
| 15 | `ContentPipeline.md` | Asset authoring vs. generation strategy |
| 16 | `ScopeAndMilestones.md` | Build plan M0–M4, cut line, risks |
| — | `Aesthetic.md` | Reference as needed for exact token values |
| — | `Research.md` | Reference for academic design rationale |

## File Inventory

### Framework Documents (Pre-existing)

| File | Lines | Purpose |
|---|---|---|
| `GameDesign.md` | ~264 | Onboarding GDRD framework |
| `GameHook.md` | ~200 | Game concept one-pager |
| `Research.md` | ~5000 words | Academic design theory |
| `Aesthetic.md` | ~1370 | Full design token system |

### Game-Specific Design Documents (14 files)

| File | Coverage |
|---|---|
| `CoreInteraction.md` | Core verb (place/recall), state model, input map, data contracts |
| `OnboardingLevel.md` | Island 1 beat map B0–B5, iteration hypotheses |
| `EncounterDesign.md` | 5 encounter types: Fog, Storm, Battle, Ruins, Squid |
| `ConceptCurriculum.md` | 15 AI/ML concepts, metaphors, landmarks, prerequisites |
| `IslandProgression.md` | 5-island arc, pacing tables, competition cut line |
| `Characters.md` | Nemo, Bit, Null, Kraken, Landmark Spirits |
| `NarrativeStructure.md` | 3-act story, lore delivery, thematic throughline |
| `OverworldNavigation.md` | Node-based sailing, fog-of-war, portrait layout |
| `ShipUpgrades.md` | 5 upgrades + legendary, auto-awarded by completion |
| `InventoryAndHUD.md` | HUD zones per phase, concept tray, card specs |
| `ScoringAndProgression.md` | Points model, combo, grades, leaderboard schema |
| `AudioDirection.md` | Adaptive chiptune music, SFX catalog, accessibility |
| `ContentPipeline.md` | Authored vs. generated assets, quality gates, naming |
| `ScopeAndMilestones.md` | M0–M4 milestones, cut line, risk register |

### Archived

| File | Reason |
|---|---|
| `_archive/DesignInput.md` | Duplicate of `GameDesign.md` — retired |

## Cross-Reference to Knowledge Library

Each design file maps to one or more Knowledge files for implementation guidance. See `Knowledge/standards/coverage-matrix.md` for the full ownership matrix.
