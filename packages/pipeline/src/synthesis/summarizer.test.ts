import { describe, expect, it } from 'vitest';
import { computeRedline, gateSummary } from '@tenderhook/core';
import { W912DY_26_R_0014_V1, W912DY_26_R_0014_V2 } from '../adapters/sam/fixtures/index';
import { createSummarizer, MockHunkSummarizer } from './summarizer';

describe('MockHunkSummarizer', () => {
  it('pins every claim to a span that string-verifies against the stored text', async () => {
    // Arrange
    const redline = computeRedline(W912DY_26_R_0014_V1, W912DY_26_R_0014_V2);
    const summarizer = new MockHunkSummarizer();

    // Act
    const summary = await summarizer.summarize({
      opportunityTitle: 'Enterprise IT Modernization and Cloud Migration Services',
      hunks: redline.hunks,
      priorVersionId: 'v1',
      currentVersionId: 'v2',
    });
    const gated = gateSummary(
      summary,
      new Map([
        ['v1', W912DY_26_R_0014_V1],
        ['v2', W912DY_26_R_0014_V2],
      ]),
    );

    // Assert — the deterministic mock must always pass its own citation gate.
    expect(summary.quotes.length).toBeGreaterThan(0);
    expect(gated.kind).toBe('summary');
  });

  it('summarizes only already-diffed hunks: empty hunks yield no quotes (invariant 1)', async () => {
    // Act
    const summary = await new MockHunkSummarizer().summarize({
      opportunityTitle: 'Anything',
      hunks: [],
      priorVersionId: 'v1',
      currentVersionId: 'v2',
    });

    // Assert — the summarizer never invents a change.
    expect(summary.quotes).toHaveLength(0);
  });
});

describe('createSummarizer (model integration stays behind the interface)', () => {
  it('returns the deterministic mock when no API key is configured', () => {
    // Act
    const selection = createSummarizer({});

    // Assert
    expect(selection.provider).toBe('mock');
    expect(selection.summarizer).toBeInstanceOf(MockHunkSummarizer);
  });

  it('still returns the deterministic mock in M1 even when a key is present', () => {
    // Act — no real key is ever required or used; M1 pins the mock.
    const selection = createSummarizer({ ANTHROPIC_API_KEY: 'test-placeholder' });

    // Assert
    expect(selection.provider).toBe('mock');
    expect(selection.summarizer).toBeInstanceOf(MockHunkSummarizer);
  });
});
