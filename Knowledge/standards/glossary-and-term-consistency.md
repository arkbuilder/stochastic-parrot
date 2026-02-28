# Glossary and Term Consistency

## Objective
Keep language consistent across all knowledge files so retrieval and implementation decisions stay coherent.

## Scope
- In scope: terms used in design, engineering, product, art, audio, accessibility.
- Out of scope: lore, marketing copy, external style guides.

## Hard Constraints
- Use onboarding beat IDs `B0` to `B5` consistently.
- Use `core verb` for the primary action mechanic.
- Use `novice assist` and `expert mastery path` exactly as named.

## Implementation Rules
- Use `retry latency` for failure-to-control time.
- Use `time to first meaningful decision` for spawn-to-decision metric.
- Use `dual-input parity` for touch vs PC completion comparability.

## API/Data Contracts
- Telemetry payload field names must use snake_case.
- Beat identifier field name: `beat_id`.

## Acceptance Criteria
- No conflicting synonyms for critical terms.
- All docs reference beats using `B0..B5`.

## Telemetry Hooks
- `doc_term_conflict_found` (optional internal QA event)

## Anti-Patterns
- Renaming core concepts per file.
- Mixing terms like `tutorial`, `onboarding`, and `intro` without definition.

## Handoff Checklist
- [ ] Term list reviewed across all docs
- [ ] Critical vocabulary is unambiguous
