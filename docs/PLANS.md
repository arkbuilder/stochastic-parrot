# Execution Plans

> **Purpose:** Track what's being built, what's done, and what's next.
> Updated at the start and end of each milestone.

---

## Current Milestone: **M3 — Full Game**

**Goal:** Expand from 2-island slice to complete 5-island campaign with boss, progression systems, and full content.
**Target:** Weeks 4–5.

### Active Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| M2-1 | Overworld scene + node sailing | `completed` | Engineering | Added `src/scenes/overworld-scene.ts` with fog-of-war and route sailing |
| M2-2 | Island 2 content + assets | `completed` | Engineering | Added Island 2 config + placeholder layout/sprite/audio assets |
| M2-3 | Storm encounter implementation | `completed` | Engineering | Encounter scene now supports `storm` with lightning visibility windows + ship durability |
| M2-4 | Scoring + grade system depth | `completed` | Engineering | Added max prompt score helper and island score telemetry wiring |
| M2-5 | Server routes full implementation | `completed` | Engineering | Scores checksum validation, leaderboard query + rank, progress conflict policy, events FK safety |
| M2-6 | Leaderboard scene | `completed` | Engineering | Added `src/scenes/leaderboard-scene.ts` with per-island toggle and player rank |
| M2-7 | Reinforced Mast ship upgrade | `completed` | Engineering | Auto-awarded after Island 1 completion; overworld sail speed uses 1.2x |
| M2-8 | Offline queue drain + conflict behavior | `completed` | Engineering | Local queue retries and reconnect drain implemented in `local-store.ts` |
| M2-9 | Tests (unit/integration/e2e) | `completed` | Engineering | Added scoring/server/integration/two-island e2e tests |

### M2 Definition of Done

- [x] End-to-end flow works: menu → overworld → Island 1 → fog encounter → reward → sail/transition → Island 2 → storm encounter → reward → leaderboard
- [x] Island 2 reveals after Island 1 completion (fog-of-war progression)
- [x] Storm encounter implemented with lightning-window pressure
- [x] Scores and progress submission paths persist through server endpoints (with checksum validation)
- [x] Leaderboard shows top 10 + player rank
- [x] Reinforced Mast upgrade visible/effective in overworld sail timing
- [x] Offline queue drain implemented and reconnect sync path active
- [x] `npm run lint` passes clean
- [x] `npm test` passes (32 tests)
- [x] `npm run build` passes
- [x] `npm run test:e2e` passes (2 Playwright flows)

---

## Upcoming: M3 — Full Game

**Target:** Weeks 4–5.
**Full scope:** `Design/ScopeAndMilestones.md` §M3.

### Key Deliverables (Preview)

- Islands 3–5 with distinct encounters and assets
- Rival Pirate battle, Ruins puzzle chain, and Giant Squid boss
- Full ship upgrade schedule and narrative sightings
- Multi-board leaderboard (island/total/speed/accuracy)
- Full-game progression, balancing, and performance validation

---

## Upcoming: M4 — Polish + Ship

**Target:** Week 6.
**Full scope:** `Design/ScopeAndMilestones.md` §M4.

---

## Completed Milestones

- **M0 — Foundation** (completed 2026-02-27)
- **M1 — Playable Island 1** (completed 2026-02-27)
- **M2 — Overworld + Island 2** (completed 2026-02-27)

---

## Technical Debt Tracker

| ID | Description | Severity | Added | Resolved |
|---|---|---|---|---|
| — | No active debt | — | — | — |

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
| 2026-02-27 | Apply score checksum parity in client+server using shared algorithm shape | Prevent casual score tampering while keeping competition-scope complexity low | Omit integrity checks, or add full authenticated score service |
| 2026-02-27 | Add deterministic overworld travel debug hook for Island 2 e2e | Canvas click timing on node selection was flaky under parallel Playwright workers | Increase E2E timeout, repeated click retries, or single-worker E2E only |

Record decisions that affect architecture, scope, or schedule here. Keep entries short.
