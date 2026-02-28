import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export function runMigrations(): void {
  const db = getDb();

  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    filename TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const applied = new Set<number>(
    db
      .prepare('SELECT version FROM _migrations')
      .all()
      .map((row) => (row as { version: number }).version),
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const [versionString = '0'] = file.split('_');
    const version = Number.parseInt(versionString, 10);
    if (applied.has(version)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (version, filename) VALUES (?, ?)').run(version, file);
    console.info(`[db:migrate] applied ${file}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runMigrations();
}
