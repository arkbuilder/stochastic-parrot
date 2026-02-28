# Sync Conflict and Offline Policy

## Objective
Specify consistent behavior when network and local state diverge, including offline play.

## Scope
- In scope: local-first writes, conflict resolution, retry behavior.
- Out of scope: multi-region conflict arbitration.

## Hard Constraints
- Onboarding remains playable offline.
- State persistence must not block gameplay loop.

## Implementation Rules
- Local-first queue for score/progress writes.
- Retry with exponential backoff for transient failures.
- Conflict resolution:
  - Progress: keep furthest completed beat and max attempts history.
  - Highscore: keep highest valid score per mode.
- Mark unsynced entries with explicit state.

## API/Data Contracts
- Sync fields: `sync_state`, `last_synced_at`, `sync_error_code`.

## Acceptance Criteria
- Offline session can complete onboarding and sync later without loss.
- Conflict resolution deterministic across retries.

## Telemetry Hooks
- `sync_enqueue`
- `sync_success`
- `sync_conflict`
- `sync_drop`

## Anti-Patterns
- Blocking retry dialogs in active gameplay.
- Silent data overwrite on conflict.

## Handoff Checklist
- [ ] Offline scenario test cases captured
- [ ] Conflict policies documented per entity
