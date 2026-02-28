# Execution Plans

> Purpose: Track what is built, what passed, and what remains external to this workspace.

---

## Current Milestone: M4 — Polish + Ship

Goal: Accessibility, recovery/reliability hardening, CI/deployment readiness, and final acceptance pass.
Target: Week 6.

### Active Tasks

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| M4-1 | Accessibility options | completed | Engineering | Reduced motion, high contrast mode, visual-only mode, mute toggle, master/music/sfx sliders via pause settings |
| M4-2 | Concept Journal | completed | Engineering | Pause-menu journal with mastery ladder: discovered → placed → recalled → mastered |
| M4-3 | Session recovery | completed | Engineering | Local resumable save (`encode`/`recall`) with 1-hour expiry and menu Resume CTA |
| M4-4 | Error/reliability hardening | completed | Engineering | Global error recovery, state transition recovery telemetry, 10s layout timeout fallback, perf-critical degrade path |
| M4-5 | Polish pass | completed | Engineering | Scene fade transitions, reward score count-up and grade reveal animation, reward sparkle FX |
| M4-6 | Deployment/CI setup | completed | Engineering | Added GitHub Actions CI, enriched `/api/health`, CORS + cache headers |
| M4-7 | Final testing | completed | Engineering | lint/test/build/e2e all pass (including simulated-agent e2e suite) |
| M4-8 | Documentation cleanup | completed | Engineering | M4 updates in plan + quality docs |

### M4 Validation Snapshot

- [x] Accessibility controls functional in pause settings
- [x] Concept Journal browsable with mastery levels
- [x] Resume flow appears on menu when a fresh session save exists
- [x] Reliability fallbacks active (asset timeout, global error recovery, perf critical handling)
- [x] CI workflow added (`.github/workflows/ci.yml`)
- [x] `GET /api/health` returns status/version/db payload
- [x] `npm run lint` passes
- [x] `npm test` passes (43 tests)
- [x] `npm run build` passes
- [x] `npm run test:e2e` passes (7 scenarios)
- [ ] External deployment + hosted URL verification (manual environment step)

---

## Completed Milestones

- M0 — Foundation (completed 2026-02-27)
- M1 — Playable Island 1 (completed 2026-02-27)
- M2 — Overworld + Island 2 (completed 2026-02-27)
- M3 — Full Game Core (completed 2026-02-27)
- M4 — Polish + Ship Readiness (completed 2026-02-27)

---

## Technical Debt Tracker

| ID | Description | Severity | Added | Resolved |
|---|---|---|---|---|
| TD-M4-DEPLOY | Hosted deployment verification depends on external platform credentials/runtime | Low | 2026-02-27 | pending |

---

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| 2026-02-27 | Use localStorage-backed resumable session with `encode/recall` phases | Meets ≤5s recovery and crash-resume requirements without schema migration overhead | Persist full live scene graph; server-side transient session store |
| 2026-02-27 | Implement high contrast as full-canvas contrast/saturation filter | Fast, globally consistent contrast uplift across all scenes without token rewrite | Per-component manual recolor pass |
| 2026-02-27 | Add performance degrade controls at game-loop level | Centralized handling for long-frame suppression and critical render skips | Scene-by-scene manual frame-budget branches |
| 2026-02-27 | Keep deployment as CI-ready in-repo configuration | Hosted release requires out-of-workspace account/environment secrets | Omit CI and defer all deployment prep |
