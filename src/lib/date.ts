/** Local-time date helpers. All decay/streak/calendar logic uses the DEVICE clock. */

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 'YYYY-MM-DD' in device-local time. */
export function todayLocalISO(atMs: number = Date.now()): string {
  const d = new Date(atMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Number of local midnights strictly crossed between two instants (>= 0). */
export function localMidnightsBetween(fromMs: number, nowMs: number): number {
  const a = startOfLocalDay(fromMs);
  const b = startOfLocalDay(nowMs);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** Human "1h 30m" from seconds. */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSeconds}s`;
}
