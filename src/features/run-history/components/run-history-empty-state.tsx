import Link from "next/link";

export function RunHistoryEmptyState() {
  return (
    <div data-testid="run-history-empty" className="saved-run-empty">
      <p>No saved investigations yet. Start a new investigation to build your evidence archive.</p>
      <Link href="/" data-testid="start-new-investigation-link" className="saved-run-link">Start new investigation</Link>
    </div>
  );
}
