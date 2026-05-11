import type { RunHistoryStatusFilter } from "@/features/run-history/types";

type Props = { status: RunHistoryStatusFilter; q: string };

const OPTIONS: RunHistoryStatusFilter[] = ["all", "queued", "processing", "completed", "failed"];

export function RunHistoryFilters({ status, q }: Props) {
  return (
    <form className="saved-run-filters" method="get">
      <input name="q" defaultValue={q} maxLength={100} placeholder="Search research topic" data-testid="run-history-search" aria-label="Search research topic" />
      <select name="status" defaultValue={status} data-testid="run-history-status-filter" aria-label="Filter by status">
        {OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <button type="submit" className="saved-run-link">Apply</button>
    </form>
  );
}
