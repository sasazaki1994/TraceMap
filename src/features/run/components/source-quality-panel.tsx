import type { SourceQualitySignal } from "@/types/source-quality";

type SourceQualityPanelProps = {
  sourceQuality: SourceQualitySignal[];
};

export function SourceQualityPanel({ sourceQuality }: SourceQualityPanelProps) {
  return (
    <section className="investigation-panel" data-testid="source-quality-panel" style={{ marginTop: "1.25rem" }}>
      <h3 className="run-question-label">Source Quality & Freshness Lite</h3>
      {sourceQuality.length > 0 ? (
        <ul className="investigation-list">
          {sourceQuality.map((quality) => (
            <li key={quality.sourceId} className="investigation-list-item" data-testid="source-quality-item">
              <p className="source-list-item-title">{quality.label}</p>
              <p className="source-list-item-meta" style={{ marginTop: "6px" }}>
                Quality: <span data-testid="source-quality-badge">{quality.quality}</span> · Freshness: <span data-testid="source-freshness-badge">{quality.freshness}</span> · Reachability: <span data-testid="source-reachability-badge">{quality.reachability}</span>
              </p>
              <p className="source-list-item-meta" style={{ marginTop: "6px" }}>
                Type: {quality.sourceType ?? "unknown"} · Published: {quality.publishedAt ?? "Unknown"} · Checked: {quality.checkedAt ?? "Unknown"}
                {quality.isPrimarySource ? " · Primary source" : ""}
              </p>
              <p className="muted" style={{ marginTop: "6px" }}>Reason: {quality.reasons[0]}</p>
              {quality.suggestedAction ? <p className="muted" style={{ marginTop: "6px" }}>Suggested action: {quality.suggestedAction}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: "0.75rem" }}>No source quality signals available yet.</p>
      )}
    </section>
  );
}
