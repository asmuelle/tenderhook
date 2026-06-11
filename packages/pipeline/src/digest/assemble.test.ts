import { describe, expect, it } from 'vitest';
import type { SourceHealth } from '@tenderhook/core';
import {
  assembleDigest,
  DigestAssemblyError,
  type NewMatchItem,
  type TrackedBidItem,
} from './assemble';

const HEALTHY_SOURCE: SourceHealth = {
  sourceId: 'sam-extract',
  kind: 'sam',
  label: 'SAM.gov daily extract',
  consecutiveFailures: 0,
  lastSuccessAt: '2026-06-10T11:00:00.000Z',
  status: 'healthy',
};

const TRACKED_UNCHANGED: TrackedBidItem = {
  opportunityId: 'sam:abc',
  solicitationNumber: 'TEST-26-R-0001',
  title: 'Tracked solicitation',
  citation: { url: 'https://sam.gov/opp/abc/view', label: 'TEST-26-R-0001' },
  state: 'unchanged',
  amendment: null,
};

const NEW_MATCH: NewMatchItem = {
  opportunityId: 'sam:def',
  solicitationNumber: 'TEST-26-R-0002',
  title: 'Matched opportunity',
  score: 72,
  rationale: 'Capability overlap on cloud, migration.',
  responseDeadline: '2026-07-01T17:00:00-04:00',
  citation: { url: 'https://sam.gov/opp/def/view', label: 'TEST-26-R-0002' },
};

const BASE_INPUT = {
  generatedAt: '2026-06-10T11:00:00.000Z',
  orgName: 'Test Org',
  trackedBids: [TRACKED_UNCHANGED],
  newMatches: [NEW_MATCH],
  sources: [HEALTHY_SOURCE],
};

describe('assembleDigest', () => {
  it('states full coverage explicitly when nothing changed (trust contract)', () => {
    // Act
    const digest = assembleDigest(BASE_INPUT);

    // Assert
    expect(digest.coverage).toBe(
      'No changes on your 1 tracked bids. All 1 sources polled successfully.',
    );
  });

  it('annotates the coverage statement when a source is degraded (invariant 3)', () => {
    // Arrange
    const degraded: SourceHealth = {
      ...HEALTHY_SOURCE,
      sourceId: 'bonfire-tempe',
      kind: 'sled-bonfire',
      label: 'Bonfire — City of Tempe, AZ',
      consecutiveFailures: 3,
      status: 'degraded',
    };

    // Act
    const digest = assembleDigest({ ...BASE_INPUT, sources: [HEALTHY_SOURCE, degraded] });

    // Assert
    expect(digest.coverage).toContain('Monitoring degraded on 1 of 2 sources');
    expect(digest.coverage).toContain('Bonfire — City of Tempe, AZ');
    expect(digest.coverage).toContain('may have unreported changes');
  });

  it('throws when a tracked-bid item lacks a valid deep link (invariant 4: no citation, no ship)', () => {
    // Arrange
    const uncited: TrackedBidItem = {
      ...TRACKED_UNCHANGED,
      citation: { url: 'not-a-url', label: 'TEST-26-R-0001' },
    };

    // Act + Assert
    expect(() => assembleDigest({ ...BASE_INPUT, trackedBids: [uncited] })).toThrow(
      DigestAssemblyError,
    );
  });

  it('throws when a new-match item carries an empty citation label', () => {
    // Arrange
    const uncited: NewMatchItem = {
      ...NEW_MATCH,
      citation: { url: 'https://sam.gov/opp/def/view', label: '  ' },
    };

    // Act + Assert
    expect(() => assembleDigest({ ...BASE_INPUT, newMatches: [uncited] })).toThrow(
      DigestAssemblyError,
    );
  });

  it('keeps the fixed section order: tracked bids, new matches, sources footer', () => {
    // Act
    const digest = assembleDigest(BASE_INPUT);

    // Assert
    expect(digest.trackedBids).toHaveLength(1);
    expect(digest.newMatches).toHaveLength(1);
    expect(digest.sources).toHaveLength(1);
    expect(digest.orgName).toBe('Test Org');
  });
});
