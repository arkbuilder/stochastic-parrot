# Quality Score

> **Purpose:** Grade the quality of each architectural domain and game feature. Updated after each milestone.
> Inspired by the OpenAI Harness Engineering quality grading approach.

---

## Grading Scale

| Grade | Meaning |
|---|---|
| **A** | Production-ready. Tests pass, perf met, telemetry wired, acceptance criteria validated. |
| **B** | Functional. Works correctly but missing tests, telemetry, or polish. |
| **C** | Partial. Core logic exists but incomplete, untested, or has known bugs. |
| **D** | Stub. Placeholder or scaffolding only. |
| **—** | Not started. |

---

## Domain Grades

### Core Infrastructure

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Game loop (`core/game-loop.ts`) | B | rAF loop wired with poll/update/render/present | B |
| State machine (`core/state-machine.ts`) | B | Transition guard + transition records + tests | A |
| Scene manager (`core/scene-manager.ts`) | B | Stack push/pop/replace lifecycle implemented | B |
| Clock / timing (`core/clock.ts`) | A | Pause-aware dt + reset behavior with tests | B |

### Input

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Touch provider | B | Pointer primary/drag/secondary events normalized | B |
| Keyboard provider | B | WASD/arrows + Enter/Space/Escape mapping | B |
| Input manager (unified) | B | Provider aggregation and normalized poll API | A |
| Coordinate normalization | A | Screen→game mapping validated in unit test | A |

### Rendering

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Canvas setup + scaling | B | 240×400 portrait scaling + pixel-perfect rendering | A |
| Sprite sheet loader | — | Not started | B |
| Tile map renderer | — | Not started | B |
| HUD overlay | — | Not started | C |
| Particle effects | — | Not started | D |

### Audio

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Audio manager | — | Not started | C |
| Music layer engine | — | Not started | D |
| SFX playback | — | Not started | B |

### Game Systems

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Encode system (drag + place) | — | Not started | A |
| Recall system (prompt + validate) | — | Not started | A |
| Threat system (fog advancement) | — | Not started | B |
| Movement system | — | Not started | B |
| Animation system | — | Not started | C |
| Camera system | — | Not started | C |

### Scenes

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Boot scene | B | Loading placeholder + auto transition hook | B |
| Menu scene | B | Start interaction on touch/mouse/keyboard primary | B |
| Island scene | — | Not started | A |
| Encounter scene | — | Not started | A |
| Reward scene | — | Not started | B |
| Overworld scene | — | Not started (M2) | — |
| Leaderboard scene | — | Not started (M2) | — |

### Data & Content

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Concept definitions | A | All 15 canonical concepts included with islands/landmarks | A |
| Island 1 config | B | Island config scaffolded with landmark coordinates | A |
| Encounter templates | B | 5 encounter templates with tuning knobs | B |
| Recall prompts (Island 1) | B | Prompt set seeded from curriculum mappings | A |

### Persistence

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| SQLite schema + migrations | A | Full `001_init.sql` + migration runner validated | A |
| Express server | B | API bootstrapped with JSON + static serving + health | B |
| Score API | C | Basic GET/POST route implemented; checksum enforcement pending | — |
| Progress API | B | GET/POST upsert flow implemented with schema validation | B |
| Telemetry API | B | Batch ingest route with persisted event log | C |

### Telemetry

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Event definitions | A | M0+CoreInteraction event constants defined | A |
| Telemetry client | B | Buffered emit/flush pipeline implemented | B |
| Console sink (dev) | B | Batch logging sink active in development | B |
| Server sink | B | `/api/events` route persists telemetry batches | — |

### Testing

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Unit tests | B | 11 tests across core/input/data all passing | B (≥20 tests) |
| Integration tests | — | Not started | C (≥5 tests) |
| E2E tests | — | Not started | D (≥1 test) |

---

## Summary

| Category | Current Avg | M1 Target | M2 Target |
|---|---|---|---|
| Core Infrastructure | B | B+ | A |
| Input | B+ | A | A |
| Rendering | C | B | A |
| Audio | — | C+ | B |
| Game Systems | — | B+ | A |
| Scenes | C | B+ | A |
| Data & Content | B+ | A | A |
| Persistence | B | B | A |
| Telemetry | B | B | A |
| Testing | C+ | C+ | B |

---

## Update Cadence

- Update grades at the **end of each milestone**.
- When promoting a grade, cite the evidence (e.g., "tests pass", "playtest validated", "perf budget met").
- When a grade drops, log the reason in the Notes column and add a tech debt entry in `docs/PLANS.md`.
