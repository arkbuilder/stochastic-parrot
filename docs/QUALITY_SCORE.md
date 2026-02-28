# Quality Score

> **Purpose:** Grade the quality of each architectural domain and game feature. Updated after each milestone.

---

## Grading Scale

| Grade | Meaning |
|---|---|
| **A** | Production-ready for current milestone scope. |
| **B** | Functional and stable, with minor polish gaps. |
| **C** | Partial implementation or limited validation. |
| **D** | Stub or placeholder only. |
| **—** | Not started. |

---

## Domain Grades (Post-M2)

### Core Infrastructure

| Domain | Grade | Notes |
|---|---|---|
| Game loop (`core/game-loop.ts`) | A- | Stable frame/update loop through multi-scene flows |
| State machine (`core/state-machine.ts`) | B+ | Transition guard correctness validated; still coarse state granularity |
| Scene manager (`core/scene-manager.ts`) | A- | Handles menu/overworld/island/encounter/reward/leaderboard transitions |
| Clock / timing (`core/clock.ts`) | A | Deterministic timing and pause behavior covered by tests |

### Input

| Domain | Grade | Notes |
|---|---|---|
| Touch provider | A- | Core interactions and scene controls work in e2e |
| Keyboard provider | B+ | Primary interaction parity retained; deeper scene shortcuts pending |
| Input manager | A | Normalization remains stable across new scenes |
| Coordinate normalization | A | Canvas-scale translation validated by unit and e2e behavior |

### Rendering

| Domain | Grade | Notes |
|---|---|---|
| Canvas setup + scaling | A- | Portrait-first render path stable across all M2 scenes |
| Sprite/tile pipeline | B+ | Placeholder assets for Island 2 integrated and loading |
| HUD overlays | B+ | Overworld/status + encounter HUDs are functional |
| Particles/effects | B | Fog/sparkle effects active; storm visuals still lightweight |

### Audio

| Domain | Grade | Notes |
|---|---|---|
| Audio manager | B+ | Scene-aware layer transitions stay stable |
| Music layers | B+ | Overworld/encounter/reward transitions wired |
| SFX playback | B+ | Recall/fog/storm feedback and reward cues active |

### Game Systems

| Domain | Grade | Notes |
|---|---|---|
| Encode system | A | Stable, tested, and reused for Island 2 |
| Recall system | A | Prompt scoring model aligned to spec and tested |
| Threat system | B+ | Fog + storm pressure behaviors integrated |
| Scoring system | A- | Base/speed/combo + grade helpers covered by tests |
| Camera/movement/animation | B | Functional for current slice; richer encounter framing pending |

### Scenes

| Domain | Grade | Notes |
|---|---|---|
| Boot + Menu | B+ | Stable entry flow and leaderboard access |
| Overworld | A- | Node sailing + fog-of-war + route progression complete for 2 islands |
| Island scene | A | Generic island scene now supports island-specific content/layout |
| Encounter scene | A- | Fog + storm implementations with assists and score telemetry |
| Reward scene | B+ | Summary and progression routing complete |
| Leaderboard scene | B+ | Toggleable per-island board with player rank display |

### Data & Content

| Domain | Grade | Notes |
|---|---|---|
| Concept definitions | A | Full 15 concept catalog intact |
| Island configs (1–2 active) | A- | Island 2 progression and storm mapping complete |
| Encounter templates | A- | Template-driven timing for fog/storm integrated |
| Upgrade data | B+ | Reinforced Mast progression aligned to M2 flow |

### Persistence & Security

| Domain | Grade | Notes |
|---|---|---|
| SQLite schema + migrations | A | Migration and schema remain stable |
| Score API | A- | Checksum + envelope checks + leaderboard query/rank implemented |
| Progress API | A- | Upsert with client-wins conflict policy and player upsert |
| Telemetry API | B+ | Batch ingest and FK-safe session/player fallback |
| Offline queue handling | B+ | Retry + drain + cache path implemented; broader conflict telemetry pending |

### Testing

| Domain | Grade | Notes |
|---|---|---|
| Unit tests | A- | Expanded coverage with scoring + server validation tests |
| Integration tests | B+ | Added overworld travel and persistence queue integration |
| E2E tests | A- | Island 1 and two-island flow both passing in Playwright |

---

## Summary

| Category | Current Avg | M3 Target |
|---|---|---|
| Core Infrastructure | A- | A |
| Input | A- | A |
| Rendering | B+ | A- |
| Audio | B+ | A- |
| Game Systems | A- | A |
| Scenes | A- | A |
| Data & Content | A- | A |
| Persistence & Security | A- | A |
| Testing | A- | A |

---

## Update Cadence

- Update grades at the end of each milestone.
- Promote grades only with validation evidence (lint/test/build/e2e, playability checks, persistence behavior).
- Log degradations as technical debt in `docs/PLANS.md`.
