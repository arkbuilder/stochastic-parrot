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
| Sprite sheet loader | B | Atlas loader + frame animation fallback rendering implemented | B |
| Tile map renderer | B | Island layout JSON renderer with camera offset support | B |
| HUD overlay | B | Minimap/tray/timer/health/attempt indicators rendered per phase | C |
| Particle effects | B | Fog edge + concept lock-in sparkle particles implemented | D |

### Audio

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Audio manager | B | Web Audio mixer with master/music/sfx controls + mute | C |
| Music layer engine | B | Base/rhythm/tension/resolution crossfades (500ms) | D |
| SFX playback | B | Runtime oscillator SFX for encode/recall/fog/reward cues | B |

### Game Systems

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Encode system (drag + place) | A | Snap radius + lock-in + placement validation with tests | A |
| Recall system (prompt + validate) | A | Prompt progression, scoring multipliers, timeout handling with tests | A |
| Threat system (fog advancement) | A | Fog advancement + pushback + fail/retry support with tests | B |
| Movement system | B | Touch/keyboard-driven movement + parrot follow behavior | B |
| Animation system | B | Entity animation/glow/lock timers updated per tick | C |
| Camera system | C | Follow/clamp helper implemented; full scene integration pending | C |

### Scenes

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Boot scene | B | Loading placeholder + auto transition hook | B |
| Menu scene | B | Start interaction on touch/mouse/keyboard primary | B |
| Island scene | A | Full encode loop with concept unlock + threat trigger + telemetry/audio wiring | A |
| Encounter scene | A | Cursed Fog recall loop with assist/retry/scoring + resolution | A |
| Reward scene | B | Score/grade/chart fragment summary + continue progression | B |
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
| Telemetry client | A | Scene-level onboarding/core event emission and buffered flush wired | B |
| Console sink (dev) | B | Batch logging sink active in development | B |
| Server sink | B | `/api/events` route persists telemetry batches | — |

### Testing

| Domain | Grade | Notes | Target (M1) |
|---|---|---|---|
| Unit tests | A | 22 unit tests across core/input/data/systems passing | B (≥20 tests) |
| Integration tests | B | Encode→recall→reward integration flow test passing | C (≥5 tests) |
| E2E tests | B | Island 1 playthrough scene path test passing in Playwright | D (≥1 test) |

---

## Summary

| Category | Current Avg | M1 Target | M2 Target |
|---|---|---|---|
| Core Infrastructure | B | B+ | A |
| Input | B+ | A | A |
| Rendering | B | B | A |
| Audio | B | C+ | B |
| Game Systems | B+ | B+ | A |
| Scenes | A- | B+ | A |
| Data & Content | B+ | A | A |
| Persistence | B | B | A |
| Telemetry | A- | B | A |
| Testing | B+ | C+ | B |

---

## Update Cadence

- Update grades at the **end of each milestone**.
- When promoting a grade, cite the evidence (e.g., "tests pass", "playtest validated", "perf budget met").
- When a grade drops, log the reason in the Notes column and add a tech debt entry in `docs/PLANS.md`.
