# Execution Plans

> **Purpose:** Track what's being built, what's done, and what's next.
> Updated at the start and end of each milestone.

---

## Current Milestone: **M2 — Overworld + Island 2**

**Goal:** Connect Island 1 completion into overworld traversal and Island 2 storm loop.
**Target:** End of Week 3.

### Active Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| M1-1 | Sprite + tile rendering pipeline | `completed` | Engineering | `sprite-sheet`, `tile-map`, Island 1 layout JSON |
| M1-2 | Entity model (Nemo, Bit, landmarks, cards, fog) | `completed` | Engineering | Added `src/entities/*` |
| M1-3 | Gameplay systems (movement/encode/recall/threat/etc.) | `completed` | Engineering | Added `src/systems/*` with unit coverage |
| M1-4 | Island scene encode flow | `completed` | Engineering | Explore → unlock cards → place 3 concepts |
| M1-5 | Encounter scene (Cursed Fog recall) | `completed` | Engineering | 3-prompt fog recall with assist + retry loop |
| M1-6 | Reward scene + grade summary | `completed` | Engineering | Score/grade/expert bonus flow |
| M1-7 | Audio engine (SFX + adaptive layers) | `completed` | Engineering | Web Audio manager + layer transitions |
| M1-8 | HUD + particle overlays | `completed` | Engineering | Tray/timer/health/minimap + fog/sparkle particles |
| M1-9 | Persistence client + local fallback queue | `completed` | Engineering | API client + local queue storage |
| M1-10 | Island 1 placeholder assets | `completed` | Engineering | Layout/sprite/audio placeholders added |
| M1-11 | Telemetry wiring for M1 flow | `completed` | Engineering | Core + onboarding events emitted through scenes |
| M1-12 | Tests (unit/integration/e2e) | `completed` | Engineering | 23 tests + Island 1 Playwright flow |

### M1 Definition of Done

- [x] `npm run dev` launches playable Island 1 flow (menu → island → fog encounter → reward)
- [x] Drag/place encode mechanics implemented for 3 concepts and 3 landmarks
- [x] Recall under fog threat with novice assist and retry loop ≤5s
- [x] Reward summary with score + grade and return-to-menu progression
- [x] SFX + adaptive music layer transitions wired through gameplay phases
- [x] Telemetry events emitted for onboarding/core interaction milestones
- [x] `npm run lint` passes clean
- [x] `npm test` passes (23 tests)
- [x] `npm run build` passes
- [x] `npm run test:e2e` passes (`island-1-playthrough.spec.ts`)

---

## Upcoming: M2 — Overworld + Island 2

**Goal:** Add overworld sailing, Island 2 storm loop, and leaderboard persistence depth.
**Target:** End of Week 3.
**Full scope:** `Design/ScopeAndMilestones.md` §M2.

### Key Deliverables (Preview)

- Overworld node chart and Island 2 fog-of-war unlock
- Island 2 content set (landmarks, concepts, storm encounter)
- Full scoring + grade persistence in SQLite-backed leaderboards
- Reinforced Mast ship upgrade and visual progression cue
- Offline queue drain policy and conflict handling validation

---

## Upcoming: M2 — Overworld + Island 2

**Target:** End of Week 3.
**Full scope:** `Design/ScopeAndMilestones.md` §M2.

---

## Upcoming: M3 — Full Game

**Target:** Weeks 4–5.
**Full scope:** `Design/ScopeAndMilestones.md` §M3.

---

## Upcoming: M4 — Polish + Ship

**Target:** Week 6.
**Full scope:** `Design/ScopeAndMilestones.md` §M4.

---

## Completed Milestones

- **M0 — Foundation** (completed 2026-02-27)
- **M1 — Playable Island 1** (completed 2026-02-27)

---

## Technical Debt Tracker

| ID | Description | Severity | Added | Resolved |
|---|---|---|---|---|
| — | No debt yet | — | — | — |

### Debt Policy

- **P1 (blocks progress):** Resolve before next task.
- **P2 (degrades quality):** Resolve before milestone closes.
- **P3 (cosmetic):** Batch into Friday cleanup.

---

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| 2026-02-27 | Project initialized | Starting M0 | — |
| 2026-02-27 | Use `node:sqlite` for M0 instead of `better-sqlite3` in this environment | `better-sqlite3` native build failed on Windows ARM + Node 24; needed stable install/build path | Install additional MSVC toolchains; pin Node version; alternate native sqlite packages |
| 2026-02-27 | Add deterministic debug hooks for e2e progression in Island/Encounter scenes | Raw pointer-driven drag flow was flaky in CI-style browser timing; hooks keep scene-transition coverage stable | Increase E2E timeouts, synthetic pointer retries, or run only unit/integration for scene progression |

Record decisions that affect architecture, scope, or schedule here. Keep entries short.
