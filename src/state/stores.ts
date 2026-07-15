import { create } from 'zustand';
import * as repo from '../db/repo';
import type { DayActivity, NewTaskInput } from '../db/repo';
import type { CompletionReward, FoodWithQty, PetWithAnimal, Reminder, Task, UserProfile } from '../db/types';
import { cancelReminder, ensureNotificationPermission, scheduleReminder } from '../lib/notifications';
import { kv, Keys } from './mmkv';

function cancelReminderNotifs(r: Reminder | null) {
  if (!r?.os_notification_ids) return;
  try {
    (JSON.parse(r.os_notification_ids) as string[]).forEach((id) => void cancelReminder(id));
  } catch {}
}

// ─── Settings ───
type ColorSchemePref = 'light' | 'dark' | 'system';

interface SettingsState {
  colorScheme: ColorSchemePref;
  onboardingComplete: boolean;
  setColorScheme: (s: ColorSchemePref) => void;
  completeOnboarding: () => void;
}

export const useSettings = create<SettingsState>((set) => ({
  colorScheme: (kv.getString(Keys.colorScheme) as ColorSchemePref) ?? 'system',
  onboardingComplete: kv.getBool(Keys.onboardingComplete, false),
  setColorScheme: (s) => {
    kv.setString(Keys.colorScheme, s);
    set({ colorScheme: s });
  },
  completeOnboarding: () => {
    kv.setBool(Keys.onboardingComplete, true);
    set({ onboardingComplete: true });
  },
}));

// ─── Entitlement (premium) — MVP stub; real source is the IAP SDK later ───
interface EntitlementState {
  isPremium: boolean;
  setPremium: (v: boolean) => void;
}

export const useEntitlement = create<EntitlementState>((set) => ({
  isPremium: kv.getBool(Keys.entitlementIsPremium, false),
  setPremium: (v) => {
    kv.setBool(Keys.entitlementIsPremium, v);
    set({ isPremium: v });
  },
}));

// ─── Core game store (hydrated from SQLite) ───
/** Derived dashboard stats — kept in the store so they recompute on every mutation
 *  (impure SQLite reads in render would be memoized/frozen by the React Compiler). */
function derivedStats() {
  return {
    focusToday: repo.totalFocusSecondsToday(),
    doneToday: repo.completedCountToday(),
    streak: repo.currentStreak(),
    week: repo.weeklyActivity(),
  };
}

interface GameState {
  ready: boolean;
  profile: UserProfile | null;
  pets: PetWithAnimal[];
  activePetId: number | null;
  openTasks: Task[];
  food: FoodWithQty[];
  focusToday: number;
  doneToday: number;
  streak: number;
  week: DayActivity[];

  init: () => void;
  refresh: () => void;
  setActivePet: (id: number) => void;
  addQuest: (input: NewTaskInput) => number;
  completeQuest: (id: number) => CompletionReward;
  removeQuest: (id: number) => void;
  buy: (foodId: number) => void;
  feed: (foodId: number) => number;
  renameCompanion: (name: string) => void;
  adopt: (animalId: number) => number;
  buyClothes: (clothesId: number) => void;
  equip: (clothesId: number) => void;
  pauseFocus: (id: number, doneSeconds: number) => void;
}

export const useGame = create<GameState>((set, get) => ({
  ready: false,
  profile: null,
  pets: [],
  activePetId: null,
  openTasks: [],
  food: [],
  focusToday: 0,
  doneToday: 0,
  streak: 0,
  week: [],

  init: () => {
    repo.applyHealthDecay(); // lazy catch-up on launch — replaces the server cron
    const pets = repo.listPets();
    const stored = kv.getNumber(Keys.activePetId);
    const activePetId = stored && pets.some((p) => p.id === stored) ? stored : (pets[0]?.id ?? null);
    if (activePetId) kv.setNumber(Keys.activePetId, activePetId);
    set({
      ready: true,
      profile: repo.getProfile(),
      pets,
      activePetId,
      openTasks: repo.listOpenTasks(),
      food: repo.listFoodWithQty(),
      ...derivedStats(),
    });
  },

  refresh: () => {
    set({
      profile: repo.getProfile(),
      pets: repo.listPets(),
      openTasks: repo.listOpenTasks(),
      food: repo.listFoodWithQty(),
      ...derivedStats(),
    });
  },

  setActivePet: (id) => {
    kv.setNumber(Keys.activePetId, id);
    set({ activePetId: id });
  },

  addQuest: (input) => {
    const id = repo.createTask(input);
    get().refresh();
    return id;
  },

  completeQuest: (id) => {
    const reward = repo.completeTask(id);
    // Companion evolves as the user's Level climbs.
    const pet = get().activePetId;
    if (pet && reward.leveledUp) {
      repo.setPetEvolution(pet, repo.evolutionStageForLevel(reward.newLevel));
    }
    get().refresh();
    return reward;
  },

  removeQuest: (id) => {
    repo.deleteTask(id);
    get().refresh();
  },

  buy: (foodId) => {
    repo.buyFood(foodId, useEntitlement.getState().isPremium);
    get().refresh();
  },

  feed: (foodId) => {
    const pet = get().activePetId;
    if (!pet) throw new Error('No active companion');
    const health = repo.feedPet(pet, foodId);
    get().refresh();
    return health;
  },

  renameCompanion: (name) => {
    const pet = get().activePetId;
    if (!pet) return;
    repo.renamePet(pet, name);
    get().refresh();
  },

  adopt: (animalId) => {
    const id = repo.adoptAnimal(animalId, useEntitlement.getState().isPremium);
    kv.setNumber(Keys.activePetId, id);
    set({ activePetId: id });
    get().refresh();
    return id;
  },

  buyClothes: (clothesId) => {
    repo.buyClothes(clothesId, useEntitlement.getState().isPremium);
    get().refresh();
  },

  equip: (clothesId) => {
    const pet = get().activePetId;
    if (!pet) throw new Error('No active companion');
    repo.equipClothes(pet, clothesId);
    get().refresh();
  },

  pauseFocus: (id, doneSeconds) => {
    repo.setFocusProgress(id, doneSeconds);
    get().refresh();
  },
}));

/** Derived: the currently active companion row (or first, or null). */
export function selectActivePet(s: GameState): PetWithAnimal | null {
  if (!s.pets.length) return null;
  return s.pets.find((p) => p.id === s.activePetId) ?? s.pets[0];
}

// ─── Reminders ───
interface RemindersState {
  items: Reminder[];
  load: () => void;
  add: (title: string, remindAtMs: number) => Promise<void>;
  complete: (id: number) => void;
  remove: (id: number) => void;
}

export const useReminders = create<RemindersState>((set, get) => ({
  items: [],

  load: () => set({ items: repo.listUpcomingReminders() }),

  add: async (title, remindAtMs) => {
    const id = repo.createReminder({ title, remind_at: remindAtMs });
    get().load();
    await ensureNotificationPermission();
    const notifId = await scheduleReminder(title, remindAtMs);
    if (!notifId) return;
    // The reminder may have been completed/deleted during the async permission+schedule gap.
    const row = repo.getReminder(id);
    if (!row || row.is_completed) {
      await cancelReminder(notifId);
      return;
    }
    repo.setReminderNotifIds(id, [notifId]);
  },

  complete: (id) => {
    cancelReminderNotifs(repo.getReminder(id));
    repo.completeReminder(id);
    get().load();
  },

  remove: (id) => {
    cancelReminderNotifs(repo.getReminder(id));
    repo.deleteReminder(id);
    get().load();
  },
}));
