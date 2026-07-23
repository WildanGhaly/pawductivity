// Offline persistence. Native (iOS/Android) uses expo-sqlite (a single kv table
// holding the app-state document); web uses localStorage. Same shape both sides,
// survives restart, no JOINs. See docs/SPEC.md D6.
import { Platform } from 'react-native';
import { AppState } from '../domain/types';

const KEY = 'app_state';

export interface Persistence {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
  wipe(): Promise<void>;
}

// strip runtime-only fields before persisting
function serialize(state: AppState): string {
  const { tab, ...rest } = state;
  return JSON.stringify(rest);
}
function deserialize(raw: string | null | undefined): AppState | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return { tab: 'home', ...obj } as AppState;
  } catch {
    return null;
  }
}

// ---- web adapter (localStorage) ----
class WebPersistence implements Persistence {
  async load() {
    try {
      return deserialize(globalThis.localStorage?.getItem(KEY));
    } catch {
      return null;
    }
  }
  async save(state: AppState) {
    try {
      globalThis.localStorage?.setItem(KEY, serialize(state));
    } catch {
      /* ignore quota/availability errors */
    }
  }
  async wipe() {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}

// ---- native adapter (expo-sqlite) ----
class SqlitePersistence implements Persistence {
  private dbPromise: Promise<any> | null = null;

  private async db() {
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        const SQLite = await import('expo-sqlite');
        const database = await SQLite.openDatabaseAsync('pawductivity.db');
        await database.execAsync(
          'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
        );
        return database;
      })();
    }
    return this.dbPromise;
  }

  async load() {
    try {
      const database = await this.db();
      const row = (await database.getFirstAsync(
        'SELECT value FROM kv WHERE key = ?;',
        KEY,
      )) as { value: string } | null | undefined;
      return deserialize(row?.value);
    } catch (e) {
      console.warn('[persistence] sqlite load failed, starting fresh:', e);
      return null;
    }
  }

  async save(state: AppState) {
    try {
      const database = await this.db();
      await database.runAsync(
        'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?);',
        KEY,
        serialize(state),
      );
    } catch (e) {
      console.warn('[persistence] sqlite save failed:', e);
    }
  }

  async wipe() {
    try {
      const database = await this.db();
      await database.runAsync('DELETE FROM kv WHERE key = ?;', KEY);
    } catch (e) {
      console.warn('[persistence] sqlite wipe failed:', e);
    }
  }
}

export const persistence: Persistence =
  Platform.OS === 'web' ? new WebPersistence() : new SqlitePersistence();
