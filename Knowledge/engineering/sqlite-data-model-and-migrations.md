# SQLite Data Model and Migrations

## Objective
Define SQLite schema and migration strategy for highscores, onboarding progress, and lightweight player state.

## Scope
- In scope: local/dev SQLite schema and migration workflow.
- Out of scope: distributed SQL scaling.

## Hard Constraints
- Persist highscores and onboarding completion state.
- Schema changes must be migration-driven, not ad hoc.

## Implementation Rules
- Core tables:
  - `players(id, device_fingerprint, created_at)`
  - `sessions(id, player_id, started_at, completed_at, input_mode)`
  - `highscores(id, player_id, score, mode, created_at)`
  - `onboarding_progress(id, player_id, beat_id, attempts, status, updated_at)`
  - `event_log(id, session_id, event_name, payload_json, ts)`
- Use migration files with monotonic version naming.
- Add indexes for `player_id`, `session_id`, and leaderboard queries.

## API/Data Contracts
- All timestamps stored in UTC ISO8601.
- `payload_json` schema versioned via `payload_version`.

## Acceptance Criteria
- Fresh setup runs all migrations successfully.
- Rolling forward from previous version preserves highscores.

## Telemetry Hooks
- `db_migration_started`
- `db_migration_completed`
- `db_migration_failed`

## Anti-Patterns
- Manual schema edits in production DB.
- Storing unbounded payload blobs without retention policy.

## Handoff Checklist
- [ ] Migration runner script documented
- [ ] Seed data path defined for local QA
