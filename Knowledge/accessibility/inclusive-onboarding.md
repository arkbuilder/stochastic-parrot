# Inclusive Onboarding

## Objective
Ensure onboarding is usable for a wider range of players across motor, visual, and auditory needs.

## Scope
- In scope: accessible controls, visual/audio alternatives, comfort options.
- Out of scope: platform certification specifics.

## Hard Constraints
- Core onboarding must remain completable with both touch and PC inputs.
- Critical feedback cannot rely on a single sensory channel.

## Implementation Rules
- Provide optional reduced-motion and camera-shake controls.
- Ensure contrast and size choices preserve hazard/reward distinction.
- Provide audio-independent visual confirmations for key events.
- Avoid mandatory multi-finger gestures in onboarding-critical paths.

## API/Data Contracts
- Accessibility settings model: `reduced_motion`, `high_contrast`, `audio_cues_enabled`.

## Acceptance Criteria
- Accessibility settings do not break onboarding progression.
- Players can complete core beats with alternative feedback enabled.

## Telemetry Hooks
- `accessibility_setting_changed`
- `accessibility_mode_session`

## Anti-Patterns
- Hidden accessibility controls.
- Critical warnings available only via sound.

## Handoff Checklist
- [ ] Accessibility options test pass completed
- [ ] Alternative feedback paths validated
