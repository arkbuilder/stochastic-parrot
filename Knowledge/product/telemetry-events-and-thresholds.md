# Telemetry Events and Thresholds

## Objective
Provide a canonical event catalog and threshold rules for onboarding iteration.

## Scope
- In scope: required event names and KPI thresholds.
- Out of scope: third-party analytics vendor specifics.

## Hard Constraints
- Required events must include onboarding lifecycle, input, fail/retry, reward, beat completion, secrets, quit.

## Implementation Rules
- Required events:
  - `onboarding_start`
  - `first_input`
  - `first_success_core_verb`
  - `first_fail`
  - `retry_start`
  - `reward_seen`
  - `reward_collected`
  - `reward_used`
  - `beat_completed`
  - `secret_found`
  - `onboarding_complete`
  - `quit`
- Include common fields: `session_id`, `player_id` (or pseudonymous ID), `beat_id`, `attempt`, `input_type`, `ts`.

## API/Data Contracts
- Event payloads must include `schema_version`.

## Acceptance Criteria
- P95 time to first input <=10s.
- Median time to first correct core response <=60s.
- Median failures in onboarding between 0 and 2.

## Telemetry Hooks
- This file defines hooks; no additional hooks required.

## Anti-Patterns
- Event names drifting between files.
- Missing attempt counters for fail/retry analysis.

## Handoff Checklist
- [ ] Event dictionary published
- [ ] Threshold dashboard calculations verified
