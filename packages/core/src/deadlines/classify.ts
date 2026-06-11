export type DeadlineChangeKind = 'unchanged' | 'extended' | 'accelerated' | 'set' | 'removed';

/**
 * Classifies a deadline transition between two ISO dates (YYYY-MM-DD).
 * Lexicographic comparison is exact for ISO calendar dates.
 */
export function classifyDeadlineChange(
  priorIso: string | null,
  currentIso: string | null,
): DeadlineChangeKind {
  if (priorIso === null && currentIso === null) return 'unchanged';
  if (priorIso === null) return 'set';
  if (currentIso === null) return 'removed';
  if (priorIso === currentIso) return 'unchanged';
  return currentIso > priorIso ? 'extended' : 'accelerated';
}
