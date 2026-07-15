/**
 * Pure reward + level-curve math — the single source of truth for the economy
 * (open decision D12). Zero dependencies so it is trivially unit-testable and can be
 * shared by the repository and the UI without pulling in SQLite.
 *
 *   coins = XP = floor(estimated minutes)
 *   level curve   needed_xp = 10·L² + 50·L + 100
 *   level-up bonus (legacy `level_up` proc) = floor(estimated/600)·3,
 *                 granted ONCE per completion, not per level crossed.
 */

/** Coins granted for completing a quest of `estimatedSeconds`. */
export const coinsForTask = (estimatedSeconds: number) => Math.floor(estimatedSeconds / 60);

/** XP granted for completing a quest of `estimatedSeconds`. */
export const xpForTask = (estimatedSeconds: number) => Math.floor(estimatedSeconds / 60);

/** One-off coin bonus when a completion crosses a level boundary. */
export const levelUpBonus = (estimatedSeconds: number) => Math.floor(estimatedSeconds / 600) * 3;

/** XP required to advance FROM `level` to the next (10·L² + 50·L + 100). */
export const neededXpFor = (level: number) => 10 * level * level + 50 * level + 100;

/** Companion evolution stage (0–5) derived from the user's Level. */
export function evolutionStageForLevel(level: number): number {
  return Math.max(0, Math.min(5, Math.floor((level - 1) / 2)));
}

export interface LevelProgress {
  level: number;
  currentXp: number;
  neededXp: number;
}

export interface XpGainResult extends LevelProgress {
  /** True if at least one level boundary was crossed. */
  leveledUp: boolean;
  /** Number of levels gained (0 when no level-up). */
  levelsGained: number;
}

/**
 * Apply an XP gain to a {level, currentXp, neededXp} triple, cascading through
 * as many level boundaries as the gain covers. Pure — no I/O, no clock.
 */
export function applyXpGain(start: LevelProgress, xpEarned: number): XpGainResult {
  let level = start.level;
  let xp = start.currentXp + Math.max(0, xpEarned);
  let needed = start.neededXp;
  let levelsGained = 0;
  while (xp >= needed) {
    xp -= needed;
    level += 1;
    needed = neededXpFor(level);
    levelsGained += 1;
  }
  return { level, currentXp: xp, neededXp: needed, leveledUp: levelsGained > 0, levelsGained };
}
