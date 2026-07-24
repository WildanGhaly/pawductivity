import { AppState } from './types';

// Stable per-install identifier for the referral/sync backend. Random, not derived
// from any device or personal identifier.
export function newDeviceId(): string {
  const r = () => Math.random().toString(36).slice(2, 10);
  return `dev_${r()}${r()}`;
}

const zeros = (n: number) => new Array(n).fill(0);

// The genuine starting state for a brand new user: no history, no seeded quests or
// reminders, no fake insights, no pre-unlocked badges. A fresh companion, a small
// welcome of 200 coins and two starter treats so the core loop is discoverable, and
// everything else empty. (The prototype seeded demo data to look alive; a real app
// must not.) This is also the default template used to backfill an older saved state.
export function freshState(): AppState {
  return {
    profile: { name: 'Friend', avatar: 0, level: 1, xp: 0, needed: 160, coins: 200, premium: false },
    pet: {
      species: 'cat', // overwritten by onboarding
      name: 'Pixel', // overwritten by onboarding
      health: 70, // settling in: room to reach Happy by feeding
      stage: 1,
      clothesId: 0,
      home: [],
      lastCollect: Date.now(), // nothing to collect yet
      food: { 1: 1, 2: 1 }, // one apple, one chicken to try feeding
      ownedClothes: [],
    },
    streak: { current: 0, longest: 0 },
    quests: [],
    reminders: [],
    completedDays: [],
    settings: { notif: true, sound: true, accent: 0, room: 0, notifAsked: false },
    cloud: {
      signedIn: false, email: null, lastSync: null, pending: 0, status: 'idle',
      auto: true, wifiOnly: false, lastError: null, device: 'This device',
    },
    insights: {
      weekly: zeros(7),
      categories: [],
      sessions: 0, bestFocus: 'Evenings',
      hours: zeros(8),
      lastWeekTotal: 0, completionRate: 0, bestStreak: 0,
      avgLen: 0, longest: 0,
      trend: zeros(8),
      dist: [],
      goalHitDays: 0, goalTotalDays: 30,
      heat: zeros(84),
      monthly: zeros(5),
      yearly: zeros(12),
      dayhour: zeros(56),
      petDays: 0, coinsLifetime: 0,
      weekCoins: 0, weekBadges: 0, weekMilestones: 0, weekFocusDays: 0,
      petHealth: [],
      mealsFed: 0, happyDays: 0, idleCollected: 0, outfitChanges: 0,
    },
    today: { min: 0, sessions: 0, goalMin: 60 },
    plan: [],
    lifetime: { sessions: 0, minutes: 0 },
    achievements: [],
    nextId: 1,
    nextRem: 1,
    deviceId: newDeviceId(),
    onboarded: true,
    tab: 'home',
  };
}
