/**
 * Citation verifier — PRODUCT INVARIANT 2: no unverifiable quotes ship.
 * Every quoted span in a summary must string-verify against the stored
 * extracted text. Verification failure blocks the summary; callers ship
 * the raw red-line instead.
 */

export interface QuotedSpan {
  readonly quote: string;
  readonly documentVersionId: string;
}

export interface HunkSummary {
  readonly text: string;
  readonly quotes: readonly QuotedSpan[];
}

export type CitationFailureReason = 'missing-document' | 'quote-not-found' | 'empty-quote';

export interface CitationFailure {
  readonly quote: string;
  readonly documentVersionId: string;
  readonly reason: CitationFailureReason;
}

export type CitationCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly failures: readonly CitationFailure[] };

export function verifyQuotedSpans(
  summary: HunkSummary,
  extractedTexts: ReadonlyMap<string, string>,
): CitationCheck {
  const failures: CitationFailure[] = [];
  for (const span of summary.quotes) {
    const failure = checkSpan(span, extractedTexts);
    if (failure !== null) failures.push(failure);
  }
  return failures.length === 0 ? { ok: true } : { ok: false, failures };
}

function checkSpan(
  span: QuotedSpan,
  extractedTexts: ReadonlyMap<string, string>,
): CitationFailure | null {
  if (span.quote.trim().length === 0) {
    return { ...span, reason: 'empty-quote' };
  }
  const text = extractedTexts.get(span.documentVersionId);
  if (text === undefined) {
    return { ...span, reason: 'missing-document' };
  }
  if (!normalize(text).includes(normalize(span.quote))) {
    return { ...span, reason: 'quote-not-found' };
  }
  return null;
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export type GatedSummary =
  | { readonly kind: 'summary'; readonly summary: HunkSummary }
  | { readonly kind: 'raw-redline'; readonly failures: readonly CitationFailure[] };

/**
 * The send-path gate. A summary with no quotes at all is also blocked:
 * a claim about a document change must pin at least one verifiable span.
 */
export function gateSummary(
  summary: HunkSummary,
  extractedTexts: ReadonlyMap<string, string>,
): GatedSummary {
  if (summary.quotes.length === 0) {
    return {
      kind: 'raw-redline',
      failures: [{ quote: '', documentVersionId: '', reason: 'empty-quote' }],
    };
  }
  const check = verifyQuotedSpans(summary, extractedTexts);
  return check.ok
    ? { kind: 'summary', summary }
    : { kind: 'raw-redline', failures: check.failures };
}
