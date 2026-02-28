# Database Schema

> **Source of truth:** `Knowledge/engineering/sqlite-data-model-and-migrations.md` · `Design/ScoringAndProgression.md`
> **Engine:** SQLite via `better-sqlite3` (server-side)

---

## Schema Overview

```
players ──1:N──→ sessions ──1:N──→ event_log
   │                 │
   ├──1:N──→ highscores
   ├──1:N──→ island_progress
   └──1:N──→ concept_mastery
```

---

## Migration: `001_init.sql`

```sql
-- =========================================
-- 001_init.sql — Dead Reckoning: Memory Sea
-- =========================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- -----------------------------------------
-- Players
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS players (
  id              TEXT PRIMARY KEY,          -- UUID (client-generated)
  display_name    TEXT NOT NULL DEFAULT 'Pirate' CHECK(length(display_name) <= 12),
  device_fingerprint TEXT,                   -- optional device hash (not PII)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_players_device ON players(device_fingerprint);

-- -----------------------------------------
-- Sessions
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,          -- UUID
  player_id       TEXT NOT NULL REFERENCES players(id),
  input_mode      TEXT NOT NULL CHECK(input_mode IN ('touch', 'keyboard', 'mouse', 'mixed')),
  started_at      TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at    TEXT,
  build_version   TEXT NOT NULL
);

CREATE INDEX idx_sessions_player ON sessions(player_id);

-- -----------------------------------------
-- Highscores
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS highscores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id       TEXT NOT NULL REFERENCES players(id),
  board_type      TEXT NOT NULL CHECK(board_type IN ('island', 'total', 'speed', 'accuracy')),
  island_id       TEXT,                      -- NULL for total/speed/accuracy boards
  score           INTEGER NOT NULL DEFAULT 0,
  time_ms         INTEGER NOT NULL DEFAULT 0,
  accuracy_pct    REAL NOT NULL DEFAULT 0.0 CHECK(accuracy_pct >= 0 AND accuracy_pct <= 100),
  grade           TEXT NOT NULL CHECK(grade IN ('S', 'A', 'B', 'C', 'D')),
  checksum        TEXT NOT NULL,             -- integrity check (see docs/SECURITY.md)
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_highscores_board ON highscores(board_type, island_id, score DESC);
CREATE INDEX idx_highscores_player ON highscores(player_id, board_type);

-- -----------------------------------------
-- Island Progress
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS island_progress (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id       TEXT NOT NULL REFERENCES players(id),
  island_id       TEXT NOT NULL,
  status          TEXT NOT NULL CHECK(status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  best_grade      TEXT CHECK(best_grade IN ('S', 'A', 'B', 'C', 'D')),
  best_score      INTEGER NOT NULL DEFAULT 0,
  chart_fragment   INTEGER NOT NULL DEFAULT 0 CHECK(chart_fragment IN (0, 1)),
  expert_bonus    INTEGER NOT NULL DEFAULT 0 CHECK(expert_bonus IN (0, 1)),
  attempts        INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, island_id)
);

CREATE INDEX idx_progress_player ON island_progress(player_id);

-- -----------------------------------------
-- Concept Mastery
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS concept_mastery (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id       TEXT NOT NULL REFERENCES players(id),
  concept_id      TEXT NOT NULL,
  mastery_level   TEXT NOT NULL CHECK(mastery_level IN ('discovered', 'placed', 'recalled', 'mastered')),
  recall_count    INTEGER NOT NULL DEFAULT 0,
  first_recall_ms INTEGER,                   -- fastest recall time
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, concept_id)
);

CREATE INDEX idx_mastery_player ON concept_mastery(player_id);

-- -----------------------------------------
-- Ship Upgrades
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS ship_upgrades (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id       TEXT NOT NULL REFERENCES players(id),
  upgrade_id      TEXT NOT NULL,
  earned_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, upgrade_id)
);

-- -----------------------------------------
-- Event Log (Telemetry)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS event_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT NOT NULL REFERENCES sessions(id),
  event_name      TEXT NOT NULL,
  payload_json    TEXT NOT NULL DEFAULT '{}',
  payload_version INTEGER NOT NULL DEFAULT 1,
  ts              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_events_session ON event_log(session_id);
CREATE INDEX idx_events_name ON event_log(event_name, ts);
```

---

## Table Summary

| Table | Rows (Est.) | Purpose |
|---|---|---|
| `players` | 1 per device | Player identity |
| `sessions` | ~10 per player | Play session tracking |
| `highscores` | ~20 per player | Leaderboard entries (4 board types × islands) |
| `island_progress` | 5–6 per player | Per-island completion state |
| `concept_mastery` | 15 per player | Per-concept learning state |
| `ship_upgrades` | 5–6 per player | Earned ship upgrades |
| `event_log` | ~200 per session | Telemetry events |

---

## Query Patterns

### Leaderboard (top 10 for island board)

```sql
SELECT p.display_name, h.score, h.grade, h.time_ms
FROM highscores h
JOIN players p ON p.id = h.player_id
WHERE h.board_type = 'island' AND h.island_id = ?
ORDER BY h.score DESC
LIMIT 10;
```

### Player rank

```sql
SELECT COUNT(*) + 1 AS rank
FROM highscores
WHERE board_type = ? AND island_id = ? AND score > (
  SELECT MAX(score) FROM highscores WHERE player_id = ? AND board_type = ? AND island_id = ?
);
```

### Player progress (all islands)

```sql
SELECT island_id, status, best_grade, best_score, chart_fragment, expert_bonus
FROM island_progress
WHERE player_id = ?
ORDER BY island_id;
```

### Concept journal

```sql
SELECT concept_id, mastery_level, recall_count, first_recall_ms
FROM concept_mastery
WHERE player_id = ?
ORDER BY concept_id;
```

---

## Migration Runner

```typescript
// server/db/migrate.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export function migrate(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    filename TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const applied = new Set(
    db.prepare('SELECT version FROM _migrations').all().map((r: any) => r.version)
  );

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10);
    if (applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (version, filename) VALUES (?, ?)').run(version, file);
    console.log(`Applied migration: ${file}`);
  }
}
```

### npm script

```bash
npm run db:migrate   # Runs all pending migrations
npm run db:seed      # Seeds test data (scripts/seed-db.ts)
npm run db:reset     # Drop + recreate (dev only)
```

---

## Data Retention

| Table | Retention | Cleanup |
|---|---|---|
| `event_log` | 30 days | Cron or startup sweep: `DELETE FROM event_log WHERE ts < datetime('now', '-30 days')` |
| `sessions` | 90 days | Same pattern |
| `highscores` | Permanent | Never deleted |
| `island_progress` | Permanent | Player's progress |
| `concept_mastery` | Permanent | Player's learning state |

---

## Offline Fallback

When the server is unreachable, the client stores progress in `localStorage`:

```json
{
  "dr_offline_queue": [
    { "type": "score", "payload": { ... }, "ts": "ISO8601" },
    { "type": "progress", "payload": { ... }, "ts": "ISO8601" }
  ]
}
```

On reconnect, the queue is drained with conflict resolution: **server wins for scores** (highest score kept), **client wins for progress** (most recent state).

See `docs/RELIABILITY.md` for full offline strategy.
