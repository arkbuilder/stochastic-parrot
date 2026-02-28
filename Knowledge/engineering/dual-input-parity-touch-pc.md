# Dual-Input Parity (Touch and PC)

## Objective
Ensure onboarding is equally completable and understandable for touch and PC users.

## Scope
- In scope: action mapping parity, interaction equivalence, parity measurement.
- Out of scope: advanced remapping UX.

## Hard Constraints
- Every onboarding beat must be completable with either input scheme.
- Completion time parity target: within +/-20% between cohorts.

## Implementation Rules
- Define canonical actions independent of device: `primary`, `move`, `secondary`.
- Provide one default mapping per device family.
- Keep mechanical complexity identical across input modes.
- For secondary input, unlock only after core verb mastery.

## API/Data Contracts
- Input profile payload: `input_type`, `mapping_version`, `action_count`.

## Acceptance Criteria
- No beat shows mode-specific blocker defects.
- Error rates by beat do not diverge significantly by input mode.

## Telemetry Hooks
- `input_profile_assigned`
- `input_parity_gap_detected`

## Anti-Patterns
- Extra hints for one mode only.
- Device-specific timing windows that change challenge level.

## Handoff Checklist
- [ ] Mapping sheet approved
- [ ] Parity test run completed
