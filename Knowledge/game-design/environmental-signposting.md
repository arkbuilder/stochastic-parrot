# Environmental Signposting

## Objective
Teach the player what to do next without explicit text instructions.

## Scope
- In scope: motion, contrast, geometry, rhythm, reward trails.
- Out of scope: text tooltips and modal tutorials.

## Hard Constraints
- Guidance must be diegetic.
- At least 3 signposting patterns must be present in onboarding.

## Implementation Rules
- Motion: moving hazard/reward indicates urgency and affordance.
- Contrast: intended path is brighter, non-path darker.
- Geometry: obstacle shape/spacing implies timing/hold length.
- Rhythm: repeated pattern teaches timing before penalty.
- Reward trail: collectible breadcrumb toward desired route.

## API/Data Contracts
- Store signposting tags on level chunks: `signpost_types: string[]`.

## Acceptance Criteria
- Players identify progression direction without text in first 10s.
- Misroute rate drops after signpost tuning iteration.

## Telemetry Hooks
- `path_deviation`
- `reward_trail_followed`
- `wrong_action_at_signpost`

## Anti-Patterns
- UI arrows replacing spatial teaching.
- High-contrast clutter that competes with path cues.

## Handoff Checklist
- [ ] Every beat has explicit signposting intent
- [ ] Signposting is testable via telemetry
