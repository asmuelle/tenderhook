/**
 * Deterministic date formatting for the digest preview — table-driven,
 * no locale or timezone dependent Date parsing, so server rendering is
 * stable across machines.
 */

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;
const UTC_TIME = /T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?Z$/;

/** '2026-07-21' or '2026-07-21T14:00:00-05:00' -> 'July 21, 2026'. */
export function formatDateLong(iso: string): string {
  const match = ISO_DATE_PREFIX.exec(iso);
  if (match === null) return iso;
  const month = MONTH_NAMES[Number(match[2]) - 1];
  if (month === undefined) return iso;
  return `${month} ${Number(match[3])}, ${match[1]}`;
}

/** '2026-06-10T11:00:00.000Z' -> 'June 10, 2026 · 11:00 UTC'. */
export function formatStampUtc(iso: string): string {
  const date = formatDateLong(iso);
  const time = UTC_TIME.exec(iso);
  return time === null ? date : `${date} · ${time[1]}:${time[2]} UTC`;
}

/** Nullable deadline -> long date or an explicit em-dash placeholder. */
export function formatDeadline(iso: string | null): string {
  return iso === null ? '—' : formatDateLong(iso);
}
