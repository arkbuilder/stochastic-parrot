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
| Game loop (`core/game-loop.ts`) | — | Not started | B |
| State machine (`core/state-machine.ts`) | — | Not started | A |
| Scene manager (`core/scene-manager.ts`) | — | Not started | B |
| Clock / timing (`core/clock.ts`) | — | Not started | B |

### Input

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Touch provider | — | Not started | B |
| Keyboard provider | — | Not started | B |
| Input manager (unified) | — | Not started | A |
| Coordinate normalization | — | Not started | A |

### Rendering

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Canvas setup + scaling | — | Not started | A |
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
| Boot scene | — | Not started | B |
| Menu scene | — | Not started | B |
| Island scene | — | Not started | A |
| Encounter scene | — | Not started | A |
| Reward scene | — | Not started | B |
| Overworld scene | — | Not started (M2) | — |
| Leaderboard scene | — | Not started (M2) | — |

### Data & Content

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Concept definitions | — | Not started | A |
| Island 1 config | — | Not started | A |
| Encounter templates | — | Not started | B |
| Recall prompts (Island 1) | — | Not started | A |

### Persistence

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| SQLite schema + migrations | — | Not started | A |
| Express server | — | Not started | B |
| Score API | — | Not started (M2) | — |
| Progress API | — | Not started | B |
| Telemetry API | — | Not started | C |

### Telemetry

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Event definitions | — | Not started | A |
| Telemetry client | — | Not started | B |
| Console sink (dev) | — | Not started | B |
| Server sink | — | Not started (M2) | — |

### Testing

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Unit tests | — | Not started | B (≥20 tests) |
| Integration tests | — | Not started | C (≥5 tests) |
| E2E tests | — | Not started | D (≥1 test) |

---

## Summary

| Category | Current Avg | M1 Target | M2 Target |
|---|---|---|---|
| Core Infrastructure | — | B+ | A |
| Input | — | A | A |
| Rendering | — | B | A |
| Audio | — | C+ | B |
| Game Systems | — | B+ | A |
| Scenes | — | B+ | A |
| Data & Content | — | A | A |
| Persistence | — | B | A |
| Telemetry | — | B | A |
| Testing | — | C+ | B |

---

## Update Cadence

- Update grades at the **end of each milestone**.
- When promoting a grade, cite the evidence (e.g., "tests pass", "playtest validated", "perf budget met").
- When a grade drops, log the reason in the Notes column and add a tech debt entry in `docs/PLANS.md`.
