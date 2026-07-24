import { create } from 'zustand';
import { produce } from 'immer';
import { AppState, Species } from '../domain/types';
import { freshState } from '../domain/state';
import { persistence } from '../db/persistence';
import { FOODS, CLOTHES, SPECIES, JOURNEY } from '../domain/catalogs';
import { idlePending, petStage, achMet } from '../domain/mechanics';
import { ACHIEVEMENTS } from '../domain/catalogs';

// A transient toast message consumers can subscribe to.
export interface ToastMsg { id: number; text: string; coin?: boolean }

export type OverlayName =
  // full-screen slide-ups
  | 'focus' | 'shop' | 'premium' | 'referral' | 'insights' | 'journey'
  | 'achievements' | 'recap' | 'sync' | 'profile' | 'appearance' | 'reward'
  // bottom sheets / dialogs
  | 'capture' | 'goal' | 'plan' | 'buy';

export interface OverlayState { name: OverlayName; param?: any }

interface StoreShape {
  state: AppState | null; // null until hydrated
  hydrated: boolean;
  toast: ToastMsg | null;
  // Overlay navigation stack. The last entry is the visible overlay; closing pops
  // back to its parent (so Profile -> Appearance -> back returns to Profile).
  overlays: OverlayState[];

  hydrate: () => Promise<void>;
  showToast: (text: string, coin?: boolean) => void;
  openOverlay: (name: OverlayName, param?: any) => void;
  closeOverlay: () => void;
  closeAllOverlays: () => void;
  mutate: (fn: (s: AppState) => void, opts?: { silent?: boolean }) => void;

  // lifecycle
  finishOnboarding: (species: Species, petName: string) => void;
  resetData: () => Promise<void>;

  // core gameplay actions
  setTab: (tab: AppState['tab']) => void;
  collectIdle: () => void;
  feed: (foodId: number) => void;
  equip: (clothesId: number) => void;
  buildMilestone: (id: string) => void;
  buyFood: (id: number) => void;
  buyClothes: (id: number) => void;
  buyPet: (id: number) => void;
  addQuest: (q: { name: string; est: number; tag: any; repeat?: boolean }) => number;
  addQuests: (list: { name: string; est: number; tag: any; repeat?: boolean }[]) => void;
  setGoal: (min: number) => void;
  togglePlan: (id: number) => void;
  bankFocus: (qid: number | null, workDoneSec: number, pomodoro: boolean) => { coins: number; bonus: number; mins: number };
  toggleSetting: (k: 'notif' | 'sound') => void;
  setName: (name: string) => void;
  setAvatar: (i: number) => void;
  setAccent: (i: number) => void;
  setRoom: (i: number) => void;
  setPremium: (on: boolean) => void;

  // reminders
  addReminder: (r: { name: string; time: string; rep: any; y?: number; mo?: number; day?: number }) => void;
  toggleReminderDone: (id: number, key: string) => void;
  deleteReminder: (id: number) => void;

  // backend-parked features (local placeholders)
  redeemReferral: (code: string) => void;
  buyPremium: () => void;
  runSync: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let toastSeq = 1;

function scheduleSave(getState: () => StoreShape) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = getState().state;
    if (s) persistence.save(s);
  }, 250);
}

export const useStore = create<StoreShape>((set, get) => {
  const mutate: StoreShape['mutate'] = (fn) => {
    set((store) => {
      if (!store.state) return store;
      const next = produce(store.state, fn);
      return { ...store, state: next };
    });
    // grant any newly-met achievements, then persist
    grantAchievements(set, get);
    scheduleSave(get);
  };

  return {
    state: null,
    hydrated: false,
    toast: null,
    overlays: [],

    hydrate: async () => {
      const loaded = await persistence.load();
      set({ state: loaded, hydrated: true });
    },

    showToast: (text, coin) => set({ toast: { id: toastSeq++, text, coin } }),
    // Push onto the stack. 'reward' is terminal: it follows a finished focus session,
    // so it replaces the stack rather than sitting on top of the spent Focus screen.
    openOverlay: (name, param) =>
      set((store) => ({
        overlays: name === 'reward' ? [{ name, param }] : [...store.overlays, { name, param }],
      })),
    // Pop back to the parent overlay (or to the tab when the stack empties).
    closeOverlay: () => set((store) => ({ overlays: store.overlays.slice(0, -1) })),
    closeAllOverlays: () => set({ overlays: [] }),

    mutate,

    finishOnboarding: (species, petName) => {
      const s = freshState();
      s.pet.species = species;
      s.pet.name = (petName || 'Pixel').trim();
      s.profile.name = 'Friend';
      set({ state: s });
      persistence.save(s);
      get().showToast(`${s.pet.name} is ready to go! +200 coins`, true);
    },

    resetData: async () => {
      await persistence.wipe();
      set({ state: null });
    },

    setTab: (tab) => set((store) => (store.state ? { state: { ...store.state, tab } } : store)),

    collectIdle: () => {
      const s = get().state;
      if (!s) return;
      const amt = idlePending(s.pet);
      if (amt <= 0) { get().showToast('Nothing to collect yet'); return; }
      mutate((d) => {
        d.profile.coins += amt;
        d.pet.lastCollect = Date.now();
        d.insights.idleCollected += amt;
      });
      get().showToast(`${s.pet.name} brought you ${amt} coins`, true);
    },

    feed: (foodId) => {
      const s = get().state;
      if (!s) return;
      if ((s.pet.food[foodId] || 0) <= 0) { get().showToast('You have none of that treat'); return; }
      const f = FOODS.find((x) => x.id === foodId);
      if (!f) return;
      mutate((d) => {
        d.pet.food[foodId] = (d.pet.food[foodId] || 0) - 1;
        d.pet.health = Math.min(100, d.pet.health + f.heal);
        d.insights.mealsFed += 1;
      });
      get().showToast(`${s.pet.name} enjoyed the ${f.name.toLowerCase()} (+${f.heal})`);
    },

    equip: (clothesId) => {
      mutate((d) => { d.pet.clothesId = d.pet.clothesId === clothesId ? 0 : clothesId; d.insights.outfitChanges += 1; });
    },

    buildMilestone: (id) => {
      const s = get().state;
      if (!s) return;
      const m = JOURNEY.find((x) => x.id === id);
      if (!m || s.pet.home.includes(id)) return;
      if (s.profile.coins < m.cost) { get().showToast('Keep focusing to afford this'); return; }
      const before = petStage(s.pet);
      mutate((d) => {
        d.profile.coins -= m.cost;
        d.pet.home.push(id);
        d.pet.stage = petStage(d.pet);
      });
      get().showToast(`Built ${m.name} for ${s.pet.name}`, false);
    },

    buyFood: (id) => {
      const s = get().state; if (!s) return;
      const f = FOODS.find((x) => x.id === id); if (!f) return;
      if (f.premium && !s.profile.premium) { get().showToast('That treat is a Premium item'); return; }
      if (s.profile.coins < f.price) { get().showToast('Not enough coins yet'); return; }
      mutate((d) => { d.profile.coins -= f.price; d.pet.food[id] = (d.pet.food[id] || 0) + 1; });
      get().showToast(`Bought ${f.name}`, true);
    },

    buyClothes: (id) => {
      const s = get().state; if (!s) return;
      const c = CLOTHES.find((x) => x.id === id); if (!c) return;
      if (s.pet.ownedClothes.includes(id)) { get().equip(id); return; }
      if (c.premium && !s.profile.premium) { get().showToast('That outfit is a Premium item'); return; }
      if (s.profile.coins < c.price) { get().showToast('Not enough coins yet'); return; }
      mutate((d) => { d.profile.coins -= c.price; d.pet.ownedClothes.push(id); d.pet.clothesId = id; });
      get().showToast(`Bought ${c.name}`, true);
    },

    buyPet: (id) => {
      const s = get().state; if (!s) return;
      const sp = SPECIES.find((x) => x.id === id); if (!sp) return;
      if (sp.premium && !s.profile.premium) { get().showToast('That companion is Premium'); return; }
      if (s.profile.coins < sp.price) { get().showToast('Not enough coins yet'); return; }
      mutate((d) => { d.profile.coins -= sp.price; d.pet.species = sp.key; d.pet.clothesId = 0; });
      get().showToast(`Welcome, a new ${sp.name}!`, true);
    },

    addQuest: (q) => {
      const s = get().state; if (!s) return 0;
      const id = s.nextId;
      mutate((d) => {
        d.quests.unshift({ id, name: q.name, tag: q.tag, est: q.est, done: 0, repeat: q.repeat, focus: true });
        d.nextId += 1;
      });
      return id;
    },

    addQuests: (list) => {
      mutate((d) => {
        list.forEach((q) => {
          d.quests.unshift({ id: d.nextId, name: q.name, tag: q.tag, est: q.est, done: 0, repeat: q.repeat, focus: true });
          d.nextId += 1;
        });
      });
    },

    setGoal: (min) => mutate((d) => { d.today.goalMin = min; }),

    togglePlan: (id) => mutate((d) => {
      const i = d.plan.indexOf(id);
      if (i >= 0) d.plan.splice(i, 1);
      else if (d.plan.length < 3) d.plan.push(id);
    }),

    bankFocus: (qid, workDoneSec, pomodoro) => {
      const s = get().state;
      const mins = Math.floor(workDoneSec / 60);
      let coins = mins;
      let bonus = 0;
      if (s) {
        const moodBonus = s.pet.health >= 80 ? 0.25 : s.pet.health >= 40 ? 0.1 : 0;
        bonus = Math.floor(coins * moodBonus);
      }
      mutate((d) => {
        if (qid != null) {
          const q = d.quests.find((x) => x.id === qid);
          if (q) q.done = Math.min(q.est, q.done + workDoneSec);
        }
        d.profile.coins += coins + bonus;
        d.profile.xp += coins;
        d.today.min += mins;
        d.today.sessions += 1;
        d.lifetime.sessions += 1;
        d.lifetime.minutes += mins;
        d.insights.coinsLifetime += coins + bonus;
      });
      // Finishing a Pomodoro cycle is an event badge (no numeric progress), so it is
      // granted here rather than by the achievement checker, and announced once.
      if (pomodoro && s && !s.achievements.includes('pomodoro')) {
        mutate((d) => { d.achievements.push('pomodoro'); });
        const a = ACHIEVEMENTS.find((x) => x.id === 'pomodoro');
        setTimeout(() => get().showToast(`Badge unlocked: ${a ? a.name : 'Tomato timer'}`, true), 600);
      }
      return { coins, bonus, mins };
    },

    toggleSetting: (k) => mutate((d) => { d.settings[k] = !d.settings[k]; }),
    setName: (name) => { mutate((d) => { d.profile.name = name; }); get().showToast('Name updated'); },
    setAvatar: (i) => mutate((d) => { d.profile.avatar = i; }),
    setAccent: (i) => mutate((d) => { d.settings.accent = i; }),
    setRoom: (i) => mutate((d) => { d.settings.room = i; }),
    setPremium: (on) => mutate((d) => { d.profile.premium = on; }),

    addReminder: (r) => mutate((d) => {
      d.reminders.push({ id: d.nextRem, name: r.name, time: r.time, rep: r.rep, doneOn: [], y: r.y, mo: r.mo, day: r.day });
      d.nextRem += 1;
    }),
    toggleReminderDone: (id, key) => mutate((d) => {
      const r = d.reminders.find((x) => x.id === id);
      if (!r) return;
      if (!Array.isArray(r.doneOn)) r.doneOn = [];
      const i = r.doneOn.indexOf(key);
      if (i >= 0) r.doneOn.splice(i, 1); else r.doneOn.push(key);
    }),
    deleteReminder: (id) => mutate((d) => { d.reminders = d.reminders.filter((x) => x.id !== id); }),

    // Referral verification needs a server (parked). Local placeholder: accept a
    // well-formed code once and grant the coin boost, mirroring the give-100/get-100 rule.
    redeemReferral: (code) => {
      const s = get().state; if (!s) return;
      const c = (code || '').trim().toUpperCase();
      if (!/^[A-Z]{3}-[A-Z0-9]{4}$/.test(c)) { get().showToast('That code does not look right'); return; }
      mutate((d) => { d.profile.coins += 100; d.insights.coinsLifetime += 100; });
      get().showToast('Code redeemed. +100 coins', true);
    },
    // Real billing is parked; locally flip premium on so premium content is explorable.
    buyPremium: () => { get().setPremium(true); get().showToast('Premium unlocked', true); },
    // Cloud sync is simulated locally (no backend). Mark synced now.
    runSync: () => {
      mutate((d) => { d.cloud.pending = 0; d.cloud.lastSync = Date.now(); d.cloud.status = 'synced'; });
      get().showToast('Backed up');
    },
  };
});

// Grant any achievements whose conditions are now met, toasting each once.
function grantAchievements(
  set: (partial: Partial<StoreShape>) => void,
  get: () => StoreShape,
) {
  const s = get().state;
  if (!s) return;
  const newly: string[] = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!s.achievements.includes(a.id) && achMet(s, a.id)) newly.push(a.id);
  });
  if (newly.length) {
    set({ state: produce(s, (d) => { d.achievements.push(...newly); }) });
    get().showToast(`Badge unlocked: ${ACHIEVEMENTS.find((a) => a.id === newly[0])!.name}`, true);
  }
}

// dev-only: expose the store for automated verification driving (stripped in production)
if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined') {
  (window as any).__store = useStore;
}
