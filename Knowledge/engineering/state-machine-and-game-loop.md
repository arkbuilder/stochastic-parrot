# State Machine and Game Loop

## Objective
Define deterministic onboarding progression and reliable retry behavior using explicit state modeling.

## Scope
- In scope: global game states, beat states, transition guards.
- Out of scope: full content pipeline for later levels.

## Hard Constraints
- Retry latency budget <=5s.
- Beat transitions must preserve one-concept-per-beat pacing.

## Implementation Rules
- Global states: `boot`, `menu`, `onboarding`, `paused`, `complete`.
- Beat substates: `intro`, `active`, `failed`, `retrying`, `cleared`.
- Transition guards use telemetry-visible reasons.
- Tick loop should separate update and render phases.

## API/Data Contracts
- Transition log model: `from_state`, `to_state`, `reason`, `ts`.

## Acceptance Criteria
- No undefined transitions in onboarding flow.
- Fail -> retry -> active path remains stable after repeated attempts.

## Telemetry Hooks
- `state_transition`
- `beat_state_transition`

## Anti-Patterns
- Hidden transitions in UI callbacks.
- Retrying by fully reloading application state.

## Handoff Checklist
- [ ] Transition map documented
- [ ] Retry path tested for all beats
