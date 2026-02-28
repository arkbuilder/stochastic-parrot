# Novice Assists vs Mastery Paths

## Objective
Deliver a two-tier onboarding: subtle support for strugglers and optional challenge for experts.

## Scope
- In scope: hidden assists, optional high-skill routes, bonus outcomes.
- Out of scope: mandatory difficulty modes.

## Hard Constraints
- Assist appears only after struggle signals.
- Expert route is optional and never blocks completion.

## Implementation Rules
- Struggle trigger: 2+ failures in same beat within short window.
- Assist examples: temporary forgiving timing window, extra platform, reduced hazard speed.
- Mastery examples: tighter route, shortcut, bonus score pickup.

## API/Data Contracts
- Flags: `assist_armed`, `assist_used`, `mastery_route_entered`, `mastery_reward_claimed`.

## Acceptance Criteria
- Mastery discovery rate first play: 10-30%.
- Assist activation skews toward bottom-skill cohort.

## Telemetry Hooks
- `secret_found` with `type=expert|novice`
- `assist_triggered`

## Anti-Patterns
- Obvious pity UI.
- Mandatory expert route progression.

## Handoff Checklist
- [ ] Assist trigger logic validated
- [ ] Mastery route has meaningful reward
