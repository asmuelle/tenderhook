import { describe, expect, it } from 'vitest';
import { computeRedline } from './redline';
import { diffWords } from './word-diff';

describe('computeRedline', () => {
  it('reports identical documents with zero hunks', () => {
    // Arrange
    const doc = 'SECTION A\nOffers due: June 30, 2026\nSECTION B';

    // Act
    const result = computeRedline(doc, doc);

    // Assert
    expect(result.identical).toBe(true);
    expect(result.hunks).toHaveLength(0);
  });

  it('treats CRLF and LF documents with equal content as identical', () => {
    // Arrange
    const lf = 'line one\nline two';
    const crlf = 'line one\r\nline two';

    // Act
    const result = computeRedline(lf, crlf);

    // Assert
    expect(result.identical).toBe(true);
  });

  it('classifies a pure insertion as an added hunk with current range only', () => {
    // Arrange
    const prior = 'alpha\ncharlie';
    const current = 'alpha\nbravo\ncharlie';

    // Act
    const result = computeRedline(prior, current);

    // Assert
    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0]).toMatchObject({
      kind: 'added',
      priorRange: null,
      currentRange: { start: 2, end: 2 },
      currentText: 'bravo',
    });
  });

  it('classifies a pure deletion as a removed hunk with prior range only', () => {
    // Arrange
    const prior = 'alpha\nbravo\ncharlie';
    const current = 'alpha\ncharlie';

    // Act
    const result = computeRedline(prior, current);

    // Assert
    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0]).toMatchObject({
      kind: 'removed',
      priorRange: { start: 2, end: 2 },
      priorText: 'bravo',
      currentRange: null,
    });
  });

  it('classifies a replaced line as a changed hunk carrying both sides verbatim', () => {
    // Arrange
    const prior = 'header\nOffers due: June 30, 2026\nfooter';
    const current = 'header\nOffers due: July 21, 2026\nfooter';

    // Act
    const result = computeRedline(prior, current);

    // Assert
    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0]).toMatchObject({
      kind: 'changed',
      priorText: 'Offers due: June 30, 2026',
      currentText: 'Offers due: July 21, 2026',
      priorRange: { start: 2, end: 2 },
      currentRange: { start: 2, end: 2 },
    });
  });

  it('handles an empty prior document as one added hunk covering everything', () => {
    // Arrange
    const current = 'first\nsecond';

    // Act
    const result = computeRedline('', current);

    // Assert
    expect(result.identical).toBe(false);
    const added = result.hunks.filter((hunk) => hunk.kind === 'added');
    expect(added.length).toBeGreaterThan(0);
    expect(result.hunks.map((hunk) => hunk.currentText).join('\n')).toContain('first');
  });

  it('produces multiple hunks for multiple separated edits', () => {
    // Arrange
    const prior = 'a\nb\nc\nd\ne';
    const current = 'a\nB\nc\nd\nE';

    // Act
    const result = computeRedline(prior, current);

    // Assert
    expect(result.hunks).toHaveLength(2);
    expect(result.hunks.map((hunk) => hunk.kind)).toEqual(['changed', 'changed']);
  });
});

describe('diffWords', () => {
  it('marks only the replaced words inside a changed line', () => {
    // Arrange
    const prior = 'Offers due: June 30, 2026 at 2:00 PM';
    const current = 'Offers due: July 21, 2026 at 2:00 PM';

    // Act
    const segments = diffWords(prior, current);

    // Assert
    const removed = segments.filter((segment) => segment.kind === 'removed');
    const added = segments.filter((segment) => segment.kind === 'added');
    expect(removed.map((segment) => segment.text).join(' ')).toContain('June');
    expect(added.map((segment) => segment.text).join(' ')).toContain('July');
    expect(segments.some((segment) => segment.kind === 'equal')).toBe(true);
  });

  it('round-trips: concatenating equal+removed reproduces the prior text', () => {
    // Arrange
    const prior = 'the quick brown fox';
    const current = 'the slow brown wolf';

    // Act
    const segments = diffWords(prior, current);

    // Assert
    const rebuiltPrior = segments
      .filter((segment) => segment.kind !== 'added')
      .map((segment) => segment.text)
      .join('');
    expect(rebuiltPrior).toBe(prior);
  });
});
