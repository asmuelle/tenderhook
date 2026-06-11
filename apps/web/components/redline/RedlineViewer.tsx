import { diffWords, type Hunk, type LineRange } from '@tenderhook/core';

interface RedlineViewerProps {
  hunks: readonly Hunk[];
}

/**
 * Legal-style red-line: crimson strikethrough for deletions, green underline
 * for insertions, inline in document flow — never a developer unified diff.
 * Purely presentational; all change detection happened deterministically
 * in @tenderhook/core (invariant 1).
 */
export function RedlineViewer({ hunks }: RedlineViewerProps) {
  return (
    <div className="redline">
      <p className="redline-caption">
        Red-line · {hunks.length} change {hunks.length === 1 ? 'region' : 'regions'} · deterministic
        diff
      </p>
      {hunks.map((hunk, index) => (
        <div className="hunk" key={index}>
          <span className="hunk-lines">{lineLabel(hunk)}</span>
          <p className="hunk-text">
            <HunkBody hunk={hunk} />
          </p>
        </div>
      ))}
    </div>
  );
}

function HunkBody({ hunk }: { hunk: Hunk }) {
  if (hunk.kind === 'changed' && hunk.priorText !== null && hunk.currentText !== null) {
    return (
      <>
        {diffWords(hunk.priorText, hunk.currentText).map((segment, index) => {
          if (segment.kind === 'removed') return <del key={index}>{segment.text}</del>;
          if (segment.kind === 'added') return <ins key={index}>{segment.text}</ins>;
          return <span key={index}>{segment.text}</span>;
        })}
      </>
    );
  }
  if (hunk.kind === 'added' && hunk.currentText !== null) {
    return <ins>{hunk.currentText}</ins>;
  }
  if (hunk.kind === 'removed' && hunk.priorText !== null) {
    return <del>{hunk.priorText}</del>;
  }
  return null;
}

function lineLabel(hunk: Hunk): string {
  const range = hunk.kind === 'removed' ? hunk.priorRange : hunk.currentRange;
  const side = hunk.kind === 'removed' ? 'was' : 'now';
  return range === null ? '' : `${side} ${formatRange(range)}`;
}

function formatRange(range: LineRange): string {
  return range.start === range.end ? `L${range.start}` : `L${range.start}–${range.end}`;
}
