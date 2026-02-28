# Coverage Matrix

## Objective
Map each knowledge file to requirements in `Design/GameDesign.md` so nothing critical is missed.

## Scope
- In scope: onboarding beats, input parity, telemetry, acceptance tests, UX, statefulness.
- Out of scope: post-onboarding content.

## Hard Constraints
- Must cover all 8 required output areas in the design document.
- Must include npm-based engineering and SQLite persistence guidance.

## Implementation Rules
- Each row maps: requirement -> owning file(s) -> measurable output.

## API/Data Contracts

### Knowledge → Design Doc Requirements

| Requirement | Owning Knowledge File(s) | Output Artifact |
|---|---|---|
| Beat map | `game-design/onboarding-beat-map.md` | Beat sequence + timers |
| Screen layout notes | `art/ui-layout-thumb-reach-zones.md`, `engineering/responsive-layout-and-input-abstraction.md` | Layout rules |
| Dual-input mapping | `engineering/dual-input-parity-touch-pc.md` | Input map + parity checks |
| Mechanic intro plan | `game-design/environmental-signposting.md` | Concept-per-beat plan |
| Fail/retry | `game-design/fail-retry-loop.md` | Retry policy |
| Secrets/mastery | `game-design/novice-assists-vs-mastery.md` | Optional routes |
| Telemetry | `product/telemetry-events-and-thresholds.md` | Event schema |
| Acceptance tests | `product/playtest-and-acceptance-protocol.md` | Test protocol |
| Stateful progression/highscores | `engineering/sqlite-data-model-and-migrations.md`, `engineering/highscore-and-progression-service.md` | DB + service contracts |

### Design Files → Knowledge File Ownership

Each Design file below lists the Knowledge files it depends on or extends.

| Design File | Primary Knowledge Owner(s) | Coverage Area |
|---|---|---|
| `Design/CoreInteraction.md` | `game-design/onboarding-beat-map.md`, `engineering/dual-input-parity-touch-pc.md`, `engineering/state-machine-and-game-loop.md` | Core verb, state model, input map |
| `Design/OnboardingLevel.md` | `game-design/onboarding-beat-map.md`, `game-design/environmental-signposting.md`, `education/no-text-teaching-patterns.md` | Beat map B0–B5, signposting |
| `Design/EncounterDesign.md` | `game-design/fail-retry-loop.md`, `game-design/novice-assists-vs-mastery.md` | 5 encounter types, tuning knobs |
| `Design/ConceptCurriculum.md` | `education/no-text-teaching-patterns.md`, `game-design/environmental-signposting.md` | 15 concepts, metaphor map |
| `Design/IslandProgression.md` | `game-design/onboarding-beat-map.md`, `product/quality-bar-and-definition-of-done.md` | 5-island arc, cut line |
| `Design/Characters.md` | `art/legibility-and-visual-hierarchy.md`, `accessibility/inclusive-onboarding.md` | Character roster, sprite specs |
| `Design/NarrativeStructure.md` | `education/no-text-teaching-patterns.md` | 3-act story, lore delivery |
| `Design/OverworldNavigation.md` | `engineering/responsive-layout-and-input-abstraction.md`, `art/ui-layout-thumb-reach-zones.md` | Node-based sailing, portrait layout |
| `Design/ShipUpgrades.md` | `game-design/novice-assists-vs-mastery.md`, `engineering/sqlite-data-model-and-migrations.md` | 5 upgrades, persistence |
| `Design/InventoryAndHUD.md` | `art/ui-layout-thumb-reach-zones.md`, `engineering/responsive-layout-and-input-abstraction.md` | HUD zones, component tokens |
| `Design/AudioDirection.md` | `audio/music-and-sonic-feedback.md` | Adaptive music, SFX catalog |
| `Design/ScoringAndProgression.md` | `engineering/highscore-and-progression-service.md`, `engineering/sqlite-data-model-and-migrations.md` | Points model, leaderboard, grades |
| `Design/ContentPipeline.md` | `product/playtest-and-acceptance-protocol.md`, `product/quality-bar-and-definition-of-done.md` | Asset strategy, quality gates |
| `Design/ScopeAndMilestones.md` | `product/quality-bar-and-definition-of-done.md`, `engineering/performance-budget-mobile.md` | Milestones M0–M4, cut line, risks |

## Acceptance Criteria
- Every design requirement has an owner file.
- No owner file without measurable outputs.
- Every Design/ file maps to at least one Knowledge/ file.

## Telemetry Hooks
- `coverage_matrix_gap_detected` (internal QA)

## Anti-Patterns
- Unowned requirements.
- Multiple files owning same requirement with contradictory rules.
- Design file without traceable Knowledge ownership.

## Handoff Checklist
- [ ] Matrix rows complete
- [ ] Ownership conflicts resolved
- [ ] All 14 Design files mapped
