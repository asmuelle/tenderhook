import { describe, expect, it } from 'vitest';
import { formatDateLong, formatDeadline, formatStampUtc } from './format';

describe('formatDateLong', () => {
  it('formats a plain ISO calendar date', () => {
    expect(formatDateLong('2026-07-21')).toBe('July 21, 2026');
  });

  it('formats an ISO timestamp with an offset using its calendar date', () => {
    expect(formatDateLong('2026-06-30T14:00:00-05:00')).toBe('June 30, 2026');
  });

  it('returns unparseable input unchanged instead of guessing', () => {
    expect(formatDateLong('TBD')).toBe('TBD');
    expect(formatDateLong('2026-13-01')).toBe('2026-13-01');
  });
});

describe('formatStampUtc', () => {
  it('appends the UTC clock time for a Z timestamp', () => {
    expect(formatStampUtc('2026-06-10T11:00:00.000Z')).toBe('June 10, 2026 · 11:00 UTC');
  });

  it('falls back to the date alone for non-UTC stamps', () => {
    expect(formatStampUtc('2026-06-10T11:00:00-05:00')).toBe('June 10, 2026');
  });
});

describe('formatDeadline', () => {
  it('renders an explicit placeholder for a missing deadline', () => {
    expect(formatDeadline(null)).toBe('—');
  });

  it('renders the long date when present', () => {
    expect(formatDeadline('2026-06-24T16:00:00-07:00')).toBe('June 24, 2026');
  });
});
