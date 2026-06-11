import { describe, expect, it } from 'vitest';
import type { MatchScorer, MatchScoreInput, MatchScoreResult } from '@tenderhook/core';
import { parseSamExtract } from '../adapters/sam/extract-adapter';
import { SAM_EXTRACT_2026_06_09 } from '../adapters/sam/fixtures/index';
import { DEMO_PROFILE } from '../demo';
import { DeterministicEmbedder } from './embedder';
import { MockMatchScorer } from './scorer';
import { triageOpportunities } from './triage';

class CountingScorer implements MatchScorer {
  calls = 0;
  private readonly inner = new MockMatchScorer();

  score(input: MatchScoreInput): Promise<MatchScoreResult> {
    this.calls += 1;
    return this.inner.score(input);
  }
}

describe('triageOpportunities (embeddings-first, invariant 8)', () => {
  const { opportunities } = parseSamExtract(SAM_EXTRACT_2026_06_09);

  it('invokes the (cheap-model) scorer only on the top-K retrieved candidates', async () => {
    // Arrange
    const scorer = new CountingScorer();

    // Act
    const result = await triageOpportunities(
      DEMO_PROFILE,
      opportunities,
      new DeterministicEmbedder(),
      scorer,
      { retrievalTopK: 3 },
    );

    // Assert — 6 opportunities in the corpus, but only K=3 scorer calls.
    expect(opportunities.length).toBeGreaterThan(3);
    expect(scorer.calls).toBe(3);
    expect(result.retrieved).toHaveLength(3);
    expect(result.matches).toHaveLength(3);
  });

  it('retrieves the cloud/IT opportunities for a cloud-migration profile, not janitorial work', async () => {
    // Act
    const result = await triageOpportunities(
      DEMO_PROFILE,
      opportunities,
      new DeterministicEmbedder(),
      new MockMatchScorer(),
      { retrievalTopK: 3 },
    );

    // Assert
    const retrievedNumbers = result.retrieved.map(
      (candidate) => candidate.opportunity.solicitationNumber,
    );
    expect(retrievedNumbers).toContain('W912DY-26-R-0014');
    expect(retrievedNumbers).toContain('36C10B-26-Q-0188');
    expect(retrievedNumbers).not.toContain('47QSMD-26-Q-5201');
    expect(retrievedNumbers).not.toContain('W912PL-26-B-0042');
  });

  it('is deterministic: two runs produce identical rankings and rationales', async () => {
    // Act
    const run = () =>
      triageOpportunities(
        DEMO_PROFILE,
        opportunities,
        new DeterministicEmbedder(),
        new MockMatchScorer(),
        {
          retrievalTopK: 3,
        },
      );
    const [first, second] = await Promise.all([run(), run()]);

    // Assert
    expect(first).toEqual(second);
  });

  it('returns empty results for an empty corpus without calling the scorer', async () => {
    // Arrange
    const scorer = new CountingScorer();

    // Act
    const result = await triageOpportunities(
      DEMO_PROFILE,
      [],
      new DeterministicEmbedder(),
      scorer,
      {
        retrievalTopK: 3,
      },
    );

    // Assert
    expect(result.retrieved).toHaveLength(0);
    expect(result.matches).toHaveLength(0);
    expect(scorer.calls).toBe(0);
  });
});
