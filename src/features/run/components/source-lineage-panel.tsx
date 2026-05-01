import type { SourceLineageLite } from "@/types/investigation";

type SourceLineagePanelProps = {
  sourceLineage: SourceLineageLite[];
};

export function SourceLineagePanel({ sourceLineage }: SourceLineagePanelProps) {
  return (
    <section
      className="investigation-panel"
      data-testid="source-lineage-panel"
      style={{ marginTop: "1.25rem" }}
    >
      <h3 className="run-question-label">Source Lineage Lite</h3>
      {sourceLineage.length > 0 ? (
        <ul className="investigation-list">
          {sourceLineage.map((source) => (
            <li
              key={source.sourceId}
              className="investigation-list-item"
              data-lineage-primary={source.isPrimarySource ? "true" : "false"}
              data-testid="source-lineage-item"
            >
              <div className="claim-support-header">
                <span className="source-list-item-title">{source.label}</span>
                {source.isPrimarySource ? (
                  <span className="claim-primary-badge">Primary source</span>
                ) : null}
              </div>
              <p className="source-list-item-meta" style={{ marginTop: "6px" }}>
                Type: {source.sourceType} · Published: {source.publishedAt ?? "Unknown"}
              </p>
              <p className="muted" style={{ marginTop: "6px" }}>
                {source.lineageLabel}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          No source lineage is available yet.
        </p>
      )}
    </section>
  );
}
