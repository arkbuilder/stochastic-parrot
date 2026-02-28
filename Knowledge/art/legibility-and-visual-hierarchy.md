# Legibility and Visual Hierarchy

## Objective
Ensure players can instantly parse hazards, rewards, and progression in portrait mode.

## Scope
- In scope: contrast, silhouette clarity, hierarchy, clutter control.
- Out of scope: thematic worldbuilding depth.

## Hard Constraints
- Critical affordances must be readable without zoom.
- Visual hierarchy must support top/mid/bottom zone intent.

## Implementation Rules
- Use distinct silhouettes for hazard vs reward.
- Maintain stable contrast between playable path and background.
- Keep VFX subtle in onboarding; feedback should clarify, not distract.
- Reserve strongest visual emphasis for immediate actionable element.

## API/Data Contracts
- Asset tagging: `asset_role=hazard|reward|neutral|ui`.

## Acceptance Criteria
- Testers correctly identify primary hazard/reward classes without text.
- Reduced misinteraction after hierarchy tuning.

## Telemetry Hooks
- `misclick_near_hazard`
- `reward_visibility_delay`

## Anti-Patterns
- Decorative effects masking hitboxes.
- Similar color/value for threat and reward classes.

## Handoff Checklist
- [ ] Hierarchy review completed per beat
- [ ] Asset roles tagged consistently
