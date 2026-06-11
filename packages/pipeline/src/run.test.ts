import { describe, expect, it } from 'vitest';
import type { HunkSummarizer, HunkSummary, SummarizeInput } from '@tenderhook/core';
import {
  SAM_EXTRACT_2026_06_09,
  W912DY_26_R_0014_V1 as FIXTURE_V1,
  W912DY_26_R_0014_V2 as FIXTURE_V2,
} from './adapters/sam/fixtures/index';
import { DEMO_NOW, DEMO_PROFILE, runDemoSlice } from './demo';
import { createSummarizer } from './synthesis/summarizer';
import { DeterministicEmbedder } from './triage/embedder';
import { MockMatchScorer } from './triage/scorer';
import { InMemoryVersionStore } from './version-store/store';
import { runDailySlice, type SliceInput, type SliceResult } from './run';

/** A summarizer that fabricates quotes — simulating a hallucinating model. */
class HallucinatingSummarizer implements HunkSummarizer {
  summarize(input: SummarizeInput): Promise<HunkSummary> {
    return Promise.resolve({
      text: 'The deadline moved to August 1, 2026 and the contract doubled in value.',
      quotes: [
        { quote: 'deadline moved to August 1, 2026', documentVersionId: input.currentVersionId },
      ],
    });
  }
}

function runSliceWith(summarizer: HunkSummarizer): Promise<SliceResult> {
  const input: SliceInput = {
    extract: SAM_EXTRACT_2026_06_09,
    orgName: 'Test Org',
    profile: DEMO_PROFILE,
    tracked: [
      {
        opportunityId: 'sam:1f64e7a2c8b94d0e9a317c5d2f80a416',
        solicitationNumber: 'W912DY-26-R-0014',
        title: 'Enterprise IT Modernization and Cloud Migration Services',
        url: 'https://sam.gov/opp/1f64e7a2c8b94d0e9a317c5d2f80a416/view',
        sourceId: 'sam-poller',
        fetches: demoFetches(),
      },
    ],
    sources: [
      {
        sourceId: 'sam-extract',
        kind: 'sam',
        label: 'SAM.gov daily extract',
        consecutiveFailures: 0,
        lastSuccessAt: null,
        status: 'healthy',
      },
      {
        sourceId: 'sam-poller',
        kind: 'sam',
        label: 'SAM.gov tracked-notice poller',
        consecutiveFailures: 0,
        lastSuccessAt: null,
        status: 'healthy',
      },
    ],
    retrievalTopK: 3,
  };
  return runDailySlice(input, {
    embedder: new DeterministicEmbedder(),
    scorer: new MockMatchScorer(),
    summarizer,
    store: new InMemoryVersionStore(),
    now: () => DEMO_NOW,
  });
}

function demoFetches() {
  return [
    { ok: true as const, text: FIXTURE_V1 },
    { ok: true as const, text: FIXTURE_V2 },
  ];
}

describe('runDailySlice (the M1 vertical slice, fixtures only, zero egress)', () => {
  it('produces the full demo digest: amendment, matches, degraded source', async () => {
    // Act
    const result = await runDemoSlice();

    // Assert — ingest
    expect(result.opportunities).toHaveLength(6);
    expect(result.ingestErrors).toHaveLength(0);

    // Assert — exactly one amendment detected (W912DY v1 -> v2)
    expect(result.amendments).toHaveLength(1);
    const amendment = result.amendments[0]!;
    expect(amendment.solicitationNumber).toBe('W912DY-26-R-0014');
    expect(amendment.materiality.deadlineChange).toBe('extended');
    expect(amendment.materiality.scopeChanged).toBe(true);
    expect(amendment.materiality.qaAdded).toBe(true);

    // Assert — the verified summary shipped (mock pins exact spans)
    expect(amendment.outcome.kind).toBe('summary');

    // Assert — invariant 3: bonfire poll failures degrade the source and the digest says so
    const bonfire = result.sources.find((source) => source.sourceId === 'bonfire-tempe');
    expect(bonfire?.status).toBe('degraded');
    expect(result.digest.coverage).toContain('Monitoring degraded');
    const tempe = result.digest.trackedBids.find(
      (bid) => bid.opportunityId === 'bonfire:tempe-rfp-26-114',
    );
    expect(tempe?.state).toBe('degraded');

    // Assert — invariant 4: every digest item carries a deep link
    for (const item of [...result.digest.trackedBids, ...result.digest.newMatches]) {
      expect(item.citation.url).toMatch(/^https:\/\//);
    }
  });

  it('is deterministic end to end: two demo runs produce identical results', async () => {
    // Act
    const [first, second] = await Promise.all([runDemoSlice(), runDemoSlice()]);

    // Assert
    expect(first).toEqual(second);
  });

  it('invariant 1: the change set is identical regardless of what the model says', async () => {
    // Act — same inputs, honest mock vs hallucinating summarizer.
    const honest = await runSliceWith(createSummarizer({}).summarizer);
    const hallucinated = await runSliceWith(new HallucinatingSummarizer());

    // Assert — detection, hunks, materiality, and version hashes are identical:
    // an LLM output can never create, suppress, or reclassify a change event.
    expect(hallucinated.amendments).toHaveLength(honest.amendments.length);
    const honestAmendment = honest.amendments[0]!;
    const hallucinatedAmendment = hallucinated.amendments[0]!;
    expect(hallucinatedAmendment.redline).toEqual(honestAmendment.redline);
    expect(hallucinatedAmendment.materiality).toEqual(honestAmendment.materiality);
    expect(hallucinatedAmendment.priorVersion).toEqual(honestAmendment.priorVersion);
    expect(hallucinatedAmendment.currentVersion).toEqual(honestAmendment.currentVersion);
  });

  it('invariant 2: a fabricated quote blocks the summary and ships the raw red-line', async () => {
    // Act
    const result = await runSliceWith(new HallucinatingSummarizer());

    // Assert
    const outcome = result.amendments[0]!.outcome;
    expect(outcome.kind).toBe('raw-redline');
    if (outcome.kind === 'raw-redline') {
      expect(outcome.failures[0]?.reason).toBe('quote-not-found');
    }
  });

  it('stores both fetched versions append-only with distinct content hashes', async () => {
    // Arrange
    const store = new InMemoryVersionStore();

    // Act
    await runDailySlice(
      {
        extract: SAM_EXTRACT_2026_06_09,
        orgName: 'Test Org',
        profile: DEMO_PROFILE,
        tracked: [
          {
            opportunityId: 'sam:1f64e7a2c8b94d0e9a317c5d2f80a416',
            solicitationNumber: 'W912DY-26-R-0014',
            title: 'Enterprise IT Modernization and Cloud Migration Services',
            url: 'https://sam.gov/opp/1f64e7a2c8b94d0e9a317c5d2f80a416/view',
            sourceId: 'sam-poller',
            fetches: [
              { ok: true, text: FIXTURE_V1 },
              { ok: true, text: FIXTURE_V1 }, // unchanged refetch — must NOT create a version
              { ok: true, text: FIXTURE_V2 },
            ],
          },
        ],
        sources: [],
        retrievalTopK: 1,
      },
      {
        embedder: new DeterministicEmbedder(),
        scorer: new MockMatchScorer(),
        summarizer: new HallucinatingSummarizer(),
        store,
        now: () => DEMO_NOW,
      },
    );

    // Assert — identical refetch deduplicated by content hash (invariant 7 + 1).
    const versions = store.versions('sam:1f64e7a2c8b94d0e9a317c5d2f80a416');
    expect(versions).toHaveLength(2);
    expect(versions[0]?.contentHash).not.toBe(versions[1]?.contentHash);
  });
});
