import type { SourceQualitySignal } from "@/types/source-quality";
import {
  sourceFreshnessLabel,
  sourceQualityGradeLabel,
  sourceReachabilityLabel,
} from "@/features/run/lib/source-quality-labels";

export function SourceQualityPanel({ sourceQuality }: { sourceQuality: SourceQualitySignal[] }) {
  return <section className="investigation-panel" data-testid="source-quality-panel" style={{ marginTop: "1.25rem" }}><h3 className="run-question-label">Source Quality & Freshness Lite</h3>{sourceQuality.length > 0 ? <ul className="investigation-list">{sourceQuality.map((q)=><li key={q.sourceId} className="investigation-list-item" data-testid="source-quality-item"><p className="source-list-item-title">{q.label}</p><p className="source-list-item-meta">Quality: <span data-testid="source-quality-badge">{sourceQualityGradeLabel(q.quality)}</span> · Freshness: <span data-testid="source-freshness-badge">{sourceFreshnessLabel(q.freshness)}</span> · Reachability: <span data-testid="source-reachability-badge">{sourceReachabilityLabel(q.reachability)}</span></p><p className="source-list-item-meta">Source type: {q.sourceType ?? "unknown"} · Published date: {q.publishedAt ?? "Unknown"} · Checked date: {q.checkedAt ?? "Unknown"} · Linked claim count: {q.linkedClaimCount}</p>{q.reasons.map((r,i)=><p key={i} className="muted">Reason: {r}</p>)}{q.suggestedAction ? <p className="muted">Suggested action: {q.suggestedAction}</p> : null}</li>)}</ul> : <p className="muted" style={{ marginTop: "0.75rem" }}>No source quality signals available yet.</p>}</section>;
}
