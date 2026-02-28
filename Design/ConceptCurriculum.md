# AI Concept Curriculum

> **Source of truth:** `Design/GameHook.md` (concept list + metaphor examples) · `Design/CoreInteraction.md` (place/recall)  
> **Status:** Canonical concept-to-metaphor mapping and sequencing for all islands.

---

## Design Principles

1. **Spatial association over exposition.** Every concept is learned by placing it in a vivid, memorable physical landmark — not by reading a definition.
2. **One concept = one landmark.** No landmark teaches more than one concept. No concept spans multiple landmarks.
3. **Metaphor must be visually self-evident.** The landmark should imply the concept's meaning through shape, behavior, or context.
4. **Prerequisite chains respected.** Concepts that depend on earlier ideas appear on later islands.
5. **3 concepts per island maximum** (cognitive load cap from `GameDesign.md`).

---

## Full Concept Inventory

### Tier 1 — Foundational (Islands 1–2)

| # | Concept | Metaphor Object | Landmark | Island | Visual Hook |
|---|---|---|---|---|---|
| 1 | **Training Data** | Fish crates filled with sample catches | Dock Crates | 1 — Bay of Learning | Overflowing crates, each fish labeled (icon: fish + data glyph) |
| 2 | **Model** | Captain's navigational chart | Chart Table | 1 — Bay of Learning | Rolled chart with compass rose and gear symbol |
| 3 | **Inference** | Loaded cannon ready to fire | Cannon | 1 — Bay of Learning | Cannonball with lightning bolt — "aim and fire a conclusion" |
| 4 | **Bias** | Crooked compass that always points slightly wrong | Compass Pedestal | 2 — Driftwood Shallows | Compass needle visibly off-center, pulls toward treasure that isn't there |
| 5 | **Classification** | Sorting bins at a fish market | Market Stalls | 2 — Driftwood Shallows | Color-coded bins with different fish species being sorted |
| 6 | **Feedback Loop** | Tidewheel (water-powered wheel) | Tidewheel | 2 — Driftwood Shallows | Wheel turns, dips bucket into water, raises it, pours it back — cyclic motion |

### Tier 2 — Intermediate (Islands 3–4)

| # | Concept | Metaphor Object | Landmark | Island | Visual Hook |
|---|---|---|---|---|---|
| 7 | **Overfitting** | Treasure chest encrusted with too many barnacles | Barnacle Chest | 3 — Coral Maze | Chest so overdecorated it won't open — too specific, too rigid |
| 8 | **Underfitting** | Empty treasure map with almost no markings | Blank Map Frame | 3 — Coral Maze | A map so sparse it could be anywhere — too general to be useful |
| 9 | **Training vs Testing** | Two separate fishing nets (one for catching, one for measuring) | Twin Net Posts | 3 — Coral Maze | Side-by-side nets of different mesh sizes — "learn with one, check with the other" |
| 10 | **Reinforcement** | Ship's bell that rings louder when the lookout spots reward | Reward Bell Tower | 4 — Storm Bastion | Bell swings and rings; the more rewards nearby, the louder it gets |
| 11 | **Reward Function** | Treasure scale that weighs outcomes | Treasure Scale | 4 — Storm Bastion | Balance scale — one side has gold, the other has risk tokens |
| 12 | **Agent** | A ship's autonomous lookout (crow's nest parrot) | Crow's Nest | 4 — Storm Bastion | Parrot in the nest that scans the horizon and squawks directions |

### Tier 3 — Advanced (Island 5 / Boss Island)

| # | Concept | Metaphor Object | Landmark | Island | Visual Hook |
|---|---|---|---|---|---|
| 13 | **Neural Network** | A web of signal ropes connecting mast lights | Rigging Web | 5 — Kraken's Reach | Ropes strung between masts, each node a lantern that lights on signal |
| 14 | **Gradient Descent** | An anchor lowering step-by-step to the sea floor | Anchor Winch | 5 — Kraken's Reach | Anchor dropping in deliberate steps, finding the lowest point |
| 15 | **Generalization** | A universal master key for all island locks | Master Key Shrine | 5 — Kraken's Reach | A single golden key that fits many different lock shapes |

---

## Prerequisite Chain

```
Training Data (1) ──→ Model (1) ──→ Inference (1)
       │                                    │
       ▼                                    ▼
 Classification (2)              Bias (2) ──→ Overfitting (3)
       │                                         │
       ▼                                         ▼
Feedback Loop (2)               Underfitting (3) + Training vs Testing (3)
       │
       ▼
Reinforcement (4) ──→ Reward Function (4) ──→ Agent (4)
                                                  │
                                                  ▼
                              Neural Network (5) ──→ Gradient Descent (5)
                                                          │
                                                          ▼
                                                  Generalization (5)
```

**Rule:** A player cannot reach Island N until Island N-1 is complete, so the prerequisite chain is enforced by island progression order.

---

## Recall Prompt Design Per Concept

Each concept has a canonical recall prompt style — how the game "asks" the player to recall it during encounters.

| Concept | Prompt Style | Example Riddle (Icon-Based) |
|---|---|---|
| Training Data | "What feeds the learning?" | Fish icon + empty crate icon → Dock Crates |
| Model | "What maps the pattern?" | Gear icon + compass rose → Chart Table |
| Inference | "What fires the conclusion?" | Cannonball + lightning → Cannon |
| Bias | "What leads you astray?" | Crooked arrow + compass → Compass Pedestal |
| Classification | "What sorts the catch?" | Colored bins + fish → Market Stalls |
| Feedback Loop | "What turns and returns?" | Circular arrow + water → Tidewheel |
| Overfitting | "What holds too tight?" | Barnacles + locked chest → Barnacle Chest |
| Underfitting | "What knows too little?" | Blank paper + empty frame → Blank Map Frame |
| Training vs Testing | "What catches vs. checks?" | Two nets → Twin Net Posts |
| Reinforcement | "What rings for reward?" | Bell + volume wave → Reward Bell Tower |
| Reward Function | "What weighs the outcome?" | Scale + gold → Treasure Scale |
| Agent | "Who decides what to do?" | Parrot + horizon → Crow's Nest |
| Neural Network | "What connects the signals?" | Web + lanterns → Rigging Web |
| Gradient Descent | "What finds the bottom?" | Anchor + steps → Anchor Winch |
| Generalization | "What opens all locks?" | Key + many locks → Master Key Shrine |

---

## Difficulty Tier Behavior

| Tier | Islands | New Skills Tested | Recall Style |
|---|---|---|---|
| 1 (Foundational) | 1–2 | Single concept recall | One-at-a-time, generous time |
| 2 (Intermediate) | 3–4 | Concept chains (ordered recall) | Sequential prompts, moderate time |
| 3 (Advanced) | 5 | Cross-island recall | Multi-island references, tight time |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Players correctly associate concept ↔ landmark after placement | ≥85% on immediate recall |
| Metaphor comprehension without text definition | ≥70% can explain concept in own words post-play |
| Prerequisite chain never violated by encounter design | 100% — validated in content pipeline |
| Concept count per island | Exactly 3 (never more) |
| Cross-island recall accuracy (Squid Boss) | ≥60% on first attempt |

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `concept_discovered` | `concept_id`, `island_id`, `landmark_id` |
| `concept_placed` | `concept_id`, `landmark_id`, `encode_duration_ms` |
| `concept_recalled_correctly` | `concept_id`, `response_ms`, `attempt` |
| `concept_recalled_incorrectly` | `concept_id`, `selected_landmark`, `correct_landmark` |
| `concept_chain_completed` | `island_id`, `chain_order`, `total_ms` |
