/**
 * Deterministic deadline extraction from solicitation text.
 * Date parsing is table-driven (no locale-dependent Date parsing).
 */

export interface ParsedDeadline {
  /** ISO calendar date, YYYY-MM-DD. */
  readonly iso: string;
  /** The exact source line the deadline was found on. */
  readonly raw: string;
}

const MONTH_NUMBERS: Readonly<Record<string, number>> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const DEADLINE_KEYWORD =
  /(offers?\s+(?:are\s+)?due|responses?\s+due|response\s+deadline|closing\s+date|proposals?\s+due|quotations?\s+due|due\s+date)/i;

const LONG_DATE =
  /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),\s*(\d{4})/i;

const NUMERIC_DATE = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;

export function extractDeadline(text: string): ParsedDeadline | null {
  for (const line of text.split('\n')) {
    if (!DEADLINE_KEYWORD.test(line)) continue;
    const iso = parseDateFromLine(line);
    if (iso !== null) return { iso, raw: line.trim() };
  }
  return null;
}

function parseDateFromLine(line: string): string | null {
  const longMatch = LONG_DATE.exec(line);
  if (longMatch !== null) {
    const month = MONTH_NUMBERS[longMatch[1]!.toLowerCase()];
    return month === undefined
      ? null
      : toIsoDate(Number(longMatch[3]), month, Number(longMatch[2]));
  }
  const numericMatch = NUMERIC_DATE.exec(line);
  if (numericMatch !== null) {
    return toIsoDate(Number(numericMatch[3]), Number(numericMatch[1]), Number(numericMatch[2]));
  }
  return null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
