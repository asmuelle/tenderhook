import type { CapabilityProfile, Opportunity } from '../types';
import type { Hunk } from '../diff/hunks';
import type { HunkSummary } from '../citations/verifier';

/**
 * Model-facing contracts. Every AI integration sits behind one of these
 * interfaces; the M1 pipeline ships only deterministic mock implementations
 * (packages/pipeline) — it builds and tests without any AI API call.
 */

export interface Embedder {
  readonly dimensions: number;
  embed(texts: readonly string[]): Promise<readonly (readonly number[])[]>;
}

export interface MatchScoreInput {
  readonly profile: CapabilityProfile;
  readonly opportunity: Opportunity;
  readonly similarity: number;
}

export interface MatchScoreResult {
  readonly score: number;
  readonly rationale: string;
}

export interface MatchScorer {
  score(input: MatchScoreInput): Promise<MatchScoreResult>;
}

export interface SummarizeInput {
  readonly opportunityTitle: string;
  readonly hunks: readonly Hunk[];
  readonly priorVersionId: string;
  readonly currentVersionId: string;
}

export interface HunkSummarizer {
  summarize(input: SummarizeInput): Promise<HunkSummary>;
}
