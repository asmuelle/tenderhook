import { describe, expect, it } from 'vitest';
import { parseSamExtract, SamExtractParseError } from './extract-adapter';
import { SAM_EXTRACT_2026_06_09 } from './fixtures/index';

describe('parseSamExtract (adapter contract against the recorded extract)', () => {
  it('parses every record of the recorded 2026-06-09 extract without errors', () => {
    // Act
    const result = parseSamExtract(SAM_EXTRACT_2026_06_09);

    // Assert
    expect(result.errors).toHaveLength(0);
    expect(result.opportunities).toHaveLength(6);
    expect(result.extractDate).toBe('2026-06-09');
  });

  it('maps SAM record fields onto the Opportunity shape with stable ids', () => {
    // Act
    const result = parseSamExtract(SAM_EXTRACT_2026_06_09);
    const w912dy = result.opportunities.find(
      (opportunity) => opportunity.solicitationNumber === 'W912DY-26-R-0014',
    );

    // Assert
    expect(w912dy).toMatchObject({
      id: 'sam:1f64e7a2c8b94d0e9a317c5d2f80a416',
      sourceKind: 'sam',
      externalId: '1f64e7a2c8b94d0e9a317c5d2f80a416',
      naicsCode: '541512',
      type: 'solicitation',
      url: 'https://sam.gov/opp/1f64e7a2c8b94d0e9a317c5d2f80a416/view',
    });
  });

  it('collects invalid records as explicit errors while valid records still flow', () => {
    // Arrange — government feeds are messy; never trust extract fields.
    const extract = {
      extractDate: '2026-06-09',
      source: 'test',
      opportunities: [
        { noticeId: 'broken-record-missing-everything' },
        {
          noticeId: 'ok1',
          title: 'Valid record',
          solicitationNumber: 'TEST-26-R-0001',
          fullParentPathName: 'AGENCY.SUB',
          postedDate: '2026-06-08',
          type: 'Sources Sought',
          naicsCode: '541512',
          responseDeadLine: null,
          uiLink: 'https://sam.gov/opp/ok1/view',
          description: 'A valid test record.',
        },
      ],
    };

    // Act
    const result = parseSamExtract(extract);

    // Assert
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0]?.type).toBe('sources-sought');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.index).toBe(0);
    expect(result.errors[0]?.message).toContain('title');
  });

  it('rejects a record whose deep link is not https (invariant 4 upstream)', () => {
    // Arrange
    const extract = {
      extractDate: '2026-06-09',
      source: 'test',
      opportunities: [
        {
          noticeId: 'bad-link',
          title: 'Bad link record',
          solicitationNumber: 'TEST-26-R-0002',
          fullParentPathName: 'AGENCY',
          postedDate: '2026-06-08',
          type: 'Solicitation',
          naicsCode: '541512',
          responseDeadLine: null,
          uiLink: 'http://sam.gov/opp/bad-link/view',
          description: 'Non-https deep link.',
        },
      ],
    };

    // Act
    const result = parseSamExtract(extract);

    // Assert
    expect(result.opportunities).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('throws SamExtractParseError on a malformed envelope', () => {
    // Act + Assert
    expect(() => parseSamExtract({ nope: true })).toThrow(SamExtractParseError);
    expect(() => parseSamExtract(null)).toThrow(SamExtractParseError);
  });
});
