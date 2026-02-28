# Playtest and Acceptance Protocol

## Objective
Define repeatable playtest procedures that validate no-text onboarding effectiveness and input parity.

## Scope
- In scope: onboarding test cohorts and pass criteria.
- Out of scope: monetization experiments.

## Hard Constraints
- Run no-text comprehension tests.
- Run dual-input parity tests with separate cohorts.

## Implementation Rules
- Cohorts:
  - 10 touch-only testers
  - 10 PC-only testers
- Tasks:
  - complete onboarding naturally without hints
  - recover from at least one failure
  - use first reward/tool
- Capture qualitative confusion points and map to event spikes.

## API/Data Contracts
- Test report fields: `cohort`, `completion_time`, `attempts`, `major_confusion_point`, `outcome`.

## Acceptance Criteria
- Completion times between cohorts remain within +/-20%.
- New concepts count <=3 and test participants can summarize objective in one sentence.

## Telemetry Hooks
- `playtest_session_tagged`
- `playtest_observation_logged`

## Anti-Patterns
- Coaching players during no-text test.
- Mixing touch and PC in same parity cohort.

## Handoff Checklist
- [ ] Test script prepared
- [ ] Results summarized against thresholds
