# Scope and Milestones

> **Source of truth:** `Design/GameHook.md` (vertical slice + risks) · `Design/IslandProgression.md` (full game scope)  
> **Status:** Canonical build plan, cut line, and risk mitigations.

---

## Project Scope

### Full Game

| Component | Description |
|---|---|
| Islands | 5 main islands + 1 secret island |
| Concepts | 15 AI/ML concepts across 5 tiers |
| Encounters | 5 types (Fog, Storm, Battle, Ruins, Squid Boss) |
| Characters | Nemo, Bit, Null, Kraken, Landmark Spirits |
| Overworld | Node-based sailing with fog-of-war map |
| Ship upgrades | 5 upgrades + 1 legendary |
| Scoring | Per-island + total + speed + accuracy leaderboards |
| Persistence | SQLite: highscores, progress, event log |
| Audio | 5 island themes + overworld + SFX catalog |
| Playtime | 30–50 minutes |

### Competition / Demo Build (Vertical Slice)

| Priority | Content | Playtime |
|---|---|---|
| **Must ship** | Island 1 (Bay of Learning) — full encode/recall/reward flow + all 6 onboarding beats | 3–5 min |
| **Should ship** | Island 2 (Driftwood Shallows) + overworld sailing between islands | +4–6 min |
| **Stretch** | Islands 3–5 + Squid Boss + full leaderboard | +15–25 min |
| **Bonus** | Secret Island + all expert mastery content | +5–10 min |

---

## Milestone Plan

### M0 — Foundation (Week 1)

**Goal:** Project bootstrapped, architecture validated, first screen renders.

| Deliverable | Owner | Definition of Done |
|---|---|---|
| npm project scaffolded (Vite + TS + Canvas) | Engineering | `npm run dev` shows blank canvas |
| SQLite + migration runner working | Engineering | Fresh `npm run db:migrate` succeeds |
| Design token CSS generated from `Aesthetic.md` | Engineering | Tokens importable, theme renders |
| Game loop skeleton (boot → menu → play → pause) | Engineering | State machine transitions logged |
| Input abstraction (touch + PC) | Engineering | `primary`, `move`, `secondary` actions normalized |
| Telemetry client stub | Engineering | Events log to console |

---

### M1 — Playable Island 1 (Week 2)

**Goal:** Complete vertical slice — Island 1 is fully playable on phone and PC.

| Deliverable | Owner | Definition of Done |
|---|---|---|
| Island 1 tile map + landmarks rendered | Art / Engineering | 3 landmarks visible, portrait layout correct |
| Player avatar (Nemo) with walk + place animations | Art | 16×16 sprite, 4-dir walk, place animation |
| Bit (parrot) idle + fly-to-landmark | Art | 8×8 sprite, follows player, flies on assist |
| Concept card tray + drag-to-place interaction | Engineering | 3 cards draggable, lock-in on correct landmark |
| Cursed Fog encounter (3 recall prompts) | Engineering | Fog advances, recall resolves, retry ≤5s |
| Novice assist (Bit flies to landmark after 2 fails) | Engineering | Diegetic assist triggers correctly |
| Expert mastery path (hidden cave, bonus fragment) | Engineering | Cave appears if all 3 correct first-attempt fast |
| Chart Fragment reward + island-complete summary | Engineering | Fragment earned, summary overlay shown |
| SFX: concept placed, recall correct/incorrect, fog | Audio | All core SFX play at correct events |
| Music: Island 1 adaptive layers | Audio | Base + tension + resolution layers switch |
| Telemetry events firing for all beats | Engineering | All GameDesign.md events logged |
| Playtest: 5 testers, no-text comprehension pass | QA | ≥80% complete Island 1 without guidance |

---

### M2 — Overworld + Island 2 (Week 3)

**Goal:** Two-island game with sailing, scoring, and persistence.

| Deliverable | Owner | Definition of Done |
|---|---|---|
| Overworld sea chart (node-based) | Engineering | 2 nodes, fog-of-war, sail animation |
| Island 2 tile map + 3 new landmarks | Art / Engineering | Distinct visual identity from Island 1 |
| Storm encounter | Engineering | Lightning flashes, concept selection, health bar |
| Scoring system (base + speed + combo) | Engineering | Score displays, grade awarded per island |
| SQLite persistence (progress + highscores) | Engineering | Progress survives app restart |
| Leaderboard display (per-island) | Engineering | Top 10 + player rank shown |
| Ship upgrade: Reinforced Mast (auto-awarded) | Engineering | Visual change + speed boost applied |
| Playtest: dual-input parity (5 touch, 5 PC) | QA | Completion time ±20% |

---

### M3 — Full Game (Weeks 4–5)

**Goal:** All 5 islands, all encounters, boss fight, full progression.

| Deliverable | Owner | Definition of Done |
|---|---|---|
| Islands 3–5 tile maps + landmarks + concepts | Art / Engineering | 9 new concept-landmark pairings |
| Rival Pirate Battle encounter | Engineering | 3-volley cannon duel |
| Ruins Exploration encounter | Engineering | Concept-chain sequential puzzles |
| Giant Squid Boss encounter | Engineering | Cross-island recall, tentacle mechanic |
| Captain Null character + ship sprite | Art | Appears in battle + overworld sighting |
| Kraken sprites (tentacles + eye) | Art | Boss renders, health bar functional |
| All ship upgrades | Engineering | 5 upgrades + Ghostlight Lantern |
| Narrative sighting moments | Engineering | Overworld camera events trigger |
| Full leaderboard (4 boards) | Engineering | Per-island, total, speed, accuracy |
| Optional lore objects (ruins journal) | Content | Pictographic panels viewable |
| Secret Island (if all expert bonuses) | Engineering | Hidden route, remixed encounters |
| Full audio (5 island themes + boss) | Audio | All adaptive layers working |
| Performance validation on mobile | QA | ≤3s load, stable frame pacing |

---

### M4 — Polish + Ship (Week 6)

**Goal:** Competition-ready build with polish and validated metrics.

| Deliverable | Owner | Definition of Done |
|---|---|---|
| Accessibility options (reduced motion, high contrast, mutes) | Engineering | All options functional |
| Concept Journal (pause menu) | Engineering | All discovered concepts browsable |
| Telemetry dashboard review | Product | Thresholds validated against targets |
| Full playtest (10 testers, mixed input) | QA | All acceptance criteria met |
| Bug fixes from playtest | Engineering | 0 P1 bugs, ≤3 P2 bugs |
| Performance optimization pass | Engineering | Mobile perf budget met |
| Build + deploy pipeline | Engineering | Hosted URL accessible |
| Pitch materials (screenshots, one-liner) | Product | Submission-ready |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Recall feels like a quiz, not adventure | Medium | Critical | Playtest early (M1). If recall prompts read as quiz, redesign to pure landmark-selection without icon riddles. |
| AI-generated sprites don't match aesthetic | Medium | High | Gate 2 quality check. Fallback: hand-edit or use pixel-art generators with strict palette constraints. |
| 5 islands is too much content for timeline | High | High | Cut line at M2 (2 islands). Ensure M2 is a complete, shippable game experience. |
| Touch drag interaction feels imprecise | Medium | Medium | Use generous snap zones (32px radius). Test on 3+ phone models at M1. |
| SQLite adds unwanted complexity | Low | Medium | Keep schema minimal. If blocked, use localStorage for MVP, migrate to SQLite in M3. |
| Cross-island recall (Squid Boss) too hard | Medium | Medium | Reduce tentacle count. Add island-of-origin visual hint on each tentacle. |
| Adaptive music implementation complex | Medium | Low | Ship with static tracks + manual layer switching first. Automate in M4. |

---

## Cut Line Decision Matrix

If behind schedule, cut in this order (bottom first):

| Priority | Content | Cut Impact |
|---|---|---|
| 1 (keep) | Island 1 fully playable | Game exists |
| 2 (keep) | Overworld + Island 2 | Progression demonstrated |
| 3 (nice) | Scoring + leaderboard | Competition angle |
| 4 (nice) | Islands 3–4 + encounters | Deeper game |
| 5 (stretch) | Island 5 + Squid Boss | Climax |
| 6 (stretch) | Secret Island | Expert completionism |
| 7 (bonus) | Concept Journal + full accessibility | Polish |
| 8 (bonus) | Full adaptive music | Audio refinement |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| M1 vertical slice playable on phone + PC | Date-bound: end of Week 2 |
| Competition build (M2) shippable as standalone game | Complete experience with 2 islands |
| Full game (M3) testable end-to-end | All 5 islands + boss completable |
| Ship build (M4) meets all design doc acceptance criteria | All thresholds from GameDesign.md validated |
