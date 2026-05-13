import type { SourceQualitySignal } from "@/types/source-quality";
import {
  sourceFreshnessLabel,
  sourceQualityGradeLabel,
  sourceReachabilityLabel,
} from "@/features/run/lib/source-quality-labels";

export function SourceQualityPanel({ sourceQuality }: { sourceQuality: SourceQualitySignal[] }) {
  return (
    <section className="investigation-panel" data-testid="source-quality-panel" style={{ marginTop: "1.25rem" }}>
      <h3 className="run-question-label">Source Quality & Freshness</h3>
      {sourceQuality.length > 0 ? (
        <ul className="investigation-list">
          {sourceQuality.map((q) => (
            <li key={q.sourceId} className="investigation-list-item">
              <p className="source-list-item-title">{q.label}</p>
              <p className="source-list-item-meta" data-testid="source-quality-badge">
                Quality: <span data-testid="source-quality-label">{sourceQualityGradeLabel(q.quality)}</span> · Freshness: <span data-testid="source-freshness-label">{sourceFreshnessLabel(q.freshness)}</span> · Reachability: <span data-testid="source-reachability-label">{sourceReachabilityLabel(q.reachability)}</span>
              </p>
              {q.reasons.map((reason, index) => (
                <p key={`${q.sourceId}-reason-${index}`} className="muted" data-testid="source-quality-reason">
                  Reason: {reason}
                </p>
              ))}
              {q.warnings.map((warning, index) => (
                <p key={`${q.sourceId}-warning-${index}`} className="muted" data-testid="source-quality-warning">
                  Warning: {warning}
                </p>
              ))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          No source quality signals available yet.
        </p>
      )}
    </section>
  );
}
