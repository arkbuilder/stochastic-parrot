# Responsive Layout and Input Abstraction

## Objective
Guarantee one gameplay implementation works across touch and PC inputs with layout responsive to portrait-first constraints.

## Scope
- In scope: viewport strategy, safe zones, action mapping.
- Out of scope: custom control remapping UI.

## Hard Constraints
- Primary action in lower third.
- Upcoming hazard/goal readability in upper third.
- Every beat completable with touch or PC.

## Implementation Rules
- Use a normalized coordinate system for world interactions.
- Input adapter outputs actions: `primary`, `move_vector`, `secondary`.
- Touch default: tap/hold + swipe/drag.
- PC default: left-click + WASD/arrow (or mouse drag, choose one primary per build).

## API/Data Contracts
- Input event payload: `input_type`, `action`, `duration_ms`, `x_norm`, `y_norm`.

## Acceptance Criteria
- Touch-only and PC-only onboarding completion time within +/-20%.
- No beat requires inaccessible gesture for either input mode.

## Telemetry Hooks
- `first_input`
- `input_mode_changed`
- `beat_input_error`

## Anti-Patterns
- Separate beat scripts per platform.
- Tiny tap targets near screen edges.

## Handoff Checklist
- [ ] Input adapter used by all beats
- [ ] Reach zones validated on representative devices
