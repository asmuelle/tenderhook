export {
  parseSamExtract,
  SamExtractParseError,
  type IngestError,
  type SamIngestResult,
} from './adapters/sam/extract-adapter';

export {
  InMemoryVersionStore,
  type VersionStore,
  type DocumentVersionRecord,
  type AppendVersionInput,
} from './version-store/store';
export { sha256Hex } from './version-store/hash';

export { DEGRADED_FAILURE_THRESHOLD, recordPollFailure, recordPollSuccess } from './sources/health';

export { DeterministicEmbedder, tokenizeForMatching } from './triage/embedder';
export { MockMatchScorer } from './triage/scorer';
export {
  triageOpportunities,
  type TriageOptions,
  type TriageResult,
  type RankedCandidate,
  type MatchResult,
} from './triage/triage';

export {
  MockHunkSummarizer,
  createSummarizer,
  type SummarizerSelection,
  type SummarizerProvider,
} from './synthesis/summarizer';

export {
  assembleDigest,
  DigestAssemblyError,
  type DigestModel,
  type DigestInput,
  type DigestCitation,
  type TrackedBidItem,
  type TrackedBidState,
  type NewMatchItem,
  type AmendmentView,
  type HunkCounts,
} from './digest/assemble';

export {
  runDailySlice,
  type SliceInput,
  type SliceDeps,
  type SliceResult,
  type AmendmentRecord,
  type TrackedSolicitation,
  type DocumentFetch,
  type VersionRef,
} from './run';

export { runDemoSlice, DEMO_NOW, DEMO_ORG_NAME, DEMO_PROFILE } from './demo';
