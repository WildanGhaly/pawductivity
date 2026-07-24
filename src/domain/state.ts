import { AppState } from './types';

// Stable per-install identifier for the referral/sync backend. Random, not derived
// from any device or personal identifier.
export function newDeviceId(): string {
  const r = () => Math.random().toString(36).slice(2, 10);
  return `dev_${r()}${r()}`;
}

const zeros = (n: number) => new Array(n).fill(0);

// The genuine starting state for a brand new user: zero of everything earned. No
// history, quests, reminders, insights, badges, coins or food. The only non-zero is
// the freshly adopted companion's health, which starts full and happy (a brand new pet
// is not hungry, and with no coins or food a low-health pet would be an unrecoverable
// dead end). Everything is earned by focusing. This is also the default template used
// to backfill an older saved state.
export function freshState(): AppState {
  return {
    profile: { name: 'Friend', avatar: 0, level: 1, xp: 0, needed: 160, coins: 0, premium: false },
    pet: {
      species: 'cat', // overwritten by onboarding
      name: 'Pixel', // overwritten by onboarding
      health: 100, // a freshly adopted pet is healthy and happy
      stage: 1,
      clothesId: 0,
      home: [],
      lastCollect: Date.now(), // nothing to collect yet
      food: {}, // no treats yet; earn coins by focusing, then buy food
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
