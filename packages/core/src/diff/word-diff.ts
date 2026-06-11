import { lcsDiff } from './lcs';

export type WordSegmentKind = 'equal' | 'removed' | 'added';

export interface WordSegment {
  readonly kind: WordSegmentKind;
  readonly text: string;
}

/**
 * Word-level refinement inside a changed hunk, used by the red-line viewer
 * to render legal-style strikethrough/underline inline — not unified diffs.
 */
export function diffWords(priorText: string, currentText: string): readonly WordSegment[] {
  const priorTokens = tokenizeWords(priorText);
  const currentTokens = tokenizeWords(currentText);
  const ops = lcsDiff(priorTokens, currentTokens);

  const segments: WordSegment[] = [];
  for (const op of ops) {
    const kind: WordSegmentKind =
      op.kind === 'equal' ? 'equal' : op.kind === 'delete' ? 'removed' : 'added';
    const last = segments[segments.length - 1];
    if (last !== undefined && last.kind === kind) {
      segments[segments.length - 1] = { kind, text: last.text + op.value };
    } else {
      segments.push({ kind, text: op.value });
    }
  }
  return segments;
}

function tokenizeWords(text: string): readonly string[] {
  return text.split(/(\s+)/).filter((token) => token.length > 0);
}
