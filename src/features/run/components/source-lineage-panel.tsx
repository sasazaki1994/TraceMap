import type { SourceLineageLite } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";
import { sourceFreshnessLabel, sourceQualityGradeLabel, sourceReachabilityLabel } from "@/features/run/lib/source-quality-labels";

type SourceLineagePanelProps = {
  sourceLineage: SourceLineageLite[];
  sourceQuality: SourceQualitySignal[];
};

export function SourceLineagePanel({ sourceLineage, sourceQuality }: SourceLineagePanelProps) {
  const toSafeUrl = (value: string | null | undefined): string | null => {
    if (!value) return null;
    try {
      const parsed = new URL(value);
      const protocol = parsed.protocol.toLowerCase();
      return protocol === "http:" || protocol === "https:" ? parsed.toString() : null;
    } catch {
      return null;
    }
  };

  return (
    <section className="investigation-panel" data-testid="source-lineage-panel" style={{ marginTop: "1.25rem" }}>
      <h3 className="run-question-label">Source Lineage Lite</h3>
      <p className="muted" style={{ marginTop: "0.25rem" }}>
        Lite provenance view. This does not guarantee full origin verification.
      </p>
      {sourceLineage.length > 0 ? (
        <ul className="investigation-list">
          {sourceLineage.map((source) => {
            const safeUrl = toSafeUrl(source.url);
            const quality = sourceQuality.find((item) => item.sourceId === source.sourceId);
            return (
              <li key={source.sourceId} className="investigation-list-item" data-lineage-primary={source.isPrimarySource ? "true" : "false"} data-testid="source-lineage-item">
                <div className="claim-support-header">
                  <span className="source-list-item-title">{source.label}</span>
                  {source.isPrimarySource ? <span className="claim-primary-badge">Primary source</span> : null}
                </div>
                {quality ? (
                  <div data-testid="source-lineage-quality-summary" className="source-list-item-meta" style={{ marginTop: "6px" }}>
                    <span data-testid="source-quality-badge">Quality: {sourceQualityGradeLabel(quality.quality)}</span> · <span data-testid="source-freshness-badge">Freshness: {sourceFreshnessLabel(quality.freshness)}</span> · <span data-testid="source-reachability-badge">Reachability: {sourceReachabilityLabel(quality.reachability)}</span>
                  </div>
                ) : null}
                <p className="source-list-item-meta" style={{ marginTop: "6px" }}>Type: {source.sourceType} · Published: {source.publishedAt ?? "Unknown"} · Checked: {source.checkedAt ?? "Unknown"}</p>
                <p className="source-list-item-meta" data-testid="source-verification-status" style={{ marginTop: "6px" }}>
                  Verification: {source.verificationStatus ?? "unverified"} · HTTP {source.httpStatus ?? "Unknown"}
                  {source.contentType ? ` · ${source.contentType}` : ""}
                </p>
                {source.finalUrl ? <p className="source-list-item-meta" style={{ marginTop: "6px", wordBreak: "break-all" }}>Final URL: {source.finalUrl}</p> : null}
                <p className="muted" style={{ marginTop: "6px" }}>{source.lineageLabel}</p>
                {safeUrl ? <p style={{ marginTop: "6px", wordBreak: "break-all" }}><a href={safeUrl} rel="noreferrer" target="_blank">{safeUrl}</a></p> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: "0.75rem" }}>No source lineage is available yet.</p>
      )}
    </section>
  );
}
