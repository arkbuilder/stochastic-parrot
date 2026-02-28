# No-Text Teaching Patterns

## Objective
Translate educational scaffolding methods into game onboarding patterns that teach through interaction.

## Scope
- In scope: scaffold sequencing, retrieval practice, confidence loops.
- Out of scope: explicit tutorial text systems.

## Hard Constraints
- No required text instructions for onboarding comprehension.
- One concept introduced per beat.

## Implementation Rules
- Pattern: demonstrate -> let player try -> apply mild pressure -> reinforce.
- Use immediate feedback for correct/incorrect responses.
- Repeat with slight variation for retention before adding new concept.
- Trigger support after struggle, then fade once competence improves.

## API/Data Contracts
- Learning marker model: `concept_id`, `first_seen_beat`, `mastery_signal`.

## Acceptance Criteria
- Players can perform core verb reliably without reading instructions.
- Concept mastery indicators improve across beats.

## Telemetry Hooks
- `concept_first_success`
- `concept_regression_detected`

## Anti-Patterns
- Teaching two unrelated concepts in same encounter.
- Over-assisting before the player attempts independently.

## Handoff Checklist
- [ ] Concept map linked to beats
- [ ] Mastery signals defined per concept
