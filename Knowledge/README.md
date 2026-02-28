# Knowledge Library

This folder contains project-specific knowledge documents that guide an agent building the mobile-friendly, responsive web game defined in `Design/GameDesign.md`.

## Purpose
- Convert design requirements into implementation-ready guidance.
- Keep decisions measurable with acceptance criteria and telemetry hooks.
- Support cross-discipline delivery: game design, engineering, product owner polish, art, music, education, accessibility, and standards.

## Stack Assumptions
- npm-based web stack for frontend and tooling.
- SQLite-backed persistence for highscores, onboarding progress, and lightweight stateful features.

## Source of Truth
- If any knowledge file conflicts with `Design/GameDesign.md`, the design doc wins.

## Recommended Retrieval Order for Agents
1. `standards/agent-consumption-guidelines.md`
2. `standards/glossary-and-term-consistency.md`
3. `product/telemetry-events-and-thresholds.md`
4. `product/playtest-and-acceptance-protocol.md`
5. Relevant `engineering/*` files
6. Relevant `game-design/*` files
7. Relevant `art/*`, `audio/*`, `education/*`, `accessibility/*` files
8. `standards/coverage-matrix.md`

## File Map

### Templates
- `_template/knowledge-doc-template.md`

### Standards
- `standards/agent-consumption-guidelines.md`
- `standards/glossary-and-term-consistency.md`
- `standards/coverage-matrix.md`

### Game Design
- `game-design/onboarding-beat-map.md`
- `game-design/environmental-signposting.md`
- `game-design/fail-retry-loop.md`
- `game-design/novice-assists-vs-mastery.md`

### Engineering
- `engineering/frontend-architecture-npm.md`
- `engineering/responsive-layout-and-input-abstraction.md`
- `engineering/dual-input-parity-touch-pc.md`
- `engineering/state-machine-and-game-loop.md`
- `engineering/performance-budget-mobile.md`
- `engineering/sqlite-data-model-and-migrations.md`
- `engineering/highscore-and-progression-service.md`
- `engineering/sync-conflict-and-offline-policy.md`
- `engineering/security-and-data-integrity.md`

### Product
- `product/quality-bar-and-definition-of-done.md`
- `product/telemetry-events-and-thresholds.md`
- `product/playtest-and-acceptance-protocol.md`

### Art
- `art/legibility-and-visual-hierarchy.md`
- `art/ui-layout-thumb-reach-zones.md`

### Audio
- `audio/music-and-sonic-feedback.md`

### Education
- `education/no-text-teaching-patterns.md`

### Accessibility
- `accessibility/inclusive-onboarding.md`

## Minimum Quality Rule
Each knowledge file must include:
- Objective
- Scope
- Hard constraints
- Implementation rules
- Acceptance criteria
- Telemetry hooks