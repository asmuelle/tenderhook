import { describe, expect, it } from 'vitest';
import { classifyMateriality } from './classify';
import type { Hunk } from '../diff/hunks';

function changedHunk(priorText: string, currentText: string): Hunk {
  return {
    kind: 'changed',
    priorRange: { start: 1, end: 1 },
    currentRange: { start: 1, end: 1 },
    priorText,
    currentText,
  };
}

function addedHunk(currentText: string): Hunk {
  return {
    kind: 'added',
    priorRange: null,
    currentRange: { start: 10, end: 12 },
    priorText: null,
    currentText,
  };
}

describe('classifyMateriality', () => {
  it('flags a deadline change with prior and current ISO dates', () => {
    // Arrange
    const hunks = [
      changedHunk('Offers due: June 30, 2026 at 2:00 PM.', 'Offers due: July 21, 2026 at 2:00 PM.'),
    ];

    // Act
    const flags = classifyMateriality(hunks);

    // Assert
    expect(flags.deadlineChanged).toBe(true);
    expect(flags.priorDeadline).toBe('2026-06-30');
    expect(flags.currentDeadline).toBe('2026-07-21');
    expect(flags.deadlineChange).toBe('extended');
  });

  it('flags scope changes when a hunk touches statement-of-work text', () => {
    // Arrange
    const hunks = [addedHunk('C.2.4. The Contractor shall provide zero trust segmentation.')];

    // Act
    const flags = classifyMateriality(hunks);

    // Assert
    expect(flags.scopeChanged).toBe(true);
    expect(flags.deadlineChanged).toBe(false);
  });

  it('flags Q&A additions only when the Q&A text is new', () => {
    // Arrange
    const added = [addedHunk('QUESTIONS AND ANSWERS\nQ1: Is a site visit required?\nA1: No.')];
    const unchangedQa = [
      changedHunk('Q1: Is a site visit required?', 'Q1: Is a site visit mandatory?'),
    ];

    // Act & Assert
    expect(classifyMateriality(added).qaAdded).toBe(true);
    expect(classifyMateriality(unchangedQa).qaAdded).toBe(false);
  });

  it('returns all-false flags for an immaterial wording change', () => {
    // Arrange
    const hunks = [
      changedHunk('Attachment 2: Pricing_Workbook.xlsx', 'Attachment 2: Pricing_Workbook_v2.xlsx'),
    ];

    // Act
    const flags = classifyMateriality(hunks);

    // Assert
    expect(flags).toMatchObject({
      deadlineChanged: false,
      scopeChanged: false,
      qaAdded: false,
      deadlineChange: 'unchanged',
    });
  });
});
