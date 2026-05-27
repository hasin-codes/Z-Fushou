const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function utcBoundsForBeijingDate(dateKey: string): { start: string; end: string } {
  const [year, month, day] = dateKey.split('-').map(Number);
  const startMs = Date.UTC(year, month - 1, day) - BEIJING_OFFSET_MS;
  const endMs = startMs + 24 * 60 * 60 * 1000 - 1;

  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
  };
}

export function utcBoundsForBeijingRange(
  from: string,
  to: string,
): { start: string; end: string } {
  return {
    start: utcBoundsForBeijingDate(from).start,
    end: utcBoundsForBeijingDate(to).end,
  };
}

export function beijingDateKeyFromUtc(iso: string): string {
  if (!iso) return '';
  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) return '';
  return new Date(value + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
}

export function beijingHourFromUtc(iso: string): number {
  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) return -1;
  return new Date(value + BEIJING_OFFSET_MS).getUTCHours();
}

/**
 * Returns today's date key (YYYY-MM-DD) in Beijing timezone,
 * regardless of the system's local timezone.
 */
export function beijingTodayKey(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Validates that a string is a proper YYYY-MM-DD date key.
 * Returns empty string if invalid.
 */
export function sanitizeDateKey(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';
  const [, y, m, d] = match.map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) return '';
  return value;
}

/**
 * Returns a complete ISO 8601 timestamp for the *start* of a YYYY-MM-DD
 * date key in UTC. Used to cast text date values for PostgreSQL `date`
 * column comparisons via `timestamptz` conversion.
 *
 * When PostgreSQL complains `operator does not exist: date >= text`,
 * use the UTC timestamp bounds from utcBoundsForBeijingRange instead of
 * comparing against the raw YYYY-MM-DD string.
 */
