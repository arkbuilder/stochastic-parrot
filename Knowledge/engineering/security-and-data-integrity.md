# Security and Data Integrity

## Objective
Protect stateful gameplay data from trivial tampering while keeping implementation lightweight.

## Scope
- In scope: validation, rate limits, payload hygiene, retention basics.
- Out of scope: full anti-cheat platform.

## Hard Constraints
- Do not trust client-provided score/progress blindly.
- Minimize personally identifiable data in SQLite.

## Implementation Rules
- Validate score growth against session envelope constraints.
- Attach request signature/checksum for score submissions.
- Apply simple per-device rate limits for score posting.
- Sanitize and schema-validate telemetry payload JSON.

## API/Data Contracts
- Integrity fields: `checksum`, `client_build`, `session_duration_ms`.

## Acceptance Criteria
- Obvious replay/tamper submissions are rejected.
- Data retention policy documented for event log and session data.

## Telemetry Hooks
- `score_rejected_integrity`
- `rate_limit_triggered`

## Anti-Patterns
- Storing raw sensitive identifiers.
- Accepting unlimited anonymous score writes.

## Handoff Checklist
- [ ] Validation rules listed per endpoint
- [ ] Retention windows defined
