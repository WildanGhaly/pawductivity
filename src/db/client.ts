import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './migrate';

let _db: SQLiteDatabase | null = null;

/** Lazily open (and migrate) the single app database. */
export function getDb(): SQLiteDatabase {
  if (_db) return _db;
  _db = openDatabaseSync('pawductivity.db');
  migrate(_db);
  return _db;
}

/** For tests / hard resets. */
export function _resetDbHandle(): void {
  _db = null;
}
