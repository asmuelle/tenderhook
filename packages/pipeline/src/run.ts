import {
  classifyMateriality,
  computeRedline,
  gateSummary,
  normalizeLineEndings,
  type CapabilityProfile,
  type Embedder,
  type HunkSummarizer,
  type MatchScorer,
  type MaterialityFlags,
  type GatedSummary,
  type Opportunity,
  type RedlineDiff,
  type SourceHealth,
} from '@tenderhook/core';
import { parseSamExtract, type IngestError } from './adapters/sam/extract-adapter';
import { recordPollFailure, recordPollSuccess } from './sources/health';
import { sha256Hex } from './version-store/hash';
import type { VersionStore } from './version-store/store';
import { triageOpportunities, type MatchResult } from './triage/triage';
import {
  assembleDigest,
  type DigestModel,
  type NewMatchItem,
  type TrackedBidItem,
} from './digest/assemble';

/**
 * The M1 vertical slice: ingest -> version store -> deterministic diff ->
 * triage -> synthesis -> digest. All I/O is injected; with fixture inputs
 * the run is fully deterministic and performs zero network egress.
 */

export type DocumentFetch =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: string };

export interface TrackedSolicitation {
  readonly opportunityId: string;
  readonly solicitationNumber: string;
  readonly title: string;
  readonly url: string;
  readonly sourceId: string;
  readonly fetches: readonly DocumentFetch[];
}

export interface SliceInput {
  readonly extract: unknown;
  readonly orgName: string;
  readonly profile: CapabilityProfile;
  readonly tracked: readonly TrackedSolicitation[];
  readonly sources: readonly SourceHealth[];
  readonly retrievalTopK: number;
}

export interface SliceDeps {
  readonly embedder: Embedder;
  readonly scorer: MatchScorer;
  readonly summarizer: HunkSummarizer;
  readonly store: VersionStore;
  readonly now: () => string;
}

export interface VersionRef {
  readonly versionId: string;
  readonly contentHash: string;
}

export interface AmendmentRecord {
  readonly opportunityId: string;
  readonly solicitationNumber: string;
  readonly priorVersion: VersionRef;
  readonly currentVersion: VersionRef;
  readonly redline: RedlineDiff;
  readonly materiality: MaterialityFlags;
  readonly outcome: GatedSummary;
}

export interface SliceResult {
  readonly opportunities: readonly Opportunity[];
  readonly ingestErrors: readonly IngestError[];
  readonly amendments: readonly AmendmentRecord[];
  readonly matches: readonly MatchResult[];
  readonly sources: readonly SourceHealth[];
  readonly digest: DigestModel;
}

const EXTRACTOR_TOOL = 'fixture-text';
const EXTRACTOR_VERSION = '1.0.0';
const SAM_EXTRACT_SOURCE_ID = 'sam-extract';

export async function runDailySlice(input: SliceInput, deps: SliceDeps): Promise<SliceResult> {
  const { opportunities, errors } = parseSamExtract(input.extract);
  let sources = markSamExtractSuccess(input.sources, deps.now());

  const trackedBids: TrackedBidItem[] = [];
  const amendments: AmendmentRecord[] = [];
  for (const item of input.tracked) {
    const processed = await processTrackedItem(item, sources, deps);
    sources = processed.sources;
    trackedBids.push(processed.bidItem);
    if (processed.amendment !== null) amendments.push(processed.amendment);
  }

  const { matches } = await triageOpportunities(
    input.profile,
    opportunities,
    deps.embedder,
    deps.scorer,
    { retrievalTopK: input.retrievalTopK },
  );
  const newMatches = matches.map(toNewMatchItem);

  const digest = assembleDigest({
    generatedAt: deps.now(),
    orgName: input.orgName,
    trackedBids,
    newMatches,
    sources,
  });

  return { opportunities, ingestErrors: errors, amendments, matches, sources, digest };
}

interface ProcessedTrackedItem {
  readonly bidItem: TrackedBidItem;
  readonly amendment: AmendmentRecord | null;
  readonly sources: readonly SourceHealth[];
}

async function processTrackedItem(
  item: TrackedSolicitation,
  sources: readonly SourceHealth[],
  deps: SliceDeps,
): Promise<ProcessedTrackedItem> {
  let nextSources = sources;
  for (const fetch of item.fetches) {
    if (!fetch.ok) {
      nextSources = updateSource(nextSources, item.sourceId, recordPollFailure);
      continue;
    }
    nextSources = updateSource(nextSources, item.sourceId, (source) =>
      recordPollSuccess(source, deps.now()),
    );
    storeIfChanged(item.opportunityId, fetch.text, deps);
  }

  const amendment = await diffLatestVersions(item, deps);
  const sourceHealth = nextSources.find((source) => source.sourceId === item.sourceId);
  const state =
    amendment !== null ? 'changed' : sourceHealth?.status === 'degraded' ? 'degraded' : 'unchanged';

  return {
    bidItem: {
      opportunityId: item.opportunityId,
      solicitationNumber: item.solicitationNumber,
      title: item.title,
      citation: { url: item.url, label: item.solicitationNumber },
      state,
      amendment:
        amendment === null
          ? null
          : {
              priorVersionId: amendment.priorVersion.versionId,
              currentVersionId: amendment.currentVersion.versionId,
              materiality: amendment.materiality,
              hunkCounts: countHunks(amendment.redline),
              outcome: amendment.outcome,
            },
    },
    amendment,
    sources: nextSources,
  };
}

function storeIfChanged(opportunityId: string, rawText: string, deps: SliceDeps): void {
  const text = normalizeLineEndings(rawText);
  const latest = deps.store.latest(opportunityId);
  if (latest !== undefined && latest.contentHash === sha256Hex(text)) return;
  deps.store.append({
    opportunityId,
    extractedText: text,
    fetchedAt: deps.now(),
    extractorTool: EXTRACTOR_TOOL,
    extractorVersion: EXTRACTOR_VERSION,
  });
}

async function diffLatestVersions(
  item: TrackedSolicitation,
  deps: SliceDeps,
): Promise<AmendmentRecord | null> {
  const versions = deps.store.versions(item.opportunityId);
  if (versions.length < 2) return null;
  const prior = versions[versions.length - 2]!;
  const current = versions[versions.length - 1]!;

  const redline = computeRedline(prior.extractedText, current.extractedText);
  if (redline.identical) return null;

  const materiality = classifyMateriality(redline.hunks);
  const summary = await deps.summarizer.summarize({
    opportunityTitle: item.title,
    hunks: redline.hunks,
    priorVersionId: prior.versionId,
    currentVersionId: current.versionId,
  });
  const outcome = gateSummary(
    summary,
    new Map([
      [prior.versionId, prior.extractedText],
      [current.versionId, current.extractedText],
    ]),
  );

  return {
    opportunityId: item.opportunityId,
    solicitationNumber: item.solicitationNumber,
    priorVersion: { versionId: prior.versionId, contentHash: prior.contentHash },
    currentVersion: { versionId: current.versionId, contentHash: current.contentHash },
    redline,
    materiality,
    outcome,
  };
}

function markSamExtractSuccess(
  sources: readonly SourceHealth[],
  at: string,
): readonly SourceHealth[] {
  return updateSource(sources, SAM_EXTRACT_SOURCE_ID, (source) => recordPollSuccess(source, at));
}

function updateSource(
  sources: readonly SourceHealth[],
  sourceId: string,
  transition: (source: SourceHealth) => SourceHealth,
): readonly SourceHealth[] {
  return sources.map((source) => (source.sourceId === sourceId ? transition(source) : source));
}

function countHunks(redline: RedlineDiff): { added: number; removed: number; changed: number } {
  return {
    added: redline.hunks.filter((hunk) => hunk.kind === 'added').length,
    removed: redline.hunks.filter((hunk) => hunk.kind === 'removed').length,
    changed: redline.hunks.filter((hunk) => hunk.kind === 'changed').length,
  };
}

function toNewMatchItem(match: MatchResult): NewMatchItem {
  return {
    opportunityId: match.opportunity.id,
    solicitationNumber: match.opportunity.solicitationNumber,
    title: match.opportunity.title,
    score: match.score,
    rationale: match.rationale,
    responseDeadline: match.opportunity.responseDeadline,
    citation: { url: match.opportunity.url, label: match.opportunity.solicitationNumber },
  };
}
