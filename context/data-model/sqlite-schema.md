# expo-sqlite Schema (Local-First)

> The single canonical on-device relational schema for the Pawductivity rebuild — concrete `CREATE TABLE` DDL that consolidates the legacy Go/Postgres (GORM) tables and the vestigial Flutter Floor tables into one clean, single-user SQLite database.

This document is the source of truth for the **relational** layer only. Settings, entitlement, and ephemeral timer/pet state live in `react-native-mmkv` + Zustand — see [state-and-mmkv.md](./state-and-mmkv.md). Seed rows for the catalog tables (animal / food / clothes) live in [seed-catalogs.md](./seed-catalogs.md). The narrative ERD lives in [entity-relationship.md](./entity-relationship.md).

**Status vs legacy:** the legacy authoritative schema was Postgres, defined **twice and inconsistently** — a hand-written DDL script (`database/script/pawductivity.sql`) and GORM `AutoMigrate` structs (`database/migration/model/*.go`). GORM was the effective runtime schema and had drifted ahead of the SQL script. This doc **collapses everything into one single-user schema**, drops `userid`, drops auth/payment/sync tables, and resolves the known drifts and bugs explicitly (§3, §9).

---

## 1. Design conventions

Applied consistently to every table below.

| Concern | Legacy (Postgres) | New (expo-sqlite) | Tag |
|---|---|---|---|
| Multi-user keying | every table carried `userid` FK | **single local user** — `userid` dropped everywhere; one `user_profile` row | [CHANGE] |
| Auto ID | `SERIAL` | `INTEGER PRIMARY KEY AUTOINCREMENT` (rowid alias) | [CHANGE] |
| Booleans | `BOOLEAN` | `INTEGER` `CHECK (col IN (0,1))` (SQLite has no bool) | [CHANGE] |
| Enums | Postgres `CREATE TYPE … ENUM` | `TEXT` + `CHECK (col IN (…))` (validated in TS too) | [CHANGE] |
| Precise timestamps | `timestamptz` / `timestamp` | `INTEGER` **Unix epoch milliseconds** (`unixepoch()*1000`) | [CHANGE] |
| Calendar dates | `DATE` | `TEXT` `'YYYY-MM-DD'` (local date, works with `strftime`) | [CHANGE] |
| Arrays (`boolean[]`, `integer[]`) | Postgres native arrays | **avoided** — bitmask INTEGER or child rows (see task.repetition, checklist) | [CHANGE] |
| Money/coins | `int CHECK (>=0)` | same `CHECK`, enforced in app too | [PRESERVE] |
| Stored procedures | `buy_coins()`, dead `level_up()` | TS store actions inside one SQLite transaction (see [gamification-xp-levels](../../.claude/skills/gamification-xp-levels/SKILL.md)) | [CHANGE] |

**Required connection PRAGMAs** (expo-sqlite does **not** enable FK enforcement by default):

```sql
PRAGMA journal_mode = WAL;   -- concurrent reads, fewer locks
PRAGMA foreign_keys = ON;    -- MUST run on every opened connection
```

> `unixepoch()` needs SQLite ≥ 3.38 (bundled by modern expo-sqlite). If targeting an older engine, substitute `CAST(strftime('%s','now') AS INTEGER)*1000`.

---

## 2. Legacy → new table map

Every legacy table (GORM + Floor) and where it goes. Catalog tables are shared/global and survive; per-user tables lose `userid`.

| Legacy table (source) | New table | Change | Notes |
|---|---|---|---|
| `users` (GORM `user.model.go`) | `user_profile` | [CHANGE] | single row `id=1`; drop email/name/password; keep coins/level/xp |
| `membership` (`membership.model.go`) | — (MMKV entitlement) | [CHANGE] | no relational table; premium status cached in MMKV → [state-and-mmkv.md](./state-and-mmkv.md) |
| `task` (`task.model.go`) | `task` | [CHANGE] | drop versioning composite PK; drop `userid` |
| `task_log` (`task_log.model.go`) | `time_log` | [CHANGE] | renamed; append-only increments |
| `daily_logs` (`daily_log.model.go`) | `daily_log` | [CHANGE] | drop `userid`/`version` from PK |
| `reminder` (`reminder.model.go`) | `reminder` | [CHANGE] | merge legacy `time`+`date` into one `remind_at` |
| `checklist` (`checklist.model.go`, monthly `int[]`) | — (derived) | [DROP] | the month-completion calendar is computed from `daily_log`, not stored |
| `animal` (`animal.model.go`) | `animal` (catalog) | [PRESERVE] | + canonical `species` column |
| `pet` (`pet.model.go`) | `pet` | [CHANGE] | drop `userid`; add `evolution_stage`, `last_health_decay_at` |
| `food` (`food.model.go`) | `food` (catalog) | [PRESERVE] | `stats` → `heal` |
| `playerFood` (`—`, SQL script) | `food_inventory` | [CHANGE] | **one-row-per-item → real `quantity` column** |
| `clothes` (`clothes.model.go`) | `clothes` (catalog) | [PRESERVE] | `type` → `slot` |
| `wardrobe` (`wardrobe.model.go`) | `clothes_inventory` | [CHANGE] | owned-once set |
| `petClothes` (`petClothes.model.go`) | `pet_clothes` | [CHANGE] | PK `(pet_id, slot)` = one garment per slot |
| `purchases` (`purchases.model.go`) | `coin_ledger` | [CHANGE] | **signed `delta`** instead of positive-only `price`+`type` |
| `pet_usage` (`pet_usage.model.go`) | `pet_usage` | [CHANGE] | `hoursUsed` (was seconds, misnamed) → `seconds_used` |
| `achievement` / `userachievement` | `achievement` / `user_achievement` | [DECIDE] | stubbed in legacy (no seed) — include only if in scope |
| `verification` (`verification.model.go`) | — | [DROP] | no email signup in a local app |
| `orders` (`orders.model.go`) | — | [DROP] | Midtrans real-money orders → store IAP |
| `subscription` / `archived_subscription` | — | [DROP] | Google Play receipt state handled by IAP SDK + MMKV cache |
| `referral` / `referral_user` | — (or local promo) | [DECIDE] | cross-user reward is impossible without a backend |
| Floor `task/pet/food/user` (`app_database.dart` v1) | folded into the above | [DROP] | the lossy 4-entity local cache is superseded |

Legacy Floor DB was online-first and incomplete: only `TaskModel`, `FoodModel`, `PetModel`, `UserModel` were registered (`lib/database/app_database.dart` v1); `CoinModel`/`ClothesModel`/`ActivityModel` had `@Entity` but no table — dead code. None of that carries over.

---

## 3. Schema drifts & bugs resolved here

These are the concrete inconsistencies found in the legacy source that this schema **deliberately fixes** (see [known-bugs-and-antipatterns.md](../legacy/known-bugs-and-antipatterns.md)).

| # | Legacy defect | Resolution here | Tag |
|---|---|---|---|
| 1 | `users.current_xp`, `needed_xp`, `profile_index`, `userimage` existed only in GORM, **absent from the SQL script** (`user.model.go` vs `pawductivity.sql:4`) | included explicitly in `user_profile` from day one | [CHANGE] |
| 2 | `task.tasktag` / `duration` / `repetition` existed only in GORM, absent from SQL script (`task.model.go` vs `pawductivity.sql:30`) | `tag` and `repetition` kept; unused `duration` (always `0`) dropped | [CHANGE] / [DROP] |
| 3 | Several tables (`daily_logs`, `reminder`, `checklist`, `pet_usage`, `subscription`) existed **only** in GORM, never in the SQL script | one canonical schema — no second source | [CHANGE] |
| 4 | `referral`/`referral_user` existed **only** in the SQL script, not in `AutoMigrate` | dropped/deferred (§8) | [DECIDE] |
| 5 | `needed_xp` seeded `150` but the curve `10·L²+50·L+100` yields `160` at L1 (`user.model.go` default vs `task.repository.go:451`) | seed `needed_xp = 160` (from the formula) | [CHANGE] |
| 6 | Coin reward: actual grant `estimatedTime/60` vs task-list preview `FLOOR(estimatedTime/60/3)` disagreed (`task.repository.go:470` vs `:234`) | pick ONE formula; ledger and display use the same value (decision in [gamification skill](../../.claude/skills/gamification-xp-levels/SKILL.md)) | [DECIDE] |
| 7 | Inventory quantity derived by `COUNT(*)` over one-row-per-item (`food.repository.go:59`) — fragile | `food_inventory.quantity` real column | [CHANGE] |
| 8 | `purchases` stored grants and spends both as positive `price`, direction implied by `type` only | `coin_ledger.delta` signed | [CHANGE] |
| 9 | `pet_usage.hoursUsed` actually stored **seconds** (`totalHours = SUM/3600`) | renamed `seconds_used` | [CHANGE] |
| 10 | health decay had no missed-day catch-up + shared server timezone (`decreasePetHealth.routine.go`) | lazy on-open decay from `pet.last_health_decay_at`, device timezone | [CHANGE] |

---

## 4. DDL — profile & gamification

```sql
-- Single local user. Exactly one row, id = 1. Replaces Postgres `users`.
-- Drops: email, name, password (auth removed). Keeps coins/level/xp counters.
CREATE TABLE user_profile (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  display_name  TEXT    NOT NULL DEFAULT 'Me',
  avatar        TEXT    NOT NULL DEFAULT 'default.png',   -- legacy users.userimage
  profile_index INTEGER NOT NULL DEFAULT 0,               -- GORM users.profile_index (drift #1)
  coins         INTEGER NOT NULL DEFAULT 200 CHECK (coins >= 0),   -- starting coins [DECIDE]
  level         INTEGER NOT NULL DEFAULT 1   CHECK (level >= 1),
  current_xp    INTEGER NOT NULL DEFAULT 0   CHECK (current_xp >= 0),
  needed_xp     INTEGER NOT NULL DEFAULT 160 CHECK (needed_xp > 0),  -- fixed from 150 (drift #5)
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
```

- Legacy defaults preserved: `coins DEFAULT 0`, `level DEFAULT 1`, `current_xp DEFAULT 0` (`user.model.go`). [PRESERVE]
- `coins DEFAULT 200` here reflects the legacy new-user starting balance (a free Cat + 200 coins were granted at signup via a `buy_coins` misuse; the *intended* starting inventory is a [DECIDE] — see [coin-economy skill](../../.claude/skills/coin-economy-and-shop/SKILL.md)). [DECIDE]
- `needed_xp DEFAULT 160` intentionally differs from the legacy `150` seed to match the level curve. [CHANGE]
- **Membership / premium entitlement is NOT stored here** — it is cached in MMKV and validated by the IAP SDK. [CHANGE] → [state-and-mmkv.md](./state-and-mmkv.md).
- **Active/selected pet id lives in MMKV**, not this table. [CHANGE]

---

## 5. DDL — tasks, quests & progress

```sql
-- Task / Quest. Legacy `task` used a composite PK (id, userid, version) with
-- immutable versioning; locally we mutate in place (no multi-device sync). [DECIDE→CHANGE]
CREATE TABLE task (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,                          -- legacy taskname varchar(50)
  description    TEXT,                                      -- legacy varchar(50)
  tag            TEXT    NOT NULL DEFAULT '',               -- legacy tasktag (GORM-only, drift #2)
  kind           TEXT    NOT NULL DEFAULT 'focus'
                   CHECK (kind IN ('target','checklist','focus')),   -- [NEW] quest kinds
  estimated_time INTEGER NOT NULL CHECK (estimated_time > 0), -- SECONDS; legacy CHECK (>600) [DECIDE]
  time_completed INTEGER NOT NULL DEFAULT 0 CHECK (time_completed >= 0),  -- SECONDS
  completed      INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  repetition     INTEGER NOT NULL DEFAULT 0 CHECK (repetition BETWEEN 0 AND 127), -- weekday bitmask
  target_value   INTEGER,                                   -- [NEW] target-quest goal (e.g. 5 km)
  target_current INTEGER NOT NULL DEFAULT 0,                -- [NEW] target-quest progress
  target_unit    TEXT,                                      -- [NEW] e.g. 'km','pages'
  due_date       INTEGER,                                   -- epoch ms; legacy was NOT NULL [CHANGE]
  creation_date  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by_ai  INTEGER NOT NULL DEFAULT 0 CHECK (created_by_ai IN (0,1))  -- [NEW] brain-dump provenance
);

-- Checklist-quest subtasks (NEW). Distinct from the legacy monthly `checklist` table.
CREATE TABLE checklist_item (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Per-day progress rollup. Legacy PK (taskid, version, userid, date); locally (task_id, date).
-- UPSERT on completion; time_completed/duration capped at task.estimated_time (app-enforced).
CREATE TABLE daily_log (
  task_id        INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  date           TEXT    NOT NULL,                          -- 'YYYY-MM-DD' local
  time_completed INTEGER NOT NULL DEFAULT 0,                -- SECONDS, capped at estimated_time
  duration       INTEGER NOT NULL DEFAULT 0,                -- SECONDS
  PRIMARY KEY (task_id, date)
);

-- Append-only increment log (legacy task_log). Powers the 2-hour-bucket timeline chart.
CREATE TABLE time_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id   INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  seconds   INTEGER NOT NULL,                               -- delta increment
  logged_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
```

Key rules preserved from `task.repository.go`:
- `estimated_time` and `time_completed` are **SECONDS**. [PRESERVE]
- Legacy `CHECK (estimatedTime > 600)` (min 10-minute task, `pawductivity.sql:36`) is relaxed to `> 0` because the AI Brain Dump may produce short tasks — keep or restore the 600s floor is a [DECIDE].
- `daily_log` values are **capped at `task.estimated_time`** on upsert (`task.repository.go:416`). [PRESERVE]
- `repetition` was a Postgres `boolean[7]` weekday mask; now a 0–127 **bitmask** (bit *n* = weekday *n*). [CHANGE]
- Task **versioning dropped**: legacy edits created `version+1` (immutable history via `UpdateTask`); locally tasks mutate in place. [DECIDE] — confirm no history requirement.
- Quest `kind` and target/checklist fields are [NEW] — the authoritative rules live in [task-quest-system](../../.claude/skills/task-quest-system/SKILL.md).
- The legacy monthly `checklist(userid, month, year, date int[])` calendar is **not stored** — the month-completion heatmap is derived from `daily_log` on demand. [DROP]

---

## 6. DDL — companion (pet)

```sql
-- Catalog of purchasable species (shared/global). Seed rows in seed-catalogs.md.
CREATE TABLE animal (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  species     TEXT    NOT NULL CHECK (species IN ('dog','cat','rabbit')),  -- canonical
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),          -- coins
  asset       TEXT    NOT NULL,                             -- bundled Lottie base (e.g. assets/pet/cat/cat_default.json)
  premium     INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1))
);

-- A user's owned pet instance. Legacy PK (id, userid); locally just id.
CREATE TABLE pet (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id            INTEGER NOT NULL REFERENCES animal(id),
  name                 TEXT    NOT NULL,                    -- legacy petname
  health               INTEGER NOT NULL DEFAULT 100 CHECK (health BETWEEN 0 AND 100),
  evolution_stage      INTEGER NOT NULL DEFAULT 0 CHECK (evolution_stage BETWEEN 0 AND 5), -- [NEW] 0=_default
  last_health_decay_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),   -- [NEW] lazy-decay anchor
  acquired_at          INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
```

- `health` default **100**, legacy `CHECK (health >= 0)` (`pawductivity.sql:77`); we add the upper bound `<= 100` (feeding caps at 100, `animal.repository.go` FeedPet). [PRESERVE] + tightened. [CHANGE]
- **Health decay** is `-1/day`, computed lazily on app open from `last_health_decay_at` (`health -= floor(local_midnights_elapsed)`, clamped ≥ 0) — replacing the server midnight cron and fixing the missed-day + shared-timezone bugs (drift #10). [CHANGE]
- `evolution_stage` (0–5, matching `_default`.._5` art) is [NEW] — the user's Level (in `user_profile`) is separate. See [pet-companion-system](../../.claude/skills/pet-companion-system/SKILL.md).
- Per-pet `premium` column dropped (redundant; derive from `animal.premium`). [DROP]

---

## 7. DDL — shop, inventory, cosmetics & economy

```sql
-- Food catalog (shared/global). Legacy `stats` (health restored) → `heal`.
CREATE TABLE food (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),          -- coins
  heal        INTEGER NOT NULL CHECK (heal >= 0),           -- legacy food.stats
  asset       TEXT    NOT NULL,
  premium     INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1))
);

-- Owned-food inventory with a REAL quantity column (fixes drift #7 one-row-per-item).
CREATE TABLE food_inventory (
  food_id  INTEGER PRIMARY KEY REFERENCES food(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

-- Clothes catalog (shared/global). Legacy enum `type` → `slot`.
CREATE TABLE clothes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),          -- coins
  slot        TEXT    NOT NULL DEFAULT 'shirt'
                CHECK (slot IN ('hat','shirt','pants','shoes')),
  asset       TEXT    NOT NULL,                             -- e.g. assets/clothes/suit.png
  premium     INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1))
);

-- Owned cosmetics (legacy `wardrobe`). Cosmetics owned once → PK is clothes_id.
CREATE TABLE clothes_inventory (
  clothes_id  INTEGER PRIMARY KEY REFERENCES clothes(id) ON DELETE CASCADE,
  acquired_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Which owned garment a pet wears in each slot (legacy petClothes join).
-- PK (pet_id, slot) enforces one garment per slot per pet.
CREATE TABLE pet_clothes (
  pet_id     INTEGER NOT NULL REFERENCES pet(id) ON DELETE CASCADE,
  clothes_id INTEGER NOT NULL REFERENCES clothes(id) ON DELETE CASCADE,
  slot       TEXT    NOT NULL CHECK (slot IN ('hat','shirt','pants','shoes')),
  PRIMARY KEY (pet_id, slot)
);

-- Coin ledger (legacy `purchases`). SIGNED delta: + grant, - spend (fixes drift #8).
CREATE TABLE coin_ledger (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  delta         INTEGER NOT NULL,                           -- + grant / - spend
  reason        TEXT    NOT NULL CHECK (reason IN (
                    'task_reward','level_up','purchase_pet','purchase_food',
                    'purchase_clothes','referral','iap_topup','other')),
  ref_id        INTEGER,                                    -- optional: task/animal/food/clothes id
  balance_after INTEGER,                                    -- optional snapshot for audit
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
```

- Seed catalog values (verified in `pawductivity.sql:233-335`) — full rows in [seed-catalogs.md](./seed-catalogs.md):
  - Animals: **Dog 100**, **Cat 200**, **Rabbit 200 (premium)**.
  - Food (price / heal): **Apple 3/10**, **Chicken 3/10**, **Pizza 4/20 (premium)**, **Watermelon 4/10**, **Carrot 5/15**.
  - Clothes (price, all seeded as `slot='shirt'`): **Cyan t-shirt 15**, **Green shirt 10**, **Tuxedo 20 (premium)**, **Star Shirt 15 (premium)**, **Pink Dress 20 (premium)**.
- Purchase rules preserved (`purchase.repository.go`): reject if `coins < price` ("insufficient coins"); reject premium item when not entitled ("premium content"); reject buying an already-owned species. Enforced in a single SQLite transaction. [PRESERVE]
- Feeding: `heal` added to `pet.health`, capped at 100; decrement `food_inventory.quantity` by 1. [PRESERVE]
- Only `slot='shirt'` cosmetics exist in legacy seed despite the 4-slot enum — whether hat/pants/shoes are ever used is a [DECIDE].

---

## 8. DDL — analytics & optional tables

```sql
-- Which pet focused on which task on which day, and for how long.
-- Legacy column `hoursUsed` actually stored SECONDS (totalHours = SUM/3600) → renamed.
CREATE TABLE pet_usage (
  pet_id       INTEGER NOT NULL REFERENCES pet(id)  ON DELETE CASCADE,
  task_id      INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  date         TEXT    NOT NULL,                            -- 'YYYY-MM-DD'
  seconds_used INTEGER NOT NULL DEFAULT 0,                  -- legacy pet_usage.hoursUsed (seconds)
  PRIMARY KEY (pet_id, task_id, date)
);

-- OPTIONAL — achievements were stubbed in legacy (no seed, UserEntity.badges → null). [DECIDE]
CREATE TABLE achievement (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  description  TEXT,
  requirement  TEXT    NOT NULL                             -- legacy varchar[]; store as JSON or rule id
);
CREATE TABLE user_achievement (
  achievement_id INTEGER NOT NULL REFERENCES achievement(id) ON DELETE CASCADE,
  unlocked_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (achievement_id)
);
```

**Dropped entirely** (no local table): `verification` (email OTP — no signup), `orders` (Midtrans), `subscription` / `archived_subscription` (Google Play receipt state → IAP SDK + MMKV cache), `membership` (→ MMKV entitlement). [DROP] See [premium-and-monetization](../../.claude/skills/premium-and-monetization/SKILL.md).

**Referral** (`referral` / `referral_user`, +100 coins to both parties, `referral.repository.go:55`) is meaningless without a shared backend. Options: drop it, make it a cosmetic share-a-code with no reward, or defer to a future sync service. [DECIDE] See [referral-system](../../.claude/skills/referral-system/SKILL.md).

---

## 9. Indices

Beyond the implicit PK/rowid indices:

```sql
CREATE INDEX idx_task_due        ON task(due_date);
CREATE INDEX idx_task_open       ON task(completed) WHERE completed = 0;   -- partial: today's open quests
CREATE INDEX idx_checklist_task  ON checklist_item(task_id);
CREATE INDEX idx_daily_log_date  ON daily_log(date);                       -- calendar/heatmap by day
CREATE INDEX idx_time_log_task   ON time_log(task_id, logged_at);          -- timeline buckets
CREATE INDEX idx_reminder_time   ON reminder(remind_at) WHERE is_completed = 0; -- next-to-fire scheduling
CREATE INDEX idx_coin_ledger_at  ON coin_ledger(created_at);
CREATE INDEX idx_pet_usage_date  ON pet_usage(date);
CREATE INDEX idx_pet_clothes_pet ON pet_clothes(pet_id);
```

The legacy analytics queries port directly to SQLite: 7-day activity windows (`generate_series` → recursive CTE or a client-built day array), tag summaries (`GROUP BY tag`), 2-hour timeline buckets over `time_log`, and month calendars from `daily_log` — see [analytics-and-insights](../../.claude/skills/analytics-and-insights/SKILL.md).

---

## 10. Migrations & versioning

expo-sqlite has no migration framework built in. Use the **`PRAGMA user_version`** integer as the schema version and run an idempotent, ordered migration ladder inside a transaction on app start. (If using `drizzle-orm`, its migration files wrap the same mechanism — pick one and stay consistent.)

```ts
// runMigrations.ts — pseudocode for the on-open migration runner
const MIGRATIONS: ((db: SQLiteDatabase) => void)[] = [
  /* v1 */ (db) => { db.execSync(SCHEMA_V1); db.execSync(SEED_CATALOGS); },
  // /* v2 */ (db) => db.execSync(`ALTER TABLE task ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;`),
];

export function migrate(db: SQLiteDatabase) {
  db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const { user_version } = db.getFirstSync<{ user_version: number }>('PRAGMA user_version') ?? { user_version: 0 };
  db.withTransactionSync(() => {
    for (let v = user_version; v < MIGRATIONS.length; v++) {
      MIGRATIONS[v](db);
    }
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length};`);   // PRAGMA can't be parameterized
  });
}
```

Rules for this codebase:
- **v1** = every `CREATE TABLE`/`CREATE INDEX` above + the catalog seed inserts ([seed-catalogs.md](./seed-catalogs.md)) + `INSERT INTO user_profile(id) VALUES (1)`.
- Migrations are **append-only and forward-only**; never edit a shipped migration — add a new one. No down-migrations on device.
- SQLite `ALTER TABLE` is limited (add-column/rename only). For a table rebuild, use the standard 12-step pattern: create `new_table`, copy, drop old, rename, recreate indices — all inside one transaction.
- Catalog seeds use `INSERT OR IGNORE` (or `ON CONFLICT DO NOTHING`) so re-running a seed is idempotent.
- `PRAGMA foreign_keys` must be re-asserted per connection (it is not a stored setting).

---

## 11. Open decisions

- **[DECIDE]** Reward formula: actual grant `estimatedTime/60` vs display `FLOOR(estimatedTime/60/3)` — pick one (drift #6).
- **[DECIDE]** Keep the legacy `estimated_time > 600` (10-minute) floor, or allow short AI-parsed tasks?
- **[DECIDE]** Starting inventory: is `200 coins + a free Cat` intended, or an artifact of the legacy `buy_coins` signup bug?
- **[DECIDE]** Drop task **versioning** for good (mutate in place), or keep an edit-history requirement?
- **[DECIDE]** Are achievements in scope (currently stubbed)? Are hat/pants/shoes cosmetic slots used, or shirt-only?
- **[DECIDE]** Referral without a backend: drop, cosmetic, or defer to future sync?
- **[DECIDE]** Health-at-0 consequence — does the companion "die", go sad, or block features? Legacy only floors at 0.
- **[DECIDE]** Single-device only, or is eventual cloud sync expected (would reintroduce an identity/version concept)?

---

## Related

- [entity-relationship.md](./entity-relationship.md) — narrative ERD across these tables.
- [state-and-mmkv.md](./state-and-mmkv.md) — settings, entitlement, ephemeral timer/pet state (MMKV + Zustand).
- [seed-catalogs.md](./seed-catalogs.md) — concrete seed rows for `animal` / `food` / `clothes`.
- [../legacy/known-bugs-and-antipatterns.md](../legacy/known-bugs-and-antipatterns.md) — the legacy defects §3 resolves.
- [../legacy/backend-api-catalog.md](../legacy/backend-api-catalog.md) — the server endpoints these tables replace.
- [../migration/backend-to-local-first.md](../migration/backend-to-local-first.md) — server → on-device mapping strategy.
- Skills: [local-first-data-layer](../../.claude/skills/local-first-data-layer/SKILL.md), [gamification-xp-levels](../../.claude/skills/gamification-xp-levels/SKILL.md), [task-quest-system](../../.claude/skills/task-quest-system/SKILL.md), [pet-companion-system](../../.claude/skills/pet-companion-system/SKILL.md), [coin-economy-and-shop](../../.claude/skills/coin-economy-and-shop/SKILL.md), [food-and-feeding](../../.claude/skills/food-and-feeding/SKILL.md), [clothes-and-wardrobe](../../.claude/skills/clothes-and-wardrobe/SKILL.md).
