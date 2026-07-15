import { create } from 'zustand';
import * as repo from '../db/repo';
import type { NewTaskInput } from '../db/repo';
import type { CompletionReward, FoodWithQty, PetWithAnimal, Task, UserProfile } from '../db/types';
import { kv, Keys } from './mmkv';

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
interface GameState {
  ready: boolean;
  profile: UserProfile | null;
  pets: PetWithAnimal[];
  activePetId: number | null;
  openTasks: Task[];
  food: FoodWithQty[];

  init: () => void;
  refresh: () => void;
  setActivePet: (id: number) => void;
  addQuest: (input: NewTaskInput) => number;
  completeQuest: (id: number) => CompletionReward;
  removeQuest: (id: number) => void;
  buy: (foodId: number) => void;
  feed: (foodId: number) => number;
  renameCompanion: (name: string) => void;
}

export const useGame = create<GameState>((set, get) => ({
  ready: false,
  profile: null,
  pets: [],
  activePetId: null,
  openTasks: [],
  food: [],

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
    });
  },

  refresh: () => {
    set({
      profile: repo.getProfile(),
      pets: repo.listPets(),
      openTasks: repo.listOpenTasks(),
      food: repo.listFoodWithQty(),
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
}));

/** Derived: the currently active companion row (or first, or null). */
export function selectActivePet(s: GameState): PetWithAnimal | null {
  if (!s.pets.length) return null;
  return s.pets.find((p) => p.id === s.activePetId) ?? s.pets[0];
}
