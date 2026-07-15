/**
 * Canonical local-first SQLite schema for Pawductivity.
 * Transcribed from context/data-model/sqlite-schema.md (single source of truth).
 *
 * Conventions:
 *  - Booleans are INTEGER 0/1 (SQLite has no bool).
 *  - Timestamps are epoch MILLISECONDS (unixepoch() * 1000).
 *  - Calendar dates are TEXT 'YYYY-MM-DD' (device-local).
 *  - Enums are TEXT + CHECK.
 *  - Single local user (user_profile row id = 1); no userid FKs.
 */

export const SCHEMA_V1 = /* sql */ `
-- ─── profile & gamification ───
CREATE TABLE user_profile (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  display_name  TEXT    NOT NULL DEFAULT 'Me',
  avatar        TEXT    NOT NULL DEFAULT 'default.png',
  profile_index INTEGER NOT NULL DEFAULT 0,
  coins         INTEGER NOT NULL DEFAULT 200 CHECK (coins >= 0),
  level         INTEGER NOT NULL DEFAULT 1   CHECK (level >= 1),
  current_xp    INTEGER NOT NULL DEFAULT 0   CHECK (current_xp >= 0),
  needed_xp     INTEGER NOT NULL DEFAULT 160 CHECK (needed_xp > 0),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ─── tasks / quests & progress ───
CREATE TABLE task (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  description    TEXT,
  tag            TEXT    NOT NULL DEFAULT '',
  kind           TEXT    NOT NULL DEFAULT 'focus'
                   CHECK (kind IN ('target','checklist','focus')),
  estimated_time INTEGER NOT NULL CHECK (estimated_time > 0),
  time_completed INTEGER NOT NULL DEFAULT 0 CHECK (time_completed >= 0),
  completed      INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  repetition     INTEGER NOT NULL DEFAULT 0 CHECK (repetition BETWEEN 0 AND 127),
  target_value   INTEGER,
  target_current INTEGER NOT NULL DEFAULT 0,
  target_unit    TEXT,
  due_date       INTEGER,
  creation_date  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_by_ai  INTEGER NOT NULL DEFAULT 0 CHECK (created_by_ai IN (0,1))
);

CREATE TABLE checklist_item (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE daily_log (
  task_id        INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  date           TEXT    NOT NULL,
  time_completed INTEGER NOT NULL DEFAULT 0,
  duration       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (task_id, date)
);

CREATE TABLE time_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id   INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  seconds   INTEGER NOT NULL,
  logged_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ─── companion (pet) ───
CREATE TABLE animal (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  species     TEXT    NOT NULL CHECK (species IN ('dog','cat','rabbit')),
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),
  asset       TEXT    NOT NULL,
  premium     INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1))
);

CREATE TABLE pet (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id            INTEGER NOT NULL REFERENCES animal(id),
  name                 TEXT    NOT NULL,
  health               INTEGER NOT NULL DEFAULT 100 CHECK (health BETWEEN 0 AND 100),
  evolution_stage      INTEGER NOT NULL DEFAULT 0 CHECK (evolution_stage BETWEEN 0 AND 5),
  last_health_decay_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  acquired_at          INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ─── shop, inventory, cosmetics & economy ───
CREATE TABLE food (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),
  heal        INTEGER NOT NULL CHECK (heal >= 0),
  asset       TEXT    NOT NULL,
  premium     INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1))
);

CREATE TABLE food_inventory (
  food_id  INTEGER PRIMARY KEY REFERENCES food(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

CREATE TABLE clothes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),
  slot        TEXT    NOT NULL DEFAULT 'shirt'
                CHECK (slot IN ('hat','shirt','pants','shoes')),
  asset       TEXT    NOT NULL,
  premium     INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1))
);

CREATE TABLE clothes_inventory (
  clothes_id  INTEGER PRIMARY KEY REFERENCES clothes(id) ON DELETE CASCADE,
  acquired_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE pet_clothes (
  pet_id     INTEGER NOT NULL REFERENCES pet(id) ON DELETE CASCADE,
  clothes_id INTEGER NOT NULL REFERENCES clothes(id) ON DELETE CASCADE,
  slot       TEXT    NOT NULL CHECK (slot IN ('hat','shirt','pants','shoes')),
  PRIMARY KEY (pet_id, slot)
);

CREATE TABLE coin_ledger (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  delta         INTEGER NOT NULL,
  reason        TEXT    NOT NULL CHECK (reason IN (
                    'task_reward','level_up','purchase_pet','purchase_food',
                    'purchase_clothes','referral','iap_topup','other')),
  ref_id        INTEGER,
  balance_after INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ─── reminders ───
CREATE TABLE reminder (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  title               TEXT    NOT NULL,
  remind_at           INTEGER NOT NULL,
  recurrence          TEXT    NOT NULL DEFAULT 'once'
                        CHECK (recurrence IN ('once','weekly','monthly','yearly')),
  is_completed        INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0,1)),
  os_notification_ids TEXT,
  created_at          INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ─── analytics & optional ───
CREATE TABLE pet_usage (
  pet_id       INTEGER NOT NULL REFERENCES pet(id)  ON DELETE CASCADE,
  task_id      INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  date         TEXT    NOT NULL,
  seconds_used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (pet_id, task_id, date)
);

CREATE TABLE achievement (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  requirement TEXT    NOT NULL
);

CREATE TABLE user_achievement (
  achievement_id INTEGER NOT NULL REFERENCES achievement(id) ON DELETE CASCADE,
  unlocked_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (achievement_id)
);

-- ─── indices ───
CREATE INDEX idx_task_due        ON task(due_date);
CREATE INDEX idx_task_open       ON task(completed) WHERE completed = 0;
CREATE INDEX idx_checklist_task  ON checklist_item(task_id);
CREATE INDEX idx_daily_log_date  ON daily_log(date);
CREATE INDEX idx_time_log_task   ON time_log(task_id, logged_at);
CREATE INDEX idx_reminder_time   ON reminder(remind_at) WHERE is_completed = 0;
CREATE INDEX idx_coin_ledger_at  ON coin_ledger(created_at);
CREATE INDEX idx_pet_usage_date  ON pet_usage(date);
CREATE INDEX idx_pet_clothes_pet ON pet_clothes(pet_id);
`;

/**
 * Seed catalogs — verified against pawductivity.sql:233-335 and seed-catalogs.md.
 * `asset` stores a stable KEY resolved to a bundled require() in src/assets/registry.ts.
 * Runs once (inside the v1 migration).
 */
export const SEED_V1 = /* sql */ `
INSERT INTO animal (species, name, description, price, asset, premium) VALUES
  ('dog',    'Dog',    'A faithful companion',  100, 'dog',    0),
  ('cat',    'Cat',    'An independent friend', 200, 'cat',    0),
  ('rabbit', 'Rabbit', 'A fluffy friend',       200, 'rabbit', 1);

INSERT INTO food (name, description, price, heal, asset, premium) VALUES
  ('Apple',      'A crunchy apple',              3, 10, 'apple',      0),
  ('Chicken',    'A delicious meal for your pet',3, 10, 'chicken',    0),
  ('Pizza',      'A tasty pizza for your pet',   4, 20, 'pizza',      1),
  ('Watermelon', 'A juicy slice of watermelon',  4, 10, 'watermelon', 0),
  ('Carrot',     'A fresh carrot',               5, 15, 'carrot',     0);

INSERT INTO clothes (name, description, price, slot, asset, premium) VALUES
  ('Cyan t-shirt', 'A cool cyan tee',    15, 'shirt', 'shirt_cyan',  0),
  ('Green shirt',  'A classic polo',     10, 'shirt', 'shirt_green', 0),
  ('Tuxedo',       'Formal and fancy',   20, 'shirt', 'tuxedo',      1),
  ('Star Shirt',   'A shirt with a star',15, 'shirt', 'shirt_star',  1),
  ('Pink Dress',   'A pretty pink dress',20, 'shirt', 'dress_pink',  1);

-- Seed the single local user and a free starter Cat named 'My Pet' (legacy onboarding).
INSERT INTO user_profile (id) VALUES (1);
INSERT INTO pet (animal_id, name) VALUES ((SELECT id FROM animal WHERE species = 'cat'), 'My Pet');
`;
