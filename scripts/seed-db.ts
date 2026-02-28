import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'dead-reckoning.db');
const db = new DatabaseSync(dbPath);
const isReset = process.argv.includes('--reset');

if (isReset) {
  db.exec(`
    DROP TABLE IF EXISTS _migrations;
    DROP TABLE IF EXISTS event_log;
    DROP TABLE IF EXISTS ship_upgrades;
    DROP TABLE IF EXISTS concept_mastery;
    DROP TABLE IF EXISTS island_progress;
    DROP TABLE IF EXISTS highscores;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS players;
  `);
}

db.exec(`
  INSERT OR IGNORE INTO players (id, display_name) VALUES ('player_local', 'Pirate');
  INSERT OR IGNORE INTO sessions (id, player_id, input_mode, build_version) VALUES ('session_local', 'player_local', 'mixed', '0.1.0');
`);

console.info(`Seeded database at ${dbPath}`);
db.close();
