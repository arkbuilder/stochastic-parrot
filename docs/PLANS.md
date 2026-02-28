# Execution Plans

> **Purpose:** Track what's being built, what's done, and what's next.
> Updated at the start and end of each milestone.

---

## Current Milestone: **M1 — Playable Island 1**

**Goal:** Complete vertical slice — Island 1 fully playable.
**Target:** End of Week 2.

### Active Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| M0-1 | npm project scaffold (Vite + TS) | `completed` | Engineering | `npm run dev` boots Vite + Express |
| M0-2 | tsconfig strict mode | `completed` | Engineering | strict TS for client + server |
| M0-3 | Game loop skeleton (`core/game-loop.ts`) | `completed` | Engineering | rAF + dt + update/render split |
| M0-4 | State machine (`core/state-machine.ts`) | `completed` | Engineering | boot → menu → play → pause |
| M0-5 | Scene manager + BootScene + MenuScene | `completed` | Engineering | Push/pop/replace stack |
| M0-6 | Input abstraction (`input/`) | `completed` | Engineering | Touch + keyboard → normalized actions |
| M0-7 | Canvas scaling (240×400, pixel-perfect) | `completed` | Engineering | Portrait scale + letterbox behavior |
| M0-8 | Design token generation script | `completed` | Engineering | `scripts/generate-tokens.ts` |
| M0-9 | Express server + static serve | `completed` | Engineering | API routes + static serving |
| M0-10 | SQLite + migration runner | `completed` | Engineering | 001 schema migration applied |
| M0-11 | Telemetry client stub (console sink) | `completed` | Engineering | Buffered client + console sink |
| M0-12 | Vitest setup + first test | `completed` | Engineering | 11 passing unit tests |

### M0 Definition of Done

- [x] `npm run dev` starts Vite + Express with canvas bootstrap and menu scene rendering path
- [x] State machine transitions: boot → menu → play (logged)
- [x] Touch tap and keyboard press both produce `primary` InputAction
- [x] `npm run db:migrate` creates all tables from `001_init.sql`
- [x] `npm test` passes with ≥1 test
- [x] Design tokens importable as TS constants

---

## Upcoming: M1 — Playable Island 1

**Goal:** Complete vertical slice — Island 1 fully playable.
**Target:** End of Week 2.
**Full scope:** See `Design/ScopeAndMilestones.md` §M1.

### Key Deliverables (Preview)

- Island 1 tile map + 3 landmarks rendered
- Nemo + Bit sprites with walk/place animations
- Concept card tray + drag-to-place encode interaction
- Cursed Fog encounter (3 recall prompts)
- Novice assist (Bit flies to landmark)
- Chart Fragment reward overlay
- Core SFX + adaptive music (Island 1)
- Full telemetry events firing
- Playtest: 5 testers pass no-text comprehension

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

Record decisions that affect architecture, scope, or schedule here. Keep entries short.
