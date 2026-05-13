import type { RunMetadata } from "@/features/run/lib/build-run-metadata";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function RunMetadataPanel({ metadata }: { metadata: RunMetadata }) {
  const items: Array<[string, string | number]> = [
    ["Run ID", metadata.runId ?? "-"],
    ["Status", metadata.status],
    ["Created", formatDate(metadata.createdAtIso)],
    ["Updated", formatDate(metadata.updatedAtIso)],
    ["Provider", metadata.provider],
    ["Model", metadata.model],
    ["Sources", metadata.sourceCount],
    ["Claims", metadata.claimCount],
    ["Alerts", metadata.alertCount],
    ["Counterpoints", metadata.counterpointCount],
    ["Cache", metadata.cacheStatus],
    ["Generated", formatDate(metadata.generatedAtIso)],
  ];

  return (
    <section className="investigation-panel" data-testid="run-metadata-panel" style={{ marginTop: "1.25rem" }}>
      <h3 className="run-question-label">Run metadata</h3>
      <ul className="investigation-list">
        {items.map(([label, value]) => (
          <li key={label} className="investigation-list-item" data-testid="run-metadata-item">
            <p className="source-list-item-title">{label}</p>
            <p className="muted">{value}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
