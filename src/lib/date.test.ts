import { describe, expect, test } from '@jest/globals';
import { formatDuration, localMidnightsBetween, startOfLocalDay, todayLocalISO } from './date';

describe('formatDuration', () => {
  test.each([
    [3600, '1h 0m'],
    [3661, '1h 1m'],
    [1500, '25m'],
    [90, '1m'],
    [59, '59s'],
    [0, '0s'],
  ])('%is → %s', (secs, out) => {
    expect(formatDuration(secs)).toBe(out);
  });
});

describe('todayLocalISO', () => {
  test('formats YYYY-MM-DD', () => {
    expect(todayLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  test('is stable across the whole local day', () => {
    const now = Date.now();
    expect(todayLocalISO(startOfLocalDay(now))).toBe(todayLocalISO(now));
  });
});

describe('startOfLocalDay', () => {
  test('is idempotent and lands on local midnight', () => {
    const s = startOfLocalDay(Date.now());
    expect(startOfLocalDay(s)).toBe(s);
    expect(new Date(s).getHours()).toBe(0);
    expect(new Date(s).getMinutes()).toBe(0);
  });
});

describe('localMidnightsBetween', () => {
  test('same instant crosses zero midnights', () => {
    const now = Date.now();
    expect(localMidnightsBetween(now, now)).toBe(0);
  });
  test('one ms before local midnight counts as a crossing', () => {
    const midnight = startOfLocalDay(Date.now());
    expect(localMidnightsBetween(midnight - 1, midnight)).toBe(1);
  });
  test('never negative when time runs backwards', () => {
    const now = Date.now();
    expect(localMidnightsBetween(now, now - 86_400_000)).toBe(0);
  });
});
