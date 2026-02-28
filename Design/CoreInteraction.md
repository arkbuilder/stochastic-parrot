# Core Interaction Design

> **Source of truth:** `Design/GameDesign.md` · `Design/GameHook.md`  
> **Status:** Canonical — all encounter, onboarding, and engineering files derive from this spec.

---

## Quick Decision Gate (Answers)

| Question | Answer |
|---|---|
| **Core verb** | **Place** (encode a concept into a landmark) + **Recall** (retrieve the correct concept under pressure) |
| **First hazard** | **Cursed Fog** — rolls toward the player, obscuring landmarks until the correct concept is recalled |
| **First reward** | **Chart Fragment** — unlocks the next island region and visually completes the sea chart |

---

## 1. Interaction Model Overview

Dead Reckoning has **two gameplay phases** that alternate within every island visit:

| Phase | Player Goal | Emotional State | Time Pressure |
|---|---|---|---|
| **Encode** | Explore island, discover AI concepts, place them in landmarks | Curiosity, delight | None (safe sandbox) |
| **Recall** | Survive a threat by selecting the correct concept/location | Tension, urgency | Countdown or advancing hazard |

The core loop is: **Explore → Encode → Threat triggers → Recall → Resolve → Reward**.

---

## 2. Encode Phase — "Place"

### 2.1 What the Player Does

1. **Walk/sail** to a landmark on the island (e.g., dock crates, chart table, cannon).
2. A **concept card** appears contextually — a floating object with an icon and one-word label (e.g., a crate icon with "Training Data").
3. The player **drags the concept card onto the landmark** (touch) or **clicks the card then clicks the landmark** (PC).
4. A satisfying **lock-in animation** plays — the concept merges visually with the landmark (crates glow, chart table draws itself, cannon loads).
5. The concept is now **placed** in the player's spatial memory and stored in their concept inventory.

### 2.2 Input Mapping

| Action | Touch | PC |
|---|---|---|
| Move to landmark | Tap destination / virtual joystick | WASD / Arrow keys |
| Pick up concept card | Tap card (enters drag mode) | Left-click card |
| Place concept in landmark | Drag onto landmark and release | Left-click landmark while card is held |
| Cancel placement | Drag off landmark / tap elsewhere | Right-click / Escape |
| Inspect placed concept | Long-press landmark | Hover landmark (tooltip) |

### 2.3 Portrait Layout During Encode

- **Top zone:** Island mini-map showing landmarks (placed = glowing, empty = pulsing).
- **Mid zone:** Exploration view — player avatar walking the island, landmarks visible.
- **Bottom zone:** Concept card tray — unplaced concepts sit here as draggable cards.

### 2.4 Design Rules

- Maximum **3 concepts** per island encoding session (cognitive load cap from GameDesign.md).
- Concepts are introduced **one at a time** as the player reaches each landmark.
- The landmark **must visually suggest the concept metaphor** (environmental signposting, no text instruction required).
- Encoding order is player-driven but landmark proximity creates a natural sequence.
- Once placed, concepts cannot be re-placed (commitment creates memory pressure).

---

## 3. Recall Phase — "Recall"

### 3.1 What the Player Does

1. A **threat event** triggers (cursed fog, storm, battle, etc.).
2. The screen shifts to **recall mode** — the environment darkens, the threat advances, and the placed landmarks glow as interactive targets.
3. A **recall prompt** appears — a situational challenge requiring a specific concept. Example: "The fog asks: *What fills the crates to teach the cannon?*" (answer: Training Data). The prompt is a visual/spatial riddle, not a text quiz.
4. The player **taps/clicks the correct landmark** within the time window.
5. **Correct recall:** the landmark activates (cannon fires, chart reveals safe passage, crates block the fog). Encounter resolves positively.
6. **Incorrect recall:** brief negative feedback (screen shake, fog advances), player gets another attempt with reduced time window.
7. **Failure (time runs out):** fail state triggers, retry loop engages per `Knowledge/game-design/fail-retry-loop.md`.

### 3.2 Input Mapping

| Action | Touch | PC |
|---|---|---|
| Select landmark to recall | Tap landmark | Left-click landmark |
| Confirm selection | Auto-confirm on tap | Auto-confirm on click |
| Pan camera to find landmark | Swipe | WASD / Arrow keys |

### 3.3 Portrait Layout During Recall

- **Top zone:** Threat visualization advancing (fog wall, storm clouds, enemy ship).
- **Mid zone:** Island view with glowing landmarks — the recall battlefield.
- **Bottom zone:** Timer bar + current prompt icon (no text, icon-only riddle).

### 3.4 Design Rules

- Recall prompts are **spatial and visual**, never raw quiz questions.
- The correct landmark **pulses subtly** as a novice assist after the first failed attempt (per `Knowledge/game-design/novice-assists-vs-mastery.md` — diegetic, not UI pity).
- Time pressure increases per island tier but never drops below a fair minimum.
- Each recall sequence requires **1–3 correct recalls** depending on threat severity.
- Expert mastery: recalling all 3 concepts faster than par time yields a **bonus chart fragment** (secret reward, 10–30% discovery rate target).

---

## 4. Dual-Input Parity Contract

Per `GameDesign.md` Section 1.2, every interaction must be completable with either input scheme.

| Canonical Action | Touch Binding | PC Binding | Parity Notes |
|---|---|---|---|
| `primary` (place/recall) | Tap / drag-release | Left-click | Same target, same timing |
| `move` | Tap-to-move / joystick | WASD / arrows | Equivalent traversal speed |
| `secondary` (inspect) | Long-press | Hover / right-click | Non-critical, no gameplay gate |
| `cancel` | Drag off / tap empty | Right-click / Escape | Same undo window |

### Parity acceptance test
- 10 touch-only, 10 PC-only testers complete Island 1 encoding + recall within ±20% time.

---

## 5. State Model

```
ISLAND_ARRIVE → EXPLORING → ENCODING (per landmark)
                                ↓
                          THREAT_TRIGGERED
                                ↓
                          RECALLING (per prompt)
                           ↙         ↘
                    RECALL_SUCCESS   RECALL_FAIL
                           ↓              ↓
                    ENCOUNTER_RESOLVED  RETRY (≤5s)
                           ↓
                    REWARD_GRANTED → ISLAND_COMPLETE
```

### State data contract

```json
{
  "island_id": "string",
  "phase": "encode | recall | resolved",
  "concepts_placed": [
    { "concept_id": "string", "landmark_id": "string", "placed_at": "ISO8601" }
  ],
  "recall_attempts": [
    { "prompt_id": "string", "landmark_selected": "string", "correct": "boolean", "response_ms": "number" }
  ],
  "threat_type": "string",
  "outcome": "success | fail | retry"
}
```

---

## 6. Telemetry Hooks

| Event | Payload | Maps to GameDesign.md |
|---|---|---|
| `concept_placed` | `island_id`, `concept_id`, `landmark_id`, `encode_duration_ms` | `reward_collected` equivalent |
| `recall_prompted` | `island_id`, `prompt_id`, `threat_type` | — |
| `recall_answered` | `prompt_id`, `landmark_selected`, `correct`, `response_ms`, `attempt` | `first_success_core_verb`, `first_fail` |
| `recall_timeout` | `prompt_id`, `elapsed_ms` | `first_fail` (timeout cause) |
| `encode_phase_complete` | `island_id`, `concepts_count`, `total_encode_ms` | `beat_completed` |
| `recall_phase_complete` | `island_id`, `correct_count`, `total_recall_ms`, `bonus_earned` | `beat_completed` |

---

## 7. Acceptance Criteria

| Criterion | Target | Source |
|---|---|---|
| Players place first concept without text instruction | ≥95% within 10s of landmark proximity | GameDesign.md B0 |
| Players complete first recall correctly | ≥80% within 2 attempts | GameDesign.md B1 |
| Recall response time (median) | ≤8s per prompt | Project-specific |
| Retry latency (fail → control regained) | ≤5s | GameDesign.md P3 |
| Touch vs PC completion parity | ±20% time | GameDesign.md §8.B |
| Expert bonus discovery rate | 10–30% first play | GameDesign.md B5 |

---

## 8. Anti-Patterns

- **Quiz screen:** Recall must happen in the game world, never in a modal popup.
- **Text-heavy prompts:** Riddles are icon/spatial, not sentences.
- **Undo after commit:** Re-placing concepts removes memory pressure and defeats the mechanic.
- **Simultaneous encode + recall:** Phases must be distinct to isolate variables (Research.md).
- **Hidden landmarks:** All landmarks must be visible during exploration; no pixel-hunting.
