/** Row types mirroring the SQLite schema (src/db/schema.ts). */

export type Species = 'dog' | 'cat' | 'rabbit';
export type QuestKind = 'target' | 'checklist' | 'focus';
export type ClothesSlot = 'hat' | 'shirt' | 'pants' | 'shoes';
export type Recurrence = 'once' | 'weekly' | 'monthly' | 'yearly';
export type CoinReason =
  | 'task_reward'
  | 'level_up'
  | 'purchase_pet'
  | 'purchase_food'
  | 'purchase_clothes'
  | 'referral'
  | 'iap_topup'
  | 'other';

export interface UserProfile {
  id: 1;
  display_name: string;
  avatar: string;
  profile_index: number;
  coins: number;
  level: number;
  current_xp: number;
  needed_xp: number;
  created_at: number;
  updated_at: number;
}

export interface Task {
  id: number;
  name: string;
  description: string | null;
  tag: string;
  kind: QuestKind;
  estimated_time: number; // seconds
  time_completed: number; // seconds
  completed: 0 | 1;
  repetition: number; // weekday bitmask 0..127
  target_value: number | null;
  target_current: number;
  target_unit: string | null;
  due_date: number | null; // epoch ms
  creation_date: number;
  created_by_ai: 0 | 1;
}

export interface Animal {
  id: number;
  species: Species;
  name: string;
  description: string;
  price: number;
  asset: string;
  premium: 0 | 1;
}

export interface Pet {
  id: number;
  animal_id: number;
  name: string;
  health: number; // 0..100
  evolution_stage: number; // 0..5
  last_health_decay_at: number;
  acquired_at: number;
}

/** Pet joined with its species/catalog row — what the UI usually needs. */
export interface PetWithAnimal extends Pet {
  species: Species;
  animal_name: string;
}

export interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  heal: number;
  asset: string;
  premium: 0 | 1;
}

export interface FoodWithQty extends Food {
  quantity: number;
}

export interface Clothes {
  id: number;
  name: string;
  description: string;
  price: number;
  slot: ClothesSlot;
  asset: string;
  premium: 0 | 1;
}

export interface Reminder {
  id: number;
  title: string;
  remind_at: number;
  recurrence: Recurrence;
  is_completed: 0 | 1;
  os_notification_ids: string | null;
  created_at: number;
}

/** Result of completing a quest — drives reward UI. */
export interface CompletionReward {
  coinsEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  levelUpBonusCoins: number;
}
