# Fail and Retry Loop

## Objective
Ensure failure is instructional and returns players to action fast enough to preserve flow.

## Scope
- In scope: death/fail feedback, reset behavior, checkpoint placement.
- Out of scope: punitive loss systems.

## Hard Constraints
- Failure to regained control <=5s.
- Restart location <=10s from failure site.

## Implementation Rules
- Use instant readability fail cue (<600ms).
- Auto-restart by default; manual restart as fallback.
- Keep camera and context familiar on retry.
- Apply subtle assist after repeated failure at same beat.

## API/Data Contracts
- Retry record: `beat_id`, `fail_cause`, `retry_latency_ms`, `checkpoint_id`.

## Acceptance Criteria
- Median retry latency <=5000ms.
- Quit rate during `B4` <10%.

## Telemetry Hooks
- `first_fail`
- `retry_start`
- `retry_control_regained`

## Anti-Patterns
- Long defeat animations.
- Checkpoints that force full-beat replay after micro-error.

## Handoff Checklist
- [ ] Retry latency benchmarked
- [ ] Checkpoints validated per beat
