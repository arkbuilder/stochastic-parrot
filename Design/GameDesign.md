# MOBILE PORTRAIT ONBOARDING LEVEL — GAME DESIGN REQUIREMENTS (Claude Opus-Ready)

> **Use-case:** Portrait-mode phone game that may run on **phone or PC (mouse/keyboard)**.  
> **Intent:** Teach core mechanics **without explicit instructions**, using **environmental onboarding** and **short iteration loops**.

---

## CLAUDE: ROLE + OUTPUT CONTRACT (Activation Language)
**You are a senior game designer and UX systems designer.**  
Generate onboarding design using these concepts explicitly: **affordances, signposting, learn-by-doing, safe sandbox, pressure ramp, mastery ladder, short feedback loops, error recovery, flow, cognitive load, skill gating, optional mastery paths, novice assists, telemetry-driven iteration.**

**Output must include:**
1. **Beat map** (timeboxed sequence)  
2. **Screen layout notes** (portrait composition)  
3. **Dual-input mapping** (touch + PC)  
4. **Mechanic introduction plan** (one concept per beat)  
5. **Fail/retry design** (≤5s back to action)  
6. **Secrets / optional mastery** (expert reward + novice assist)  
7. **Telemetry spec** (events + pass/fail thresholds)  
8. **Acceptance tests** (player outcomes measurable)

---

## 1) PLATFORM & INPUT REQUIREMENTS

### 1.1 Portrait Mode Constraints
- **Playable area:** vertically stacked information; primary action in lower 1/3; game state in upper 1/3.
- **Thumb reach:** key controls must be reachable on standard phones one-handed.
- **Readability:** critical affordances must be visible without zooming or tiny UI.

### 1.2 Dual-Input Support (Touch + PC)
**Touch mappings (default):**
- **Primary action:** tap (or press/hold if variable)
- **Movement:** swipe or drag (if continuous), or auto-run with lane switching
- **Secondary:** long-press or two-finger tap (avoid early onboarding)

**PC mappings (default):**
- **Primary action:** left-click (press/hold supported)
- **Movement:** WASD/arrow keys OR mouse-drag (choose one primary)
- **Secondary:** right-click or Shift (locked until later)

**Requirement:** Every onboarding beat must be completable with **either** input scheme without special casing.

---

## 2) ONBOARDING DESIGN PRINCIPLES (NON-NEGOTIABLE)

### P1 — Teach With Space Then Pressure
Introduce mechanics first in a **safe sandbox**, then repeat under **mild pressure**, then combine with one prior mechanic.

### P2 — One New Concept Per Beat
Each beat introduces **exactly one** new rule/interaction.  
Max new concepts in onboarding slice: **3**.

### P3 — Short Feedback Loop
From failure to retry: **≤5 seconds**.  
From spawn to first meaningful decision: **≤3 seconds**.

### P4 — Guidance Without Text (Environmental Onboarding)
Use **signposting**: motion cues, contrast, framing, reward trails, geometry, timing.

### P5 — Two-Tier Experience
Include:
- **Expert mastery path**: optional, skill-rewarding, faster/better outcome  
- **Novice assist**: subtle support that appears after struggle, not as pity

---

## 3) ONBOARDING SLICE SCOPE

### 3.1 Time Budget
- Total onboarding slice: **3–7 minutes**
- Microbeats: **20–60 seconds** each

### 3.2 Core Learning Outcomes (Must Achieve)
Player can:
1. Perform **core verb** reliably (the main action)
2. Recognize **forward progression language** (where to go / what to do next)
3. Survive first hazard using intended response
4. Collect and use first reward/tool/power-up
5. Recover from failure and reattempt confidently

---

## 4) BEAT MAP TEMPLATE (PORTRAIT-FIRST)

> Replace `[CORE VERB]` and `[REWARD]` with your game’s specifics.

### Beat 0 — Static Start (0–10s): “Affordance Discovery”
**Goal:** Player experiments safely; understands progression direction.
- Start in a **non-threatening** screen.
- One obvious “go” direction via **camera framing / vertical composition**.
- Visible responsive feedback on touch/click.

**Acceptance tests:**
- 95% of players move/act within **10s** without text prompts.

---

### Beat 1 — First Threat (10–45s): “Pressure Introduction”
**Goal:** Teach `[CORE VERB]` as the correct response.
- Introduce **one simple hazard** moving toward player.
- Hazard is solvable with `[CORE VERB]` (jump/dash/tap-shoot/parry/etc.).
- If player does nothing, they fail quickly enough to learn urgency.

**Failure design:**
- Failure returns player to action in **≤5s**, near the threat.

**Acceptance tests:**
- ≥80% succeed within **2 attempts**.

---

### Beat 2 — First Reward (45–90s): “Systemic Learning”
**Goal:** Teach `[REWARD]` exists, moves/behaves, and changes capability.
- Present `[REWARD]` in a semi-contained space so it can’t be missed.
- Environment “funnels” the player into collecting it (soft constraints).

**Acceptance tests:**
- ≥90% collect `[REWARD]` without explicit instruction.
- ≥70% use new capability within **30s**.

---

### Beat 3 — Mastery Ladder (90–150s): “Precision Shaping”
**Goal:** Teach variable control (timing/hold length/aim) without words.
- 3-step ladder: easy → medium → requires precision
- The layout itself teaches: spacing, obstacle size, pacing, rhythm.
- Include a low-risk rehearsal variant before real punishment.

**Acceptance tests:**
- Failure rate decreases across the ladder (learning curve visible).

---

### Beat 4 — First Real Risk + Recovery (150–210s): “Error Recovery & Confidence”
**Goal:** Introduce first hard fail state; provide a subtle assist after struggle.
- First “pit” or high-consequence hazard appears.
- After 1–2 failures, enable a **novice assist** (e.g., temporary shield, extra platform, slower timing window).
- Assist must be **diegetic** (feels like the world, not UI pity).

**Acceptance tests:**
- Quit rate at this beat <10%.
- Players who fail twice are more likely to succeed on attempt 3–4.

---

### Beat 5 — Optional Mastery + Secret (anytime after Beat 2)
**Goal:** Layered experience for skilled curiosity.
- **Expert reward:** optional path requiring skill; yields bonus currency/shortcut/high score.
- **Novice assist secret:** a hidden help that struggling players naturally bump into.

**Acceptance tests:**
- Expert secret discovery: 10–30% on first play.
- Novice assist triggers predominantly for strugglers, not experts.

---

## 5) PORTRAIT SCREEN LAYOUT REQUIREMENTS

### 5.1 Visual Hierarchy
- **Top zone:** upcoming hazards / next goal preview (read the future)
- **Mid zone:** active play area
- **Bottom zone:** controls + immediate feedback + finger-safe space

### 5.2 Signposting Patterns (No Text)
Use at least 3 of the following:
- **Motion signposts:** enemy moves toward player, reward bounces/drifts
- **Contrast signposts:** brighter “go” path, darker non-path
- **Reward trail:** coin/points breadcrumb toward desired behavior
- **Geometry signposts:** obstacle heights imply hold duration / timing
- **Rhythm signposts:** repeating patterns that teach timing

---

## 6) FAIL / RETRY LOOP REQUIREMENTS

### 6.1 Time-to-Retry
- Failure animation + reset + regained control: **≤5 seconds**

### 6.2 Proximity
- Restart point must be **≤10 seconds** from the failure site.

### 6.3 Emotional Friction
- Avoid shame triggers: no scolding copy; no long “you lost” screens.
- Provide immediate “try again” affordance (tap anywhere / auto-restart).

---

## 7) TELEMETRY SPEC (MINIMUM REQUIRED)

### 7.1 Event Names
Log these events with timestamps + attempt counts:
- `onboarding_start`
- `first_input` (type: touch/click/key)
- `first_success_core_verb`
- `first_fail` (cause)
- `retry_start`
- `reward_seen`
- `reward_collected`
- `reward_used`
- `beat_completed` (beat_id)
- `secret_found` (expert|novice)
- `onboarding_complete`
- `quit` (location/beat_id)

### 7.2 Thresholds (Pass/Fail Targets)
- Time to first input: **≤10s** (95th percentile)
- Time to first correct core response: **≤60s** median
- Reward collection rate: **≥90%**
- Retry latency: **≤5s** median
- Quit rate in onboarding: **<10%**
- Failure count (median): **0–2**

---

## 8) ACCEPTANCE TESTS (PLAYTEST-DRIVEN)

### A) No-Text Comprehension
- Remove all tutorial text.  
- Observe whether players learn through affordances + signposting.

### B) Dual-Input Parity
- 10 testers touch-only, 10 testers PC-only.  
- Both groups must clear onboarding within similar time bands (±20%).

### C) Cognitive Load Limit
- Count new concepts introduced. Must be **≤3** in onboarding slice.
- If a tester cannot describe the goal in one sentence, reduce complexity.

---

## 9) IMPLEMENTATION NOTES (DESIGN OPS)
- Build onboarding as modular beats with toggles for difficulty, spawn spacing, timing windows.
- Iterate using telemetry: identify the first “spike” in failures and reshape geometry/signposting.

---

## 10) DESIGN PROMPT FOR CLAUDE (Fill-In Template)
**Claude, generate a specific onboarding level plan** using the above GDRD.

Inputs:
- Genre: `[YOUR GENRE]`
- Core verb: `[CORE VERB]`
- Reward/power-up: `[REWARD]`
- First hazard: `[HAZARD]`
- Progression direction: `[UP/DOWN/FORWARD/SCROLL]`
- Session length target: `[e.g., 60–180 seconds]`
- Monetization constraints (if any): `[none/cosmetic/ads/etc.]`

Deliver:
- Beat map with exact obstacles and placements (portrait composition)
- Dual-input mapping details
- Secret designs (expert + novice)
- Telemetry events + thresholds
- 3 iteration hypotheses (what you’ll change if Beat 1 fails)

---

## QUICK DECISION GATE (Answer These Before Building)
1. What is the **single** core verb you want mastered first?
2. What is the first hazard that forces it *cleanly*?
3. What reward changes capability without adding cognitive load?
