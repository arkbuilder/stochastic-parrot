# Ship Upgrades

> **Source of truth:** `Design/IslandProgression.md` (unlock schedule) · `Design/Aesthetic.md` (rarity tokens)  
> **Status:** Canonical ship component tree and upgrade effects.

---

## Design Philosophy

Ship upgrades are **rewards that make recall more forgiving**, not more powerful. They reduce punishment, not increase damage. This keeps the core mechanic (memory) as the primary skill while rewarding progression with comfort.

Upgrades are **automatic** — the player earns them by completing islands, not by navigating a tech tree. This keeps the UX simple and avoids distracting from the place/recall core loop.

---

## The Ship: *Loci*

The player's ship is the *Loci* — a small but sturdy caravel. It starts in its base configuration and visually evolves as upgrades are earned.

### Base Stats

| Stat | Base Value | Description |
|---|---|---|
| **Recall Window** | Base time per encounter spec | Time allowed to answer recall prompts |
| **Error Tolerance** | 0 extra | Bonus wrong-answer allowance before fail state |
| **Storm Resistance** | 0 | Extra hits tolerated in storm encounters |
| **Sailing Speed** | 1.0x | Overworld auto-sail speed multiplier |
| **Fog Resistance** | 0 | Bonus seconds before fog fully engulfs |

---

## Upgrade Schedule

| Island Completed | Upgrade Earned | Effect | Visual Change |
|---|---|---|---|
| Island 1 | — | (None — Island 1 is the tutorial) | — |
| Island 2 | **Reinforced Mast** | Sailing speed 1.2x + Bit flies faster during assists | Taller mast, pennant flag |
| Island 3 | **Enchanted Cannon** | +1 error tolerance in Rival Pirate Battles | Cannon glows cyan (`--cyan-400`) |
| Island 4 | **Ironclad Hull** | +1 storm resistance (extra hit before fail) | Hull plating visible, darker wood |
| Island 5 (Boss) | **Golden Compass** | Recall window +2s on all encounters (post-game replays) | Compass on deck glows gold |
| All Expert Bonuses | **Ghostlight Lantern** | Secret Island route visible + all fog-of-war cleared | Lantern on bow glows pink (`--pink-500`) |

---

## Upgrade Rarity Mapping

Using `Design/Aesthetic.md` rarity tokens:

| Upgrade | Rarity | Color Token |
|---|---|---|
| Reinforced Mast | Common | `--color-rarity-common` (gray-100) |
| Enchanted Cannon | Uncommon | `--color-rarity-uncommon` (green-400) |
| Ironclad Hull | Rare | `--color-rarity-rare` (blue-500) |
| Golden Compass | Epic | `--color-rarity-epic` (violet-500) |
| Ghostlight Lantern | Legendary | `--color-rarity-legendary` (yellow-400) |

---

## Upgrade Award Flow

1. Island encounter resolved successfully.
2. **Upgrade animation:** New component materializes on the ship (particle burst in rarity color, 1.5s).
3. Brief **stat comparison** overlay — before/after with icon (no text, icon + number change).
4. Ship sails away with the upgrade visually present.

**Rule:** No upgrade menu, no choices, no currency. Earn the island → get the upgrade. Simplicity is the design.

---

## Visual Upgrade Progression

The *Loci* should look noticeably different at each stage:

```
BASE         → +Mast        → +Cannon      → +Hull        → +Compass     → +Lantern
Small caravel  Taller mast    Glowing cannon  Iron plates    Gold compass   Pink bow light
```

Each upgrade is additive — the ship accumulates visible improvements. By Island 5, the *Loci* should look like a veteran vessel.

---

## Gameplay Impact Summary

| Encounter Type | Affected By | Effect |
|---|---|---|
| Cursed Fog | Fog Resistance (none by default) | No upgrade helps fog directly — mastery only |
| Storm | Ironclad Hull | +1 hit before fail |
| Rival Pirate Battle | Enchanted Cannon | +1 wrong answer forgiveness |
| Ruins | (None) | Pure puzzle — no upgrade mitigation |
| Giant Squid | Golden Compass | +2s recall window per tentacle |
| Overworld Sailing | Reinforced Mast | 1.2x sailing speed |
| Secret Island | Ghostlight Lantern | Route access |

**Design note:** Cursed Fog and Ruins are deliberately unaffected by upgrades. They test pure memory. This preserves the integrity of the core verb.

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `upgrade_earned` | `upgrade_id`, `island_id`, `rarity` |
| `upgrade_effect_applied` | `upgrade_id`, `encounter_id`, `effect_type` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Players notice visual upgrade on ship | ≥80% mention ship change in post-test |
| Upgrade effects felt during gameplay | ≥70% report encounters feel "more manageable" on later islands |
| No upgrade makes recall trivial | Expert par times remain challenging even with all upgrades |
| Upgrade flow takes <5s from earn to resume | Average ≤4s |
