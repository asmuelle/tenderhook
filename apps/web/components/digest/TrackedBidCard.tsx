import type { AmendmentRecord, TrackedBidItem } from '@tenderhook/pipeline';
import { formatDateLong } from '../../lib/format';
import { RedlineViewer } from '../redline/RedlineViewer';

interface TrackedBidCardProps {
  bid: TrackedBidItem;
  amendment: AmendmentRecord | undefined;
}

const STATE_LABEL = {
  changed: 'Amended',
  unchanged: 'No change',
  degraded: 'Monitoring degraded',
} as const;

export function TrackedBidCard({ bid, amendment }: TrackedBidCardProps) {
  return (
    <article className="bid" aria-label={`${bid.solicitationNumber}: ${STATE_LABEL[bid.state]}`}>
      <header className="bid-header">
        <span className="bid-number">
          <a href={bid.citation.url}>{bid.solicitationNumber}</a>
        </span>
        <h3 className="bid-title">{bid.title}</h3>
        <span className={`badge badge--${bid.state}`}>{STATE_LABEL[bid.state]}</span>
      </header>
      {bid.amendment !== null && amendment !== undefined ? (
        <div className="bid-body">
          <MaterialityChips bid={bid} />
          <SummaryOutcome bid={bid} />
          <RedlineViewer hunks={amendment.redline.hunks} />
        </div>
      ) : null}
    </article>
  );
}

function MaterialityChips({ bid }: { bid: TrackedBidItem }) {
  if (bid.amendment === null) return null;
  const { materiality } = bid.amendment;
  const chips: { label: string; tone: 'degraded' | 'changed' }[] = [];
  if (materiality.deadlineChanged && materiality.currentDeadline !== null) {
    chips.push({
      label: `Deadline ${materiality.deadlineChange} → ${formatDateLong(materiality.currentDeadline)}`,
      tone: 'degraded',
    });
  }
  if (materiality.scopeChanged) chips.push({ label: 'Scope changed', tone: 'changed' });
  if (materiality.qaAdded) chips.push({ label: 'Q&A published', tone: 'changed' });
  if (chips.length === 0) return null;
  return (
    <ul className="chips" aria-label="Materiality flags">
      {chips.map((chip) => (
        <li key={chip.label} className={`badge badge--${chip.tone}`}>
          {chip.label}
        </li>
      ))}
    </ul>
  );
}

function SummaryOutcome({ bid }: { bid: TrackedBidItem }) {
  if (bid.amendment === null) return null;
  const { outcome } = bid.amendment;
  if (outcome.kind === 'summary') {
    return (
      <blockquote className="summary">
        {outcome.summary.text}
        <span className="summary-verification">
          ✓ {outcome.summary.quotes.length} quoted span
          {outcome.summary.quotes.length === 1 ? '' : 's'} string-verified against stored text
        </span>
      </blockquote>
    );
  }
  return (
    <p className="summary summary--blocked">
      Summary withheld: {outcome.failures.length} quoted span
      {outcome.failures.length === 1 ? '' : 's'} failed verification. Raw red-line shown instead.
    </p>
  );
}
