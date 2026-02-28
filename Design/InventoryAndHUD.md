# Inventory and HUD

> **Source of truth:** `Design/Aesthetic.md` (component tokens, layout zones) · `Design/CoreInteraction.md` (phase layouts)  
> **Status:** Canonical HUD layout, concept inventory, and UI component spec.

---

## HUD Philosophy

The HUD is **minimal during gameplay and rich during transitions**. During encoding and recall, the HUD shows only what's immediately actionable. Between phases, it expands to show progression.

**Rule:** No HUD element should occlude the active play area. All persistent HUD lives in the top or bottom portrait zones.

---

## Portrait Zone Allocation

### During Exploration / Encoding

| Zone | Content | Height |
|---|---|---|
| **Top** | Island mini-map (landmarks shown as icons, placed = gold, empty = pulsing cyan) | ~15% screen |
| **Mid** | Game world — avatar, landmarks, island environment | ~60% screen |
| **Bottom** | Concept card tray (unplaced concepts as draggable cards) + coin counter | ~25% screen |

### During Recall

| Zone | Content | Height |
|---|---|---|
| **Top** | Threat visualization (fog wall / storm / enemy ship / squid) | ~20% screen |
| **Mid** | Island with glowing landmarks (recall targets) | ~55% screen |
| **Bottom** | Timer bar + recall prompt icon + attempt indicator | ~25% screen |

### During Overworld

| Zone | Content | Height |
|---|---|---|
| **Top** | Sea horizon + atmospheric skybox | ~20% screen |
| **Mid** | Sea chart with island nodes | ~55% screen |
| **Bottom** | Ship status (chart fragments, heading, "Sail" button) | ~25% screen |

---

## Concept Inventory

### In-Game Tray (Encoding Phase)

- Located in the bottom zone.
- Shows **unplaced concept cards** as 48×48 icon tiles in a horizontal row.
- Max 3 cards visible (never more than 3 concepts per island).
- When a card is placed, it animates out of the tray and locks into the landmark.
- Tray uses `--color-surface-panel` background, `--border-ui` (2px) frame.

### Island Complete Summary

After each island, a brief summary overlay shows:
- 3 concept icons, each paired with their landmark icon.
- Check marks for successful recalls.
- Star for expert bonus (if earned).
- Chart fragment visual snapping into the sea chart.

### Concept Journal (Pause Menu)

- Accessible via pause/menu button (top-right corner, `--size-12` touch target).
- Grid of all discovered concepts across all islands.
- Each entry shows: concept icon + landmark icon + island name badge.
- Placed concepts are gold-bordered; unvisited concepts are hidden (fog icon).
- The journal is **optional** — a reference for players who want to review, never required for gameplay.

---

## HUD Components

### Health / Ship Integrity Bar

- Used during Storm and Rival Pirate encounters.
- Horizontal bar at the top-left of the top zone.
- Uses `--bar-health-fill` (green-400) and `--bar-health-fill-critical` (red-500 at ≤25%).
- `--bar-health-bg` (gray-700) background.
- Width: 120px. Height: 12px. Border: `--border-ui` (2px black).

### Timer Bar (Recall Phase)

- Horizontal bar spanning the bottom zone width.
- Fills from right to left as time decreases.
- Color shifts: `--cyan-400` → `--yellow-400` (50%) → `--red-500` (25%).
- Height: 8px. No border — embedded in bottom zone panel.

### Chart Fragment Counter

- Small badge in the bottom-right during overworld.
- Icon: map fragment + "N/5" counter using `--type-score-md` numeric font.
- Uses `--yellow-400` for collected, `--gray-300` for uncollected.

### Coin Counter

- Top-right corner during island exploration.
- Icon: bouncing coin (2-frame animation) + running total.
- Uses `--type-score-sm` numeric font, `--yellow-400` color.

### Attempt Indicator (Recall Phase)

- 1–3 small pip icons below the timer bar.
- Filled pip = attempt used. Empty pip = attempt remaining.
- Uses `--red-500` for filled, `--gray-300` for empty.

---

## Interactive Elements

### Concept Card (Draggable)

- Size: 48×48px (meets `--target-min-touch`).
- Background: `--color-surface-raised`.
- Border: `--border-ui` (2px), `--color-border-default`.
- Icon: concept-specific (Training Data = fish crate, etc.).
- States:
  - **Default:** Resting in tray.
  - **Dragging:** Slightly enlarged (1.1x), shadow `--shadow-pixel-md`, follows finger/cursor.
  - **Over valid target:** Border shifts to `--cyan-400`, landmark pulses.
  - **Placed:** Animates to landmark, disappears from tray.

### Landmark Target (During Recall)

- Landmarks glow with `--cyan-400` border when in recall mode.
- On hover/proximity: border thickens to `--border-strong` (3px).
- On correct select: burst animation (`--green-400` flash, `--duration-fast`).
- On incorrect select: shake animation (`--motion-shake-sm`, `--red-500` border flash).

### Pause Button

- Position: top-right corner, outside active play area.
- Size: `--size-12` (48px) for touch safety.
- Icon: double vertical bars (pixel style).
- Opens pause overlay with: Resume, Concept Journal, Settings, Quit to Overworld.

---

## Responsive Rules

| Device | Adaptation |
|---|---|
| Small phone (≤375px width) | Concept cards scale to 40px, timer bar text hidden (bar-only) |
| Standard phone (376–428px) | Default layout as specified |
| Large phone / tablet (>428px) | Wider concept tray spacing, larger mini-map |
| PC | Mouse hover states active, concept cards show tooltip on hover |

---

## Accessibility

- High-contrast mode: All HUD borders thicken to `--border-strong`, text switches to `--color-text-primary` on `--color-surface-canvas`.
- Reduced-motion mode: Timer bar does not animate color shift, concept cards snap instead of drag.
- Screen reader: HUD elements have semantic labels (concept names, landmark names, timer percentage).

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `hud_concept_card_dragged` | `concept_id`, `input_type` |
| `hud_concept_card_placed` | `concept_id`, `landmark_id`, `drag_duration_ms` |
| `hud_recall_landmark_selected` | `landmark_id`, `correct`, `input_type` |
| `hud_pause_opened` | `phase`, `beat_id` |
| `hud_journal_viewed` | `concepts_reviewed[]` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Players understand concept tray without instruction | ≥90% drag first card within 15s |
| Timer bar creates appropriate urgency | ≥80% report "time pressure felt fair" |
| Pause button accessible one-handed | No accidental pauses in ≥95% of sessions |
| HUD does not occlude active gameplay | 0 reports of "can't see landmark" in testing |
| Journal discoverable but not required | ≥40% open journal at least once |
