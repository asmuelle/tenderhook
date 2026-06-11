import { describe, expect, it } from 'vitest';
import { cosineSimilarity } from './similarity';
import { ModelRoutingError, routeModel } from './router';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors and 0 for orthogonal vectors', () => {
    // Arrange
    const a = [1, 0, 2];
    const orthogonalA = [1, 0, 0];
    const orthogonalB = [0, 1, 0];

    // Act & Assert
    expect(cosineSimilarity(a, a)).toBeCloseTo(1);
    expect(cosineSimilarity(orthogonalA, orthogonalB)).toBe(0);
  });

  it('returns 0 for a zero vector instead of dividing by zero', () => {
    // Act & Assert
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('throws on dimension mismatch', () => {
    // Act & Assert
    expect(() => cosineSimilarity([1], [1, 2])).toThrowError(/length mismatch/i);
  });
});

describe('routeModel (cost gates, invariant 8)', () => {
  it('routes change detection to deterministic code for every tier and path', () => {
    // Arrange
    const tiers = ['solo', 'team', 'capture'] as const;
    const paths = ['daily-batch', 'on-demand'] as const;

    // Act & Assert
    for (const tier of tiers) {
      for (const path of paths) {
        expect(routeModel('change-detection', { tier, path })).toBe('deterministic');
      }
    }
  });

  it('routes triage and synthesis tasks to embedding/cheap classes', () => {
    // Act & Assert
    expect(routeModel('candidate-retrieval', { tier: 'solo', path: 'daily-batch' })).toBe(
      'embedding',
    );
    expect(routeModel('match-scoring', { tier: 'solo', path: 'daily-batch' })).toBe('cheap');
    expect(routeModel('hunk-summary', { tier: 'team', path: 'daily-batch' })).toBe('cheap');
    expect(routeModel('digest-copy', { tier: 'capture', path: 'daily-batch' })).toBe('cheap');
  });

  it('never returns a frontier class in the daily batch path', () => {
    // Act & Assert
    expect(() => routeModel('capture-brief', { tier: 'capture', path: 'daily-batch' })).toThrow(
      ModelRoutingError,
    );
    expect(() =>
      routeModel('agency-dossier-synthesis', { tier: 'capture', path: 'daily-batch' }),
    ).toThrow(ModelRoutingError);
  });

  it('gates frontier tasks to the capture tier even on demand', () => {
    // Act & Assert
    expect(() => routeModel('capture-brief', { tier: 'solo', path: 'on-demand' })).toThrow(
      ModelRoutingError,
    );
    expect(() => routeModel('capture-brief', { tier: 'team', path: 'on-demand' })).toThrow(
      ModelRoutingError,
    );
    expect(routeModel('capture-brief', { tier: 'capture', path: 'on-demand' })).toBe('frontier');
  });
});
