import type { SourceHealth } from '@tenderhook/core';

/**
 * Source health transitions — PRODUCT INVARIANT 3: silence is never
 * "no changes". After the failure threshold, a source is degraded and
 * every surface must say so. Transitions return new objects (immutable).
 */

export const DEGRADED_FAILURE_THRESHOLD = 3;

export function recordPollSuccess(source: SourceHealth, at: string): SourceHealth {
  return { ...source, consecutiveFailures: 0, lastSuccessAt: at, status: 'healthy' };
}

export function recordPollFailure(source: SourceHealth): SourceHealth {
  const consecutiveFailures = source.consecutiveFailures + 1;
  return {
    ...source,
    consecutiveFailures,
    status: consecutiveFailures >= DEGRADED_FAILURE_THRESHOLD ? 'degraded' : source.status,
  };
}
