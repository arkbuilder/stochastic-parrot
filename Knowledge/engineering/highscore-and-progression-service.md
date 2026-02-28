# Highscore and Progression Service

## Objective
Define service behavior for storing, querying, and validating score and progression state.

## Scope
- In scope: local API/service contracts backed by SQLite.
- Out of scope: account federation.

## Hard Constraints
- Writes must be idempotent for retry-safe client behavior.
- Progress updates cannot regress completed beats unless explicit reset.

## Implementation Rules
- Endpoints (or equivalent service methods):
  - `POST /scores` submit score
  - `GET /scores/top` fetch leaderboard slice
  - `PUT /progress` upsert beat status
  - `GET /progress/:playerId` fetch onboarding state
- Validate score bounds and tamper indicators server-side.
- Use monotonic update rules for progression.

## API/Data Contracts
- Score submission: `player_id`, `session_id`, `score`, `mode`, `checksum`.
- Progress update: `player_id`, `beat_id`, `status`, `attempts`.

## Acceptance Criteria
- Duplicate submission retries do not create duplicate leaderboard entries.
- Completed onboarding state survives app restart.

## Telemetry Hooks
- `score_submitted`
- `leaderboard_viewed`
- `progress_updated`

## Anti-Patterns
- Client-only authority for leaderboard integrity.
- Overwriting full progress object on small update.

## Handoff Checklist
- [ ] Input validation defined
- [ ] Idempotency strategy implemented
