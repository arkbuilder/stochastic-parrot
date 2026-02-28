# Quality Bar and Definition of Done

## Objective
Set release-level quality expectations for onboarding implementation and polish.

## Scope
- In scope: onboarding ship criteria.
- Out of scope: full live-ops roadmap.

## Hard Constraints
- Onboarding completion and retry metrics must meet thresholds from design spec.
- Touch and PC parity must be demonstrated.

## Implementation Rules
- A feature is done only if: behavior implemented, telemetry instrumented, acceptance test passed.
- Use explicit pass/fail gates per beat before merging.
- Keep polish changes tied to measurable user outcomes.

## API/Data Contracts
- Ship report schema: `build`, `metric_name`, `result`, `status`, `notes`.

## Acceptance Criteria
- Quit rate in onboarding <10%.
- Reward collection >=90%.
- Retry latency median <=5s.

## Telemetry Hooks
- `release_gate_evaluated`

## Anti-Patterns
- Shipping visual polish with unresolved onboarding friction spikes.
- Subjective sign-off without measurable checks.

## Handoff Checklist
- [ ] DoD checklist attached to release artifact
- [ ] Gates reviewed by product owner
