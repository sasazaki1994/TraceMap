import type {
  InvestigationUnknown,
  InvestigationUnknownCategory,
  InvestigationUnknownSeverity,
} from "@/types/investigation";
import { buildSourceQualityUnknowns } from "@/features/run/lib/build-source-quality-unknowns";
import type { SourceQualitySignal } from "@/types/source-quality";
import type { AlertLevel, RunEvidenceAlert, RunEvidenceClaim } from "@/types/run-evidence";

const MAX_UNKNOWNS = 24;

export function severityFromAlertLevel(level: AlertLevel): InvestigationUnknownSeverity {
  return level === "error" ? "high" : level === "warning" ? "medium" : "low";
}
const rank = (s: InvestigationUnknownSeverity) => (s === "high" ? 0 : s === "medium" ? 1 : 2);

function fromAlert(params: { id: string; message: string; level: AlertLevel; claimSummary?: string; claimId?: string }): InvestigationUnknown {
  const m = params.message.toLowerCase();
  const category: InvestigationUnknownCategory = m.includes("contrad") || m.includes("counter") ? "contradiction" : m.includes("date") || m.includes("stale") ? "freshness" : m.includes("source") ? "source" : "evidence";
  return {
    id: params.id,
    relatedClaimIds: params.claimId ? [params.claimId] : [],
    relatedSourceIds: [],
    text: params.claimSummary ? `${params.claimSummary}: ${params.message}` : params.message,
    reason: m.includes("primary source") ? "Primary or official evidence is missing." : "Existing evidence raised an investigation caveat.",
    severity: severityFromAlertLevel(params.level),
    category,
    suggestedNextAction: m.includes("date") || m.includes("stale") ? "Verify publication date and recency." : "Review supporting evidence and add stronger sources.",
  };
}

export function buildUnknowns(params: { evidenceAlerts: RunEvidenceAlert[]; evidenceClaims: RunEvidenceClaim[]; sourceQuality?: SourceQualitySignal[] }): InvestigationUnknown[] {
  const unknowns: InvestigationUnknown[] = [];
  params.evidenceAlerts.forEach((a) => unknowns.push(fromAlert(a)));

  for (const c of params.evidenceClaims) {
    c.alerts.forEach((a) => unknowns.push(fromAlert({ ...a, claimSummary: c.summary, claimId: c.id })));
    const conf = c.confidence;
    if (!conf) continue;
    if (conf.level !== "high") unknowns.push({ id: `${c.id}-confidence`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: conf.summary.trim() || "Claim confidence is limited by incomplete supporting evidence.", severity: conf.level === "low" || conf.level === "insufficient" ? "high" : "medium", category: "evidence", suggestedNextAction: "Strengthen evidence before reusing this finding." });
    if (!conf.hasPrimarySource) unknowns.push({ id: `${c.id}-primary-source`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: "Primary or official evidence is missing.", severity: "medium", category: "source", suggestedNextAction: "Check official or primary source." });
    if (conf.independentSourceCount <= 1) unknowns.push({ id: `${c.id}-independent-source`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: "Independent source coverage is limited.", severity: "medium", category: "source", suggestedNextAction: "Add independent supporting source." });
    if (!conf.hasSupportingQuote) unknowns.push({ id: `${c.id}-supporting-quote`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: "No supporting quote or cited passage is attached.", severity: "medium", category: "evidence", suggestedNextAction: "Locate cited passage or supporting quote." });
    if (conf.recencyStatus !== "current") unknowns.push({ id: `${c.id}-recency`, relatedClaimIds:[c.id], relatedSourceIds:[], text: c.summary, reason: conf.recencyStatus === "stale" ? "Supporting sources may be stale." : "Publication date or recency is unknown.", severity: "medium", category: "freshness", suggestedNextAction: "Verify publication date and recency." });
  }

  (params.sourceQuality && params.sourceQuality.length > 0 ? buildSourceQualityUnknowns(params.sourceQuality) : []).forEach((u) => {
    unknowns.push({ ...u, category: u.reason.toLowerCase().includes("stale") || u.reason.toLowerCase().includes("date") ? "freshness" : u.reason.toLowerCase().includes("contrad") ? "contradiction" : "source" });
  });

  const deduped = new Map<string, InvestigationUnknown>();
  for (const u of unknowns) {
    const key = `${u.category}|${(u.relatedClaimIds??[]).sort().join(",")}|${(u.relatedSourceIds??[]).sort().join(",")}|${u.reason}`.toLowerCase();
    if (!deduped.has(key) || rank(u.severity) < rank(deduped.get(key)!.severity)) deduped.set(key, u);
  }
  return [...deduped.values()].sort((a,b)=>rank(a.severity)-rank(b.severity)).slice(0, MAX_UNKNOWNS);
}
