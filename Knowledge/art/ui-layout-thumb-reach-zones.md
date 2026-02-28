# UI Layout and Thumb Reach Zones

## Objective
Define portrait-first layout constraints for one-handed usability and clarity.

## Scope
- In scope: top/mid/bottom zoning, tap target placement, finger-safe spacing.
- Out of scope: non-portrait layouts.

## Hard Constraints
- Primary action region in lower third.
- Future-state preview in upper third.
- Controls reachable one-handed on standard phones.

## Implementation Rules
- Top zone: incoming hazards and next objective cues.
- Mid zone: active interaction space.
- Bottom zone: controls and immediate feedback.
- Keep tap targets large enough for error-tolerant input.

## API/Data Contracts
- UI layout config fields: `zone_top`, `zone_mid`, `zone_bottom`, `safe_margins`.

## Acceptance Criteria
- Low accidental-touch rate on core controls.
- Players rarely obscure critical gameplay with fingers.

## Telemetry Hooks
- `control_mis_tap`
- `critical_occlusion_detected`

## Anti-Patterns
- Critical buttons near rounded-corner/safe-area conflicts.
- HUD overlap with hazard lanes.

## Handoff Checklist
- [ ] Layout reviewed on multiple aspect ratios
- [ ] Safe-area handling verified
