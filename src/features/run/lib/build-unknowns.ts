import type { InvestigationUnknown, InvestigationUnknownCategory, InvestigationUnknownSeverity } from "@/types/investigation";
import { buildSourceQualityUnknowns } from "@/features/run/lib/build-source-quality-unknowns";
import type { SourceQualitySignal } from "@/types/source-quality";
import type { AlertLevel, RunEvidenceAlert, RunEvidenceClaim } from "@/types/run-evidence";
import type { SourceDetailDrilldown } from "@/types/source-drilldown";

const MAX_UNKNOWNS = 32;
const rank = (s: InvestigationUnknownSeverity) => (s === "high" ? 0 : s === "medium" ? 1 : 2);
export function severityFromAlertLevel(level: AlertLevel): InvestigationUnknownSeverity { return level === "error" ? "high" : level === "warning" ? "medium" : "low"; }

function fromAlert(params: { id: string; message: string; level: AlertLevel; claimSummary?: string }): InvestigationUnknown {
  const m = params.message.toLowerCase();
  const category: InvestigationUnknownCategory = m.includes("contrad") || m.includes("counter") ? "contradiction" : m.includes("date") || m.includes("stale") ? "freshness" : m.includes("source") ? "source" : m.includes("comparison") || m.includes("ranking") || m.includes("share") ? "comparison" : "evidence";
  const next = m.includes("date") || m.includes("stale") ? "Verify publication date and recency." : "Review supporting evidence and add stronger sources.";
  return { id: params.id, relatedClaimIds: params.claimSummary ? [params.id.split("-")[0]] : [], relatedSourceIds: [], text: params.claimSummary ? `${params.claimSummary}: ${params.message}` : params.message, reason: m.includes("primary source") ? "Primary or official evidence is missing." : "Existing evidence raised an investigation caveat.", severity: severityFromAlertLevel(params.level), category, suggestedNextAction: next, signals: ["alert"] };
}

// Unknown Mapは専用テーブルではなく、
// claim/alert/source-qualityから派生する調査上の「未解決点ビュー」。
export function buildUnknowns(params: { evidenceAlerts: RunEvidenceAlert[]; evidenceClaims: RunEvidenceClaim[]; sourceQuality?: SourceQualitySignal[]; sourceDrilldown?: SourceDetailDrilldown[] }): InvestigationUnknown[] {
  const unknowns: InvestigationUnknown[] = [];
  params.evidenceAlerts.forEach((a) => unknowns.push(fromAlert(a)));

  for (const c of params.evidenceClaims) {
    c.alerts.forEach((a) => unknowns.push(fromAlert({ ...a, claimSummary: c.summary })));
    const conf = c.confidence;
    if (c.supportingSourceIds.length === 0) unknowns.push({ id: `${c.id}-no-source`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: "Claim has no linked source.", severity: "high", category: "evidence", suggestedNextAction: "Add a source for this claim.", signals:["claim-no-source"] });
    if (!conf) continue;
    if (conf.level !== "high") unknowns.push({ id: `${c.id}-confidence`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: conf.summary.trim() || "Claim confidence is limited by incomplete supporting evidence.", severity: conf.level === "low" || conf.level === "insufficient" ? "high" : "medium", category: "evidence", suggestedNextAction: "Strengthen evidence before reusing this finding.", signals:["confidence"] });
    if (!conf.hasPrimarySource) unknowns.push({ id: `${c.id}-primary-source`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: "Primary or official evidence is missing.", severity: "medium", category: "source", suggestedNextAction: "Check official or primary source.", signals:["primary-missing"] });
    if (conf.independentSourceCount <= 1) unknowns.push({ id: `${c.id}-independent-source`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: "Independent source coverage is limited.", severity: "medium", category: "source", suggestedNextAction: "Add independent supporting source.", signals:["independent-low"] });
    if (!conf.hasSupportingQuote) unknowns.push({ id: `${c.id}-supporting-quote`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: "No supporting quote or cited passage is attached.", severity: "medium", category: "evidence", suggestedNextAction: "Locate a cited passage or supporting quote.", signals:["missing-quote"] });
    if (conf.recencyStatus !== "current") unknowns.push({ id: `${c.id}-recency`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: conf.recencyStatus === "stale" ? "Supporting sources may be stale." : "Publication date or recency is unknown.", severity: "medium", category: "freshness", suggestedNextAction: "Verify publication date and recency.", signals:["recency"] });
  }

  (params.sourceQuality ? buildSourceQualityUnknowns(params.sourceQuality) : []).forEach((u) => unknowns.push(u));
  (params.sourceDrilldown ?? []).forEach((source) => {
    source.supportedClaims.forEach((claim) => {
      if (claim.supportKind === "weak") unknowns.push({ id: `${source.sourceId}-${claim.claimId}-weak-support`, text: claim.claimText, reason: "Support quality is weak.", severity: "medium", category: "evidence", suggestedNextAction: "Add a stronger source or direct evidence for this claim.", relatedClaimIds: [claim.claimId], relatedSourceIds: [source.sourceId], signals: ["weak-support"] });
      if (claim.supportKind === "contradiction" || claim.contradictionNote) unknowns.push({ id: `${source.sourceId}-${claim.claimId}-contradiction`, text: claim.claimText, reason: claim.contradictionNote ?? "Contradiction detected.", severity: "high", category: "contradiction", suggestedNextAction: "Compare the conflicting sources and preserve both viewpoints.", relatedClaimIds: [claim.claimId], relatedSourceIds: [source.sourceId], signals: ["contradiction"] });
      if (claim.supportKind === "direct" && !claim.supportingQuote?.trim()) unknowns.push({ id: `${source.sourceId}-${claim.claimId}-missing-quote`, text: claim.claimText, reason: "Direct support has no supporting quote.", severity: "medium", category: "evidence", suggestedNextAction: "Locate a cited passage or supporting quote.", relatedClaimIds: [claim.claimId], relatedSourceIds: [source.sourceId], signals: ["missing-quote"] });
    });
  });

  // 同一論点の重複表示を避けるため、category+関連ID+reasonで集約し、
  // severityが高いものを優先して残す。
  const deduped = new Map<string, InvestigationUnknown>();
  for (const u of unknowns) {
    const key = `${u.category}|${(u.relatedClaimIds ?? []).sort().join(",")}|${(u.relatedSourceIds ?? []).sort().join(",")}|${u.reason.toLowerCase()}`;
    const prev = deduped.get(key);
    if (!prev || rank(u.severity) < rank(prev.severity)) deduped.set(key, u);
    else deduped.set(key, { ...prev, relatedClaimIds: [...new Set([...(prev.relatedClaimIds ?? []), ...(u.relatedClaimIds ?? [])])], relatedSourceIds: [...new Set([...(prev.relatedSourceIds ?? []), ...(u.relatedSourceIds ?? [])])], signals: [...new Set([...(prev.signals ?? []), ...(u.signals ?? [])])] });
  }
  return [...deduped.values()].sort((a,b)=>rank(a.severity)-rank(b.severity)).slice(0, MAX_UNKNOWNS);
}
