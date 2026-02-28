# Codex Execution Prompt — Dead Reckoning: Memory Sea

> **What this is:** A single prompt that drives OpenAI Codex to build the entire game from zero code to a fully playable, deployable product. This references every markdown document in the repository. Codex should not stop until every milestone is complete and validated.

---

## SYSTEM INSTRUCTIONS

You are building **Dead Reckoning: Memory Sea** — an 8-bit pirate adventure that teaches AI/ML concepts through spatial memory (Method of Loci). The complete game design, architecture, engineering specs, and knowledge library already exist in this repository as markdown files. **Your job is to write all the code.** Every line. Every file. Every test. Every migration. Every config. Do not stop until the game is deployed and all acceptance criteria pass.

### Operating Rules

1. **Read before you write.** Before touching any domain, read the relevant Design doc, Knowledge doc, and engineering doc listed below. Do not guess — the specs are precise.
2. **Follow the architecture.** `ARCHITECTURE.md` defines the folder structure, layering rules, and dependency direction. Violating these is a build-breaking error. No upward imports. No cross-domain infrastructure coupling.
3. **Milestone by milestone.** Build in order: M0 → M1 → M2 → M3 → M4. Do not skip ahead. Each milestone has a Definition of Done — validate it before proceeding.
4. **Self-validate continuously.** After each significant piece of work, run the relevant checks: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`. Fix failures before moving on.
5. **Update docs as you go.** After completing each milestone task, update `docs/PLANS.md` (mark task status) and `docs/QUALITY_SCORE.md` (update grades). These are living documents.
6. **Never stop.** If you hit an ambiguity, make the best decision consistent with the design docs and log it in `docs/PLANS.md` → Decision Log. If you hit a bug, fix it. If a test fails, fix it. If an asset is missing, generate a placeholder. Keep going.
7. **Commit after each milestone.** Use the commit conventions from `AGENTS.md`: prefix with `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. Reference the Design doc that drives each change.

---

## COMPLETE DOCUMENT MAP

Read these files. They are your specifications. Everything you need to build the game is here.

### Tier 1 — Read First (Framework + Architecture)

| File | What It Tells You | Read When |
|---|---|---|
| `AGENTS.md` | Entry point, constraints, where to find things | First |
| `ARCHITECTURE.md` | Tech stack, folder structure, layering rules, state machine, data flow, naming conventions | First |
| `Design/GameDesign.md` | Non-negotiable principles (P1–P5), telemetry spec, acceptance tests, portrait layout rules | First |
| `Design/GameHook.md` | Game concept, core fantasy, vertical slice scope, pitch line | First |

### Tier 2 — Read Before Building Each Feature (Game Design)

| File | What It Tells You |
|---|---|
| `Design/CoreInteraction.md` | **Most critical.** How place/recall works. State model. Input mapping. Data contracts. Telemetry hooks. |
| `Design/OnboardingLevel.md` | Island 1 beat map B0–B5. Exact timing, obstacles, iteration hypotheses. |
| `Design/EncounterDesign.md` | 5 encounter types (Fog, Storm, Battle, Ruins, Squid). Tuning knobs. Novice assists. Expert mastery. |
| `Design/ConceptCurriculum.md` | All 15 AI/ML concepts. Metaphor-to-landmark mappings. Prerequisite chains. Recall prompt style. |
| `Design/IslandProgression.md` | 5-island sequence. Pacing tables. Unlock logic. Competition cut line. |
| `Design/Characters.md` | Nemo, Bit, Null, Kraken, Landmark Spirits. Sprite sizes. Animation frames. Color tokens. |
| `Design/NarrativeStructure.md` | 3-act story arc. Lore delivery system. Thematic throughline. |
| `Design/OverworldNavigation.md` | Node-based sailing. Fog-of-war. Portrait layout. Auto-sail timing. |
| `Design/ShipUpgrades.md` | 5 upgrades + 1 legendary. Auto-awarded on island completion. Gameplay effects. |
| `Design/InventoryAndHUD.md` | HUD zone layouts per game phase. Component specs. Concept card dimensions. |
| `Design/ScoringAndProgression.md` | Points model. Speed bonus. Combo multiplier. Grade thresholds. Leaderboard schema. |
| `Design/AudioDirection.md` | Adaptive chiptune layers. SFX catalog (17+ events). Per-island themes. Web Audio API spec. |
| `Design/ContentPipeline.md` | Authored vs generated boundaries. Asset naming. Quality gates. |
| `Design/ScopeAndMilestones.md` | M0–M4 milestone plan. Deliverables. Definition of Done. Risk register. Cut line. |
| `Design/Aesthetic.md` | **1370-line design token system.** `arcade-midnight` theme. All colors, spacing, typography, motion, component tokens. |
| `Design/Research.md` | Academic design theory (SMB 1-1 analysis). Use for encounter pacing and signposting patterns. |

### Tier 3 — Read For Implementation Guidance (Knowledge Library)

| File | Domain |
|---|---|
| `Knowledge/standards/agent-consumption-guidelines.md` | How to consume these docs as an agent |
| `Knowledge/standards/glossary-and-term-consistency.md` | Canonical terminology |
| `Knowledge/standards/coverage-matrix.md` | Design → Knowledge file ownership map |
| `Knowledge/game-design/onboarding-beat-map.md` | Beat map authoring patterns |
| `Knowledge/game-design/environmental-signposting.md` | No-text teaching via environment |
| `Knowledge/game-design/fail-retry-loop.md` | ≤5s retry policy implementation |
| `Knowledge/game-design/novice-assists-vs-mastery.md` | Diegetic assist + expert secret design |
| `Knowledge/engineering/frontend-architecture-npm.md` | Module boundaries, build scripts |
| `Knowledge/engineering/responsive-layout-and-input-abstraction.md` | Viewport strategy, coordinate normalization |
| `Knowledge/engineering/dual-input-parity-touch-pc.md` | Touch + keyboard unified input |
| `Knowledge/engineering/state-machine-and-game-loop.md` | FSM states, transitions, tick loop |
| `Knowledge/engineering/performance-budget-mobile.md` | Frame pacing, asset budgets, startup latency |
| `Knowledge/engineering/sqlite-data-model-and-migrations.md` | Schema, migrations, seed data |
| `Knowledge/engineering/highscore-and-progression-service.md` | Score service, idempotency |
| `Knowledge/engineering/sync-conflict-and-offline-policy.md` | Offline queue, conflict resolution |
| `Knowledge/engineering/security-and-data-integrity.md` | Checksum, rate limit, validation |
| `Knowledge/product/quality-bar-and-definition-of-done.md` | Quality grades, done criteria |
| `Knowledge/product/telemetry-events-and-thresholds.md` | Event schema, pass/fail thresholds |
| `Knowledge/product/playtest-and-acceptance-protocol.md` | Test protocol, simulated agents |
| `Knowledge/art/legibility-and-visual-hierarchy.md` | Sprite readability, contrast rules |
| `Knowledge/art/ui-layout-thumb-reach-zones.md` | Portrait zones, thumb-safe targets |
| `Knowledge/audio/music-and-sonic-feedback.md` | Chiptune patterns, adaptive layer design |
| `Knowledge/education/no-text-teaching-patterns.md` | Environmental teaching, icon-based communication |
| `Knowledge/accessibility/inclusive-onboarding.md` | Reduced motion, color blind, screen reader |

### Tier 4 — Engineering Bridge (Build Specs)

| File | What It Tells You |
|---|---|
| `docs/FRONTEND.md` | Canvas pipeline, scene system, entity model, sprite sheets, input architecture, HUD rendering, design token integration |
| `docs/DATABASE.md` | Complete SQLite schema (CREATE TABLE statements), migration runner, query patterns, offline fallback |
| `docs/PLANS.md` | Active execution plan with task status. **Update this as you work.** |
| `docs/QUALITY_SCORE.md` | Quality grades per domain. **Update grades after each milestone.** |
| `docs/TESTING.md` | Test pyramid, unit/integration/E2E strategy, simulated agent tests, test hooks |
| `docs/DEPLOYMENT.md` | Build pipeline, npm scripts, hosting, CI workflow, caching |
| `docs/RELIABILITY.md` | Error handling per layer, offline queue, state recovery, asset fallbacks |
| `docs/SECURITY.md` | Score checksum, envelope validation, rate limiting, CORS, Zod schemas |

---

## EXECUTION PLAN

### PHASE 0: M0 — Foundation

**Read first:** `ARCHITECTURE.md`, `docs/FRONTEND.md`, `docs/DATABASE.md`, `Knowledge/engineering/frontend-architecture-npm.md`, `Knowledge/engineering/state-machine-and-game-loop.md`

**Build in this order:**

```
M0-1.  Initialize npm project
       - package.json with all dependencies (typescript, vite, vitest, better-sqlite3, express, playwright)
       - tsconfig.json (strict: true, target: ES2022, module: ESNext)
       - vite.config.ts (canvas project, dev server proxy to Express)
       - vitest.config.ts
       - .eslintrc.cjs
       - .gitignore

M0-2.  Create src/index.html
       - Single <canvas> element, no other DOM
       - <script type="module" src="main.ts">

M0-3.  Create src/main.ts
       - Initialize canvas (240×400 game resolution)
       - Pixel-perfect scaling (imageSmoothingEnabled = false)
       - Portrait responsive layout (CSS scaling, letterboxing on PC)
       - Start game loop

M0-4.  Create src/core/
       - types.ts: shared types (GameState, Scene interface, etc.)
       - clock.ts: delta time calculation, pause-aware
       - state-machine.ts: FSM with states from ARCHITECTURE.md §State Machine
       - scene-manager.ts: push/pop/replace scene stack
       - game-loop.ts: requestAnimationFrame → pollInput → update → render → present

M0-5.  Create src/input/
       - types.ts: InputAction union type (primary, move, secondary, drag, pause)
       - touch-provider.ts: Touch/pointer events → InputActions
       - keyboard-provider.ts: Keyboard events → InputActions  
       - input-manager.ts: Unified adapter, coordinate normalization (screen→game space)

M0-6.  Create src/rendering/
       - tokens.ts: Design token constants parsed from Design/Aesthetic.md
       - renderer.ts: Canvas context wrapper, clear/draw/present, double buffering

M0-7.  Create src/scenes/
       - boot-scene.ts: Shows "Loading..." placeholder, transitions to menu
       - menu-scene.ts: Title "Dead Reckoning", Start button (tap/click), responds to input

M0-8.  Create src/telemetry/
       - events.ts: All event name constants from GameDesign.md §7
       - telemetry-client.ts: Buffered event dispatch
       - console-sink.ts: Dev mode → log events to console

M0-9.  Create src/data/
       - concepts.ts: All 15 AI/ML concept definitions from ConceptCurriculum.md
       - islands.ts: Island configs (landmarks, concepts, threats) from IslandProgression.md
       - encounters.ts: Encounter templates from EncounterDesign.md
       - upgrades.ts: Ship upgrades from ShipUpgrades.md
       - prompts.ts: Recall prompt definitions from ConceptCurriculum.md

M0-10. Create server/
       - index.ts: Express app, static file serving, API routes
       - db/connection.ts: SQLite connection factory
       - db/migrate.ts: Migration runner (from docs/DATABASE.md)
       - db/migrations/001_init.sql: Full schema from docs/DATABASE.md
       - routes/scores.ts: GET/POST /api/scores (stub)
       - routes/progress.ts: GET/POST /api/progress (stub)
       - routes/events.ts: POST /api/events (stub)
       - middleware/validate.ts: Request validation (Zod schemas from docs/SECURITY.md)
       - middleware/rate-limit.ts: Per-device rate limiting

M0-11. Create scripts/
       - generate-tokens.ts: Parse Aesthetic.md → tokens.ts (or hardcode from Aesthetic.md)
       - seed-db.ts: Seed test data

M0-12. Create src/utils/
       - math.ts: clamp, lerp, distance, normalize
       - random.ts: Seeded PRNG
       - timer.ts: Countdown, stopwatch helpers

M0-13. Create tests/
       - unit/core/state-machine.test.ts: All transitions valid
       - unit/core/clock.test.ts: Delta time, pause
       - unit/input/input-manager.test.ts: Action normalization
       - unit/data/concepts.test.ts: All 15 concepts valid, unique IDs

M0-14. Wire npm scripts:
       - dev: concurrent Vite + Express
       - build: Vite client + tsc server
       - test: vitest run
       - test:e2e: playwright test
       - lint: eslint + tsc --noEmit
       - db:migrate, db:seed, db:reset
```

**M0 VALIDATION GATE — Do not proceed until ALL pass:**
```
☐ npm run dev → opens browser with 240×400 canvas showing menu scene
☐ npm run lint → zero errors
☐ npm test → all unit tests pass
☐ npm run build → clean production build
☐ npm run db:migrate → all tables created (verify with .tables)
☐ State machine logs transitions: BOOT → MENU (visible in console)
☐ Touch tap AND keyboard Enter both produce 'primary' InputAction
☐ Design tokens importable and render correct colors
☐ Update docs/PLANS.md: mark all M0 tasks 'completed'
☐ Update docs/QUALITY_SCORE.md: grade each M0 domain
☐ git commit -m "feat: M0 foundation — scaffold, game loop, input, state machine, DB"
```

---

### PHASE 1: M1 — Playable Island 1

**Read first:** `Design/CoreInteraction.md`, `Design/OnboardingLevel.md`, `Design/EncounterDesign.md` (Cursed Fog), `Design/Characters.md`, `Design/InventoryAndHUD.md`, `Design/AudioDirection.md`, `docs/FRONTEND.md`

**Build in this order:**

```
M1-1.  Sprite system
       - src/rendering/sprite-sheet.ts: Load atlas PNG + JSON manifest, frame lookup
       - src/rendering/tile-map.ts: Tile-based island rendering from layout JSON
       - Generate placeholder sprites: Nemo (16×16, 4-dir walk + place), Bit (8×8, idle + fly)
       - Generate placeholder tile set for Island 1 (sand, water, dock, grass)

M1-2.  Entity model
       - src/entities/types.ts: Entity interface from docs/FRONTEND.md
       - src/entities/player.ts: Nemo — position, walk animation, place animation
       - src/entities/parrot.ts: Bit — follow player, fly-to-landmark, idle
       - src/entities/landmark.ts: 3 landmarks (dock crates, chart table, cannon)
       - src/entities/concept-card.ts: Draggable card (48×48 in tray, states: tray/dragging/placed)
       - src/entities/threat.ts: Cursed Fog base (advancing wall)

M1-3.  Game systems
       - src/systems/movement-system.ts: Player walk, collision with landmarks
       - src/systems/encode-system.ts: Drag concept card → snap to landmark → lock-in
         * 32px snap radius
         * Lock-in animation
         * Max 3 concepts per encoding session
         * Concepts introduced one at a time per landmark proximity
       - src/systems/recall-system.ts: Prompt display, landmark selection, answer validation
         * Timer countdown
         * Correct/incorrect feedback
         * Retry logic (≤5s back to action)
         * Speed multiplier calculation (from ScoringAndProgression.md)
         * Combo tracking
       - src/systems/threat-system.ts: Fog advancement, health/progress, resolution
       - src/systems/animation-system.ts: Sprite frame stepping per entity
       - src/systems/camera-system.ts: Viewport follow player, portrait framing

M1-4.  Island scene (encode + recall phases)
       - src/scenes/island-scene.ts: Full implementation
         * ISLAND_ARRIVE → EXPLORING → ENCODING → THREAT_TRIGGERED → RECALLING → RESOLVED
         * Wires all systems: movement + encode + recall + threat + animation + camera
         * HUD: concept card tray (bottom), mini-map (top), active area (mid)
         * Transitions to encounter-scene on threat trigger

M1-5.  Encounter scene (Cursed Fog)
       - src/scenes/encounter-scene.ts: Recall phase under fog threat
         * Fog wall advances from top of screen
         * 3 recall prompts (one per placed concept)
         * Correct recall pushes fog back
         * Failed recall: fog advances, screen shake, retry ≤5s
         * Novice assist: after 2 fails on same prompt, Bit flies to correct landmark
         * Expert mastery: all 3 correct first-attempt under par time → hidden cave + bonus fragment
         * Transitions to reward-scene on resolution

M1-6.  Reward scene
       - src/scenes/reward-scene.ts: Chart Fragment award
         * Fragment assembles visually
         * Island score summary (base + speed + combo + grade)
         * "Continue" button → overworld or menu

M1-7.  Audio engine
       - src/audio/types.ts: AudioEvent enum
       - src/audio/audio-manager.ts: Master mixer, volume, mute
       - src/audio/sfx.ts: One-shot playback via Web Audio API oscillators
         * concept_placed, recall_correct, recall_incorrect, fog_advance, fog_push_back
         * chart_fragment_earned, bit_chirp, nemo_footstep
       - src/audio/music-layer.ts: Adaptive layers for Island 1
         * Base (always), Rhythm (exploring), Tension (threat), Resolution (success)
         * 500ms crossfade between layers

M1-8.  HUD rendering
       - src/rendering/hud.ts: Draw concept tray, timer bar, health bar, mini-map
       - src/rendering/particles.ts: Fog edge particles, sparkle on lock-in

M1-9.  Persistence client
       - src/persistence/types.ts: API types
       - src/persistence/api-client.ts: REST calls to server (scores, progress, events)
       - src/persistence/local-store.ts: localStorage fallback + offline queue

M1-10. Island 1 content
       - assets/layouts/island_01/layout.json: Tile map for Bay of Learning
       - assets/sprites/island_01/: All Island 1 sprites
       - assets/audio/island_01/: Music layers + SFX
       - Wire into src/data/islands.ts Island 1 config

M1-11. Telemetry wiring
       - Wire all GameDesign.md §7 events with correct payloads:
         onboarding_start, first_input, first_success_core_verb, first_fail,
         retry_start, reward_seen, reward_collected, reward_used,
         beat_completed, secret_found, onboarding_complete, quit
       - Plus CoreInteraction.md events: concept_placed, recall_prompted,
         recall_answered, recall_timeout, encode_phase_complete, recall_phase_complete

M1-12. Tests
       - unit/systems/encode-system.test.ts
       - unit/systems/recall-system.test.ts (correct, incorrect, timeout, speed multiplier)
       - unit/systems/threat-system.test.ts
       - unit/data/islands.test.ts (Island 1 config valid)
       - integration/island-encode-recall.test.ts (full encode→recall→reward flow)
       - e2e/island-1-playthrough.spec.ts (Playwright: boot→menu→island→encode→recall→reward)
```

**M1 VALIDATION GATE — Do not proceed until ALL pass:**
```
☐ npm run dev → Island 1 fully playable: walk, place 3 concepts, survive Cursed Fog
☐ Drag-to-place works on touch (simulated) AND mouse click
☐ Recall prompts are icon/spatial, NOT text quiz
☐ Fog advances visually, correct recall pushes it back
☐ After 2 fails: Bit flies to correct landmark (novice assist)
☐ All 3 correct first-attempt fast → hidden cave + bonus fragment appears
☐ Chart Fragment earned, score summary shown with grade
☐ Retry latency (fail → control regained) ≤5s
☐ SFX play for: concept placed, recall correct/incorrect, fog events
☐ Music layers switch: base → tension (threat) → resolution (success)
☐ All telemetry events fire with correct payloads (check console)
☐ npm test → all tests pass (≥20 unit, ≥2 integration)
☐ npm run test:e2e → Island 1 E2E test passes
☐ npm run lint → zero errors
☐ npm run build → clean build
☐ Update docs/PLANS.md: mark all M1 tasks 'completed', begin M2 tasks
☐ Update docs/QUALITY_SCORE.md: grade all M1 domains (target: most B+/A)
☐ git commit -m "feat: M1 — Island 1 fully playable with encode/recall/fog/audio"
```

---

### PHASE 2: M2 — Overworld + Island 2

**Read first:** `Design/OverworldNavigation.md`, `Design/IslandProgression.md`, `Design/EncounterDesign.md` (Storm), `Design/ScoringAndProgression.md`, `Design/ShipUpgrades.md`

**Build in this order:**

```
M2-1.  Overworld scene
       - src/scenes/overworld-scene.ts
         * Node-based sea chart (2 island nodes initially)
         * Fog-of-war: Island 2 revealed after Island 1 chart fragment
         * Tap/click node → auto-sail animation (10–20s with camera pan)
         * Portrait layout: horizon (top), chart (mid), ship status (bottom)
         * Narrative sighting moments during sail (text-free environmental moments)

M2-2.  Island 2 — Driftwood Shallows
       - 3 new landmarks (sorting bins, tidewheel, something for feedback loop)
       - 3 new concepts: Bias (crooked compass), Classification (sorting bins), Feedback Loop (tidewheel)
       - assets/layouts/island_02/layout.json
       - assets/sprites/island_02/, assets/audio/island_02/
       - Distinct visual identity from Island 1 (different palette within Aesthetic.md tokens)

M2-3.  Storm encounter
       - Lightning flash mechanic from EncounterDesign.md
       - Recall prompts during lightning illumination (brief visibility windows)
       - Health bar (ship durability)
       - Tuning knobs: flash duration, dark interval, number of prompts

M2-4.  Scoring system (full implementation)
       - Base points + speed bonus + combo multiplier (from ScoringAndProgression.md)
       - Per-island grade calculation (S/A/B/C/D)
       - Score displayed in reward scene and on overworld chart nodes

M2-5.  Server routes (full implementation)
       - POST /api/scores: Accept, validate checksum, save to SQLite
       - GET /api/scores: Leaderboard query (top 10 + player rank)
       - POST /api/progress: Save island_progress + concept_mastery
       - GET /api/progress: Load player state
       - POST /api/events: Accept telemetry batch
       - Zod validation on all endpoints (from docs/SECURITY.md)
       - Rate limiting active

M2-6.  Leaderboard scene
       - src/scenes/leaderboard-scene.ts
         * Per-island board (toggleable)
         * Top 10 entries + player's own rank highlighted
         * Accessible from reward scene and menu

M2-7.  Ship upgrade: Reinforced Mast
       - Auto-awarded after Island 1 completion
       - Visual change on overworld ship sprite
       - 1.2x sail speed effect

M2-8.  Offline support
       - src/persistence/local-store.ts: Full offline queue implementation
       - Queue drain on reconnect
       - Conflict resolution: server wins for scores, client wins for progress
       - Works per docs/RELIABILITY.md

M2-9.  Tests
       - unit/systems/scoring.test.ts (base, speed, combo, grade)
       - unit/server/routes.test.ts (score validation, checksum, rate limit)
       - integration/overworld-to-island.test.ts
       - integration/score-persistence.test.ts
       - e2e/two-island-playthrough.spec.ts
```

**M2 VALIDATION GATE:**
```
☐ Complete flow: Menu → Overworld → Island 1 → Fog → Reward → Sail → Island 2 → Storm → Reward → Leaderboard
☐ Overworld shows fog-of-war; Island 2 appears after Island 1 chart fragment
☐ Storm encounter works with lightning flash mechanic
☐ Scores persist in SQLite; survive app restart
☐ Leaderboard shows top 10 + player rank
☐ Ship upgrade visual change visible on overworld
☐ Offline: play works without server; scores queue and sync on reconnect
☐ Touch and keyboard parity across all new scenes
☐ npm test → all pass (≥40 unit, ≥5 integration)
☐ npm run test:e2e → 2-island E2E passes
☐ Update docs/PLANS.md and docs/QUALITY_SCORE.md
☐ git commit -m "feat: M2 — overworld, Island 2, storm, scoring, persistence"
```

---

### PHASE 3: M3 — Full Game

**Read first:** `Design/EncounterDesign.md` (Battle, Ruins, Squid), `Design/ConceptCurriculum.md` (Tier 2+3), `Design/Characters.md` (Null, Kraken), `Design/NarrativeStructure.md`, `Design/ShipUpgrades.md` (all)

**Build in this order:**

```
M3-1.  Islands 3–5 content
       - Island 3 (Coral Maze): Overfitting, Underfitting, Training vs Testing
         * Landmarks: barnacle chest, blank map, twin nets
       - Island 4 (Storm Bastion): Reinforcement, Reward Function, Agent
         * Landmarks: reward bell, treasure scale, crow's nest parrot
       - Island 5 (Kraken's Reach): Neural Network, Gradient Descent, Generalization
         * Landmarks: rigging web, anchor winch, master key
       - Each island: tile map, sprites, audio layers, layout JSON

M3-2.  Rival Pirate Battle encounter (Island 3)
       - Captain Null appears
       - 3-volley cannon duel: player recalls concept → cannon fires
       - Null's ship sprite + attack animations
       - Winner determined by recall accuracy

M3-3.  Ruins Exploration encounter (Island 4)
       - Concept-chain sequential puzzles
       - Player must recall concepts in prerequisite order
       - Ancient pictographic clues (environmental, no text)

M3-4.  Giant Squid Boss encounter (Island 5)
       - Cross-island cumulative recall (concepts from ALL islands)
       - 5–8 tentacles, each asks one recall prompt
       - Tentacles color-coded by island of origin
       - Health bar for Kraken
       - Kraken eye + tentacle sprites + attack animations
       - Dead Reckoner bonus: defeat first-attempt clean → 2000 points

M3-5.  All ship upgrades
       - Enchanted Cannon (Island 2): +1 battle error tolerance
       - Ironclad Hull (Island 3): +1 storm resistance
       - Golden Compass (Island 4): +2s recall window
       - Ghostlight Lantern (Island 5): unlocks secret island route

M3-6.  Narrative moments
       - Overworld sighting: Null's ship on horizon (after Island 2)
       - Overworld sighting: Kraken tentacle in water (after Island 4)
       - Act breaks per NarrativeStructure.md

M3-7.  Secret Island (Hidden Reef)
       - Unlocked only if all 5 expert bonuses earned
       - Remixed encounters using concepts from all islands
       - Golden Chart assembly animation on completion

M3-8.  Full leaderboard
       - 4 boards: per-island, total, speed run, accuracy
       - Total score calculated across all islands

M3-9.  Full audio
       - 5 island themes (each with adaptive layers)
       - Overworld sailing theme
       - Boss encounter theme (Kraken)
       - Null's battle theme
       - All SFX from AudioDirection.md catalog

M3-10. Performance validation
       - Test on mobile viewport (Chrome DevTools device mode)
       - Verify ≤3s time to interactive
       - Verify stable frame pacing (no sustained >33ms frames)
       - Lazy-load island assets (only current + next island)

M3-11. Tests
       - Unit tests for all 5 encounter types
       - Integration test: full 5-island playthrough
       - E2E: boot → play all 5 islands → defeat Kraken → credits
```

**M3 VALIDATION GATE:**
```
☐ All 5 islands playable with unique encounters
☐ All 15 AI/ML concepts placed and recallable
☐ Giant Squid Boss works with cross-island recall
☐ Captain Null appears in battle and overworld sightings
☐ All 5 ship upgrades awarded and affect gameplay
☐ Secret Island accessible with all expert bonuses
☐ Full leaderboard (4 boards) functional
☐ Music adapts per island and encounter
☐ Performance: ≤3s load, stable 60fps on mobile viewport
☐ npm test → all pass (≥80 unit, ≥10 integration)
☐ npm run test:e2e → full game E2E passes
☐ Update docs/PLANS.md and docs/QUALITY_SCORE.md
☐ git commit -m "feat: M3 — full game, all islands, boss, encounters, progression"
```

---

### PHASE 4: M4 — Polish + Ship

**Read first:** `Knowledge/accessibility/inclusive-onboarding.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md` (acceptance tests), `Design/ContentPipeline.md`

**Build in this order:**

```
M4-1.  Accessibility
       - Reduced motion toggle (disable particles, screen shake)
       - High contrast mode (boost all colors to WCAG AA)
       - Independent audio sliders (music, SFX, master) + full mute
       - Visual-only mode (no audio required for gameplay)
       - Keyboard navigation for all menus

M4-2.  Concept Journal
       - Accessible from pause menu
       - Shows all discovered concepts with mastery level icons
       - Discovered (dim) → Placed (normal) → Recalled (bright) → Mastered (gold + sparkle)
       - Browse by island or full list

M4-3.  Session recovery
       - Save session state at phase transitions (per docs/RELIABILITY.md)
       - "Resume" option on menu if crashed mid-island
       - Auto-discard saves older than 1 hour

M4-4.  Error handling hardening
       - Global error boundary (per docs/RELIABILITY.md)
       - Missing asset fallbacks (colored rectangles, silence)
       - State machine recovery (undefined state → menu)
       - Loading timeouts (10s per asset)

M4-5.  Polish pass
       - Smooth transitions between scenes (fade in/out)
       - Particle effects (fog edge, sparkle on place, victory confetti)
       - Camera shake on fail (subtle, 3 frames)
       - Score counter animation (counting up)
       - Grade reveal animation (stamp effect)

M4-6.  Deployment
       - GitHub Actions CI pipeline (from docs/DEPLOYMENT.md)
       - Build + test + deploy workflow
       - Health check endpoint: GET /api/health
       - Asset caching headers configured
       - Production CORS configured
       - Deploy to Railway/Render/Fly.io
       - Verify deployed URL loads and plays

M4-7.  Final testing
       - Run full test suite: npm test && npm run test:e2e
       - Simulated agent tests (from docs/TESTING.md):
         * Random tap agent (1000 taps, no crash)
         * Idle agent (never acts, timeout handled)
         * Perfect play agent (max score achieved)
         * Always-wrong agent (novice assist triggers)
       - Manual acceptance tests:
         * No-text comprehension check
         * Dual-input parity
         * Cognitive load ≤3 concepts
         * Retry ≤5s
         * Quit rate <10%

M4-8.  Documentation cleanup
       - Update all docs/PLANS.md tasks to completed
       - Update docs/QUALITY_SCORE.md with final grades (target: mostly A)
       - Verify AGENTS.md links are all valid
       - Verify ARCHITECTURE.md matches actual folder structure
```

**M4 FINAL VALIDATION GATE — THE GAME IS DONE WHEN ALL PASS:**
```
☐ Full game playable at deployed URL on phone (Chrome mobile) and PC (Chrome desktop)
☐ All 5 islands + secret island completable
☐ All 15 AI/ML concepts teach through place/recall (no text quizzes)
☐ All 5 encounter types work
☐ Giant Squid Boss beatable
☐ Leaderboard persists scores across sessions
☐ Offline play works; scores sync on reconnect
☐ Accessibility options all functional
☐ Concept Journal browsable with mastery levels
☐ Touch and keyboard parity (±20% completion time)
☐ Retry latency ≤5s everywhere
☐ Time to interactive ≤3s on mobile
☐ Stable 60fps (no sustained long frames)
☐ npm test → ALL pass
☐ npm run test:e2e → ALL pass
☐ npm run lint → zero errors
☐ npm run build → clean production build
☐ Deployed URL accessible and healthy (/api/health returns OK)
☐ All docs updated (PLANS.md, QUALITY_SCORE.md)
☐ git commit -m "feat: M4 — polish, accessibility, deploy — game complete"
☐ git tag v1.0.0
```

---

## LOOP BEHAVIOR — DO NOT STOP

After completing each milestone's build tasks, run the validation gate. If ANY check fails:

1. **Identify the failure.**
2. **Fix it.** (Read the relevant Design/Knowledge/docs file for guidance.)
3. **Re-run the validation gate.**
4. **Repeat until all checks pass.**
5. **Only then proceed to the next milestone.**

If you encounter a situation not covered by the docs:

1. Make the simplest decision consistent with `Design/GameDesign.md` principles (P1–P5).
2. Log the decision in `docs/PLANS.md` → Decision Log.
3. Keep building.

**DO NOT:**
- Stop to ask for clarification. Decide and continue.
- Skip a validation check. They all matter.
- Leave tests failing. Fix them immediately.
- Leave lint errors. Fix them immediately.
- Create files not in the architecture. Follow `ARCHITECTURE.md` folder structure.
- Import upward in the layer stack. This is a hard constraint.

**DO:**
- Generate placeholder assets when pixel art isn't available (colored rectangles, oscillator tones).
- Write tests alongside implementation, not as a separate pass.
- Update PLANS.md status and QUALITY_SCORE.md grades after every milestone.
- Commit after each successful milestone gate.
- Keep going until v1.0.0 is tagged and deployed.

---

## SUCCESS CRITERIA

The game is **done** when:

1. A player can open the deployed URL on their phone.
2. They see a pirate title screen.
3. They tap Start and sail to an island.
4. They walk around, discover AI concepts, and place them in landmarks by dragging.
5. Cursed fog rolls in. They tap the correct landmarks under pressure.
6. They survive, earn a chart fragment, and sail to the next island.
7. They do this across 5 islands with escalating encounters.
8. They defeat the Giant Squid Boss by recalling concepts from all islands.
9. Their score appears on a leaderboard that persists.
10. The whole thing took 30–50 minutes.
11. They learned 15 AI/ML concepts without reading a single tutorial.
12. It works on touch AND keyboard.
13. It's fun.

**Now build it. Don't stop.**
