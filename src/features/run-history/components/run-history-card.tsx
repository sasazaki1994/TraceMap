import Link from "next/link";

import type { RunHistoryItem } from "@/features/run-history/types";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

function formatDate(value: string): string { return DATE_FORMATTER.format(new Date(value)); }

export function RunHistoryCard({ item }: { item: RunHistoryItem }) {
  return <li data-testid="run-history-item" className="saved-run-item">
    <div className="eyebrow">MISSION ARCHIVE</div>
    <div className="saved-run-item-top">
      <h2 data-testid="run-history-item-topic" className="saved-run-topic">{item.researchTopic}</h2>
      <span data-testid="run-history-item-status" className={`saved-run-status saved-run-status--${item.status}`}>{item.status.toUpperCase()}</span>
    </div>
    <p className="muted saved-run-time">Created: {formatDate(item.createdAt)} · Updated: {formatDate(item.updatedAt)}</p>
    <p className="saved-run-answer-title">Latest answer: {item.answerTitle?.trim() || "(No answer title)"}</p>
    <div className="saved-run-meta"><span>Sources: {item.sourceCount}</span><span>Claims: {item.claimCount}</span><span>Alerts: {item.alertCount}</span><span>Share links: {item.shareLinkCount}</span></div>
    {item.status === "failed" && item.lastErrorMessage ? <p data-testid="run-history-error-message" className="saved-run-error">{item.lastErrorMessage}</p> : null}
    <Link href={`/runs/${item.id}`} data-testid="run-history-item-open" className="saved-run-link">Open Investigation</Link>
  </li>;
}
