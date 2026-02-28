# Audio Direction

> **Source of truth:** `Design/Aesthetic.md` (motion tokens, tone) · `Knowledge/audio/music-and-sonic-feedback.md` (sonic design rules)  
> **Status:** Canonical audio design for all game states and encounters.

---

## Audio Philosophy

Audio in Dead Reckoning is **functional first, atmospheric second**. Every sound serves at least one of:

1. **Feedback** — confirm player action (place, recall, fail, reward).
2. **Signposting** — audio cue that teaches or warns without text.
3. **Pacing** — music intensity matches threat level and emotional arc.
4. **Atmosphere** — reinforce the pirate/ocean/memory-palace fantasy.

---

## Aesthetic Constraints

- **8-bit chiptune** for all music — 4-channel (2 pulse, 1 triangle, 1 noise) for authenticity.
- **SFX:** Can use slightly richer samples but should feel cohesive with chiptune music.
- **No voice acting.** Character expression is via musical stingers and icon bubbles.
- **Duration rules:** UI motion SFX ≤200ms (matches `--duration-panel`). Feedback SFX ≤500ms. Music stingers ≤2s.

---

## Music Layers

### Adaptive Music System

Music uses a **layered intensity model** — the same base track plays throughout an island, but layers add/remove based on game state:

| Layer | Description | Active During |
|---|---|---|
| **Base** | Calm ambient — waves, wind, soft melody (triangle wave) | Exploration, encoding |
| **Rhythm** | Percussion loop (noise channel) adds energy | Encoding near landmarks |
| **Tension** | Dissonant pulse wave harmony, rising pitch | Encounter trigger, recall mode |
| **Urgency** | Full 4-channel intensity, faster BPM | Recall timer < 50% |
| **Resolution** | Major-key release, triumphant arpeggio | Correct recall, encounter complete |

### Per-Island Themes

Each island has a unique base melody that varies the same harmonic structure:

| Island | Musical Character | Key/Mode | BPM |
|---|---|---|---|
| 1 — Bay of Learning | Gentle, exploratory, slightly mysterious | C major / A minor | 90 |
| 2 — Driftwood Shallows | Rolling, wave-like, with uneasy undertones | D minor | 100 |
| 3 — Coral Maze | Playful but competitive, staccato | G major | 110 |
| 4 — Storm Bastion | Dark, echoey, ancient | E minor | 95 |
| 5 — Kraken's Reach | Ominous, building, massive | C minor | 80 → 120 (adaptive) |

### Overworld Theme

- Broad, hopeful sea shanty feel.
- Slower BPM (80), triangle-wave melody with gentle pulse-wave harmony.
- Adds a swell when approaching an undiscovered island.

---

## SFX Catalog

### Core Interaction Sounds

| Event | Sound Description | Duration | Emotional Role |
|---|---|---|---|
| **Concept card appears** | Bright ascending 3-note chime | 300ms | Discovery, curiosity |
| **Concept drag start** | Soft click + sustained low hum | 100ms + loop | Engagement |
| **Concept placed (lock-in)** | Satisfying "thunk" + sparkle arpeggio | 500ms | Commitment, delight |
| **Recall prompt appears** | Warning bell (2 strikes) | 400ms | Alertness |
| **Correct recall** | Major-chord burst + cannon/whoosh variant | 500ms | Triumph |
| **Incorrect recall** | Dissonant buzz + muffled thud | 300ms | Mistake (not punishing) |
| **Recall timeout** | Descending chromatic run | 600ms | Urgency → failure |
| **Fail state (fog engulfs)** | Low rumble + fade-to-silence | 1000ms | Reset, not shame |
| **Retry / restart** | Quick ascending "boot-up" tone | 200ms | Fresh start |

### Encounter-Specific Sounds

| Encounter | Distinctive Audio | Purpose |
|---|---|---|
| Cursed Fog | Whispered wind + sub-bass pulse | Creeping dread |
| Storm | Thunder crack + rain loop | Staccato urgency |
| Rival Battle | Cannon fire + creak-and-splash | Competitive rhythm |
| Ruins | Stone scraping + echo drip | Puzzle atmosphere |
| Giant Squid | Deep horn blare + tentacle suction | Boss gravitas |

### UI Sounds

| Event | Sound | Duration |
|---|---|---|
| Button tap / click | Hard pixel "tick" | 50ms |
| Menu open | Panel slide + soft chime | 150ms |
| Menu close | Reverse slide | 100ms |
| Chart fragment earned | Treasure jingle (5-note ascending) | 800ms |
| Upgrade earned | Rarity-appropriate fanfare (common=short, legendary=grand) | 500ms–1500ms |
| Achievement / title | Triumphant 8-bar fanfare | 2000ms |

---

## Bit (Parrot) Audio

- **Idle chirp:** 2 randomized short squawk variants, plays every 15–30s during exploration.
- **Assist flight:** Quick wing-flutter + directional chirp (sound pans toward correct landmark).
- **Celebration:** Excited rapid chirps on encounter completion.

**Design note:** Bit's sounds must not compete with recall prompt SFX. Bit chirps are lower-priority and duck under encounter audio.

---

## Audio Accessibility

| Feature | Implementation |
|---|---|
| Independent volume sliders | Music, SFX, and Bit chirps separately adjustable |
| Mute all audio | Single toggle, game remains fully playable |
| Visual-only mode | All audio cues have equivalent visual feedback (already designed into HUD) |
| Reduced audio complexity | Option to disable layered music (play base layer only) |

---

## Technical Notes

- All audio assets: WAV or OGG, mono, 44.1kHz. Chiptune can be generated at runtime via Web Audio API oscillators.
- Spatial panning: minimal (portrait layout is narrow), but Bit's assist flight uses slight left/right pan.
- Audio sprite sheets preferred for SFX (single file, offset playback) to minimize load.
- Preload current island + encounter audio only (matches performance budget from `Knowledge/engineering/performance-budget-mobile.md`).

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `audio_music_layer_changed` | `island_id`, `layer`, `trigger` |
| `audio_sfx_played` | `sfx_id`, `context` |
| `audio_muted` | `channel`, `muted` |
| `audio_setting_changed` | `setting`, `old_value`, `new_value` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Players distinguish success vs. fail sounds reliably | ≥90% correct identification in audio-only test |
| Music intensity matches reported tension levels | Correlation ≥0.7 between music layer and player-reported urgency |
| Audio does not mask recall timing cues | 0 reports of "couldn't tell how much time I had" due to audio |
| Game fully playable with audio muted | 100% — all cues have visual equivalents |
| Audio load does not impact performance budget | Island audio bundle ≤500KB |
