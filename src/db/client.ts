import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './migrate';

let _db: SQLiteDatabase | null = null;

/** Lazily open (and migrate) the single app database. */
export function getDb(): SQLiteDatabase {
  if (_db) return _db;
  const db = openDatabaseSync('pawductivity.db');
  // Cache only AFTER a successful migration. If migrate() throws (e.g. a transient
  // open-time failure on first run), _db stays null so the next getDb() — including the
  // in-app Retry path — re-runs migration instead of returning an unmigrated handle forever.
  migrate(db);
  _db = db;
  return _db;
}

/** For tests / hard resets. */
export function _resetDbHandle(): void {
  _db = null;
}
