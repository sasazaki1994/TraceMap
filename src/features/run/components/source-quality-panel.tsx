import type { SourceQualitySignal } from "@/types/source-quality";

type SourceQualityPanelProps = {
  sourceQuality: SourceQualitySignal[];
};

export function SourceQualityPanel({ sourceQuality }: SourceQualityPanelProps) {
  return (
    <section className="investigation-panel" data-testid="source-quality-panel" style={{ marginTop: "1.25rem" }}>
      <h3 className="run-question-label">Source Quality & Freshness Lite</h3>
      <p className="muted" style={{ marginTop: "0.25rem" }}>
        Lightweight quality indicators derived from source metadata and claim links.
      </p>
      {sourceQuality.length > 0 ? (
        <ul className="investigation-list">
          {sourceQuality.map((quality) => (
            <li key={quality.sourceId} className="investigation-list-item" data-testid="source-quality-item">
              <p className="source-list-item-title">{quality.label}</p>
              <p className="source-list-item-meta" style={{ marginTop: "6px" }}>
                Quality: <span data-testid="source-quality-level">{quality.qualityLevel}</span> · Freshness:{" "}
                <span data-testid="source-freshness-status">{quality.freshnessStatus}</span> · Reachability:{" "}
                <span data-testid="source-reachability-status">{quality.reachabilityStatus}</span>
              </p>
              <p className="source-list-item-meta" style={{ marginTop: "6px" }}>
                Published date: {quality.publishedAt ?? "Unknown"}
              </p>
              {quality.reasons.length > 0 ? (
                <p className="muted" style={{ marginTop: "6px" }}>
                  Reason: {quality.reasons[0]}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: "0.75rem" }}>No source quality signals available yet.</p>
      )}
    </section>
  );
}
