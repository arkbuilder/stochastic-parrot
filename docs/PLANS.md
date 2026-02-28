# Execution Plans

> Purpose: Track what is being built, what is complete, and what is next.

---

## Current Milestone: M4 — Polish + Ship

Goal: Accessibility, recovery/reliability hardening, CI/deployment, and final acceptance pass.
Target: Week 6.

### Active Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| M3-1 | Islands 3–5 content + secret island content | completed | Engineering | Added layouts/sprite/audio placeholders for islands 3–5 + hidden reef |
| M3-2 | Rival Pirate Battle encounter | completed | Engineering | Encounter mode `battle` added in `encounter-scene.ts` |
| M3-3 | Ruins Exploration encounter | completed | Engineering | Encounter mode `ruins` with chain reset behavior |
| M3-4 | Giant Squid boss encounter | completed | Engineering | Encounter mode `squid` with cross-island prompts and Dead Reckoner bonus |
| M3-5 | Ship upgrades (all) | completed | Engineering | Reinforced Mast, Enchanted Cannon, Ironclad Hull, Golden Compass, Ghostlight Lantern wired |
| M3-6 | Narrative sightings + act signals | completed | Engineering | Overworld sighting hooks for storm front, Null ship, Kraken tentacle |
| M3-7 | Secret Island route | completed | Engineering | Hidden Reef unlock via expert-bonus gate + ghostlight lantern |
| M3-8 | Full leaderboard boards | completed | Engineering | Island/total/speed/accuracy boards with rank support |
| M3-9 | Audio expansion scaffolding | completed | Engineering | Added M3 island audio placeholder packs and runtime layer routing |
| M3-10 | Performance guardrails | completed | Engineering | Continued lazy per-island layout loading and lightweight scene rendering |
| M3-11 | Tests (unit/integration/e2e) | completed | Engineering | Added full-campaign e2e and M3 data/progression tests |

### M3 Definition of Done

- [x] All five primary islands playable with unique encounter styles
- [x] Rival Pirate Battle, Ruins chain, and Giant Squid boss implemented
- [x] Cross-island squid recall and Dead Reckoner bonus path implemented
- [x] Ship upgrades affect gameplay progression and overworld presentation
- [x] Hidden Reef route unlockable through expert progression
- [x] Leaderboards support island, total, speed, and accuracy boards
- [x] `npm run lint` passes
- [x] `npm test` passes (40 tests)
- [x] `npm run build` passes
- [x] `npm run test:e2e` passes (3 scenarios including full campaign)

---

## Upcoming: M4 — Polish + Ship

Target: Week 6.
Full scope: Design/ScopeAndMilestones.md §M4.

### Key Deliverables (Preview)

- Accessibility options (reduced motion, contrast mode, audio sliders, visual-only mode)
- Session recovery and robust state/error fallback behavior
- Concept Journal and polished transitions/FX layer
- Deployment pipeline + hosted runtime validation + final acceptance checks

---

## Completed Milestones

- M0 — Foundation (completed 2026-02-27)
- M1 — Playable Island 1 (completed 2026-02-27)
- M2 — Overworld + Island 2 (completed 2026-02-27)
- M3 — Full Game Core (completed 2026-02-27)

---

## Technical Debt Tracker

| ID | Description | Severity | Added | Resolved |
|---|---|---|---|---|
| — | No active debt | — | — | — |

---

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| 2026-02-27 | Use `node:sqlite` for DB implementation in this environment | Avoid native build failures on Windows ARM + Node 24 | Pin Node/toolchain, switch to alternate native sqlite packages |
| 2026-02-27 | Keep deterministic debug hooks for scene progression in e2e | Canvas-pointer timing is flaky under parallel workers; hooks stabilize e2e | Retry-heavy pointer scripts, longer timeouts, reduce e2e scope |
| 2026-02-27 | Implement squid cross-island recall using island-origin tentacle mapping | Enables cumulative recall without introducing a second boss input system | New bespoke squid-only input scene with separate control model |
| 2026-02-27 | Unlock Hidden Reef using all-main-islands expert bonuses | Preserves expert-route intent while keeping unlock rule deterministic | Unlock solely on Island 5 completion, or gate with separate collectible counters |
| 2026-02-27 | Submit total/speed/accuracy boards on reward persistence | Keeps leaderboard boards fresh without requiring end-of-session sync jobs | Batch-submit only after final island, or server-side aggregate derivation only |
