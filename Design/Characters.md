# Characters

> **Source of truth:** `Design/GameHook.md` (cast references) · `Design/Aesthetic.md` (faction tokens, rarity system)  
> **Status:** Canonical character roster, visual direction, and behavioral roles.

---

## 1. Player Character — Captain Mnemona Vex

### Identity

| Field | Value |
|---|---|
| **Name** | Mnemona "Nemo" Vex |
| **Role** | Pirate-cartographer, captain of the ship *Loci* |
| **Personality** | Curious, methodical, quietly competitive. Talks to herself while charting. |
| **Motivation** | Chart the entire Memory Sea and prove that structured knowledge beats brute force. |
| **Faction color** | `--color-faction-player` (cyan-400 accent) |

### Visual Spec

- **Sprite size:** 16×16 base tile, 32×32 for close-up / dialogue portraits.
- **Silhouette rule:** Identifiable by tricorn hat + sextant on belt. Must read clearly at 16px.
- **Color palette:** Dark coat (`--gray-700`), cyan trim (`--cyan-400`), yellow buttons (`--yellow-400`).
- **Idle animation:** 2-frame breathing loop + occasional sextant check (4 frames).
- **Move animation:** 4-frame walk cycle, 4 directions (top-down).
- **Place animation:** Arm extends, item locks into landmark — 3 frames + particle burst.
- **Recall animation:** Eyes flash cyan, hand points at landmark — 2 frames.
- **Fail animation:** Hat tips forward in frustration — 2 frames, quick reset.

---

## 2. The Parrot — Bit

### Identity

| Field | Value |
|---|---|
| **Name** | Bit |
| **Role** | Navigator assistant / novice assist delivery mechanism |
| **Personality** | Chatty (icon-based squawks), loyal, slightly sarcastic via body language |
| **Faction color** | `--color-faction-friendly` (green-400) |

### Gameplay Function

- Bit sits on Nemo's shoulder during exploration.
- During recall, Bit flies to the correct landmark **after 2 failures** as a diegetic novice assist.
- Bit chirps near expert secret entrances if the player lingers nearby (curiosity breadcrumb).
- Bit is never the source of explicit instruction — only spatial hints via movement.

### Visual Spec

- **Sprite size:** 8×8 sitting, 12×12 flying.
- **Color:** Bright green body (`--green-400`), yellow beak (`--yellow-400`).
- **Animations:** Sit-idle (2 frames), fly-to-landmark (4 frames), excited-bounce (3 frames).

---

## 3. Rival Captain — Redmond Null

### Identity

| Field | Value |
|---|---|
| **Name** | Captain Redmond Null |
| **Role** | Antagonist pirate, brute-force learner (foil to Nemo's method) |
| **Personality** | Aggressive, impatient, overconfident. Memorizes by repetition, not structure. |
| **Motivation** | Reach Kraken's Reach first and claim the Golden Chart by force. |
| **Faction color** | `--color-faction-enemy` (red-500) |

### Gameplay Function

- Appears as the challenger in Rival Pirate Battle encounters (Island 3+).
- His ship, the *Overfit*, is visually aggressive (red sails, bristling cannons).
- His dialogue (icon-speech-bubbles, no text) conveys bluster and challenge.
- Represents the "wrong way to learn" — cramming without understanding.

### Visual Spec

- **Sprite size:** 16×16 base, 32×32 portrait.
- **Silhouette rule:** Broad shoulders, no hat (bald head + eye patch). Opposite silhouette to Nemo.
- **Color:** Red coat (`--red-500`), black trim (`--gray-900`), orange belt (`--orange-500`).
- **Animations:** Idle-arms-crossed (2 frames), fire-cannon (3 frames), defeat-fist-shake (3 frames).

---

## 4. The Giant Squid — The Kraken of Recall

### Identity

| Field | Value |
|---|---|
| **Name** | The Kraken (unnamed in-world — simply "it") |
| **Role** | Final boss. Cumulative mastery test. |
| **Personality** | Ancient, unknowable, vast. Not evil — it tests worthiness. |
| **Faction color** | `--color-faction-boss` (pink-500) |

### Gameplay Function

- Tentacles wrap the player's ship — each tentacle represents a concept from a previous island.
- Defeating tentacles = recalling concepts correctly.
- The Kraken is never fully visible — only tentacles and one enormous eye.
- The eye tracks player actions (cosmetic but atmospheric).

### Visual Spec

- **Tentacle sprites:** 8×48 per tentacle segment, animated sway (3 frames).
- **Eye sprite:** 32×32, blinks and tracks (separate pupil layer).
- **Color:** Deep violet body (`--violet-500`), pink suckers (`--pink-500`), cyan bioluminescent spots.
- **Boss health bar:** Uses `--bar-health-fill` tokens. Pink fill (`--pink-500`) against dark background.

---

## 5. NPCs — Landmark Spirits (Optional)

Each island may have a **Landmark Spirit** — a ghostly figure that appears when the player first approaches a landmark. Spirits serve as environmental signposts:

- They pantomime the concept's meaning (e.g., the Dock Spirit lifts crates repeatedly = "data input").
- They vanish after the concept is placed.
- They are entirely optional for the vertical slice (stretch content).

### Visual Spec

- Semi-transparent (`--opacity-muted`), single-color tint matching the island's accent.
- 16×16 sprites, 2-frame idle loop.

---

## Sprite Sheet Summary

| Character | Base Size | Animations | Priority |
|---|---|---|---|
| Nemo Vex | 16×16 / 32×32 | Idle, walk(4dir), place, recall, fail | **Must ship** |
| Bit | 8×8 / 12×12 | Sit, fly, bounce | **Must ship** |
| Redmond Null | 16×16 / 32×32 | Idle, fire, defeat | Should ship (Island 3) |
| Kraken | Tentacles 8×48, Eye 32×32 | Sway, wrap, retreat, blink | Stretch (Island 5) |
| Landmark Spirits | 16×16 | Idle, pantomime, vanish | Stretch |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Player character recognizable at 16×16 | Silhouette test pass with 5 testers |
| Bit's assist function understood without explanation | ≥80% follow Bit to correct landmark |
| Redmond Null perceived as rival, not friend | ≥90% identify as opponent in post-test |
| Kraken creates emotional tension | ≥70% report increased urgency during boss |
