// App state types, mirroring the prototype freshState() shape.

export type Species = 'dog' | 'cat' | 'rabbit';
export type QuestTag = 'Work' | 'School' | 'Sport' | 'Personal' | 'Project';
export type ReminderRep = 'once' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Profile {
  name: string;
  avatar: number; // 0..6, or -1 for a custom uploaded photo (avatarCustom)
  avatarCustom?: string; // data URI of the user's own photo when avatar === -1
  level: number;
  xp: number;
  needed: number;
  coins: number;
  premium: boolean;
}

export interface Pet {
  species: Species;
  name: string;
  health: number; // 0..100
  stage: number; // 1..5
  clothesId: number; // 0 = none
  home: string[]; // built milestone ids
  lastCollect: number; // epoch ms
  food: Record<number, number>; // foodId -> count owned
  ownedClothes: number[];
}

export interface Streak {
  current: number;
  longest: number;
}

export interface Quest {
  id: number;
  name: string;
  tag: QuestTag;
  est: number; // seconds
  done: number; // seconds
  due?: string;
  repeat?: boolean;
  rlabel?: string; // repeat display label ('Daily', 'Weekdays', 'Mondays'...) — proto rlabel
  focus?: boolean;
}

export interface Reminder {
  id: number;
  name: string;
  time: string; // HH:MM (24h)
  rep: ReminderRep;
  doneOn: string[]; // 'y-m-d' keys
  y?: number;
  mo?: number;
  day?: number;
}

export interface Settings {
  notif: boolean;
  sound: boolean;
  accent: number;
  room: number;
  notifAsked: boolean;
}

export interface Cloud {
  signedIn: boolean;
  email: string | null;
  lastSync: number | null;
  pending: number;
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  auto: boolean;
  wifiOnly: boolean;
  lastError: string | null;
  device: string;
}

export interface Insights {
  weekly: number[];
  categories: [string, number][];
  sessions: number;
  bestFocus: string;
  hours: number[];
  lastWeekTotal: number;
  completionRate: number;
  bestStreak: number;
  avgLen: number;
  longest: number;
  trend: number[];
  dist: [string, number][];
  goalHitDays: number;
  goalTotalDays: number;
  heat: number[];
  monthly: number[];
  yearly: number[];
  dayhour: number[];
  petDays: number;
  coinsLifetime: number;
  weekCoins: number;
  weekBadges: number;
  weekMilestones: number;
  weekFocusDays: number;
  petHealth: number[];
  mealsFed: number;
  happyDays: number;
  idleCollected: number;
  outfitChanges: number;
}

export interface Today {
  min: number;
  sessions: number;
  goalMin: number;
}

export interface Lifetime {
  sessions: number;
  minutes: number;
}

// A focus session that is running (persisted so it survives the app being killed).
// The on-screen timer is rebuilt from this on relaunch; if enough time elapsed the
// session completes and grants its reward.
export interface ActiveSession {
  questId: number | null;
  bankQid: number | null;
  questName: string;
  startDone: number;
  sessionTarget: number;
  mode: 'standard' | 'pomodoro';
  phase: 'work' | 'break';
  phaseLen: number;
  base: number; // remaining (seconds) at startedAt
  startedAt: number; // epoch ms
  workDone: number;
  cycle: number;
}

export interface AppState {
  profile: Profile;
  pet: Pet;
  streak: Streak;
  quests: Quest[];
  reminders: Reminder[];
  completedDays: number[];
  settings: Settings;
  cloud: Cloud;
  insights: Insights;
  today: Today;
  plan: number[];
  lifetime: Lifetime;
  achievements: string[];
  nextId: number;
  nextRem: number;
  // A running focus session, persisted so a killed/backgrounded app can resume it.
  activeSession?: ActiveSession | null;
  // Stable per-install id. Only ever sent to the referral/sync backend, which is
  // the one networked feature; everything else stays on the device.
  deviceId: string;
  // runtime-only, not persisted as domain data
  onboarded: boolean;
  tab: 'home' | 'quests' | 'pet' | 'cal';
}
