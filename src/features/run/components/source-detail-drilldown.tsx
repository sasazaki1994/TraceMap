import type { SourceDetailDrilldown } from "@/types/source-drilldown";
import { sourceFreshnessLabel, sourceQualityGradeLabel, sourceReachabilityLabel } from "@/features/run/lib/source-quality-labels";

export function SourceDetailDrilldown({ detail }: { detail: SourceDetailDrilldown | null }) {
  if (!detail) return null;
  return (
    <section className="investigation-panel" data-testid="source-detail-drilldown" style={{ marginTop: "0.75rem" }}>
      <p className="source-list-item-title" data-testid="source-detail-title">{detail.title}</p>
      <p data-testid="source-detail-url" className="source-list-item-meta">{detail.url ?? "URL unavailable"}</p>
      {detail.isPrimaryLike ? <p data-testid="primary-source-badge" className="claim-primary-badge">Primary-like source</p> : null}
      {detail.sourceQuality ? (
        <div data-testid="source-quality-summary" className="source-list-item-meta">
          {sourceQualityGradeLabel(detail.sourceQuality.quality)} / {sourceFreshnessLabel(detail.sourceQuality.freshness)} / {sourceReachabilityLabel(detail.sourceQuality.reachability)}
        </div>
      ) : null}
      <p data-testid="source-lineage-summary" className="muted">{detail.lineage?.lineageLabel ?? "Lineage not available"}</p>

      {detail.supportedClaims.length > 0 ? detail.supportedClaims.map((claim) => (
        <article key={`${detail.sourceId}-${claim.claimId}`} data-testid="source-supported-claim" className="investigation-list-item" style={{ marginTop: 8 }}>
          <p>{claim.claimText}</p>
          <p data-testid="source-support-kind" className="muted">Support kind: {claim.supportKind}</p>
          {claim.supportingQuote ? <blockquote data-testid="source-supporting-quote">“{claim.supportingQuote}”</blockquote> : <p className="muted">Quote missing.</p>}
          {claim.contradictionNote ? <p data-testid="source-contradiction-note" className="claim-support-contradiction">Contradiction: {claim.contradictionNote}</p> : null}
          {claim.warnings.map((warning) => <p key={warning} className="muted">Warning: {warning}</p>)}
        </article>
      )) : <p data-testid="source-detail-empty-state" className="muted">No structured claim support is available for this source.</p>}

      {detail.relatedUnknowns.map((u) => (
        <p key={u.id} data-testid="source-related-unknown" className="muted">[{u.severity.toUpperCase()}] {u.text} — {u.reason}</p>
      ))}
    </section>
  );
}
