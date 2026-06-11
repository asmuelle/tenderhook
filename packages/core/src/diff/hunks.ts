import type { DiffOp } from './lcs';

export type HunkKind = 'added' | 'removed' | 'changed';

export interface LineRange {
  /** 1-based inclusive start line in the source document. */
  readonly start: number;
  /** 1-based inclusive end line in the source document. */
  readonly end: number;
}

/**
 * A contiguous changed region between two document versions. Carries the
 * exact source text on both sides so every quoted span downstream can be
 * string-verified against stored extracted text (invariant 2).
 */
export interface Hunk {
  readonly kind: HunkKind;
  readonly priorRange: LineRange | null;
  readonly currentRange: LineRange | null;
  readonly priorText: string | null;
  readonly currentText: string | null;
}

interface MutableRun {
  deletedLines: string[];
  insertedLines: string[];
  priorStart: number | null;
  priorEnd: number | null;
  currentStart: number | null;
  currentEnd: number | null;
}

export function groupHunks(ops: readonly DiffOp<string>[]): readonly Hunk[] {
  const hunks: Hunk[] = [];
  let run: MutableRun | null = null;

  for (const op of ops) {
    if (op.kind === 'equal') {
      if (run !== null) {
        hunks.push(finishRun(run));
        run = null;
      }
      continue;
    }
    run = run ?? emptyRun();
    if (op.kind === 'delete') {
      run.deletedLines.push(op.value);
      run.priorStart = run.priorStart ?? op.aIndex + 1;
      run.priorEnd = op.aIndex + 1;
    } else {
      run.insertedLines.push(op.value);
      run.currentStart = run.currentStart ?? op.bIndex + 1;
      run.currentEnd = op.bIndex + 1;
    }
  }
  if (run !== null) hunks.push(finishRun(run));
  return hunks;
}

function emptyRun(): MutableRun {
  return {
    deletedLines: [],
    insertedLines: [],
    priorStart: null,
    priorEnd: null,
    currentStart: null,
    currentEnd: null,
  };
}

function finishRun(run: MutableRun): Hunk {
  const hasDeletes = run.deletedLines.length > 0;
  const hasInserts = run.insertedLines.length > 0;
  const kind: HunkKind = hasDeletes && hasInserts ? 'changed' : hasDeletes ? 'removed' : 'added';
  return {
    kind,
    priorRange:
      run.priorStart !== null && run.priorEnd !== null
        ? { start: run.priorStart, end: run.priorEnd }
        : null,
    currentRange:
      run.currentStart !== null && run.currentEnd !== null
        ? { start: run.currentStart, end: run.currentEnd }
        : null,
    priorText: hasDeletes ? run.deletedLines.join('\n') : null,
    currentText: hasInserts ? run.insertedLines.join('\n') : null,
  };
}
