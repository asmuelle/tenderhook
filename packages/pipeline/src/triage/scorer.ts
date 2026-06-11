import type { MatchScorer, MatchScoreInput, MatchScoreResult } from '@tenderhook/core';
import { tokenizeForMatching } from './embedder';

/**
 * Deterministic mock of the cheap-model match scorer (Haiku/Flash-class in
 * production, see DESIGN.md cost table). Produces a stable score and a
 * one-line rationale from real capability/solicitation term overlap.
 */
export class MockMatchScorer implements MatchScorer {
  score(input: MatchScoreInput): Promise<MatchScoreResult> {
    const profileTokens = new Set(tokenizeForMatching(input.profile.description));
    const opportunityTokens = new Set(
      tokenizeForMatching(`${input.opportunity.title} ${input.opportunity.description}`),
    );
    const overlap = [...profileTokens].filter((token) => opportunityTokens.has(token)).sort();
    const naicsAligned = input.profile.naicsCodes.includes(input.opportunity.naicsCode);

    const score = clampScore(
      Math.round(
        input.similarity * 60 + Math.min(overlap.length, 10) * 3 + (naicsAligned ? 15 : 0),
      ),
    );
    const overlapText = overlap.length > 0 ? overlap.slice(0, 4).join(', ') : 'no shared terms';
    const rationale =
      `Capability overlap on ${overlapText}` +
      (naicsAligned ? `; NAICS ${input.opportunity.naicsCode} is in your profile.` : '.');

    return Promise.resolve({ score, rationale });
  }
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}
