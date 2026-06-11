import { describe, expect, it } from 'vitest';
import { extractDeadline } from './parse';
import { classifyDeadlineChange } from './classify';

describe('extractDeadline', () => {
  it('extracts a long-form date from an offers-due line', () => {
    // Arrange
    const text = 'SECTION A\nOffers due: June 30, 2026 at 2:00 PM Central Time.\nSECTION B';

    // Act
    const deadline = extractDeadline(text);

    // Assert
    expect(deadline).not.toBeNull();
    expect(deadline?.iso).toBe('2026-06-30');
    expect(deadline?.raw).toContain('Offers due');
  });

  it('extracts a numeric MM/DD/YYYY date from a response deadline line', () => {
    // Arrange
    const text = 'Response deadline: 07/21/2026, 14:00 ET';

    // Act
    const deadline = extractDeadline(text);

    // Assert
    expect(deadline?.iso).toBe('2026-07-21');
  });

  it('returns null when a keyword line has no parseable date', () => {
    // Arrange
    const text = 'Q1: Will the Government extend the proposal due date?';

    // Act
    const deadline = extractDeadline(text);

    // Assert
    expect(deadline).toBeNull();
  });

  it('returns null when a date appears without a deadline keyword', () => {
    // Arrange
    const text = 'This solicitation was posted on June 8, 2026.';

    // Act
    const deadline = extractDeadline(text);

    // Assert
    expect(deadline).toBeNull();
  });
});

describe('classifyDeadlineChange', () => {
  it.each([
    [null, null, 'unchanged'],
    ['2026-06-30', '2026-06-30', 'unchanged'],
    ['2026-06-30', '2026-07-21', 'extended'],
    ['2026-07-21', '2026-06-30', 'accelerated'],
    [null, '2026-06-30', 'set'],
    ['2026-06-30', null, 'removed'],
  ] as const)('classifies %s -> %s as %s', (prior, current, expected) => {
    // Act
    const result = classifyDeadlineChange(prior, current);

    // Assert
    expect(result).toBe(expected);
  });
});
