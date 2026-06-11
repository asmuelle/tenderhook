import {
  cosineSimilarity,
  type CapabilityProfile,
  type Embedder,
  type MatchScorer,
  type Opportunity,
} from '@tenderhook/core';

/**
 * Embeddings-first triage — PRODUCT INVARIANT 8: the embedding filter is
 * the cost gate. The (cheap-model) scorer runs only on the top-K retrieved
 * candidates, never on the full corpus.
 */

export interface TriageOptions {
  readonly retrievalTopK: number;
}

export interface RankedCandidate {
  readonly opportunity: Opportunity;
  readonly similarity: number;
}

export interface MatchResult {
  readonly opportunity: Opportunity;
  readonly similarity: number;
  readonly score: number;
  readonly rationale: string;
}

export interface TriageResult {
  readonly retrieved: readonly RankedCandidate[];
  readonly matches: readonly MatchResult[];
}

export async function triageOpportunities(
  profile: CapabilityProfile,
  opportunities: readonly Opportunity[],
  embedder: Embedder,
  scorer: MatchScorer,
  options: TriageOptions,
): Promise<TriageResult> {
  if (opportunities.length === 0) {
    return { retrieved: [], matches: [] };
  }

  const texts = [
    profileText(profile),
    ...opportunities.map((opportunity) => opportunityText(opportunity)),
  ];
  const vectors = await embedder.embed(texts);
  const profileVector = vectors[0];
  if (profileVector === undefined) {
    throw new Error('Embedder returned no vector for the capability profile.');
  }

  const ranked = opportunities
    .map((opportunity, index) => {
      const vector = vectors[index + 1];
      if (vector === undefined) {
        throw new Error(`Embedder returned no vector for opportunity ${opportunity.id}.`);
      }
      return { opportunity, similarity: cosineSimilarity(profileVector, vector) };
    })
    .sort(
      (a, b) => b.similarity - a.similarity || a.opportunity.id.localeCompare(b.opportunity.id),
    );

  const retrieved = ranked.slice(0, options.retrievalTopK);

  const matches: MatchResult[] = [];
  for (const candidate of retrieved) {
    const result = await scorer.score({
      profile,
      opportunity: candidate.opportunity,
      similarity: candidate.similarity,
    });
    matches.push({ ...candidate, ...result });
  }
  matches.sort((a, b) => b.score - a.score || a.opportunity.id.localeCompare(b.opportunity.id));

  return { retrieved, matches };
}

function profileText(profile: CapabilityProfile): string {
  return `${profile.description} NAICS ${profile.naicsCodes.join(' ')}`;
}

function opportunityText(opportunity: Opportunity): string {
  return `${opportunity.title} ${opportunity.description} NAICS ${opportunity.naicsCode}`;
}
