import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type StatementLike = {
  run: (...args: unknown[]) => unknown;
  get: (...args: unknown[]) => any;
  all: (...args: unknown[]) => any[];
};

type DatabaseLike = {
  exec: (sql: string) => unknown;
  prepare: (sql: string) => StatementLike;
};

let dbInstance: DatabaseLike | null = null;

function createDatabase(dbPath: string): DatabaseLike {
  try {
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => DatabaseLike };
    return new DatabaseSync(dbPath);
  } catch {
    const BetterSqlite3 = require('better-sqlite3') as new (path: string) => DatabaseLike;
    return new BetterSqlite3(dbPath);
  }
}

export function getDb(): DatabaseLike {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.resolve(process.cwd(), 'dead-reckoning.db');
  dbInstance = createDatabase(dbPath);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  return dbInstance;
}
