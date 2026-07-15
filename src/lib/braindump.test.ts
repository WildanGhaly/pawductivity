import { describe, expect, test } from '@jest/globals';
import { parseBrainDump, summarizeParse } from './braindump';

describe('parseBrainDump — duration', () => {
  test('minutes', () => {
    expect(parseBrainDump('study biology 45 min').estimated_time).toBe(45 * 60);
  });
  test('hours', () => {
    expect(parseBrainDump('deep work 2h').estimated_time).toBe(2 * 3600);
  });
  test('hours + minutes combine', () => {
    expect(parseBrainDump('project 1h 30m').estimated_time).toBe(5400);
  });
  test('no duration falls back to a 25-min focus block', () => {
    expect(parseBrainDump('call the dentist').estimated_time).toBe(25 * 60);
  });
});

describe('parseBrainDump — targets', () => {
  test('distance in km, tagged Fitness', () => {
    const q = parseBrainDump('run 5km');
    expect(q.kind).toBe('target');
    expect(q.target_value).toBe(5);
    expect(q.target_unit).toBe('km');
    expect(q.tag).toBe('Fitness');
  });
  test('pages, tagged Study', () => {
    const q = parseBrainDump('read 20 pages');
    expect(q.kind).toBe('target');
    expect(q.target_value).toBe(20);
    expect(q.target_unit).toBe('pages');
    expect(q.tag).toBe('Study');
  });
  test('k-multiplier before a real unit: "10k steps" = 10000 steps', () => {
    const q = parseBrainDump('walk 10k steps');
    expect(q.target_value).toBe(10000);
    expect(q.target_unit).toBe('steps');
  });
  test('bare "5k" means 5 kilometres', () => {
    const q = parseBrainDump('jog 5k');
    expect(q.target_value).toBe(5);
    expect(q.target_unit).toBe('km');
  });
  test('plain text with no number is a focus quest, not a target', () => {
    expect(parseBrainDump('write the essay').kind).toBe('focus');
  });
});

describe('parseBrainDump — tags', () => {
  test.each([
    ['email the client deck', 'Work'],
    ['revise for the exam', 'Study'],
    ['gym session', 'Fitness'],
    ['do the laundry', 'Home'],
    ['call mom', 'Personal'],
    ['something random', ''],
  ])('%s → %s', (text, tag) => {
    expect(parseBrainDump(text).tag).toBe(tag);
  });
});

describe('parseBrainDump — misc', () => {
  test('name is title-cased and whitespace-collapsed', () => {
    expect(parseBrainDump('  finish   the   report ').name).toBe('Finish the report');
  });
  test('empty input still yields a usable quest', () => {
    const q = parseBrainDump('');
    expect(q.name).toBe('New quest');
    expect(q.kind).toBe('focus');
  });
  test('never marks itself AI-created (rules-based MVP)', () => {
    expect(parseBrainDump('anything').created_by_ai).toBe(false);
  });
  test('"tomorrow 9am" resolves a future due date', () => {
    const q = parseBrainDump('submit report tomorrow 9am');
    expect(typeof q.due_date).toBe('number');
    expect(q.due_date!).toBeGreaterThan(Date.now());
  });
});

describe('summarizeParse', () => {
  test('includes minutes and tag', () => {
    const s = summarizeParse(parseBrainDump('gym 30 min'));
    expect(s).toContain('30 min');
    expect(s).toContain('Fitness');
  });
  test('includes the target for target quests', () => {
    const s = summarizeParse(parseBrainDump('read 20 pages'));
    expect(s).toContain('target 20 pages');
  });
});
