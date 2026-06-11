import type { GatedSummary, MaterialityFlags, SourceHealth } from '@tenderhook/core';

/**
 * Morning digest assembly. Fixed section order (DESIGN.md "Surfaces"):
 * 1. tracked-bid changes (always first, even when empty — coverage
 *    statements are part of the trust contract),
 * 2. new matches, 3. monitoring health footer.
 *
 * PRODUCT INVARIANT 4: every item carries a deep-link citation —
 * no citation, no ship (assembly throws).
 * PRODUCT INVARIANT 3: degraded sources are stated explicitly; a digest
 * never implies coverage that did not happen.
 */

export interface DigestCitation {
  readonly url: string;
  readonly label: string;
}

export type TrackedBidState = 'changed' | 'unchanged' | 'degraded';

export interface HunkCounts {
  readonly added: number;
  readonly removed: number;
  readonly changed: number;
}

export interface AmendmentView {
  readonly priorVersionId: string;
  readonly currentVersionId: string;
  readonly materiality: MaterialityFlags;
  readonly hunkCounts: HunkCounts;
  readonly outcome: GatedSummary;
}

export interface TrackedBidItem {
  readonly opportunityId: string;
  readonly solicitationNumber: string;
  readonly title: string;
  readonly citation: DigestCitation;
  readonly state: TrackedBidState;
  readonly amendment: AmendmentView | null;
}

export interface NewMatchItem {
  readonly opportunityId: string;
  readonly solicitationNumber: string;
  readonly title: string;
  readonly score: number;
  readonly rationale: string;
  readonly responseDeadline: string | null;
  readonly citation: DigestCitation;
}

export interface DigestModel {
  readonly generatedAt: string;
  readonly orgName: string;
  readonly coverage: string;
  readonly trackedBids: readonly TrackedBidItem[];
  readonly newMatches: readonly NewMatchItem[];
  readonly sources: readonly SourceHealth[];
}

export interface DigestInput {
  readonly generatedAt: string;
  readonly orgName: string;
  readonly trackedBids: readonly TrackedBidItem[];
  readonly newMatches: readonly NewMatchItem[];
  readonly sources: readonly SourceHealth[];
}

export class DigestAssemblyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DigestAssemblyError';
  }
}

export function assembleDigest(input: DigestInput): DigestModel {
  for (const item of [...input.trackedBids, ...input.newMatches]) {
    assertCitation(item.citation, item.opportunityId);
  }
  return {
    generatedAt: input.generatedAt,
    orgName: input.orgName,
    coverage: buildCoverageStatement(input.trackedBids, input.sources),
    trackedBids: input.trackedBids,
    newMatches: input.newMatches,
    sources: input.sources,
  };
}

function assertCitation(citation: DigestCitation, opportunityId: string): void {
  if (!citation.url.startsWith('https://') || citation.label.trim().length === 0) {
    throw new DigestAssemblyError(
      `No citation, no ship (invariant 4): digest item ${opportunityId} lacks a valid deep link.`,
    );
  }
}

function buildCoverageStatement(
  trackedBids: readonly TrackedBidItem[],
  sources: readonly SourceHealth[],
): string {
  const changed = trackedBids.filter((bid) => bid.state === 'changed').length;
  const degraded = sources.filter((source) => source.status === 'degraded');
  const sentences: string[] = [];

  if (changed === 0) {
    sentences.push(`No changes on your ${trackedBids.length} tracked bids.`);
  } else {
    sentences.push(
      `${changed} change${changed === 1 ? '' : 's'} detected across your ${trackedBids.length} tracked bids.`,
    );
  }

  if (degraded.length === 0) {
    sentences.push(`All ${sources.length} sources polled successfully.`);
  } else {
    const labels = degraded.map((source) => source.label).join(', ');
    sentences.push(
      `Monitoring degraded on ${degraded.length} of ${sources.length} sources (${labels}): ` +
        'items on these sources may have unreported changes.',
    );
  }
  return sentences.join(' ');
}
