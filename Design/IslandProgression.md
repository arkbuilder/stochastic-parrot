# Island Progression

> **Source of truth:** `Design/GameHook.md` (loop + vertical slice) · `Design/ConceptCurriculum.md` (concept assignment)  
> **Status:** Canonical island sequence, pacing, and unlock logic.

---

## Overview

The Memory Sea contains **5 main islands** plus a **boss encounter zone**. Each island introduces exactly 3 AI/ML concepts, one encounter type, and one progression reward. The full game is designed to be completable in **30–45 minutes** for a focused session, or across multiple shorter sessions.

---

## Island Sequence

| # | Island Name | Concepts (3) | Encounter Type | Reward | Unlock Condition |
|---|---|---|---|---|---|
| 1 | **Bay of Learning** | Training Data, Model, Inference | Cursed Fog | Chart Fragment A | Start of game |
| 2 | **Driftwood Shallows** | Bias, Classification, Feedback Loop | Storm | Chart Fragment B | Complete Island 1 |
| 3 | **Coral Maze** | Overfitting, Underfitting, Training vs Testing | Rival Pirate Battle | Chart Fragment C + Ship Cannon Upgrade | Complete Island 2 |
| 4 | **Storm Bastion** | Reinforcement, Reward Function, Agent | Ruins Exploration | Chart Fragment D + Ship Hull Upgrade | Complete Island 3 |
| 5 | **Kraken's Reach** | Neural Network, Gradient Descent, Generalization | Giant Squid Boss | Golden Chart (complete map) + Dead Reckoner Title | Complete Island 4 |

---

## Pacing Curve

| Island | Session Target | New Mechanic Introduced | Difficulty | Emotional Arc |
|---|---|---|---|---|
| 1 | 3–5 min | Place + single recall | Easy | Wonder → mild tension → relief |
| 2 | 4–6 min | Multi-prompt recall + storm pressure | Easy-Medium | Curiosity → urgency → satisfaction |
| 3 | 5–7 min | Concept chains (ordered recall) + battle | Medium | Confidence → challenge → triumph |
| 4 | 5–7 min | Environmental puzzle (ruins sequence) | Medium-Hard | Exploration → tension → mastery |
| 5 | 6–8 min | Cross-island cumulative recall | Hard | Dread → escalation → catharsis |

**Total estimated playtime:** 25–35 minutes core path.  
**With exploration + expert mastery routes:** 35–50 minutes.

---

## Unlock Logic

### Chart Fragment System

- Each island awards one **Chart Fragment** on completion.
- Fragments visually assemble into a sea chart in the HUD.
- The chart shows discovered islands (gold border) and the next island (silhouette, pulsing).
- **Island N+1 unlocks when Island N is complete** (linear progression, no branching for the core path).

### Ship Upgrades (Islands 3–4)

- Island 3 awards a **Cannon Upgrade** (visual: cannon glows, +1 max recall error forgiveness in battles).
- Island 4 awards a **Hull Upgrade** (visual: hull reinforced, +1 hit tolerance in storms).
- Upgrades are automatic — no upgrade menu in core path (keeps UX simple).

### Expert Unlock: Secret Island

- Collecting **all 5 expert mastery bonuses** (one per island) reveals coordinates to a **Hidden Reef** — a bonus challenge island with 3 advanced remixed encounters.
- This is entirely optional (10–30% of players discover any individual bonus; far fewer collect all 5).

---

## Per-Island Structure Template

Every island follows this structure:

```
1. ARRIVAL (5–10s)
   - Ship auto-docks or player sails to shore
   - Island name appears as environmental text (carved into a sign post, not UI overlay)
   - Camera frames the island in portrait

2. EXPLORATION + ENCODING (60–120s)
   - Player walks between 3 landmarks
   - Each landmark reveals one concept card
   - Player places concept into landmark
   - Safe sandbox — no threats during encoding

3. ENCOUNTER TRIGGER (5–10s)
   - Threat appears (fog / storm / rival / ruins / squid)
   - Sky/environment shifts to signal danger
   - Transition into recall mode

4. RECALL SEQUENCE (30–90s)
   - 1–8 recall prompts depending on island/encounter
   - Difficulty ladder within the encounter
   - Novice assists and expert paths active

5. RESOLUTION + REWARD (10–20s)
   - Threat defeated
   - Chart Fragment / Upgrade awarded
   - Next island preview + optional boss stinger
```

---

## Overworld Between Islands

Between islands, the player sails the overworld (see `Design/OverworldNavigation.md`). Sailing serves as:

- **Breathing room** between encoding/recall intensity.
- **Progression visualization** (chart fills in, fog-of-war lifts).
- Optional **random micro-encounters** (minor storms, floating loot) for bonus score.

---

## Competition Build Cut Line

For a competition/demo build, the **minimum viable slice** is:

| Priority | Content | Status |
|---|---|---|
| **Must ship** | Island 1 (Bay of Learning) — fully playable with all beats | Vertical slice |
| **Should ship** | Island 2 (Driftwood Shallows) + overworld sailing between them | Demonstrates progression |
| **Stretch** | Islands 3–5 + Squid Boss | Full game |
| **Bonus** | Hidden Reef secret island | Expert content |

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `island_arrived` | `island_id`, `session_id` |
| `island_encoding_complete` | `island_id`, `concepts_placed`, `encode_total_ms` |
| `island_encounter_complete` | `island_id`, `encounter_type`, `result` |
| `island_complete` | `island_id`, `total_ms`, `expert_bonus`, `chart_fragments_total` |
| `island_quit` | `island_id`, `phase`, `beat_id` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Island 1 completable in 3–5 min | 90th percentile ≤5 min |
| Players understand unlock logic without text | ≥85% navigate to Island 2 after completing Island 1 |
| Difficulty ramp perceived as fair | <10% quit rate per island |
| Expert secret discovery per island | 10–30% of players |
| Full game completable in one session | ≤50 min for 90th percentile |
