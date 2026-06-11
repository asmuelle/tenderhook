import type {
  Hunk,
  HunkSummarizer,
  HunkSummary,
  QuotedSpan,
  SummarizeInput,
} from '@tenderhook/core';

/**
 * Hunk summarization sits behind the HunkSummarizer contract (core).
 * M1 ships only this deterministic mock — it summarizes *already-diffed*
 * hunks (never decides whether something changed, invariant 1) and pins
 * every claim to an exact span from the stored text (invariant 2).
 * A live Anthropic (Haiku-class) implementation lands post-M1 behind the
 * same interface; no AI API is called anywhere in this milestone.
 */
export class MockHunkSummarizer implements HunkSummarizer {
  summarize(input: SummarizeInput): Promise<HunkSummary> {
    const sentences: string[] = [];
    const quotes: QuotedSpan[] = [];

    for (const hunk of input.hunks) {
      const described = describeHunk(hunk, input);
      if (described === null) continue;
      sentences.push(described.sentence);
      quotes.push(described.quote);
    }

    return Promise.resolve({
      text: `Amendment to "${input.opportunityTitle}": ${sentences.join(' ')}`,
      quotes,
    });
  }
}

interface DescribedHunk {
  readonly sentence: string;
  readonly quote: QuotedSpan;
}

function describeHunk(hunk: Hunk, input: SummarizeInput): DescribedHunk | null {
  if (hunk.kind !== 'removed' && hunk.currentText !== null) {
    const line = firstContentLine(hunk.currentText);
    if (line === null) return null;
    const verb = hunk.kind === 'added' ? 'Added' : 'Revised';
    return {
      sentence: `${verb}: "${line}"`,
      quote: { quote: line, documentVersionId: input.currentVersionId },
    };
  }
  if (hunk.priorText !== null) {
    const line = firstContentLine(hunk.priorText);
    if (line === null) return null;
    return {
      sentence: `Removed: "${line}"`,
      quote: { quote: line, documentVersionId: input.priorVersionId },
    };
  }
  return null;
}

function firstContentLine(text: string): string | null {
  for (const line of text.split('\n')) {
    if (line.trim().length > 0) return line;
  }
  return null;
}

export type SummarizerProvider = 'mock';

export interface SummarizerSelection {
  readonly summarizer: HunkSummarizer;
  readonly provider: SummarizerProvider;
  readonly reason: string;
}

/**
 * Factory for the active summarizer. Reads env, never throws, never calls
 * out: with or without ANTHROPIC_API_KEY, M1 returns the deterministic
 * mock (the live adapter is a post-M1 task behind the same contract).
 */
export function createSummarizer(
  env: Readonly<Record<string, string | undefined>>,
): SummarizerSelection {
  const hasKey = typeof env['ANTHROPIC_API_KEY'] === 'string' && env['ANTHROPIC_API_KEY'] !== '';
  return {
    summarizer: new MockHunkSummarizer(),
    provider: 'mock',
    reason: hasKey
      ? 'ANTHROPIC_API_KEY present, but M1 pins the deterministic mock summarizer.'
      : 'ANTHROPIC_API_KEY not set; using the deterministic mock summarizer.',
  };
}
