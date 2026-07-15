/**
 * Rules-based Brain Dump parser (FE-only MVP, NO LLM).
 * Turns one free-text line into a structured quest. An optional Phase-2 Claude parser
 * can replace `parseBrainDump` behind the same return type (see ai-braindump-parser skill).
 */
import type { NewTaskInput } from '../db/repo';
import type { QuestKind } from '../db/types';

const DEFAULT_SECONDS = 25 * 60; // a focus block when no duration is given

function parseDurationSeconds(text: string): number | null {
  let secs = 0;
  let found = false;
  const h = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i);
  if (h) {
    secs += parseFloat(h[1]) * 3600;
    found = true;
  }
  const m = text.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/i);
  if (m) {
    secs += parseInt(m[1], 10) * 60;
    found = true;
  }
  return found ? Math.round(secs) : null;
}

const UNIT_MAP: Record<string, string> = {
  k: 'km',
  km: 'km',
  mi: 'miles',
  mile: 'miles',
  miles: 'miles',
  page: 'pages',
  pages: 'pages',
  rep: 'reps',
  reps: 'reps',
  word: 'words',
  words: 'words',
  pushup: 'pushups',
  pushups: 'pushups',
  glass: 'glasses',
  glasses: 'glasses',
  step: 'steps',
  steps: 'steps',
  lap: 'laps',
  laps: 'laps',
};

function parseTarget(text: string): { value: number; unit: string } | null {
  // '<n>k <unit>' means n*1000 of <unit> (e.g. "10k steps"); optional k-multiplier before a real unit.
  const t = text.match(
    /(\d+(?:\.\d+)?)(k)?\s*(km|miles?|mi|pages?|reps?|words?|pushups?|glasses?|steps?|laps?)\b/i,
  );
  if (t) {
    const value = parseFloat(t[1]) * (t[2] ? 1000 : 1);
    const u = t[3].toLowerCase();
    return { value, unit: UNIT_MAP[u] ?? u };
  }
  // bare '<n>k' with no following unit → kilometres
  const km = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (km) return { value: parseFloat(km[1]), unit: 'km' };
  return null;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseDue(text: string, now = new Date()): number | null {
  const lower = text.toLowerCase();
  const base = new Date(now);
  base.setSeconds(0, 0);
  let day: Date | null = null;

  if (/\btomorrow\b/.test(lower)) {
    day = new Date(base);
    day.setDate(day.getDate() + 1);
  } else if (/\b(today|tonight)\b/.test(lower)) {
    day = new Date(base);
  } else {
    for (let i = 0; i < WEEKDAYS.length; i++) {
      if (new RegExp(`\\b${WEEKDAYS[i]}\\b`).test(lower)) {
        day = new Date(base);
        const diff = (i - day.getDay() + 7) % 7 || 7; // next occurrence
        day.setDate(day.getDate() + diff);
        break;
      }
    }
  }

  // time of day
  const time = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) || lower.match(/\b(\d{1,2}):(\d{2})\b/);
  let hour: number | null = null;
  let minute = 0;
  if (time) {
    hour = parseInt(time[1], 10);
    minute = time[2] ? parseInt(time[2], 10) : 0;
    const mer = time[3];
    if (mer === 'pm' && hour < 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;
  }
  if (/\btonight\b/.test(lower) && hour === null) hour = 20;

  if (!day && hour === null) return null;
  const target = day ?? new Date(base);
  if (hour !== null) target.setHours(hour, minute, 0, 0);
  else target.setHours(9, 0, 0, 0); // default morning
  // If the resolved time is already past (incl. "today"/"tonight"/a weekday earlier today), roll to next day.
  if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime();
}

const TAG_RULES: [RegExp, string][] = [
  [/\b(work|meeting|email|report|deck|client|project|standup|slides?)\b/i, 'Work'],
  [/\b(study|exam|essay|homework|read(ing)?|assignment|lecture|class|revise|revision|thesis)\b/i, 'Study'],
  [/\b(gym|run|jog|workout|exercise|yoga|walk|pushups?|steps|training|stretch)\b/i, 'Fitness'],
  [/\b(clean|laundry|dishes|groceries|cook|tidy|chores?|vacuum)\b/i, 'Home'],
  [/\b(call|text|mum|mom|dad|friend|family|birthday|meet up)\b/i, 'Personal'],
];

function parseTag(text: string): string {
  for (const [re, tag] of TAG_RULES) if (re.test(text)) return tag;
  return '';
}

function titleCase(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length ? t[0].toUpperCase() + t.slice(1) : t;
}

/** Parse one free-text line into a quest. Always returns something usable. */
export function parseBrainDump(raw: string): NewTaskInput {
  const text = raw.trim();
  const duration = parseDurationSeconds(text);
  const target = parseTarget(text);
  const due = parseDue(text);
  const tag = parseTag(text);
  const kind: QuestKind = target ? 'target' : 'focus';

  return {
    name: titleCase(text) || 'New quest',
    estimated_time: duration ?? DEFAULT_SECONDS,
    kind,
    tag,
    due_date: due,
    target_value: target?.value ?? null,
    target_unit: target?.unit ?? null,
    created_by_ai: false, // rules-based, not an LLM
  };
}

/** Short human summary of what the parser extracted (for the confirm UI). */
export function summarizeParse(input: NewTaskInput): string {
  const bits: string[] = [];
  bits.push(`${Math.round(input.estimated_time / 60)} min`);
  if (input.kind === 'target' && input.target_value != null) {
    bits.push(`target ${input.target_value}${input.target_unit ? ' ' + input.target_unit : ''}`);
  }
  if (input.tag) bits.push(input.tag);
  if (input.due_date) {
    const d = new Date(input.due_date);
    bits.push(`due ${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`);
  }
  return bits.join(' · ');
}
