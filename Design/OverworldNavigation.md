# Overworld Navigation

> **Source of truth:** `Design/IslandProgression.md` (island sequence) · `Design/GameDesign.md` (portrait layout)  
> **Status:** Canonical overworld sailing mechanics and map system.

---

## Overview

The overworld is the **Memory Sea** — a top-down ocean map the player sails between islands. It serves three purposes:

1. **Pacing:** Breathing room between encode/recall intensity.
2. **Progression visualization:** The sea chart fills in as islands are completed.
3. **World-building:** The sea itself tells the story — wrecks, fog banks, and creature silhouettes create atmosphere.

---

## Navigation Model

### Node-Based Sailing (Recommended for Scope)

The overworld uses a **node-based** navigation system, not free movement:

- Each island is a **node** on the sea chart.
- Discovered nodes are connected by **sailing routes** (visible dotted lines).
- The player selects a destination node and the ship **auto-sails** along the route.
- Sailing takes **10–20s** real-time with a simple parallax ocean animation.
- During sailing, the camera may pan to show a **narrative sighting** (Null's ship, Kraken tentacle, floating wreckage).

**Why node-based:**
- Eliminates free-movement pathfinding complexity.
- Keeps session time predictable.
- Works perfectly in portrait layout (chart fills the screen, tap a node to sail).
- Enables authored narrative sighting moments at specific route segments.

### Stretch Goal: Free Sailing

If scope allows, add optional free sailing within a bounded sea region around each route. This enables:
- Bonus floating loot pickup (coins, minor score rewards).
- Random micro-encounters (small storms, driftwood puzzles).
- Hidden route to Secret Island (expert discovery).

---

## Portrait Layout — Overworld

- **Top zone:** Sea horizon + atmospheric elements (clouds, distant islands, Kraken stinger).
- **Mid zone:** Sea chart with island nodes. Completed nodes glow gold; next node pulses cyan. Ship icon shows current position.
- **Bottom zone:** Ship HUD — chart fragment count, current heading indicator, "Sail" button for selected destination.

---

## Map Reveal / Fog of War

- The sea chart starts almost entirely covered in **fog** (`--gray-950` with animated swirl).
- Completing an island clears fog around that island and reveals the route to the next node.
- Expert bonuses clear additional fog, revealing optional lore icons (floating bottles, wreck markers).
- The fog is the **visual representation of the Memory Sea's curse** — knowledge disperses unless charted.

### Fog clear rules

| Trigger | Fog Cleared |
|---|---|
| Island N completed | Island N region + route to Island N+1 |
| Expert bonus on Island N | Small bonus region near Island N (lore/cosmetic) |
| All expert bonuses collected | Hidden Reef route revealed |

---

## Sailing Interactions

### During Auto-Sail (Node-Based)

| Event | Player Action | Frequency |
|---|---|---|
| **Smooth sailing** | Watch parallax ocean, Bit idle-perches | Every route |
| **Narrative sighting** | Auto-camera pan to point of interest (5–10s, non-interactive) | 1 per new route |
| **Floating coin cluster** | Tap coins as ship passes (bonus score, optional) | 50% of routes |

### During Free Sailing (Stretch)

| Event | Player Action | Frequency |
|---|---|---|
| **Driftwood puzzle** | Recall one concept from a previous island for bonus reward | Rare |
| **Minor storm** | Tap rhythm minigame (tap when lightning flashes) | Rare |
| **Message bottle** | Tap to collect lore fragment (pictographic) | Rare |

---

## Dual-Input Mapping

| Action | Touch | PC |
|---|---|---|
| Select destination node | Tap node on chart | Click node on chart |
| Confirm sail | Tap "Sail" button | Click "Sail" button or Enter |
| Collect floating coins | Tap coins during sail | Click coins during sail |
| Pan chart (if zoomed) | Drag | WASD / mouse drag |

---

## State Model

```
OVERWORLD_ENTER → CHART_VISIBLE → NODE_SELECTED → SAILING
                                                      ↓
                                            SIGHTING (optional)
                                                      ↓
                                              ISLAND_ARRIVE
```

---

## Compass and Heading

- A small **compass** in the bottom-left HUD shows cardinal direction during sailing.
- The compass uses `--yellow-400` for the north needle — consistent with the reward/navigation color.
- Compass is cosmetic in node-based mode but functional in free-sailing stretch.

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `overworld_entered` | `session_id`, `from_island_id` |
| `node_selected` | `destination_island_id` |
| `sailing_started` | `from_node`, `to_node`, `route_id` |
| `sighting_shown` | `sighting_type`, `route_id` |
| `floating_loot_collected` | `loot_type`, `route_id` |
| `island_arrived` | `island_id` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Players navigate to Island 2 without instruction after completing Island 1 | ≥85% within 30s of overworld entry |
| Sailing duration feels like breathing room, not boredom | Median satisfaction ≥4/5 in post-test |
| Fog-of-war communicates progression | ≥80% notice chart filling in |
| Sighting moments noticed | ≥70% mention at least one sighting in post-test |
| Portrait layout usable one-handed during overworld | No accidental mis-taps in ≥90% of sessions |
