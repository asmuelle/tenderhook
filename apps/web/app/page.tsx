import { runDemoSlice, DEMO_PROFILE } from '@tenderhook/pipeline';
import { MatchesTable } from '../components/digest/MatchesTable';
import { SourcesFooter } from '../components/digest/SourcesFooter';
import { TrackedBidCard } from '../components/digest/TrackedBidCard';
import { formatStampUtc } from '../lib/format';

/**
 * Read-only render of the M1 vertical slice: the morning digest as the
 * BD lead would read it. Fixed section order (DESIGN.md "Surfaces") —
 * tracked-bid changes first, always, even when empty.
 */
export default async function DigestPreviewPage() {
  const slice = await runDemoSlice();
  const { digest } = slice;
  const amendmentsById = new Map(
    slice.amendments.map((amendment) => [amendment.opportunityId, amendment]),
  );
  const hasDegraded = digest.sources.some((source) => source.status === 'degraded');

  return (
    <>
      <header className="masthead">
        <span className="masthead-wordmark">Tenderhook</span>
        <span className="masthead-meta">
          {digest.orgName} · generated {formatStampUtc(digest.generatedAt)} · fixture corpus,
          deterministic run
        </span>
      </header>

      <main className="page">
        <section aria-labelledby="digest-heading">
          <h1 className="digest-title" id="digest-heading">
            Morning digest
          </h1>
          <p className="digest-lede">
            Profile “{DEMO_PROFILE.name}” — NAICS {DEMO_PROFILE.naicsCodes.join(', ')}. Every claim
            below deep-links to its source document; every quoted span is string-verified against
            stored extracted text before it ships.
          </p>
        </section>

        <section className="digest-section" aria-labelledby="tracked-heading">
          <div className="section-kicker">
            <span className="section-number">§ 1</span>
            <h2 className="section-heading" id="tracked-heading">
              Deadline &amp; amendment changes on tracked bids
            </h2>
          </div>
          <p className={`coverage${hasDegraded ? ' coverage--degraded' : ''}`}>{digest.coverage}</p>
          {digest.trackedBids.map((bid) => (
            <TrackedBidCard
              key={bid.opportunityId}
              bid={bid}
              amendment={amendmentsById.get(bid.opportunityId)}
            />
          ))}
        </section>

        <section className="digest-section" aria-labelledby="matches-heading">
          <div className="section-kicker">
            <span className="section-number">§ 2</span>
            <h2 className="section-heading" id="matches-heading">
              New matches
            </h2>
          </div>
          <MatchesTable matches={digest.newMatches} />
        </section>

        <section className="digest-section" aria-labelledby="sources-heading">
          <div className="section-kicker">
            <span className="section-number">§ 3</span>
            <h2 className="section-heading" id="sources-heading">
              Monitoring health
            </h2>
          </div>
          <SourcesFooter sources={digest.sources} />
        </section>
      </main>

      <footer className="colophon">
        Change detection is deterministic — content hash + structural diff; no model decides whether
        anything changed. Silence is never reported as “no changes.”
      </footer>
    </>
  );
}
