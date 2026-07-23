// Pure game mechanics ported from the prototype. All functions take the relevant
// state slices explicitly (no global mutable S) so they are testable and store-agnostic.
import { AppState, Pet } from './types';
import { JOURNEY, STAGES } from './catalogs';

export interface Mood { t: string; k: string; spd: number; bonus: number; }

export function moodOf(h: number): Mood {
  if (h >= 80) return { t: 'Happy', k: 'happy', spd: 1.25, bonus: 0.25 };
  if (h >= 40) return { t: 'Content', k: 'content', spd: 1, bonus: 0.1 };
  if (h >= 15) return { t: 'Tired', k: 'tired', spd: 0.7, bonus: 0 };
  return { t: 'Hungry', k: 'hungry', spd: 0.6, bonus: 0 };
}

export const bonusPct = (h: number) => Math.round(moodOf(h).bonus * 100);
export const shieldActive = (h: number) => h >= 60;

export const petStage = (pet: Pet) => Math.min(5, 1 + Math.floor(pet.home.length / 2));

export function moodRate(h: number): number {
  if (h >= 80) return 1;
  if (h >= 40) return 0.7;
  if (h >= 15) return 0.4;
  return 0.25;
}

export function homePerks(pet: Pet): { rate: number; cap: number; decay: number } {
  let rate = 0, cap = 0, decay = 1;
  JOURNEY.forEach((m) => {
    if (pet.home.includes(m.id)) {
      rate += m.rate || 0;
      cap += m.cap || 0;
      if (m.decay) decay = Math.min(decay, m.decay);
    }
  });
  return { rate, cap, decay };
}

export const idleRate = (pet: Pet) => Math.max(1, Math.round((6 + homePerks(pet).rate) * moodRate(pet.health)));
export const idleCap = (pet: Pet) => 8 + homePerks(pet).cap;

export function idlePending(pet: Pet, now = Date.now()): number {
  const hrs = Math.min(idleCap(pet), (now - pet.lastCollect) / 3600000);
  return Math.max(0, Math.floor(hrs * idleRate(pet)));
}
export const idleFull = (pet: Pet, now = Date.now()) => (now - pet.lastCollect) / 3600000 >= idleCap(pet);

export const homeOwned = (pet: Pet, id: string) => pet.home.includes(id);
export const nextMilestone = (pet: Pet) => JOURNEY.find((m) => !pet.home.includes(m.id));
export const homePct = (pet: Pet) => Math.round((pet.home.length / JOURNEY.length) * 100);

export const stageName = (n: number) => STAGES[Math.min(STAGES.length - 1, (n || 1) - 1)];
export const clothesKey = (pet: Pet) => (pet.clothesId > 0 ? String(pet.clothesId) : 'default');

// coins == xp == whole minutes of the estimate
export const reward = (est: number) => Math.floor(est / 60);

export const isDone = (q: { done: number; est: number }) => q.done >= q.est;

// formatting helpers
export function fmt(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
export function mmss(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
export const money = (n: number) => n.toLocaleString('en-US');

// ----- achievements -----
function achStats(s: AppState) {
  return {
    sessions: s.lifetime.sessions,
    hrs: s.lifetime.minutes / 60,
    strk: Math.max(s.streak.current || 0, s.streak.longest || 0, s.insights.bestStreak || 0),
    gdays: s.insights.goalHitDays || 0,
    stg: petStage(s.pet),
    hc: s.pet.home.length,
    outs: s.pet.ownedClothes.length,
    coins: s.insights.coinsLifetime || 0,
  };
}

export function achProgress(s: AppState, id: string): [number, number] | null {
  const a = achStats(s);
  const map: Record<string, [number, number]> = {
    ten_sessions: [a.sessions, 10], s25: [a.sessions, 25], s50: [a.sessions, 50], s100: [a.sessions, 100], s250: [a.sessions, 250],
    h1: [Math.round(a.hrs), 1], ten_hours: [Math.round(a.hrs), 10], h25: [Math.round(a.hrs), 25], h50: [Math.round(a.hrs), 50], h100: [Math.round(a.hrs), 100],
    streak_3: [a.strk, 3], streak_7: [a.strk, 7], streak_14: [a.strk, 14], streak_30: [a.strk, 30], streak_60: [a.strk, 60], streak_100: [a.strk, 100],
    goal_hit: [a.gdays, 1], goal_5: [a.gdays, 5], goal_20: [a.gdays, 20], goal_50: [a.gdays, 50],
    stage_2: [a.stg, 2], stage_3: [a.stg, 3], stage_4: [a.stg, 4], stage_5: [a.stg, 5],
    home_3: [a.hc, 3], home_half: [a.hc, Math.ceil(JOURNEY.length / 2)], home_all: [a.hc, JOURNEY.length],
    first_outfit: [a.outs, 1], collector: [a.outs, 5],
    coin_500: [a.coins, 500], coin_2000: [a.coins, 2000], coin_5000: [a.coins, 5000], coin_10000: [a.coins, 10000],
  };
  return map[id] || null;
}

export function achMet(s: AppState, id: string): boolean {
  const p = achProgress(s, id);
  if (p) return p[0] >= p[1];
  const a = achStats(s);
  switch (id) {
    case 'first_session': return a.sessions >= 1;
    case 'first_quest': return a.sessions >= 1 || s.quests.some((q) => q.done >= q.est);
    case 'first_home': return a.hc >= 1;
    case 'pet_happy': return s.pet.health >= 80;
  }
  return false; // event badges granted by their triggers
}
