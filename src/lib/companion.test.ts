import { describe, expect, test } from '@jest/globals';
import { companionLine, moodFor } from './companion';

describe('moodFor thresholds', () => {
  test.each([
    [100, 'happy'],
    [80, 'happy'],
    [79, 'content'],
    [50, 'content'],
    [49, 'sad'],
    [20, 'sad'],
    [19, 'sick'],
    [0, 'sick'],
  ])('health %i → %s', (health, mood) => {
    expect(moodFor(health).mood).toBe(mood);
  });

  test('happier moods animate faster', () => {
    expect(moodFor(100).speed).toBeGreaterThan(moodFor(50).speed);
    expect(moodFor(50).speed).toBeGreaterThan(moodFor(10).speed);
  });
});

describe('companionLine', () => {
  test('low health asks for food', () => {
    expect(companionLine(10, 3).toLowerCase()).toContain('snack');
  });
  test('no open quests celebrates', () => {
    expect(companionLine(90, 0)).toMatch(/all quests done/i);
  });
  test('healthy with open quests is encouraging', () => {
    expect(companionLine(90, 2).toLowerCase()).toContain('crush');
  });
});
