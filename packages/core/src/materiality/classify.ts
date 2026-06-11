import type { Hunk } from '../diff/hunks';
import { classifyDeadlineChange, type DeadlineChangeKind } from '../deadlines/classify';
import { extractDeadline } from '../deadlines/parse';

/**
 * Deterministic materiality classification over already-detected hunks.
 * LLMs never decide *whether* something changed (PRODUCT INVARIANT 1);
 * these flags are computed purely from the red-line.
 */
export interface MaterialityFlags {
  readonly deadlineChanged: boolean;
  readonly scopeChanged: boolean;
  readonly qaAdded: boolean;
  readonly priorDeadline: string | null;
  readonly currentDeadline: string | null;
  readonly deadlineChange: DeadlineChangeKind;
}

const SCOPE_PATTERN =
  /(statement of work|scope of work|\bC\.\d|performance work statement|technical requirements)/i;

const QA_PATTERN = /(questions?\s*(?:and|&)\s*answers?|^\s*Q\d+[:.)]|^\s*A\d+[:.)])/im;

export function classifyMateriality(hunks: readonly Hunk[]): MaterialityFlags {
  const priorTextAll = joinSide(hunks, 'priorText');
  const currentTextAll = joinSide(hunks, 'currentText');

  const priorDeadline = extractDeadline(priorTextAll);
  const currentDeadline = extractDeadline(currentTextAll);
  const deadlineChange = classifyDeadlineChange(
    priorDeadline?.iso ?? null,
    currentDeadline?.iso ?? null,
  );

  const scopeChanged = hunks.some(
    (hunk) => matches(SCOPE_PATTERN, hunk.priorText) || matches(SCOPE_PATTERN, hunk.currentText),
  );

  const qaAdded = hunks.some(
    (hunk) =>
      (hunk.kind === 'added' || hunk.kind === 'changed') &&
      matches(QA_PATTERN, hunk.currentText) &&
      !matches(QA_PATTERN, hunk.priorText),
  );

  return {
    deadlineChanged: deadlineChange !== 'unchanged',
    scopeChanged,
    qaAdded,
    priorDeadline: priorDeadline?.iso ?? null,
    currentDeadline: currentDeadline?.iso ?? null,
    deadlineChange,
  };
}

function joinSide(hunks: readonly Hunk[], side: 'priorText' | 'currentText'): string {
  return hunks
    .map((hunk) => hunk[side])
    .filter((text): text is string => text !== null)
    .join('\n');
}

function matches(pattern: RegExp, text: string | null): boolean {
  return text !== null && pattern.test(text);
}
