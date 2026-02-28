# Onboarding Beat Map

## Objective
Define a timeboxed beat sequence (`B0`..`B5`) that teaches mechanics without text in 3–7 minutes.

## Scope
- In scope: onboarding only.
- Out of scope: post-onboarding campaign.

## Hard Constraints
- One new concept per beat.
- Maximum 3 new concepts across onboarding.
- Spawn to first meaningful decision <=3s.

## Implementation Rules
- `B0` (0-10s): safe discovery, obvious forward direction.
- `B1` (10-45s): first hazard requiring core verb.
- `B2` (45-90s): first reward collection and immediate use.
- `B3` (90-150s): precision ladder (easy->medium->precise).
- `B4` (150-210s): real risk + diegetic novice assist after struggle.
- `B5` (optional after B2): expert mastery route + hidden novice aid.

## API/Data Contracts
- Beat state model fields: `beat_id`, `start_ts`, `end_ts`, `attempt`, `result`.

## Acceptance Criteria
- 95% first action within 10s.
- >=80% clear `B1` within 2 attempts.
- >=90% collect first reward in `B2`.

## Telemetry Hooks
- `beat_started`
- `beat_completed`
- `beat_failed`

## Anti-Patterns
- Introducing secondary input too early.
- Multi-concept beats.

## Handoff Checklist
- [ ] Beat timers configured
- [ ] Beat transitions deterministic
- [ ] Fail paths return to nearest playable context
