# Music and Sonic Feedback Design

## Objective
Use audio to reinforce affordances, pacing, pressure ramps, and confidence recovery.

## Scope
- In scope: SFX feedback mapping, music intensity layers, fail/retry audio.
- Out of scope: full soundtrack production pipeline.

## Hard Constraints
- Audio cues must support no-text comprehension.
- Fail/retry cues must reduce frustration, not punish.

## Implementation Rules
- Map unique SFX to core verb success, reward collect/use, and hazard warning.
- Use adaptive music intensity by beat risk level.
- Keep retry stinger short and neutral-to-encouraging.
- Provide independent sliders/mutes for music and SFX.

## API/Data Contracts
- Audio event schema: `audio_cue`, `beat_id`, `context`, `ts`.

## Acceptance Criteria
- Players can distinguish success vs danger cues reliably.
- Audio does not mask critical timing information.

## Telemetry Hooks
- `audio_cue_played`
- `audio_muted`

## Anti-Patterns
- Loud fail sounds that amplify churn.
- Similar timbre for hazard and reward cues.

## Handoff Checklist
- [ ] Cue map complete for all onboarding beats
- [ ] Accessibility options exposed
