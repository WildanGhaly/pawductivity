import { getDb } from './client';
import { localMidnightsBetween, startOfLocalDay, todayLocalISO } from '../lib/date';
import { applyXpGain, coinsForTask, levelUpBonus, xpForTask } from '../lib/rewards';
import type {
  Animal,
  Clothes,
  CompletionReward,
  Food,
  FoodWithQty,
  Pet,
  PetWithAnimal,
  QuestKind,
  Recurrence,
  Reminder,
  Task,
  UserProfile,
} from './types';

// ─── Reward tuning (open decision D12; single source of truth) ───
// The formulas live in ../lib/rewards (pure, unit-tested); re-exported here so existing
// `repo.*` callers keep working.
export { coinsForTask, evolutionStageForLevel, levelUpBonus, neededXpFor, xpForTask } from '../lib/rewards';

const NOW = 'unixepoch() * 1000';

// ─── Profile ───
export function getProfile(): UserProfile {
  return getDb().getFirstSync<UserProfile>('SELECT * FROM user_profile WHERE id = 1')!;
}

export function getCoins(): number {
  return getDb().getFirstSync<{ coins: number }>('SELECT coins FROM user_profile WHERE id = 1')!.coins;
}

export function setDisplayName(name: string): void {
  getDb().runSync(
    `UPDATE user_profile SET display_name = ?, updated_at = ${NOW} WHERE id = 1`,
    [name.trim() || 'Me'],
  );
}

export function setProfileIndex(index: number): void {
  getDb().runSync(`UPDATE user_profile SET profile_index = ?, updated_at = ${NOW} WHERE id = 1`, [
    Math.max(0, Math.min(6, Math.round(index))),
  ]);
}

// ─── Catalog / pets ───
export function listAnimals(): Animal[] {
  return getDb().getAllSync<Animal>('SELECT * FROM animal ORDER BY id');
}

export function listPets(): PetWithAnimal[] {
  return getDb().getAllSync<PetWithAnimal>(
    `SELECT p.*, a.species AS species, a.name AS animal_name
       FROM pet p JOIN animal a ON a.id = p.animal_id
      ORDER BY p.id`,
  );
}

export function getPet(id: number): PetWithAnimal | null {
  return getDb().getFirstSync<PetWithAnimal>(
    `SELECT p.*, a.species AS species, a.name AS animal_name
       FROM pet p JOIN animal a ON a.id = p.animal_id WHERE p.id = ?`,
    [id],
  );
}

export function getFirstPet(): PetWithAnimal | null {
  return getDb().getFirstSync<PetWithAnimal>(
    `SELECT p.*, a.species AS species, a.name AS animal_name
       FROM pet p JOIN animal a ON a.id = p.animal_id ORDER BY p.id LIMIT 1`,
  );
}

export function renamePet(petId: number, name: string): void {
  getDb().runSync('UPDATE pet SET name = ? WHERE id = ?', [name.trim() || 'My Pet', petId]);
}

/**
 * Lazy health decay: −1 per local midnight crossed since last_health_decay_at, floored at 0.
 * Idempotent — safe to call on every app open/resume. Returns pets whose health changed.
 */
export function applyHealthDecay(nowMs: number = Date.now()): void {
  const db = getDb();
  const pets = db.getAllSync<Pet>('SELECT id, health, last_health_decay_at FROM pet');
  const startToday = startOfLocalDay(nowMs);
  db.withTransactionSync(() => {
    for (const pet of pets) {
      const missed = localMidnightsBetween(pet.last_health_decay_at, nowMs);
      if (missed > 0) {
        const newHealth = Math.max(0, pet.health - missed);
        db.runSync('UPDATE pet SET health = ?, last_health_decay_at = ? WHERE id = ?', [
          newHealth,
          startToday,
          pet.id,
        ]);
      }
    }
  });
}

// ─── Tasks / quests ───
export interface NewTaskInput {
  name: string;
  estimated_time: number; // seconds
  kind?: QuestKind;
  tag?: string;
  description?: string;
  due_date?: number | null;
  target_value?: number | null;
  target_unit?: string | null;
  repetition?: number;
  created_by_ai?: boolean;
}

export function createTask(input: NewTaskInput): number {
  const r = getDb().runSync(
    `INSERT INTO task (name, description, tag, kind, estimated_time, repetition,
                       target_value, target_unit, due_date, created_by_ai)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name.trim(),
      input.description ?? null,
      input.tag ?? '',
      input.kind ?? 'focus',
      Math.max(1, Math.round(input.estimated_time)),
      input.repetition ?? 0,
      input.target_value ?? null,
      input.target_unit ?? null,
      input.due_date ?? null,
      input.created_by_ai ? 1 : 0,
    ],
  );
  return r.lastInsertRowId;
}

/** One-tap "Focus now": create an ad-hoc focus quest of `minutes` and return its id. */
export function createQuickFocusTask(minutes: number): number {
  const m = Math.max(1, Math.round(minutes));
  return createTask({ name: `${m}-minute focus`, estimated_time: m * 60, kind: 'focus', tag: 'Focus' });
}

export function listOpenTasks(): Task[] {
  return getDb().getAllSync<Task>(
    'SELECT * FROM task WHERE completed = 0 ORDER BY COALESCE(due_date, creation_date) ASC',
  );
}

export function listCompletedTasks(limit = 50): Task[] {
  return getDb().getAllSync<Task>(
    'SELECT * FROM task WHERE completed = 1 ORDER BY id DESC LIMIT ?',
    [limit],
  );
}

export function getTask(id: number): Task | null {
  return getDb().getFirstSync<Task>('SELECT * FROM task WHERE id = ?', [id]);
}

export function deleteTask(id: number): void {
  getDb().runSync('DELETE FROM task WHERE id = ?', [id]);
}

/**
 * Complete a quest: mark done, log progress, grant coins + XP, run the level-up
 * carry loop, and write the coin ledger — all in one transaction.
 */
export function completeTask(taskId: number): CompletionReward {
  const db = getDb();
  let reward: CompletionReward = {
    coinsEarned: 0,
    xpEarned: 0,
    leveledUp: false,
    newLevel: 1,
    levelUpBonusCoins: 0,
  };

  db.withTransactionSync(() => {
    const t = db.getFirstSync<Task>('SELECT * FROM task WHERE id = ?', [taskId]);
    if (!t) throw new Error('Quest not found');
    if (t.completed) throw new Error('Quest already completed');

    const coinsEarned = coinsForTask(t.estimated_time);
    const xpEarned = xpForTask(t.estimated_time);
    const remaining = Math.max(0, t.estimated_time - t.time_completed);
    const today = todayLocalISO();

    db.runSync('UPDATE task SET completed = 1, time_completed = ? WHERE id = ?', [
      t.estimated_time,
      taskId,
    ]);
    // Credit focus seconds only for focus quests; still write a daily_log row so
    // streaks + completed-count include target/checklist completions too.
    const focusSecs = t.kind === 'focus' ? remaining : 0;
    if (focusSecs > 0) {
      db.runSync('INSERT INTO time_log (task_id, seconds) VALUES (?, ?)', [taskId, focusSecs]);
    }
    db.runSync(
      `INSERT INTO daily_log (task_id, date, time_completed, duration) VALUES (?, ?, ?, ?)
       ON CONFLICT(task_id, date) DO UPDATE SET
         time_completed = excluded.time_completed,
         duration = daily_log.duration + excluded.duration`,
      [taskId, today, t.estimated_time, focusSecs],
    );

    const p = db.getFirstSync<UserProfile>('SELECT * FROM user_profile WHERE id = 1')!;
    const coins = p.coins;
    const { level, currentXp: xp, neededXp: needed, leveledUp } = applyXpGain(
      { level: p.level, currentXp: p.current_xp, neededXp: p.needed_xp },
      xpEarned,
    );
    // Legacy level_up granted the coin bonus once per completion, not per level crossed.
    const bonus = leveledUp ? levelUpBonus(t.estimated_time) : 0;
    const coinsAfterReward = coins + coinsEarned;
    const coinsFinal = coinsAfterReward + bonus;

    db.runSync(
      `UPDATE user_profile SET coins = ?, level = ?, current_xp = ?, needed_xp = ?, updated_at = ${NOW} WHERE id = 1`,
      [coinsFinal, level, xp, needed],
    );
    db.runSync(
      'INSERT INTO coin_ledger (delta, reason, ref_id, balance_after) VALUES (?, ?, ?, ?)',
      [coinsEarned, 'task_reward', taskId, coinsAfterReward],
    );
    if (bonus > 0) {
      db.runSync(
        'INSERT INTO coin_ledger (delta, reason, ref_id, balance_after) VALUES (?, ?, ?, ?)',
        [bonus, 'level_up', taskId, coinsFinal],
      );
    }

    reward = {
      coinsEarned,
      xpEarned,
      leveledUp,
      newLevel: level,
      levelUpBonusCoins: bonus,
    };
  });

  return reward;
}

// ─── Food & feeding ───
export function listFoodWithQty(): FoodWithQty[] {
  return getDb().getAllSync<FoodWithQty>(
    `SELECT f.*, COALESCE(fi.quantity, 0) AS quantity
       FROM food f LEFT JOIN food_inventory fi ON fi.food_id = f.id
      ORDER BY f.id`,
  );
}

/** Buy one unit of food. Throws on insufficient coins / premium gate. */
export function buyFood(foodId: number, isPremium: boolean): void {
  const db = getDb();
  db.withTransactionSync(() => {
    const f = db.getFirstSync<Food>('SELECT * FROM food WHERE id = ?', [foodId]);
    if (!f) throw new Error('Food not found');
    if (f.premium && !isPremium) throw new Error('This item requires Premium');
    const coins = db.getFirstSync<{ coins: number }>('SELECT coins FROM user_profile WHERE id = 1')!.coins;
    if (coins < f.price) throw new Error('Not enough coins');
    const newCoins = coins - f.price;
    db.runSync(`UPDATE user_profile SET coins = ?, updated_at = ${NOW} WHERE id = 1`, [newCoins]);
    db.runSync(
      `INSERT INTO food_inventory (food_id, quantity) VALUES (?, 1)
       ON CONFLICT(food_id) DO UPDATE SET quantity = quantity + 1`,
      [foodId],
    );
    db.runSync(
      'INSERT INTO coin_ledger (delta, reason, ref_id, balance_after) VALUES (?, ?, ?, ?)',
      [-f.price, 'purchase_food', foodId, newCoins],
    );
  });
}

/** Feed a pet with one owned food unit. Heals up to 100. Returns new health. */
export function feedPet(petId: number, foodId: number): number {
  const db = getDb();
  let newHealth = 0;
  db.withTransactionSync(() => {
    const inv = db.getFirstSync<{ quantity: number }>(
      'SELECT quantity FROM food_inventory WHERE food_id = ?',
      [foodId],
    );
    if (!inv || inv.quantity <= 0) throw new Error('You have none of this food');
    const heal = db.getFirstSync<{ heal: number }>('SELECT heal FROM food WHERE id = ?', [foodId])!.heal;
    const pet = db.getFirstSync<{ health: number }>('SELECT health FROM pet WHERE id = ?', [petId]);
    if (!pet) throw new Error('Pet not found');
    newHealth = Math.min(100, pet.health + heal);
    db.runSync('UPDATE pet SET health = ? WHERE id = ?', [newHealth, petId]);
    db.runSync('UPDATE food_inventory SET quantity = quantity - 1 WHERE food_id = ?', [foodId]);
  });
  return newHealth;
}

// ─── Insights (on-device aggregates) ───
export function totalFocusSecondsToday(): number {
  const row = getDb().getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(duration), 0) AS total FROM daily_log WHERE date = ?',
    [todayLocalISO()],
  );
  return row?.total ?? 0;
}

export function completedCountToday(): number {
  const row = getDb().getFirstSync<{ n: number }>(
    `SELECT COUNT(t.id) AS n FROM daily_log dl JOIN task t ON t.id = dl.task_id
      WHERE dl.date = ? AND t.completed = 1`,
    [todayLocalISO()],
  );
  return row?.n ?? 0;
}

// ─── Reminders ───
export interface NewReminderInput {
  title: string;
  remind_at: number; // epoch ms
  recurrence?: Recurrence;
}

export function createReminder(input: NewReminderInput): number {
  const r = getDb().runSync('INSERT INTO reminder (title, remind_at, recurrence) VALUES (?, ?, ?)', [
    input.title.trim(),
    Math.round(input.remind_at),
    input.recurrence ?? 'once',
  ]);
  return r.lastInsertRowId;
}

export function setReminderNotifIds(id: number, notifIds: string[]): void {
  getDb().runSync('UPDATE reminder SET os_notification_ids = ? WHERE id = ?', [JSON.stringify(notifIds), id]);
}

export function listUpcomingReminders(): Reminder[] {
  return getDb().getAllSync<Reminder>('SELECT * FROM reminder WHERE is_completed = 0 ORDER BY remind_at ASC');
}

export function getReminder(id: number): Reminder | null {
  return getDb().getFirstSync<Reminder>('SELECT * FROM reminder WHERE id = ?', [id]);
}

export function completeReminder(id: number): void {
  getDb().runSync('UPDATE reminder SET is_completed = 1 WHERE id = ?', [id]);
}

export function deleteReminder(id: number): void {
  getDb().runSync('DELETE FROM reminder WHERE id = ?', [id]);
}

// ─── Streaks & insights ───
/** Consecutive days (ending today) with at least one completed/focused quest. */
export function currentStreak(nowMs: number = Date.now()): number {
  const dates = new Set(
    getDb().getAllSync<{ date: string }>('SELECT DISTINCT date FROM daily_log').map((r) => r.date),
  );
  let streak = 0;
  const d = new Date(nowMs);
  while (dates.has(todayLocalISO(d.getTime()))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export interface DayActivity {
  date: string;
  label: string;
  seconds: number;
}

/** Focus seconds per day for the last 7 days (oldest → today). */
export function weeklyActivity(nowMs: number = Date.now()): DayActivity[] {
  const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const start = new Date(nowMs);
  start.setDate(start.getDate() - 6);
  // One grouped query instead of 7 — fewer web sqlite sync round-trips.
  const rows = getDb().getAllSync<{ date: string; s: number }>(
    'SELECT date, COALESCE(SUM(duration), 0) AS s FROM daily_log WHERE date >= ? GROUP BY date',
    [todayLocalISO(start.getTime())],
  );
  const byDate = new Map(rows.map((r) => [r.date, r.s]));
  const out: DayActivity[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowMs);
    d.setDate(d.getDate() - i);
    const iso = todayLocalISO(d.getTime());
    out.push({ date: iso, label: labels[d.getDay()], seconds: byDate.get(iso) ?? 0 });
  }
  return out;
}

/** Focus seconds grouped by quest tag (top tags), for the distribution chart. */
export function tagDistribution(limit = 6): { tag: string; seconds: number }[] {
  return getDb().getAllSync<{ tag: string; seconds: number }>(
    `SELECT CASE WHEN t.tag = '' THEN 'Untagged' ELSE t.tag END AS tag,
            COALESCE(SUM(dl.duration), 0) AS seconds
       FROM daily_log dl JOIN task t ON t.id = dl.task_id
      GROUP BY tag HAVING seconds > 0 ORDER BY seconds DESC LIMIT ?`,
    [limit],
  );
}

// ─── Evolution ───
export function setPetEvolution(petId: number, stage: number): void {
  getDb().runSync('UPDATE pet SET evolution_stage = ? WHERE id = ?', [Math.max(0, Math.min(5, stage)), petId]);
}

// ─── Onboarding ───
/** Set the chosen free starter companion (updates the single seeded pet, or creates one). */
export function setStarterCompanion(animalId: number, name: string): void {
  const db = getDb();
  const cleaned = name.trim() || 'My Pet';
  const existing = db.getFirstSync<{ id: number }>('SELECT id FROM pet ORDER BY id LIMIT 1');
  if (existing) {
    db.runSync('UPDATE pet SET animal_id = ?, name = ?, evolution_stage = 0, health = 100 WHERE id = ?', [
      animalId,
      cleaned,
      existing.id,
    ]);
  } else {
    db.runSync('INSERT INTO pet (animal_id, name) VALUES (?, ?)', [animalId, cleaned]);
  }
}

// ─── Companion shop / adoption ───
export interface AnimalOwnership extends Animal {
  owned: boolean;
  petId: number | null;
}

export function listAnimalsWithOwnership(): AnimalOwnership[] {
  let rows: (Animal & { pet_id: number | null })[] = [];
  try {
    rows = getDb().getAllSync<Animal & { pet_id: number | null }>(
      `SELECT a.*, MIN(p.id) AS pet_id
         FROM animal a LEFT JOIN pet p ON p.animal_id = a.id
        GROUP BY a.id ORDER BY a.id`,
    );
  } catch (e) {
    console.warn('listAnimalsWithOwnership failed (web sqlite worker)', e);
    return [];
  }
  return rows.map((r) => ({
    id: r.id,
    species: r.species,
    name: r.name,
    description: r.description,
    price: r.price,
    asset: r.asset,
    premium: r.premium,
    owned: r.pet_id != null,
    petId: r.pet_id ?? null,
  }));
}

/** Adopt a new species. Deducts coins, rejects duplicates/premium-gated. Returns new pet id. */
export function adoptAnimal(animalId: number, isPremium: boolean): number {
  const db = getDb();
  let newPetId = 0;
  db.withTransactionSync(() => {
    const a = db.getFirstSync<Animal>('SELECT * FROM animal WHERE id = ?', [animalId]);
    if (!a) throw new Error('Species not found');
    if (a.premium && !isPremium) throw new Error('This companion requires Premium');
    const existing = db.getFirstSync<{ id: number }>('SELECT id FROM pet WHERE animal_id = ?', [animalId]);
    if (existing) throw new Error(`You already have a ${a.name}`);
    const coins = db.getFirstSync<{ coins: number }>('SELECT coins FROM user_profile WHERE id = 1')!.coins;
    if (coins < a.price) throw new Error('Not enough coins');
    const newCoins = coins - a.price;
    db.runSync(`UPDATE user_profile SET coins = ?, updated_at = ${NOW} WHERE id = 1`, [newCoins]);
    const r = db.runSync('INSERT INTO pet (animal_id, name) VALUES (?, ?)', [animalId, a.name]);
    newPetId = r.lastInsertRowId;
    db.runSync('INSERT INTO coin_ledger (delta, reason, ref_id, balance_after) VALUES (?, ?, ?, ?)', [
      -a.price,
      'purchase_pet',
      animalId,
      newCoins,
    ]);
  });
  return newPetId;
}

// ─── Wardrobe / cosmetics ───
export interface ClothesState extends Clothes {
  owned: boolean;
  equipped: boolean;
}

export function listClothesWithState(petId: number | null): ClothesState[] {
  const pid = Math.trunc(petId ?? -1); // inline (safe integer) — a bound param + non-empty
  // result can trip the web sqlite sync worker; single LEFT-JOIN like listFoodWithQty.
  try {
    const rows = getDb().getAllSync<Clothes & { state: number }>(
      `SELECT c.*,
              CASE WHEN pc.clothes_id IS NOT NULL THEN 2
                   WHEN ci.clothes_id IS NOT NULL THEN 1 ELSE 0 END AS state
         FROM clothes c
         LEFT JOIN clothes_inventory ci ON ci.clothes_id = c.id
         LEFT JOIN pet_clothes pc ON pc.clothes_id = c.id AND pc.pet_id = ${pid}
        ORDER BY c.id`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      slot: r.slot,
      asset: r.asset,
      premium: r.premium,
      owned: r.state >= 1,
      equipped: r.state === 2,
    }));
  } catch (e) {
    console.warn('listClothesWithState failed (web sqlite worker)', e);
    return [];
  }
}

export function buyClothes(clothesId: number, isPremium: boolean): void {
  const db = getDb();
  db.withTransactionSync(() => {
    const c = db.getFirstSync<Clothes>('SELECT * FROM clothes WHERE id = ?', [clothesId]);
    if (!c) throw new Error('Item not found');
    if (c.premium && !isPremium) throw new Error('This item requires Premium');
    const already = db.getFirstSync('SELECT 1 FROM clothes_inventory WHERE clothes_id = ?', [clothesId]);
    if (already) throw new Error('You already own this');
    const coins = db.getFirstSync<{ coins: number }>('SELECT coins FROM user_profile WHERE id = 1')!.coins;
    if (coins < c.price) throw new Error('Not enough coins');
    const newCoins = coins - c.price;
    db.runSync(`UPDATE user_profile SET coins = ?, updated_at = ${NOW} WHERE id = 1`, [newCoins]);
    db.runSync('INSERT INTO clothes_inventory (clothes_id) VALUES (?)', [clothesId]);
    db.runSync('INSERT INTO coin_ledger (delta, reason, ref_id, balance_after) VALUES (?, ?, ?, ?)', [
      -c.price,
      'purchase_clothes',
      clothesId,
      newCoins,
    ]);
  });
}

/** Equip an owned garment on a pet (one per slot). Toggling the same item unequips it. */
export function equipClothes(petId: number, clothesId: number): void {
  const db = getDb();
  const c = db.getFirstSync<{ slot: string }>('SELECT slot FROM clothes WHERE id = ?', [clothesId]);
  if (!c) throw new Error('Item not found');
  const owned = db.getFirstSync('SELECT 1 FROM clothes_inventory WHERE clothes_id = ?', [clothesId]);
  if (!owned) throw new Error('You do not own this');
  const current = db.getFirstSync<{ clothes_id: number }>(
    'SELECT clothes_id FROM pet_clothes WHERE pet_id = ? AND slot = ?',
    [petId, c.slot],
  );
  if (current?.clothes_id === clothesId) {
    db.runSync('DELETE FROM pet_clothes WHERE pet_id = ? AND slot = ?', [petId, c.slot]);
  } else {
    db.runSync(
      `INSERT INTO pet_clothes (pet_id, clothes_id, slot) VALUES (?, ?, ?)
       ON CONFLICT(pet_id, slot) DO UPDATE SET clothes_id = excluded.clothes_id`,
      [petId, clothesId, c.slot],
    );
  }
}

export function getEquippedClothes(petId: number): Clothes[] {
  try {
    return getDb().getAllSync<Clothes>(
      `SELECT c.* FROM pet_clothes pc JOIN clothes c ON c.id = pc.clothes_id WHERE pc.pet_id = ${Math.trunc(petId)}`,
    );
  } catch (e) {
    console.warn('getEquippedClothes failed (web sqlite worker)', e);
    return [];
  }
}

// ─── Focus session progress ───
/** Persist accrued focus time (absolute total, capped). Logs the delta to time_log + daily_log. */
export function setFocusProgress(taskId: number, totalCompletedSeconds: number): void {
  const db = getDb();
  db.withTransactionSync(() => {
    const t = db.getFirstSync<Task>('SELECT * FROM task WHERE id = ?', [taskId]);
    if (!t || t.completed) return;
    const capped = Math.min(t.estimated_time, Math.max(0, Math.round(totalCompletedSeconds)));
    const delta = capped - t.time_completed;
    if (delta <= 0) return;
    db.runSync('UPDATE task SET time_completed = ? WHERE id = ?', [capped, taskId]);
    db.runSync('INSERT INTO time_log (task_id, seconds) VALUES (?, ?)', [taskId, delta]);
    db.runSync(
      `INSERT INTO daily_log (task_id, date, time_completed, duration) VALUES (?, ?, ?, ?)
       ON CONFLICT(task_id, date) DO UPDATE SET
         time_completed = excluded.time_completed,
         duration = daily_log.duration + excluded.duration`,
      [taskId, todayLocalISO(), capped, delta],
    );
  });
}
