import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.resolve(process.cwd(), 'dead-reckoning.db');
  dbInstance = new DatabaseSync(dbPath);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  return dbInstance;
}
