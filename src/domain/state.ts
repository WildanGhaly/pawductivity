import { AppState } from './types';

// Stable per-install identifier for the referral/sync backend. Random, not derived
// from any device or personal identifier.
export function newDeviceId(): string {
  const r = () => Math.random().toString(36).slice(2, 10);
  return `dev_${r()}${r()}`;
}

// Ported from the prototype freshState(). This is the post-onboarding starting
// state, including seeded demo quests/reminders/insights so the app feels alive.
export function freshState(): AppState {
  return {
    profile: { name: 'Friend', avatar: 0, level: 3, xp: 120, needed: 340, coins: 200, premium: false },
    pet: {
      species: 'cat',
      name: 'Pixel',
      health: 68,
      stage: 1,
      clothesId: 0,
      home: ['blanket'],
      lastCollect: Date.now() - 3.4 * 3600 * 1000,
      food: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0 },
      ownedClothes: [],
    },
    streak: { current: 3, longest: 5 },
    quests: [
      { id: 1, name: 'Finish physics essay', tag: 'School', est: 5400, done: 0, due: 'Fri', focus: true },
      { id: 2, name: 'Morning jog', tag: 'Sport', est: 1800, done: 0, repeat: true, focus: true },
      { id: 3, name: 'Reply to emails', tag: 'Work', est: 1500, done: 900, focus: true },
      { id: 4, name: 'Read 10 pages', tag: 'Personal', est: 900, done: 0, focus: true },
      { id: 5, name: 'Tidy the desk', tag: 'Personal', est: 600, done: 600, focus: true },
    ],
    reminders: [
      { id: 1, name: 'Dentist appointment', time: '15:30', rep: 'once', doneOn: [] },
      { id: 2, name: 'Call mom', time: '19:00', rep: 'weekly', doneOn: [] },
      { id: 3, name: 'Water the plants', time: '08:00', rep: 'daily', doneOn: [] },
      { id: 4, name: 'Stand up and stretch', time: '14:00', rep: 'weekdays', doneOn: [] },
      { id: 5, name: 'Pay the rent', time: '09:00', rep: 'monthly', doneOn: [] },
    ],
    completedDays: [-1, -2, -4, -5, 0],
    settings: { notif: true, sound: true, accent: 0, room: 0, notifAsked: false },
    cloud: {
      signedIn: false, email: null, lastSync: null, pending: 0, status: 'idle',
      auto: true, wifiOnly: false, lastError: null, device: 'Pixel 8a',
    },
    insights: {
      weekly: [35, 55, 20, 70, 45, 90, 30],
      categories: [['School', 38], ['Work', 27], ['Sport', 16], ['Personal', 12], ['Project', 7]],
      sessions: 14, bestFocus: 'Evenings',
      hours: [8, 18, 30, 22, 40, 64, 38, 12],
      lastWeekTotal: 260, completionRate: 82, bestStreak: 9,
      avgLen: 20, longest: 52,
      trend: [210, 245, 230, 285, 260, 300, 260, 345],
      dist: [['<15m', 3], ['15-25m', 9], ['25-45m', 6], ['45-60m', 3], ['60m+', 2]],
      goalHitDays: 18, goalTotalDays: 30,
      heat: [
        0, 20, 0, 45, 25, 0, 60, 30, 0, 50, 20, 40, 0, 0, 15, 35, 0, 25, 55, 30, 0, 0, 40, 20, 0, 35, 50, 25,
        45, 0, 30, 60, 0, 20, 40, 25, 50, 0, 35, 0, 45, 30, 0, 20, 40, 55, 25, 0, 35, 30, 45, 0, 20, 50, 35, 0,
        40, 0, 25, 45, 60, 30, 0, 0, 35, 50, 20, 0, 40, 25, 20, 45, 30, 0, 55, 35, 0, 35, 20, 0, 50, 40, 60, 45,
      ],
      monthly: [240, 310, 275, 345, 180],
      yearly: [180, 220, 260, 300, 240, 280, 320, 290, 340, 300, 360, 345],
      dayhour: [
        5, 10, 15, 8, 20, 12, 4, 2, 8, 12, 20, 15, 25, 18, 6, 3, 6, 14, 22, 18, 30, 24, 8, 4,
        4, 10, 18, 12, 28, 20, 10, 5, 10, 16, 24, 20, 35, 28, 12, 6, 12, 20, 30, 25, 40, 30, 15, 8,
        8, 14, 20, 16, 26, 18, 10, 4,
      ],
      petDays: 23, coinsLifetime: 1240,
      weekCoins: 210, weekBadges: 2, weekMilestones: 1, weekFocusDays: 6,
      petHealth: [40, 45, 42, 50, 55, 52, 60, 58, 63, 60, 66, 64, 68, 68],
      mealsFed: 27, happyDays: 12, idleCollected: 640, outfitChanges: 14,
    },
    today: { min: 25, sessions: 1, goalMin: 60 },
    plan: [],
    lifetime: { sessions: 14, minutes: 280 },
    achievements: [
      'first_session', 'first_quest', 'first_home', 'ten_sessions', 'h1',
      'streak_3', 'streak_7', 'goal_hit', 'goal_5', 'coin_500', 'explorer',
      'early_bird', 'pomodoro', 'weekend',
    ],
    nextId: 6,
    nextRem: 6,
    deviceId: newDeviceId(),
    onboarded: true,
    tab: 'home',
  };
}
