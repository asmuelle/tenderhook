import { describe, expect, it } from 'vitest';
import { classifyMateriality, computeRedline } from '@tenderhook/core';
import {
  RFQ_47QSMD_26_Q_5201_V1,
  RFQ_47QSMD_26_Q_5201_V2,
  W912DY_26_R_0014_V1,
  W912DY_26_R_0014_V2,
} from './adapters/sam/fixtures/index';

/**
 * Diff-engine golden corpus (AGENTS.md testing policy #1): real solicitation
 * version pairs; detection and hunk extraction must be exact. Regressions
 * here are release blockers.
 */
describe('golden corpus: W912DY-26-R-0014 amendment 0001 (material)', () => {
  const redline = computeRedline(W912DY_26_R_0014_V1, W912DY_26_R_0014_V2);
  const materiality = classifyMateriality(redline.hunks);

  it('detects the amendment deterministically', () => {
    expect(redline.identical).toBe(false);
    expect(redline.hunks.length).toBeGreaterThan(0);
  });

  it('red-lines the deadline extension with both sides verbatim', () => {
    const deadlineHunk = redline.hunks.find((hunk) =>
      (hunk.priorText ?? '').includes('A.2. Offers due:'),
    );
    expect(deadlineHunk).toMatchObject({
      kind: 'changed',
      priorText: 'A.2. Offers due: June 30, 2026 at 2:00 PM Central Time.',
      currentText: 'A.2. Offers due: July 21, 2026 at 2:00 PM Central Time.',
    });
  });

  it('captures the new scope requirement C.2.4 as an insertion', () => {
    const scopeHunk = redline.hunks.find((hunk) =>
      (hunk.currentText ?? '').includes('C.2.4. Provide zero trust segmentation'),
    );
    expect(scopeHunk).toBeDefined();
    expect(scopeHunk?.kind).toBe('added');
    expect(scopeHunk?.priorText).toBeNull();
  });

  it('captures the published Q&A section as added text', () => {
    const qaText = redline.hunks.map((hunk) => hunk.currentText ?? '').join('\n');
    expect(qaText).toContain('QUESTIONS AND ANSWERS — AMENDMENT 0001');
    expect(qaText).toContain('Q2: Will the Government consider extending the offer due date?');
  });

  it('classifies materiality: deadline extended, scope changed, Q&A added', () => {
    expect(materiality).toMatchObject({
      deadlineChanged: true,
      deadlineChange: 'extended',
      priorDeadline: '2026-06-30',
      currentDeadline: '2026-07-21',
      scopeChanged: true,
      qaAdded: true,
    });
  });

  it('every hunk side reproduces text present verbatim in its source version', () => {
    for (const hunk of redline.hunks) {
      if (hunk.priorText !== null) expect(W912DY_26_R_0014_V1).toContain(hunk.priorText);
      if (hunk.currentText !== null) expect(W912DY_26_R_0014_V2).toContain(hunk.currentText);
    }
  });
});

describe('golden corpus: 47QSMD-26-Q-5201 amendment (immaterial)', () => {
  const redline = computeRedline(RFQ_47QSMD_26_Q_5201_V1, RFQ_47QSMD_26_Q_5201_V2);
  const materiality = classifyMateriality(redline.hunks);

  it('still red-lines the typo fix and attachment rename exactly', () => {
    expect(redline.identical).toBe(false);
    expect(redline.hunks).toHaveLength(2);
    expect(redline.hunks.map((hunk) => hunk.kind)).toEqual(['changed', 'changed']);
    expect(redline.hunks[0]?.priorText).toContain('supervison');
    expect(redline.hunks[0]?.currentText).toContain('supervision');
    expect(redline.hunks[1]?.priorText).toContain('Pricing_Workbook.xlsx');
    expect(redline.hunks[1]?.currentText).toContain('Pricing_Workbook_v2.xlsx');
  });

  it('flags nothing material: no deadline, scope, or Q&A change', () => {
    expect(materiality).toMatchObject({
      deadlineChanged: false,
      deadlineChange: 'unchanged',
      scopeChanged: false,
      qaAdded: false,
    });
  });
});

describe('golden corpus: identity', () => {
  it('reports an unchanged document as identical with zero hunks', () => {
    const redline = computeRedline(W912DY_26_R_0014_V1, W912DY_26_R_0014_V1);
    expect(redline.identical).toBe(true);
    expect(redline.hunks).toHaveLength(0);
  });
});
