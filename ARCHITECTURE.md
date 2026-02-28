# Architecture — Dead Reckoning: Memory Sea

> **Purpose:** Top-level map of the codebase for human engineers and coding agents.
> Read this first. It tells you where things live, how they connect, and what you may not do.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | **TypeScript** (strict mode) | Type safety, agent legibility, ecosystem |
| Bundler | **Vite** | Fast HMR, ESM-native, simple config |
| Rendering | **HTML Canvas 2D** | Pixel art, no WebGL complexity, wide device support |
| Audio | **Web Audio API** (oscillators + AudioBuffer) | Chiptune synthesis, adaptive layers, small bundles |
| Persistence | **SQLite** via `better-sqlite3` (server) | Highscores, progress, event log |
| Server | **Express** (minimal) | Serve static build + REST API for persistence |
| Testing | **Vitest** + **Playwright** (E2E) | Vite-native, fast unit tests, real browser E2E |
| Package Manager | **npm** | Standard, no exotic tooling |

### Version Pins (set in `package.json`)

```
typescript    ^5.x
vite          ^6.x
vitest        ^3.x
better-sqlite3 ^11.x
express       ^4.x
playwright    ^1.x
```

---

## Repository Structure

```
week3/
├── AGENTS.md                  # Agent entry point — short TOC (~100 lines)
├── ARCHITECTURE.md            # THIS FILE — domain map + layering rules
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
│
├── Design/                    # Game design docs (source of truth for WHAT to build)
│   ├── README.md              # Index + reading order
│   ├── GameDesign.md          # Framework (GDRD, principles, telemetry spec)
│   ├── GameHook.md            # Concept one-pager
│   ├── Research.md            # Academic design theory
│   ├── Aesthetic.md           # Design tokens (arcade-midnight theme)
│   ├── CoreInteraction.md     # Place/recall mechanic spec
│   ├── OnboardingLevel.md     # Island 1 beat map
│   ├── EncounterDesign.md     # 5 encounter types
│   ├── ConceptCurriculum.md   # 15 AI/ML concepts
│   ├── IslandProgression.md   # 5-island arc
│   ├── Characters.md          # Character roster + sprites
│   ├── NarrativeStructure.md  # 3-act story
│   ├── OverworldNavigation.md # Sailing mechanics
│   ├── ShipUpgrades.md        # 5 upgrades
│   ├── InventoryAndHUD.md     # HUD zones + components
│   ├── ScoringAndProgression.md # Points, grades, leaderboard
│   ├── AudioDirection.md      # Music + SFX spec
│   ├── ContentPipeline.md     # Asset strategy + quality gates
│   └── ScopeAndMilestones.md  # M0–M4 + risks
│
├── Knowledge/                 # Agent knowledge library (HOW to build)
│   ├── README.md              # Index + retrieval order
│   └── (22 files across 8 subfolders)
│
├── docs/                      # Engineering build docs (bridge Design→Code)
│   ├── FRONTEND.md            # Canvas pipeline, scene graph, game loop
│   ├── DATABASE.md            # SQLite schema (CREATE TABLE statements)
│   ├── PLANS.md               # Active execution plan + status
│   ├── QUALITY_SCORE.md       # Quality grades per domain
│   ├── TESTING.md             # Test strategy + automation
│   ├── DEPLOYMENT.md          # Build pipeline + hosting
│   ├── RELIABILITY.md         # Error handling + offline + recovery
│   └── SECURITY.md            # Tamper protection + validation
│
├── src/                       # APPLICATION CODE
│   ├── index.html             # Entry point (canvas mount)
│   ├── main.ts                # Bootstrap: canvas init, game loop start
│   │
│   ├── core/                  # DOMAIN: Game loop + state machine
│   │   ├── game-loop.ts       # requestAnimationFrame tick (update → render)
│   │   ├── state-machine.ts   # Global FSM: boot → menu → play → pause → complete
│   │   ├── scene-manager.ts   # Scene stack (push/pop/replace)
│   │   ├── clock.ts           # Delta time, pause-aware timing
│   │   └── types.ts           # Shared core types
│   │
│   ├── input/                 # DOMAIN: Input abstraction
│   │   ├── input-manager.ts   # Unified input adapter (touch + PC)
│   │   ├── touch-provider.ts  # Touch/pointer event normalization
│   │   ├── keyboard-provider.ts # Keyboard event normalization
│   │   └── types.ts           # InputAction, InputEvent types
│   │
│   ├── scenes/                # DOMAIN: Game scenes (each is a self-contained screen)
│   │   ├── boot-scene.ts      # Asset preload, splash
│   │   ├── menu-scene.ts      # Title screen, start button
│   │   ├── island-scene.ts    # Island exploration + encode + recall phases
│   │   ├── overworld-scene.ts # Sea chart sailing between islands
│   │   ├── encounter-scene.ts # Threat encounter (fog, storm, battle, ruins, squid)
│   │   ├── reward-scene.ts    # Chart fragment award + summary
│   │   ├── leaderboard-scene.ts # Score display
│   │   └── types.ts           # Scene interface
│   │
│   ├── entities/              # DOMAIN: Game objects
│   │   ├── player.ts          # Captain Nemo — position, animations, state
│   │   ├── parrot.ts          # Bit — novice assist, follows player
│   │   ├── landmark.ts        # Placeable landmark (dock, chart table, cannon, etc.)
│   │   ├── concept-card.ts    # Draggable concept (Training Data, Model, etc.)
│   │   ├── threat.ts          # Advancing fog/storm/enemy base class
│   │   └── types.ts           # Entity interface, position, bounds
│   │
│   ├── systems/               # DOMAIN: ECS-lite systems (operate on entities per tick)
│   │   ├── movement-system.ts # Position updates, collision
│   │   ├── encode-system.ts   # Drag logic, snap zones, lock-in
│   │   ├── recall-system.ts   # Prompt display, answer validation, timer
│   │   ├── threat-system.ts   # Threat advancement, health, resolution
│   │   ├── animation-system.ts # Sprite frame stepping
│   │   └── camera-system.ts   # Viewport scrolling, portrait framing
│   │
│   ├── rendering/             # DOMAIN: Canvas draw pipeline
│   │   ├── renderer.ts        # Main canvas context, clear/draw/present
│   │   ├── sprite-sheet.ts    # Sprite atlas loading + frame lookup
│   │   ├── tile-map.ts        # Tile-based island rendering
│   │   ├── hud.ts             # HUD overlay (health, timer, concept tray)
│   │   ├── particles.ts       # Lightweight particle effects (sparkles, fog)
│   │   └── tokens.ts          # Design token constants from Aesthetic.md
│   │
│   ├── audio/                 # DOMAIN: Sound engine
│   │   ├── audio-manager.ts   # Master mixer, volume sliders, mute
│   │   ├── music-layer.ts     # Adaptive layer crossfade engine
│   │   ├── sfx.ts             # One-shot SFX playback
│   │   └── types.ts           # AudioEvent enum
│   │
│   ├── data/                  # DOMAIN: Game content (static data, NOT code)
│   │   ├── concepts.ts        # 15 AI/ML concept definitions
│   │   ├── islands.ts         # Island configs (landmarks, concepts, threats)
│   │   ├── encounters.ts      # Encounter templates + tuning knobs
│   │   ├── upgrades.ts        # Ship upgrade definitions
│   │   └── prompts.ts         # Recall prompt definitions (icon riddles)
│   │
│   ├── persistence/           # DOMAIN: Server communication + state
│   │   ├── api-client.ts      # REST client (scores, progress, events)
│   │   ├── local-store.ts     # localStorage fallback for offline
│   │   └── types.ts           # API request/response types
│   │
│   ├── telemetry/             # DOMAIN: Event logging
│   │   ├── telemetry-client.ts # Event dispatch (buffered, async)
│   │   ├── events.ts          # Event name constants + payload types
│   │   └── console-sink.ts    # Dev: log events to console
│   │
│   └── utils/                 # Cross-cutting utilities
│       ├── math.ts            # Clamp, lerp, distance
│       ├── random.ts          # Seeded RNG for deterministic replays
│       └── timer.ts           # Countdown/stopwatch helpers
│
├── server/                    # BACKEND (Express + SQLite)
│   ├── index.ts               # Server bootstrap (Express + static serve)
│   ├── routes/
│   │   ├── scores.ts          # POST/GET /api/scores
│   │   ├── progress.ts        # POST/GET /api/progress
│   │   └── events.ts          # POST /api/events (telemetry sink)
│   ├── db/
│   │   ├── connection.ts      # SQLite connection factory
│   │   ├── migrate.ts         # Migration runner
│   │   └── migrations/        # Numbered SQL migration files
│   │       ├── 001_init.sql
│   │       └── ...
│   └── middleware/
│       ├── validate.ts        # Request schema validation
│       └── rate-limit.ts      # Per-device rate limiting
│
├── assets/                    # STATIC ASSETS (checked in or generated)
│   ├── sprites/               # Sprite sheets (PNG)
│   ├── tiles/                 # Tile sets (PNG)
│   ├── audio/                 # Music + SFX (OGG/WAV)
│   └── layouts/               # Island layout JSON
│
├── tests/                     # TEST CODE
│   ├── unit/                  # Vitest unit tests (mirror src/ structure)
│   ├── integration/           # Multi-module tests
│   └── e2e/                   # Playwright browser tests
│
└── scripts/                   # BUILD + DEV TOOLING
    ├── generate-tokens.ts     # Parse Aesthetic.md → CSS/TS token file
    └── seed-db.ts             # Seed SQLite with test data
```

---

## Layered Domain Architecture

Dependency flows **downward only**. No layer may import from a layer above it.

```
┌─────────────────────────────────────────────┐
│                 scenes/                      │  ← Top: orchestrates everything
├─────────────────────────────────────────────┤
│                 systems/                     │  ← Game logic (encode, recall, threat)
├─────────────────────────────────────────────┤
│                 entities/                    │  ← Game objects (player, landmark, card)
├──────────┬──────────┬───────────┬───────────┤
│ rendering│  audio/  │persistence│ telemetry │  ← Infrastructure services
├──────────┴──────────┴───────────┴───────────┤
│                 input/                       │  ← Normalized input (touch + PC)
├─────────────────────────────────────────────┤
│                 core/                        │  ← Game loop, state machine, clock
├─────────────────────────────────────────────┤
│                 data/                        │  ← Static content definitions
├─────────────────────────────────────────────┤
│                 utils/                       │  ← Pure functions, no side effects
└─────────────────────────────────────────────┘
```

### Dependency Rules (Enforced)

| Rule | Description |
|---|---|
| **No upward imports** | `core/` cannot import from `scenes/`. `entities/` cannot import from `systems/`. |
| **No cross-domain infrastructure** | `rendering/` cannot import `audio/`. `persistence/` cannot import `telemetry/`. |
| **scenes/ is the composition layer** | Only `scenes/` may wire together systems, entities, rendering, and audio. |
| **data/ has zero dependencies** | Pure content definitions. Imports nothing from `src/`. |
| **utils/ has zero dependencies** | Pure functions. Imports nothing from `src/`. |
| **server/ is isolated** | Server code never imports from `src/`. Communication is REST only. |

### Cross-Cutting Concerns

These enter through **explicit injection**, not direct import:

| Concern | Pattern |
|---|---|
| **Telemetry** | Scenes call `telemetry.emit(event)`. Systems never import telemetry directly. |
| **Input** | Scenes poll `inputManager.getActions()` and pass actions into systems. |
| **Audio** | Scenes call `audioManager.play(event)` in response to system outputs. |
| **Persistence** | Only `leaderboard-scene.ts` and `reward-scene.ts` call the API client. |

---

## State Machine

Global game states (managed by `core/state-machine.ts`):

```
BOOT → MENU → PLAY → PAUSE → COMPLETE
              ↕              ↕
         OVERWORLD ←→ ISLAND ←→ ENCOUNTER → REWARD
```

### PLAY sub-states (island visit)

```
ISLAND_ARRIVE → EXPLORING → ENCODING → THREAT_TRIGGERED → RECALLING
                                                              ↓
                                              RECALL_SUCCESS / RECALL_FAIL
                                                      ↓              ↓
                                              ENCOUNTER_RESOLVED   RETRY (≤5s)
                                                      ↓
                                              REWARD_GRANTED → ISLAND_COMPLETE
```

Full state model specification: `Design/CoreInteraction.md` §5.

---

## Game Loop

Single `requestAnimationFrame` loop in `core/game-loop.ts`:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ pollInput │ ──→ │  update  │ ──→ │  render  │ ──→ │ present  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ↑                                                    │
     └────────────── requestAnimationFrame ───────────────┘
```

- **pollInput:** Read normalized actions from `input-manager`.
- **update:** Active scene's `update(dt, actions)` — runs systems on entities.
- **render:** Active scene's `render(ctx)` — draw to offscreen buffer.
- **present:** Blit offscreen buffer to visible canvas.

Frame budget: **16.6ms** (60 fps target). Degrade gracefully; never skip input polling.

---

## Data Flow

```
[Player Input]
      ↓
  InputManager (normalizes)
      ↓
  Active Scene (routes actions)
      ↓
  Systems (update entities, produce events)
      ↓
  ┌──────────────────────────┐
  │ Renderer (draw to canvas) │
  │ AudioManager (play sounds)│
  │ Telemetry (emit events)   │
  └──────────────────────────┘
      ↓ (on save points)
  API Client → Server → SQLite
```

---

## API Surface (Server)

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/scores` | `GET` | Leaderboard (top 10 + player rank) | None (public) |
| `/api/scores` | `POST` | Submit score | Checksum header |
| `/api/progress` | `GET` | Player progress (islands, grades) | Device ID |
| `/api/progress` | `POST` | Save progress checkpoint | Device ID |
| `/api/events` | `POST` | Telemetry event batch | None (fire-and-forget) |

Device ID = client-generated UUID stored in localStorage. Not PII.

---

## Key Design Decisions

| Decision | Chosen | Rejected Alternative | Reason |
|---|---|---|---|
| Canvas 2D over WebGL | Canvas 2D | WebGL/PixiJS | Pixel art doesn't need GPU shaders; simpler, wider support |
| ECS-lite (systems + plain objects) over full ECS | ECS-lite | bitecs/ecsy | 15 concepts, ~20 entities — full ECS is overengineering |
| Scene stack over router | Scene stack | URL router | Game scenes are not pages; push/pop fits pause/resume |
| Server-side SQLite over client IndexedDB | Server SQLite | IndexedDB | Leaderboard needs shared state; SQLite is simple and portable |
| localStorage fallback | Yes | Require server | Offline play must work; sync on reconnect |
| Monorepo (src/ + server/) | Monorepo | Separate repos | Single `npm run dev` starts everything |

---

## Performance Budget

| Metric | Target | Source |
|---|---|---|
| Time to interactive | ≤3s on mid-range mobile | `Knowledge/engineering/performance-budget-mobile.md` |
| Frame pacing | Stable 60fps, degrade gracefully | Same |
| Island asset bundle | ≤200KB sprites + ≤500KB audio | `Design/AudioDirection.md`, `Design/ContentPipeline.md` |
| Total initial download | ≤1MB (Island 1 only) | Boot scene preloads Island 1 only |
| Memory | ≤100MB heap | Sprite atlas sharing, audio sprite reuse |

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files | `kebab-case.ts` | `game-loop.ts` |
| Types/Interfaces | `PascalCase` | `IslandConfig`, `RecallAttempt` |
| Functions | `camelCase` | `pollInput()`, `resolveRecall()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_CONCEPTS_PER_ISLAND` |
| CSS tokens | `--kebab-case` | `--color-cyan-400` |
| Asset files | `snake_case` | `dock_crates_idle.png` |
| Migration files | `NNN_description.sql` | `001_init.sql` |
| Test files | `*.test.ts` | `recall-system.test.ts` |

---

## Where to Go Next

| Question | Read |
|---|---|
| What are we building? | `Design/README.md` → `Design/GameHook.md` |
| How does the core mechanic work? | `Design/CoreInteraction.md` |
| What does each domain module do? | `docs/FRONTEND.md` |
| What's the database schema? | `docs/DATABASE.md` |
| What should I build right now? | `docs/PLANS.md` |
| How do I test? | `docs/TESTING.md` |
| How do I deploy? | `docs/DEPLOYMENT.md` |
| What's the quality bar? | `docs/QUALITY_SCORE.md` |
| How does the agent work in this repo? | `AGENTS.md` |
