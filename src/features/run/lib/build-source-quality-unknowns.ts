import type { InvestigationUnknown } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";

export function buildSourceQualityUnknowns(sourceQuality: SourceQualitySignal[]): InvestigationUnknown[] {
  return sourceQuality.flatMap((signal) => {
    const unknowns: InvestigationUnknown[] = [];
    if (signal.freshness === "unknown") {
      unknowns.push({
        id: `${signal.sourceId}-freshness-unknown`,
        text: signal.label,
        reason: "This source does not expose a publication or update date.",
        severity: "medium",
        category: "freshness",
        suggestedNextAction: "Verify publication date and recency.",
      });
    }
    if (signal.reachability === "unchecked") {
      unknowns.push({
        id: `${signal.sourceId}-reachability-unchecked`,
        text: signal.label,
        reason: "This source has not been verified for reachability.",
        severity: "medium",
        category: "source",
        suggestedNextAction: "Open the source and confirm it is accessible.",
      });
    }
    if (signal.quality === "weak" || signal.quality === "limited") {
      unknowns.push({
        id: `${signal.sourceId}-weak-quality`,
        text: signal.label,
        reason: "This claim depends on a source with limited quality signals.",
        severity: signal.quality === "weak" ? "high" : "medium",
        category: "source",
        suggestedNextAction: "Add an official or independent supporting source.",
      });
    }
    return unknowns;
  });
}
