import { describe, expect, test } from '@jest/globals';
import {
  applyXpGain,
  coinsForTask,
  evolutionStageForLevel,
  levelUpBonus,
  neededXpFor,
  xpForTask,
} from './rewards';

describe('reward formulas', () => {
  test('coins/xp = floor(estimated minutes)', () => {
    expect(coinsForTask(1500)).toBe(25); // 25 min
    expect(xpForTask(1500)).toBe(25);
    expect(coinsForTask(90)).toBe(1); // 1.5 min floors to 1
    expect(coinsForTask(59)).toBe(0); // under a minute earns nothing
    expect(coinsForTask(0)).toBe(0);
  });

  test('level-up bonus = floor(estimated/600)*3', () => {
    expect(levelUpBonus(600)).toBe(3); // 10 min
    expect(levelUpBonus(1500)).toBe(6); // 25 min → 2 blocks
    expect(levelUpBonus(599)).toBe(0);
  });

  test('level curve needed_xp = 10·L² + 50·L + 100', () => {
    expect(neededXpFor(1)).toBe(160);
    expect(neededXpFor(2)).toBe(240);
    expect(neededXpFor(5)).toBe(600);
  });
});

describe('evolutionStageForLevel', () => {
  test('clamps 0–5 and steps every 2 levels', () => {
    expect(evolutionStageForLevel(1)).toBe(0);
    expect(evolutionStageForLevel(2)).toBe(0);
    expect(evolutionStageForLevel(3)).toBe(1);
    expect(evolutionStageForLevel(11)).toBe(5);
    expect(evolutionStageForLevel(100)).toBe(5); // capped
    expect(evolutionStageForLevel(0)).toBe(0); // floored
  });
});

describe('applyXpGain', () => {
  test('no level-up when gain stays under the threshold', () => {
    const r = applyXpGain({ level: 1, currentXp: 0, neededXp: 160 }, 100);
    expect(r).toEqual({ level: 1, currentXp: 100, neededXp: 160, leveledUp: false, levelsGained: 0 });
  });

  test('exact threshold levels up once', () => {
    const r = applyXpGain({ level: 1, currentXp: 159, neededXp: 160 }, 1);
    expect(r.level).toBe(2);
    expect(r.currentXp).toBe(0);
    expect(r.neededXp).toBe(neededXpFor(2));
    expect(r.leveledUp).toBe(true);
    expect(r.levelsGained).toBe(1);
  });

  test('a big gain cascades through multiple levels', () => {
    const r = applyXpGain({ level: 1, currentXp: 0, neededXp: 160 }, 500);
    // 500 → L2 (rem 340) → L3 (rem 100, needed 340)
    expect(r.level).toBe(3);
    expect(r.currentXp).toBe(100);
    expect(r.neededXp).toBe(neededXpFor(3));
    expect(r.levelsGained).toBe(2);
  });

  test('negative/zero gain is a no-op', () => {
    const r = applyXpGain({ level: 4, currentXp: 20, neededXp: neededXpFor(4) }, -50);
    expect(r).toEqual({ level: 4, currentXp: 20, neededXp: neededXpFor(4), leveledUp: false, levelsGained: 0 });
  });
});
