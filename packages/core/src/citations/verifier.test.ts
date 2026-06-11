import { describe, expect, it } from 'vitest';
import { gateSummary, verifyQuotedSpans, type HunkSummary } from './verifier';

const EXTRACTED = new Map([
  ['opp-1@v2', 'AMENDMENT 0001\nOffers due: July 21, 2026 at 2:00 PM Central Time.\nSECTION C'],
]);

describe('verifyQuotedSpans', () => {
  it('passes when every quote is an exact substring of the stored text', () => {
    // Arrange
    const summary: HunkSummary = {
      text: 'Deadline extended.',
      quotes: [{ quote: 'Offers due: July 21, 2026', documentVersionId: 'opp-1@v2' }],
    };

    // Act
    const check = verifyQuotedSpans(summary, EXTRACTED);

    // Assert
    expect(check.ok).toBe(true);
  });

  it('fails with quote-not-found for a corrupted quote', () => {
    // Arrange
    const summary: HunkSummary = {
      text: 'Deadline extended.',
      quotes: [{ quote: 'Offers due: July 22, 2026', documentVersionId: 'opp-1@v2' }],
    };

    // Act
    const check = verifyQuotedSpans(summary, EXTRACTED);

    // Assert
    expect(check).toMatchObject({ ok: false });
    if (!check.ok) {
      expect(check.failures[0]?.reason).toBe('quote-not-found');
    }
  });

  it('fails with missing-document when the version id is unknown', () => {
    // Arrange
    const summary: HunkSummary = {
      text: 'x',
      quotes: [{ quote: 'anything', documentVersionId: 'nope@v9' }],
    };

    // Act
    const check = verifyQuotedSpans(summary, EXTRACTED);

    // Assert
    expect(check).toMatchObject({ ok: false });
    if (!check.ok) {
      expect(check.failures[0]?.reason).toBe('missing-document');
    }
  });
});

describe('gateSummary (the send-path gate, invariant 2)', () => {
  it('ships the summary when all quotes verify', () => {
    // Arrange
    const summary: HunkSummary = {
      text: 'Deadline extended to July 21.',
      quotes: [{ quote: 'July 21, 2026', documentVersionId: 'opp-1@v2' }],
    };

    // Act
    const gated = gateSummary(summary, EXTRACTED);

    // Assert
    expect(gated.kind).toBe('summary');
  });

  it('blocks the summary and ships the raw red-line on any failed quote', () => {
    // Arrange
    const summary: HunkSummary = {
      text: 'Fabricated claim.',
      quotes: [
        { quote: 'July 21, 2026', documentVersionId: 'opp-1@v2' },
        { quote: 'THIS TEXT NEVER APPEARS IN THE DOCUMENT', documentVersionId: 'opp-1@v2' },
      ],
    };

    // Act
    const gated = gateSummary(summary, EXTRACTED);

    // Assert
    expect(gated.kind).toBe('raw-redline');
  });

  it('blocks a summary that pins no quotes at all', () => {
    // Arrange
    const summary: HunkSummary = { text: 'Trust me, nothing changed.', quotes: [] };

    // Act
    const gated = gateSummary(summary, EXTRACTED);

    // Assert
    expect(gated.kind).toBe('raw-redline');
  });
});
