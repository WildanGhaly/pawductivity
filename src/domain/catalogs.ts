// Catalogs and constants ported verbatim from the prototype JS (authoritative
// over the asset README where they differ; see docs/SPEC.md Decisions D1).

export interface FoodItem { id: number; name: string; price: number; heal: number; premium: boolean; }
export interface ClothesItem { id: number; name: string; price: number; premium: boolean; }
export interface SpeciesItem { id: number; key: 'dog' | 'cat' | 'rabbit'; name: string; price: number; premium: boolean; }

export const FOODS: FoodItem[] = [
  { id: 1, name: 'Apple', price: 5, heal: 10, premium: false },
  { id: 2, name: 'Chicken', price: 5, heal: 10, premium: false },
  { id: 3, name: 'Pizza', price: 15, heal: 20, premium: true },
  { id: 4, name: 'Watermelon', price: 8, heal: 10, premium: false },
  { id: 5, name: 'Carrot', price: 10, heal: 15, premium: false },
];

export const CLOTHES: ClothesItem[] = [
  { id: 1, name: 'Cyan T-shirt', price: 80, premium: false },
  { id: 2, name: 'Green Shirt', price: 150, premium: false },
  { id: 3, name: 'Tuxedo', price: 320, premium: true },
  { id: 4, name: 'Star Shirt', price: 250, premium: true },
  { id: 5, name: 'Pink Dress', price: 400, premium: true },
];

export const SPECIES: SpeciesItem[] = [
  { id: 1, key: 'dog', name: 'Dog', price: 500, premium: false },
  { id: 2, key: 'cat', name: 'Cat', price: 800, premium: false },
  { id: 3, key: 'rabbit', name: 'Rabbit', price: 1200, premium: true },
];

export interface Milestone {
  id: string;
  name: string;
  desc: string;
  cost: number;
  perk: string;
  rate?: number;
  cap?: number;
  decay?: number;
  final?: boolean;
  ic: string;
}

export const JOURNEY: Milestone[] = [
  { id: 'blanket', name: 'Warm blanket', desc: 'A soft place for Pixel to nap', cost: 60, perk: '+1 coin / hr', rate: 1, ic: 'heart' },
  { id: 'bowl', name: 'Food bowl', desc: 'Pixel gets hungry more slowly', cost: 120, perk: 'Health drops slower', decay: 0.6, ic: 'shield' },
  { id: 'post', name: 'Scratching post', desc: 'Happy claws, happy cat', cost: 220, perk: '+1 coin / hr', rate: 1, ic: 'bolt' },
  { id: 'window', name: 'Sunny window', desc: 'A warm spot to watch the day', cost: 360, perk: '+2h idle jar', cap: 2, ic: 'sparkle' },
  { id: 'toys', name: 'Toy basket', desc: 'Never a dull moment', cost: 540, perk: '+2 coins / hr', rate: 2, ic: 'sparkle' },
  { id: 'tree', name: 'Cat tree', desc: 'Room to climb and rule', cost: 780, perk: '+3h idle jar', cap: 3, ic: 'trophy' },
  { id: 'nook', name: 'Reading nook', desc: 'A cozy corner for you both', cost: 1080, perk: '+2 coins / hr', rate: 2, ic: 'note' },
  { id: 'garden', name: 'Garden view', desc: 'Birds and butterflies all day', cost: 1450, perk: '+4h idle jar', cap: 4, ic: 'sparkle' },
  { id: 'dream', name: 'Dream home', desc: 'Pixel is truly thriving now', cost: 2000, perk: 'Journey complete', final: true, ic: 'crown' },
];

export interface Achievement { id: string; group: string; name: string; desc: string; ic?: string; imgFood?: number; }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_session', group: 'Getting started', name: 'First focus', desc: 'Finish your first session', ic: 'checkCircle' },
  { id: 'first_quest', group: 'Getting started', name: 'Task done', desc: 'Complete your first quest', ic: 'check' },
  { id: 'first_home', group: 'Getting started', name: 'Home sweet home', desc: 'Build the first thing for Pixel', ic: 'sprout' },
  { id: 'explorer', group: 'Getting started', name: 'Look around', desc: "Open Pixel's Journey", ic: 'note' },
  { id: 'ten_sessions', group: 'Focus sessions', name: 'Getting serious', desc: 'Finish 10 sessions', ic: 'bolt' },
  { id: 's25', group: 'Focus sessions', name: 'Committed', desc: 'Finish 25 sessions', ic: 'bolt' },
  { id: 's50', group: 'Focus sessions', name: 'Halfway hero', desc: 'Finish 50 sessions', ic: 'bolt' },
  { id: 's100', group: 'Focus sessions', name: 'Century', desc: 'Finish 100 sessions', ic: 'bolt' },
  { id: 's250', group: 'Focus sessions', name: 'Unstoppable', desc: 'Finish 250 sessions', ic: 'bolt' },
  { id: 'h1', group: 'Focus time', name: 'Warmed up', desc: 'Focus for 1 hour total', ic: 'clock' },
  { id: 'ten_hours', group: 'Focus time', name: 'Deep worker', desc: 'Focus for 10 hours total', ic: 'clock' },
  { id: 'h25', group: 'Focus time', name: 'Focused mind', desc: 'Focus for 25 hours total', ic: 'clock' },
  { id: 'h50', group: 'Focus time', name: 'Time master', desc: 'Focus for 50 hours total', ic: 'clock' },
  { id: 'h100', group: 'Focus time', name: 'Centurion', desc: 'Focus for 100 hours total', ic: 'clock' },
  { id: 'streak_3', group: 'Streaks', name: 'On a roll', desc: 'Reach a 3 day streak', ic: 'flame' },
  { id: 'streak_7', group: 'Streaks', name: 'Habit forming', desc: 'Reach a 7 day streak', ic: 'flame' },
  { id: 'streak_14', group: 'Streaks', name: 'Fortnight focus', desc: 'Reach a 14 day streak', ic: 'flame' },
  { id: 'streak_30', group: 'Streaks', name: 'Monthly master', desc: 'Reach a 30 day streak', ic: 'flame' },
  { id: 'streak_60', group: 'Streaks', name: 'Iron will', desc: 'Reach a 60 day streak', ic: 'flame' },
  { id: 'streak_100', group: 'Streaks', name: 'Century streak', desc: 'Reach a 100 day streak', ic: 'crown' },
  { id: 'goal_hit', group: 'Daily goals', name: 'Goal crusher', desc: 'Hit your daily goal once', ic: 'target' },
  { id: 'goal_5', group: 'Daily goals', name: 'Consistent', desc: 'Hit your goal on 5 days', ic: 'target' },
  { id: 'goal_20', group: 'Daily goals', name: 'Dedicated', desc: 'Hit your goal on 20 days', ic: 'target' },
  { id: 'goal_50', group: 'Daily goals', name: 'Relentless', desc: 'Hit your goal on 50 days', ic: 'target' },
  { id: 'perfect_week', group: 'Daily goals', name: 'Perfect week', desc: 'Hit your goal 7 days in a row', ic: 'crown' },
  { id: 'stage_2', group: "Pixel's growth", name: 'Growing up', desc: 'Grow Pixel to Young', ic: 'sparkle' },
  { id: 'stage_3', group: "Pixel's growth", name: 'Blooming', desc: 'Grow Pixel to Grown', ic: 'sparkle' },
  { id: 'stage_4', group: "Pixel's growth", name: 'Thriving', desc: 'Grow Pixel to Prime', ic: 'sparkle' },
  { id: 'stage_5', group: "Pixel's growth", name: 'Fully raised', desc: 'Grow Pixel to Legend', ic: 'crown' },
  { id: 'home_3', group: "Pixel's home", name: 'Cozy corner', desc: 'Build 3 home items', ic: 'sprout' },
  { id: 'home_half', group: "Pixel's home", name: 'Halfway home', desc: 'Build half of the home', ic: 'sprout' },
  { id: 'home_all', group: "Pixel's home", name: 'Dream home', desc: 'Complete the whole home', ic: 'crown' },
  { id: 'pet_happy', group: 'Care & wardrobe', name: 'Best friends', desc: 'Get Pixel to Happy', ic: 'heart' },
  { id: 'feed_pet', group: 'Care & wardrobe', name: 'Well fed', desc: 'Feed Pixel a treat', imgFood: 1 },
  { id: 'first_outfit', group: 'Care & wardrobe', name: 'Dress up', desc: 'Buy your first outfit', ic: 'shirt' },
  { id: 'collector', group: 'Care & wardrobe', name: 'Fashionista', desc: 'Own 5 outfits', ic: 'shirt' },
  { id: 'new_species', group: 'Care & wardrobe', name: 'New friend', desc: 'Adopt another companion', ic: 'heart' },
  { id: 'coin_500', group: 'Coins', name: 'Saver', desc: 'Earn 500 coins in total', ic: 'sparkle' },
  { id: 'coin_2000', group: 'Coins', name: 'Wealthy', desc: 'Earn 2,000 coins in total', ic: 'sparkle' },
  { id: 'coin_5000', group: 'Coins', name: 'Rich kitty', desc: 'Earn 5,000 coins in total', ic: 'sparkle' },
  { id: 'coin_10000', group: 'Coins', name: 'Tycoon', desc: 'Earn 10,000 coins in total', ic: 'sparkle' },
  { id: 'early_bird', group: 'Habits & style', name: 'Early bird', desc: 'Focus before 8 am', ic: 'sprout' },
  { id: 'night_owl', group: 'Habits & style', name: 'Night owl', desc: 'Focus after 10 pm', ic: 'sparkle' },
  { id: 'pomodoro', group: 'Habits & style', name: 'Tomato timer', desc: 'Finish a Pomodoro cycle', ic: 'repeat' },
  { id: 'marathon', group: 'Habits & style', name: 'Marathon', desc: 'Focus 2 hours in one day', ic: 'clock' },
  { id: 'weekend', group: 'Habits & style', name: 'Weekend warrior', desc: 'Focus on a Saturday and Sunday', ic: 'calendar' },
  { id: 'comeback', group: 'Habits & style', name: 'Welcome back', desc: 'Return after a day off', ic: 'gift' },
];

export const STAGES = ['Baby', 'Young', 'Grown', 'Prime', 'Legend'];
export const STAGE_GOAL = 4;

// capture options
export const DURS: [string, number][] = [['15m', 900], ['25m', 1500], ['45m', 2700], ['1h', 3600], ['2h', 7200]];
export const TAGS = ['Work', 'School', 'Sport', 'Personal', 'Project'] as const;
export const CAP_REPS: [string, string][] = [['Once', 'once'], ['Daily', 'daily'], ['Weekdays', 'weekdays']];
export const REM_REPS: [string, string][] = [['Once', 'once'], ['Daily', 'daily'], ['Weekdays', 'weekdays'], ['Weekly', 'weekly'], ['Monthly', 'monthly']];

// focus soundscapes: [name, id, free]
export const SOUNDS: [string, number, boolean][] = [['None', 0, true], ['Rain', 1, true], ['Waves', 2, false], ['Lo-fi', 3, false]];

// premium accent themes: recolor the orange accent
export const ACCENTS = [
  { name: 'Sunset', a: '#E28A4B', b: '#C9773A', premium: false },
  { name: 'Berry', a: '#D46A9A', b: '#B14E7E', premium: true },
  { name: 'Forest', a: '#5B9E6B', b: '#43794F', premium: true },
  { name: 'Ocean', a: '#3E97B5', b: '#2C7793', premium: true },
];

export const POMO_WORK = 1500;
export const POMO_BREAK = 300;
export const DISCORD_URL = 'https://discord.gg/c5PZcQ3tbz';
