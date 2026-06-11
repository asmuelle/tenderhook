import { describe, expect, it } from 'vitest';
import type { SourceHealth } from '@tenderhook/core';
import { DEGRADED_FAILURE_THRESHOLD, recordPollFailure, recordPollSuccess } from './health';

const HEALTHY: SourceHealth = {
  sourceId: 'sam-poller',
  kind: 'sam',
  label: 'SAM.gov tracked-notice poller',
  consecutiveFailures: 0,
  lastSuccessAt: null,
  status: 'healthy',
};

describe('source health transitions (invariant 3: silence is never "no changes")', () => {
  it('flips to degraded exactly at the failure threshold', () => {
    // Act
    let source = HEALTHY;
    for (let i = 0; i < DEGRADED_FAILURE_THRESHOLD - 1; i += 1) {
      source = recordPollFailure(source);
      expect(source.status).toBe('healthy');
    }
    source = recordPollFailure(source);

    // Assert
    expect(source.status).toBe('degraded');
    expect(source.consecutiveFailures).toBe(DEGRADED_FAILURE_THRESHOLD);
  });

  it('resets failures and restores healthy status on a successful poll', () => {
    // Arrange
    const degraded: SourceHealth = {
      ...HEALTHY,
      consecutiveFailures: 5,
      status: 'degraded',
    };

    // Act
    const recovered = recordPollSuccess(degraded, '2026-06-10T11:00:00.000Z');

    // Assert
    expect(recovered.status).toBe('healthy');
    expect(recovered.consecutiveFailures).toBe(0);
    expect(recovered.lastSuccessAt).toBe('2026-06-10T11:00:00.000Z');
  });

  it('returns new objects and never mutates the input state', () => {
    // Act
    const afterFailure = recordPollFailure(HEALTHY);
    const afterSuccess = recordPollSuccess(HEALTHY, '2026-06-10T11:00:00.000Z');

    // Assert
    expect(afterFailure).not.toBe(HEALTHY);
    expect(afterSuccess).not.toBe(HEALTHY);
    expect(HEALTHY.consecutiveFailures).toBe(0);
    expect(HEALTHY.lastSuccessAt).toBeNull();
  });
});
