export type {
  SourceKind,
  OpportunityType,
  Opportunity,
  PlanTier,
  CapabilityProfile,
  SourceStatus,
  SourceHealth,
} from './types';

export { lcsDiff, type DiffOp } from './diff/lcs';
export { groupHunks, type Hunk, type HunkKind, type LineRange } from './diff/hunks';
export { computeRedline, normalizeLineEndings, type RedlineDiff } from './diff/redline';
export { diffWords, type WordSegment, type WordSegmentKind } from './diff/word-diff';

export { extractDeadline, type ParsedDeadline } from './deadlines/parse';
export { classifyDeadlineChange, type DeadlineChangeKind } from './deadlines/classify';

export { classifyMateriality, type MaterialityFlags } from './materiality/classify';

export {
  verifyQuotedSpans,
  gateSummary,
  type QuotedSpan,
  type HunkSummary,
  type CitationCheck,
  type CitationFailure,
  type CitationFailureReason,
  type GatedSummary,
} from './citations/verifier';

export { cosineSimilarity } from './matching/similarity';
export type {
  Embedder,
  MatchScorer,
  MatchScoreInput,
  MatchScoreResult,
  HunkSummarizer,
  SummarizeInput,
} from './matching/contracts';
export {
  routeModel,
  ModelRoutingError,
  type ModelClass,
  type PipelinePath,
  type RoutedTask,
  type RouteContext,
} from './matching/router';
