# Onboarding Level — Island 1: Bay of Learning

> **Source of truth:** `Design/GameDesign.md` (beat map template) · `Design/CoreInteraction.md` (place/recall mechanics)  
> **Status:** Canonical filled-in beat map for the vertical slice.

---

## Island 1 Parameters

| Field | Value |
|---|---|
| **Island name** | Bay of Learning |
| **Genre** | 8-bit top-down pirate adventure (educational) |
| **Core verb** | Place (encode) + Recall (retrieve under pressure) |
| **Reward** | Chart Fragment (unlocks next sea region) |
| **First hazard** | Cursed Fog |
| **Progression direction** | Left-to-right across the island, top-down camera |
| **Session length target** | 3–5 minutes |
| **Concepts taught** | Training Data, Model, Inference |
| **Landmarks** | Dock Crates, Chart Table, Cannon |

---

## Beat Map

### Beat 0 — Arrival (0–10s): "Affordance Discovery"

**Goal:** Player lands on the island and learns to move and interact.

**Setup:**
- The player's ship auto-docks at a small pier on the left edge of the island.
- The camera frames the island in portrait: pier at bottom-left, dock crates glowing gently at center-left, path leading right.
- The pier has a single **bouncing coin** (reward trail signpost) leading toward the dock crates.
- Tapping/clicking anywhere on the ground moves the captain toward that point.

**Signposting:**
- **Motion:** Coin bounces rhythmically toward crates.
- **Contrast:** Dock crates glow warm yellow (`--yellow-400`) against the dark island ground (`--gray-900`).
- **Geometry:** Pier planks form a narrow path that naturally funnels movement rightward.

**Dual-input mapping:**
- Touch: tap-to-move to coin / crates.
- PC: WASD or click-to-move to coin / crates.

**Acceptance tests:**
- 95% of players move toward the dock crates within 10s without text prompts.

---

### Beat 1 — First Concept Placement (10–45s): "Encode Introduction"

**Goal:** Teach the player to place a concept in a landmark.

**Setup:**
- As the player approaches the dock crates, the first **concept card** ("Training Data" — icon: a fish crate with data symbols) rises from the crates and floats to the bottom concept tray.
- The crates pulse with a subtle "drop here" glow (`--cyan-400` border).
- The player drags (touch) or click-selects then click-places (PC) the Training Data card onto the dock crates.
- **Lock-in animation:** Crates seal shut with a satisfying thunk, glowing lines trace the data symbol into the wood.

**Signposting:**
- **Contrast:** Concept card is bright against dark tray; crates pulse cyan.
- **Geometry:** Crate opening shape matches the card shape — visual affordance of "this goes here."
- **Motion:** Card gently drifts toward crates if untouched for 5s (novice breadcrumb, not forced).

**Failure design:**
- If the player tries to place the card on a wrong landmark (none available yet), a gentle shake + bounce-back.
- If idle >10s, the card drifts closer to the crates as a hint (novice assist, per `Knowledge/game-design/novice-assists-vs-mastery.md`).

**Acceptance tests:**
- ≥80% place Training Data within 2 attempts.
- ≥95% complete placement without text instruction.

---

### Beat 2 — Second & Third Concept (45–90s): "Systemic Encoding"

**Goal:** Player learns the pattern repeats — walk to landmark, receive concept, place it.

**Setup:**
- Path leads right from dock crates to the **Chart Table** (mid-island, near a sheltered cove).
- Approaching the table reveals the "Model" concept card (icon: a rolled chart with gear symbol).
- Player places Model onto the Chart Table. Lock-in: chart unrolls, gear stamps itself into the paper.
- Path continues right to the **Cannon** (island's east cliff, pointing out to sea).
- Approaching the cannon reveals the "Inference" concept card (icon: a cannonball with a lightning bolt).
- Player places Inference onto the Cannon. Lock-in: cannonball loads, fuse sparks once.

**Signposting:**
- Each landmark is visually distinct in shape and coloring.
- Reward trail coins connect crates → table → cannon.
- The cannon points outward to sea, implying "this does something — it fires."

**Acceptance tests:**
- ≥90% collect and place all 3 concepts without explicit instruction.
- ≥70% complete encoding within 90s.

---

### Beat 3 — Recall Primer (90–130s): "Pressure Introduction"

**Goal:** The cursed fog rolls in and the player must recall one concept correctly.

**Setup:**
- After the third concept is placed, the sky darkens. A wall of **Cursed Fog** (`--gray-950` with swirling violet particles) rolls in from the left edge.
- The fog advances slowly, obscuring landmarks as it passes.
- A **recall prompt** appears in the bottom zone — an icon riddle: a fish + a crate icon with a "?" (answer: the Dock Crates, where Training Data was placed).
- The player taps/clicks the correct landmark (Dock Crates).
- **Correct:** The crates burst with light, pushing the fog back 1/3 of the island. Satisfying audio + screen flash (`--green-400`).
- **Incorrect:** Screen shakes, fog surges forward slightly, player gets another chance with a 2s shorter window.

**Signposting:**
- **Rhythm:** Fog advances in pulses, giving the player time to think between surges.
- **Contrast:** Unrecalled landmarks glow brighter as fog approaches them.

**Failure design:**
- On second failure, the Dock Crates pulse more obviously (novice assist — diegetic: "the crates resist the fog").
- Full failure (fog covers all landmarks): 3s fog-engulf animation → instant restart at the fog trigger point (≤5s total retry latency).

**Dual-input mapping:**
- Touch: tap the landmark. PC: click the landmark. Camera auto-centers, no panning needed for first recall.

**Acceptance tests:**
- ≥80% recall Training Data location within 2 attempts.
- Failure-to-retry ≤5s.

---

### Beat 4 — Full Recall Sequence (130–200s): "Mastery Ladder + Error Recovery"

**Goal:** Player must recall remaining 2 concepts in sequence to fully dispel the fog.

**Setup:**
- Fog regroups after partial retreat. Two more recall prompts appear sequentially:
  - Prompt 2: gear icon + chart icon with "?" → Chart Table (Model)
  - Prompt 3: cannonball icon + lightning icon with "?" → Cannon (Inference)
- Each correct recall pushes the fog back another third.
- After the third correct recall, the Cannon fires and the fog is completely destroyed in a dramatic blast.

**Mastery ladder pacing:**
- Prompt 1 (Beat 3): generous time window (12s).
- Prompt 2: medium time window (10s).
- Prompt 3: tight time window (8s). The fog is close; the cannon must fire.

**Novice assist (after 2 failures on any prompt):**
- The correct landmark emits a faint sound cue (diegetic: "the landmark calls out").
- The fog slows slightly, extending the window by 3s.

**Expert mastery path:**
- If the player recalls all 3 correctly on first attempt AND total recall time < 15s → a **hidden cave entrance** glows on the cliff face beneath the cannon.
- Entering the cave yields a **bonus chart fragment** (expert secret, 10–30% first-play discovery).

**Failure design:**
- Each individual prompt failure: immediate retry at that prompt (no restart to prompt 1).
- Full sequence failure (3+ total failures across prompts): brief fog-engulf → restart at Beat 3 trigger. Total retry ≤5s.
- Quit rate target at this beat: <10%.

**Acceptance tests:**
- Failure rate decreases across the 3-prompt ladder (learning curve visible).
- Players who fail prompt 2+ twice succeed on attempt 3–4 (assist working).
- Expert cave discovery: 10–30%.

---

### Beat 5 — Resolution & Reward (200–240s): "Chart Fragment + Island Complete"

**Goal:** Deliver the reward and preview the next island.

**Setup:**
- The fog is destroyed. The cannon's blast echoes across the sea.
- A **Chart Fragment** floats down from where the fog was and lands in the player's inventory tray (bottom zone). Lock-in animation: fragment snaps into a partial sea chart in the HUD.
- The camera pans to the ocean horizon, revealing the silhouette of **Island 2** emerging from the mist.
- A **giant squid tentacle** briefly surfaces near Island 2 and submerges — boss stinger.
- "Island 1 Complete" badge appears (no text — just the island icon getting a gold border + checkmark).

**Acceptance tests:**
- ≥95% understand they earned a chart fragment (inventory glow + map update).
- ≥90% look toward Island 2 (camera guides naturally).
- Boss stinger recognition: ≥50% mention squid in post-test ("what did you notice?").

---

## Iteration Hypotheses

If telemetry reveals friction, apply these changes:

### If Beat 1 fails (>20% cannot place first concept within 2 attempts):
1. **Increase affordance strength:** Make the concept card auto-hover over the correct landmark after 8s idle.
2. **Reduce spatial distance:** Move dock crates closer to pier so the first interaction is nearly immediate.
3. **Add a pre-interaction:** A single coin collected on the pier teaches tap-to-interact before the concept card appears.

### If Beat 3 fails (>20% fail first recall despite 2 attempts):
1. **Simplify prompt:** Replace icon riddle with direct landmark highlight (the prompt shows the landmark itself, not abstract icons).
2. **Slow fog further:** Initial fog speed reduced by 30%, giving more decision time.
3. **Strengthen novice assist:** Correct landmark pulses from the first attempt (not just after failure).

### If quit rate at Beat 4 exceeds 10%:
1. **Reduce sequence to 2 recalls** (remove prompt 3, cannon fires after 2 correct).
2. **Add a mid-sequence reward** (small coin burst after each correct recall to reinforce progress).
3. **Increase assist window** to 5s additional per failure to reduce time pressure perception.

---

## Summary Table

| Beat | Time | Core Teaching | Hazard | Acceptance |
|---|---|---|---|---|
| B0 | 0–10s | Move + interact | None | 95% act within 10s |
| B1 | 10–45s | Place concept | None | 80% within 2 attempts |
| B2 | 45–90s | Pattern: walk → card → place | None | 90% collect all 3 |
| B3 | 90–130s | Recall under pressure | Cursed Fog | 80% within 2 attempts |
| B4 | 130–200s | Recall ladder + recovery | Cursed Fog (escalated) | Failure rate decreases |
| B5 | 200–240s | Reward + preview | None | 95% understand reward |
