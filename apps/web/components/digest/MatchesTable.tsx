import type { NewMatchItem } from '@tenderhook/pipeline';
import { formatDeadline } from '../../lib/format';

interface MatchesTableProps {
  matches: readonly NewMatchItem[];
}

export function MatchesTable({ matches }: MatchesTableProps) {
  if (matches.length === 0) {
    return <p className="coverage">No new matches against your capability profile today.</p>;
  }
  return (
    <table className="matches-table">
      <caption>
        Embeddings-first retrieval, then cheap-model scoring — every row deep-links to its source
        notice.
      </caption>
      <thead>
        <tr>
          <th scope="col">Solicitation</th>
          <th scope="col">Title</th>
          <th scope="col">Score</th>
          <th scope="col">Why it matters</th>
          <th scope="col">Due</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((match) => (
          <tr key={match.opportunityId}>
            <td className="mono">
              <a href={match.citation.url}>{match.solicitationNumber}</a>
            </td>
            <td className="match-title">{match.title}</td>
            <td className="match-score">{match.score}</td>
            <td>{match.rationale}</td>
            <td className="mono">{formatDeadline(match.responseDeadline)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
