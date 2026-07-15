import type { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_V1, SEED_V1 } from './schema';

/**
 * Ordered, idempotent migration ladder gated by PRAGMA user_version.
 * Add a new entry (never edit an old one) to evolve the schema.
 */
const MIGRATIONS: ((db: SQLiteDatabase) => void)[] = [
  /* v1 */ (db) => {
    db.execSync(SCHEMA_V1);
    db.execSync(SEED_V1);
  },
];

export function migrate(db: SQLiteDatabase): void {
  // PRAGMAs must run outside a transaction and per connection.
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= MIGRATIONS.length) return;

  db.withTransactionSync(() => {
    for (let v = current; v < MIGRATIONS.length; v++) {
      MIGRATIONS[v](db);
    }
    // PRAGMA cannot be parameterized.
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length};`);
  });
}

export const SCHEMA_VERSION = MIGRATIONS.length;
