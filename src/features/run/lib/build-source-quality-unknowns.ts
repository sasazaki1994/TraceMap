import type { InvestigationUnknown } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";

export function buildSourceQualityUnknowns(sourceQuality: SourceQualitySignal[]): InvestigationUnknown[] {
  return sourceQuality.flatMap((signal) => {
    const unknowns: InvestigationUnknown[] = [];
    if (signal.freshness === "stale") unknowns.push({ id: `${signal.sourceId}-freshness-stale`, text: signal.label, reason: "Source appears stale.", severity: "medium", category: "freshness", suggestedNextAction: "Verify whether newer sources or updates exist.", relatedClaimIds: [], relatedSourceIds: [signal.sourceId], signals: ["stale-source"] });
    if (signal.freshness === "unknown") unknowns.push({ id: `${signal.sourceId}-freshness-unknown`, text: signal.label, reason: "Publication/update date is unknown.", severity: "low", category: "freshness", suggestedNextAction: "Check the publication date or update date.", relatedClaimIds: [], relatedSourceIds: [signal.sourceId], signals: ["freshness-unknown"] });
    if (signal.reachability === "unchecked") unknowns.push({ id: `${signal.sourceId}-reachability-unchecked`, text: signal.label, reason: "Reachability has not been checked.", severity: "low", category: "source", suggestedNextAction: "Recheck the source URL and confirm it is reachable.", relatedClaimIds: [], relatedSourceIds: [signal.sourceId], signals: ["reachability-unchecked"] });
    if (signal.reachability === "invalid" || signal.reachability === "unreachable") unknowns.push({ id: `${signal.sourceId}-reachability-failed`, text: signal.label, reason: `Source URL is ${signal.reachability}.`, severity: "high", category: "source", suggestedNextAction: "Use a reachable source URL and validate evidence links.", relatedClaimIds: [], relatedSourceIds: [signal.sourceId], signals: [signal.reachability] });
    if (signal.quality === "weak" || signal.quality === "limited") unknowns.push({ id: `${signal.sourceId}-weak-quality`, text: signal.label, reason: "This claim depends on a source with limited quality signals.", severity: signal.quality === "weak" ? "high" : "medium", category: "source", suggestedNextAction: "Add official or independent evidence for this source.", relatedClaimIds: [], relatedSourceIds: [signal.sourceId], signals: [`quality-${signal.quality}`] });
    return unknowns;
  });
}
