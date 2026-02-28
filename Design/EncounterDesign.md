# Encounter Design

> **Source of truth:** `Design/CoreInteraction.md` (place/recall) · `Design/GameDesign.md` (fail/retry) · `Design/GameHook.md` (threat list)  
> **Status:** Canonical threat taxonomy and mechanical specification.

---

## Overview

Every encounter in Dead Reckoning follows the same resolution pattern: the threat creates urgency, and **recall** is the weapon. Combat is memory, not reflexes. Each encounter type varies in presentation, pacing, and which recall skills it tests, but the core loop is consistent:

```
Threat appears → Recall prompt(s) → Correct recall resolves threat → Reward
```

---

## Encounter Types

### 1. Cursed Fog

**First appearance:** Island 1, Beat 3 (onboarding hazard)

**Description:** A wall of supernatural fog that rolls across the island, obscuring landmarks and threatening to consume the player.

**Trigger:** Completing the encoding phase on an island.

**Mechanics:**
- Fog advances from one edge of the island toward the other.
- Each correct recall pushes the fog back by 1/3 of the island width.
- Fog speed increases slightly with each island tier.
- Full fog coverage = fail state.

**Recall integration:**
- Icon-based spatial riddles reference the concept-landmark pairings the player just encoded.
- Number of prompts = number of concepts on the island (Island 1: 3 prompts).

**Fail state:**
- Fog engulfs player → 3s animation → restart at fog trigger. Total: ≤5s.

**Novice assist:**
- After 2 failures on same prompt: correct landmark pulses + faint audio cue.
- Fog speed reduces by 20% per total failure.

**Expert mastery:**
- All prompts correct on first attempt + total time under par → hidden reward unlocked.

**Pacing profile:** Slow buildup, rhythmic pulses, tension via visual narrowing.

---

### 2. Storm

**First appearance:** Island 2 (second tier)

**Description:** A sudden squall hammers the player's ship while docked or sailing. Lightning strikes illuminate clues; thunder masks wrong answers.

**Trigger:** Midway through encoding on sea-adjacent islands, or during overworld sailing.

**Mechanics:**
- Lightning illuminates one landmark per flash — player must identify concept associations.
- Rain intensity corresponds to remaining time.
- Wind pushes the camera slightly, reducing visual clarity (pressure ramp).

**Recall integration:**
- Each lightning flash briefly shows a landmark silhouette — player selects the correct concept from a 2–3 option visual selector (icons, not text).
- One prompt per lightning cycle. 3 cycles per storm encounter.

**Fail state:**
- Ship takes damage (health bar decreases). If health reaches 0: wash-up-on-shore restart ≤5s from storm re-trigger.

**Novice assist:**
- After 2 failures: lightning holds the flash 2s longer, giving more visual reading time.
- Incorrect option dims slightly on retry.

**Expert mastery:**
- All correct on first flash → bonus relic (ship upgrade component).

**Pacing profile:** Staccato — sharp bursts of action with brief calm between cycles.

---

### 3. Rival Pirate Battle

**First appearance:** Island 3 (mid-game)

**Description:** A rival pirate ship pulls alongside. The enemy captain challenges the player's knowledge — not a quiz, but a "cannon duel" where each correct recall fires a cannonball.

**Trigger:** After full encoding, before island resolution.

**Mechanics:**
- The rival ship appears on the right side of the screen (portrait: top zone).
- Recall prompts appear as "ammunition selection" — the player must recall which landmark holds the concept needed to counter each attack.
- Correct recall: cannon fires, rival ship takes damage.
- Incorrect: player ship takes a hit.
- 3 exchanges per battle.

**Recall integration:**
- Prompts are contextual: "The enemy fires confusion shells" → counter with the concept that clarifies (e.g., Model → Chart Table).
- The metaphor mapping must make intuitive sense (cannon ↔ inference, chart ↔ model).

**Fail state:**
- Player ship health depleted → brief sinking animation → restart at battle trigger ≤5s.

**Novice assist:**
- After 2 hits taken: the ship's parrot squawks near the correct landmark (diegetic hint).
- Enemy fire rate slows slightly.

**Expert mastery:**
- Zero hits taken → capture rival's flag (cosmetic trophy + bonus score).

**Pacing profile:** Back-and-forth volleys — rhythmic, competitive, satisfying.

---

### 4. Ruins Exploration

**First appearance:** Island 4 (later-game)

**Description:** An ancient ruin on the island requires the player to recall concept chains — sequences of concepts in the correct order — to unlock doors and progress through rooms.

**Trigger:** Entering a ruin landmark after encoding on that island.

**Mechanics:**
- Each room has a locked door with a sequence of icon slots (2–3 slots).
- The player must recall and place concepts in the correct order (concept chain).
- The physical environment of each room hints at the order (e.g., water flows left-to-right, suggesting input→process→output).

**Recall integration:**
- This is the first multi-step recall — tests concept relationships, not just isolated placement.
- Introduces ordering and dependency (e.g., Training Data → Model → Inference).

**Fail state:**
- Incorrect sequence: door rumbles, slots reset, room dims briefly → immediate retry (≤3s).
- No health penalty — the "punishment" is time and the eerie atmosphere.

**Novice assist:**
- After 2 failed sequences: first slot locks in the correct concept (reducing to a 2-choice problem).
- Environmental water-flow becomes more obvious (increased contrast/animation).

**Expert mastery:**
- Complete all rooms first try → hidden chamber with rare relic.

**Pacing profile:** Slow, atmospheric, puzzle-focused — deliberate contrast to storm/battle intensity.

---

### 5. Giant Squid Boss

**First appearance:** End of Island 5 or final island (boss encounter)

**Description:** The legendary giant squid rises from the deep. The player must recall concepts from **multiple previous islands** to fight back — a cumulative mastery test.

**Trigger:** Reaching the final island's open water zone after encoding all concepts.

**Mechanics:**
- The squid wraps tentacles around the ship. Each tentacle represents a concept domain from a prior island.
- To repel each tentacle, the player must recall the correct concept + landmark from the originating island.
- 5–8 tentacles, each referencing a different previously-learned concept.
- Squid health bar at top of screen — each correct recall removes a tentacle.

**Recall integration:**
- This is the only encounter that tests cross-island recall — the "final exam."
- Prompts reference landmarks and concepts from Islands 1–4 (or however many the player has completed).
- Concepts are presented as silhouettes of their original landmarks — spatial memory is the weapon.

**Fail state:**
- Tentacle squeeze animation (2s) → screen crunch → restart at current tentacle (not from the beginning). ≤5s retry.
- After 3 total failures, the squid retreats temporarily (30s breather) before re-engaging — emotional pressure relief.

**Novice assist:**
- After 2 failures on same tentacle: the tentacle shows a faint imprint of the island where the concept was placed.
- After 4 total failures: 2 tentacles auto-release (reduces total count, preserves player dignity).

**Expert mastery:**
- All tentacles repelled on first attempt → "Dead Reckoner" title + golden squid trophy.

**Pacing profile:** Escalating intensity — starts slow (1 tentacle), builds to frantic multi-recall. The emotional peak of the game.

---

## Encounter Tuning Knobs

Every encounter exposes the same set of difficulty levers:

| Knob | Effect | Range |
|---|---|---|
| `prompt_count` | Number of recall prompts per encounter | 1–8 |
| `time_window_ms` | Time allowed per prompt | 5000–15000ms |
| `time_decay_per_prompt` | Window reduction across prompts | 0–2000ms |
| `fog_speed` / `storm_interval` / `fire_rate` | Threat advancement rate | 0.5x–2.0x base |
| `novice_assist_threshold` | Failures before assist triggers | 1–3 |
| `assist_strength` | How much the assist reveals | subtle–obvious |
| `expert_par_time_ms` | Total time for bonus reward | Per encounter |

---

## Telemetry Hooks (Per Encounter)

| Event | Payload |
|---|---|
| `encounter_started` | `island_id`, `encounter_type`, `prompt_count` |
| `encounter_prompt_answered` | `prompt_id`, `correct`, `response_ms`, `attempt` |
| `encounter_assist_triggered` | `prompt_id`, `assist_type` |
| `encounter_completed` | `island_id`, `encounter_type`, `prompts_correct`, `total_ms`, `expert_bonus` |
| `encounter_failed` | `island_id`, `encounter_type`, `fail_prompt_id`, `total_failures` |
| `encounter_quit` | `island_id`, `encounter_type`, `quit_at_prompt` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Cursed Fog clearable on first play | ≥80% within 2 retries |
| Quit rate per encounter type | <10% |
| Retry latency (fail → control) | ≤5s all encounter types |
| Expert bonus discovery | 10–30% per encounter |
| Cross-island recall in Squid fight | ≥60% accuracy on first attempt |
| Novice assist triggers for strugglers, not experts | Assist-to-skill correlation >0.7 |
