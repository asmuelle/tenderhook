import type { SourceHealth } from '@tenderhook/core';
import { formatStampUtc } from '../../lib/format';

interface SourcesFooterProps {
  sources: readonly SourceHealth[];
}

export function SourcesFooter({ sources }: SourcesFooterProps) {
  return (
    <ul className="sources">
      {sources.map((source) => (
        <li key={source.sourceId}>
          <span className="source-label">{source.label}</span>
          <span className="source-meta">
            {source.lastSuccessAt === null
              ? 'no successful poll this run'
              : `last success ${formatStampUtc(source.lastSuccessAt)}`}
            {source.consecutiveFailures > 0
              ? ` · ${source.consecutiveFailures} consecutive failures`
              : ''}
          </span>
          <span
            className={`badge badge--${source.status === 'degraded' ? 'degraded' : 'unchanged'}`}
          >
            {source.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
