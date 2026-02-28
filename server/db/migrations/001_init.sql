PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Pirate' CHECK(length(display_name) <= 12),
  device_fingerprint TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_players_device ON players(device_fingerprint);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  input_mode TEXT NOT NULL CHECK(input_mode IN ('touch', 'keyboard', 'mouse', 'mixed')),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  build_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id);

CREATE TABLE IF NOT EXISTS highscores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id),
  board_type TEXT NOT NULL CHECK(board_type IN ('island', 'total', 'speed', 'accuracy')),
  island_id TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  time_ms INTEGER NOT NULL DEFAULT 0,
  accuracy_pct REAL NOT NULL DEFAULT 0.0 CHECK(accuracy_pct >= 0 AND accuracy_pct <= 100),
  grade TEXT NOT NULL CHECK(grade IN ('S', 'A', 'B', 'C', 'D')),
  checksum TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_highscores_board ON highscores(board_type, island_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_highscores_player ON highscores(player_id, board_type);

CREATE TABLE IF NOT EXISTS island_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id),
  island_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  best_grade TEXT CHECK(best_grade IN ('S', 'A', 'B', 'C', 'D')),
  best_score INTEGER NOT NULL DEFAULT 0,
  chart_fragment INTEGER NOT NULL DEFAULT 0 CHECK(chart_fragment IN (0, 1)),
  expert_bonus INTEGER NOT NULL DEFAULT 0 CHECK(expert_bonus IN (0, 1)),
  attempts INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, island_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_player ON island_progress(player_id);

CREATE TABLE IF NOT EXISTS concept_mastery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id),
  concept_id TEXT NOT NULL,
  mastery_level TEXT NOT NULL CHECK(mastery_level IN ('discovered', 'placed', 'recalled', 'mastered')),
  recall_count INTEGER NOT NULL DEFAULT 0,
  first_recall_ms INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_mastery_player ON concept_mastery(player_id);

CREATE TABLE IF NOT EXISTS ship_upgrades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id),
  upgrade_id TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, upgrade_id)
);

CREATE TABLE IF NOT EXISTS event_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  event_name TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  payload_version INTEGER NOT NULL DEFAULT 1,
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_session ON event_log(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON event_log(event_name, ts);
