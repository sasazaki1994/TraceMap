import { RunHistoryCard } from "@/features/run-history/components/run-history-card";
import { RunHistoryEmptyState } from "@/features/run-history/components/run-history-empty-state";
import { RunHistoryFilters } from "@/features/run-history/components/run-history-filters";
import type { RunHistoryItem, RunHistoryStatusFilter } from "@/features/run-history/types";

export function RunHistoryView({ items, status, q }: { items: RunHistoryItem[]; status: RunHistoryStatusFilter; q: string }) {
  return <>
    <h1 data-testid="run-history-heading" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>Saved Investigations</h1>
    <p className="lead">Review previous investigation missions, inspect their evidence maps, and reuse briefing reports.</p>
    <RunHistoryFilters status={status} q={q} />
    {items.length === 0 ? <RunHistoryEmptyState /> : <ul data-testid="run-history-list" className="saved-run-list">{items.map((item) => <RunHistoryCard key={item.id} item={item} />)}</ul>}
  </>;
}
