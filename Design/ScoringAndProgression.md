# Scoring and Progression

> **Source of truth:** `Design/CoreInteraction.md` (recall mechanics) · `Knowledge/engineering/sqlite-data-model-and-migrations.md` (persistence)  
> **Status:** Canonical scoring model, leaderboard design, and progression tracking.

---

## Scoring Philosophy

Score measures **memory quality**, not grinding. The scoring system rewards:

1. **Recall accuracy** — correct answers worth more than retries.
2. **Recall speed** — faster responses earn bonus points.
3. **Consistency** — completing sequences without error multiplies score.
4. **Exploration** — expert bonuses and secrets add to total.

Score is never required for progression. Islands unlock by completion, not by score threshold. Score exists for **replayability, competition, and leaderboard ranking**.

---

## Points Model

### Base Scoring (Per Recall Prompt)

| Outcome | Points | Notes |
|---|---|---|
| Correct on first attempt | **100** | Base value |
| Correct on second attempt | **50** | Reduced for retry |
| Correct on third+ attempt | **25** | Minimum — player still progresses |
| Timeout / fail-then-retry | **0** | No penalty, just no credit |

### Speed Bonus

| Response Time | Bonus Multiplier |
|---|---|
| ≤3s | 2.0x |
| 3–5s | 1.5x |
| 5–8s | 1.2x |
| 8s+ | 1.0x (no bonus) |

**Formula:** `prompt_score = base_points × speed_multiplier`

### Combo Multiplier

Consecutive correct first-attempt recalls build a combo:

| Streak | Multiplier |
|---|---|
| 1 | 1.0x |
| 2 | 1.5x |
| 3 | 2.0x |
| 4+ | 2.5x (cap) |

A single incorrect answer resets the combo to 0.

**Formula:** `combo_score = prompt_score × combo_multiplier`

### Island Score

```
island_score = sum(combo_score for each prompt)
             + expert_bonus (500 if earned, 0 otherwise)
             + coins_collected × 5
```

### Total Game Score

```
total_score = sum(island_score for each island)
            + completion_bonus (1000 for finishing all 5 islands)
            + dead_reckoner_bonus (2000 for defeating Kraken first-attempt clean)
```

---

## Grade System

Each island awards a letter grade based on score percentage of maximum possible:

| Grade | Threshold | Visual |
|---|---|---|
| S | ≥95% of max | Gold border + star (`--yellow-400`) |
| A | ≥80% | Gold border (`--yellow-400`) |
| B | ≥60% | Silver border (`--gray-100`) |
| C | ≥40% | Bronze border (`--orange-500`) |
| D | <40% | No border (completed but basic) |

Grades display on the sea chart next to each island node.

---

## Leaderboard Design

### Leaderboard Types

| Board | Scope | Ranking By |
|---|---|---|
| **Per-Island** | Single island best score | `island_score` descending |
| **Total Game** | Full playthrough | `total_score` descending |
| **Speed Run** | Full playthrough | `total_time_ms` ascending |
| **Accuracy** | Full playthrough | `first_attempt_percentage` descending |

### Leaderboard Entry Schema

```json
{
  "player_id": "string",
  "player_name": "string (max 12 chars)",
  "board_type": "island | total | speed | accuracy",
  "island_id": "string | null",
  "score": "number",
  "time_ms": "number",
  "accuracy_pct": "number",
  "grade": "S | A | B | C | D",
  "created_at": "ISO8601"
}
```

### Display

- Top 10 per board, plus the player's own rank.
- Accessible from the overworld pause menu → "Leaderboards" tab.
- Uses `--type-score-lg` for rank numbers, `--type-label-md` for names.
- Player's own entry highlighted with `--cyan-400` border.

### SQLite Integration

Maps directly to `Knowledge/engineering/sqlite-data-model-and-migrations.md`:

- `highscores` table stores leaderboard entries.
- `onboarding_progress` tracks per-island completion state and grade.
- Score submission follows idempotency rules from `Knowledge/engineering/highscore-and-progression-service.md`.

---

## Progression Tracking

### Chart Fragment Collection

| Fragments | Unlocks |
|---|---|
| 1/5 | Island 2 route visible |
| 2/5 | Island 3 route visible |
| 3/5 | Island 4 route visible |
| 4/5 | Island 5 route visible |
| 5/5 | Golden Chart assembled + credits |

### Concept Mastery Tracking

Each concept has a mastery level based on recall history:

| Mastery Level | Condition | Visual in Journal |
|---|---|---|
| Discovered | Concept card seen | Dim icon |
| Placed | Successfully encoded | Normal icon |
| Recalled | Correctly recalled at least once | Bright icon |
| Mastered | Correctly recalled 3+ times across encounters/replays | Gold icon + sparkle |

### Replay Incentives

- Players can replay any completed island to improve their score/grade.
- Replay uses the same concept-landmark pairings (memory reinforcement — educationally deliberate).
- New personal best triggers a celebration animation and leaderboard update.

---

## Competition Build Scoring

For competition/demo builds with only Islands 1–2:

- Leaderboard shows per-island scores for available islands.
- Total score is the sum of available island scores.
- Speed run board tracks time across available islands only.
- Grade system works identically.

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `score_prompt_earned` | `prompt_id`, `base_points`, `speed_multiplier`, `combo_multiplier`, `total` |
| `score_island_complete` | `island_id`, `island_score`, `expert_bonus`, `grade` |
| `score_game_complete` | `total_score`, `completion_bonus`, `dead_reckoner_bonus` |
| `leaderboard_viewed` | `board_type`, `player_rank` |
| `leaderboard_entry_submitted` | `board_type`, `score`, `time_ms` |
| `island_replayed` | `island_id`, `previous_grade`, `new_grade` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| Players understand score increases with speed and accuracy | ≥80% report "faster = more points" in post-test |
| Combo system creates positive tension | ≥70% attempt to maintain streaks |
| Grade system motivates replay | ≥30% replay at least one island to improve grade |
| Leaderboard updates feel responsive | Score appears on board within 1s of submission |
| Scoring never blocks progression | 100% — islands unlock by completion, not score |
