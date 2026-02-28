# Execution Plans

> **Purpose:** Track what's being built, what's done, and what's next.
> Updated at the start and end of each milestone.

---

## Current Milestone: **M0 — Foundation**

**Goal:** Project bootstrapped, architecture validated, first screen renders.
**Target:** End of Week 1.

### Active Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| M0-1 | npm project scaffold (Vite + TS) | `not-started` | Engineering | `npm run dev` shows canvas |
| M0-2 | tsconfig strict mode | `not-started` | Engineering | |
| M0-3 | Game loop skeleton (`core/game-loop.ts`) | `not-started` | Engineering | rAF + dt + update/render split |
| M0-4 | State machine (`core/state-machine.ts`) | `not-started` | Engineering | boot → menu → play → pause |
| M0-5 | Scene manager + BootScene + MenuScene | `not-started` | Engineering | Push/pop/replace stack |
| M0-6 | Input abstraction (`input/`) | `not-started` | Engineering | Touch + keyboard → normalized actions |
| M0-7 | Canvas scaling (240×400, pixel-perfect) | `not-started` | Engineering | See docs/FRONTEND.md |
| M0-8 | Design token generation script | `not-started` | Engineering | Aesthetic.md → tokens.ts |
| M0-9 | Express server + static serve | `not-started` | Engineering | |
| M0-10 | SQLite + migration runner | `not-started` | Engineering | 001_init.sql runs clean |
| M0-11 | Telemetry client stub (console sink) | `not-started` | Engineering | Events log to console |
| M0-12 | Vitest setup + first test | `not-started` | Engineering | state-machine.test.ts |

### M0 Definition of Done

- [ ] `npm run dev` opens browser with a 240×400 canvas showing a menu screen
- [ ] State machine transitions: boot → menu → play (logged)
- [ ] Touch tap and keyboard press both produce `primary` InputAction
- [ ] `npm run db:migrate` creates all tables from `001_init.sql`
- [ ] `npm test` passes with ≥1 test
- [ ] Design tokens importable as TS constants

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

*None yet.*

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
| — | Project initialized | Starting M0 | — |

Record decisions that affect architecture, scope, or schedule here. Keep entries short.
