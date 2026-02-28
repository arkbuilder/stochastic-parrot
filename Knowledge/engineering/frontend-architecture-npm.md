# Frontend Architecture (npm)

## Objective
Define an npm-based web game architecture that supports responsive onboarding and maintainable iteration.

## Scope
- In scope: package scripts, module boundaries, build/dev conventions.
- Out of scope: framework lock-in.

## Hard Constraints
- Must support portrait-first mobile and PC parity.
- Build should allow rapid telemetry-driven iteration.

## Implementation Rules
- Recommended baseline stack: TypeScript + Vite + Canvas/Web APIs.
- Package scripts: `dev`, `build`, `preview`, `test`, `lint`, `db:migrate`.
- Module boundaries:
  - `core/` game loop, state machine, timing
  - `input/` touch/keyboard/mouse abstraction
  - `beats/` onboarding beat configs
  - `ui/` HUD + overlays
  - `telemetry/` event client
  - `services/` API client for persistence

## API/Data Contracts
- Frontend sends normalized event payloads with `session_id`, `beat_id`, `input_type`.

## Acceptance Criteria
- New beat variant can be added without touching core loop.
- Build output performs consistently on mid-range mobile devices.

## Telemetry Hooks
- `build_version_loaded`
- `feature_flag_applied`

## Anti-Patterns
- Gameplay rules spread across UI components.
- Device-specific branches in beat logic.

## Handoff Checklist
- [ ] npm scripts documented
- [ ] Module boundaries enforced
