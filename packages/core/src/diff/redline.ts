import { lcsDiff } from './lcs';
import { groupHunks, type Hunk } from './hunks';

export interface RedlineDiff {
  readonly identical: boolean;
  readonly hunks: readonly Hunk[];
  readonly priorLineCount: number;
  readonly currentLineCount: number;
}

/**
 * Deterministic line-level red-line between two extracted document texts.
 * This — and only this — decides whether a solicitation changed
 * (PRODUCT INVARIANT 1). No model is ever consulted.
 */
export function computeRedline(priorText: string, currentText: string): RedlineDiff {
  const prior = normalizeLineEndings(priorText);
  const current = normalizeLineEndings(currentText);
  const priorLines = splitLines(prior);
  const currentLines = splitLines(current);

  if (prior === current) {
    return {
      identical: true,
      hunks: [],
      priorLineCount: priorLines.length,
      currentLineCount: currentLines.length,
    };
  }

  const ops = lcsDiff(priorLines, currentLines);
  const hunks = groupHunks(ops);
  return {
    identical: hunks.length === 0,
    hunks,
    priorLineCount: priorLines.length,
    currentLineCount: currentLines.length,
  };
}

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/** An empty document has zero lines — so a first version diffs as pure insertion. */
function splitLines(text: string): readonly string[] {
  return text === '' ? [] : text.split('\n');
}
