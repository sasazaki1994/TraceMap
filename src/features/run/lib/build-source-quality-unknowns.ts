import type { InvestigationUnknown } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";

export function buildSourceQualityUnknowns(sourceQuality: SourceQualitySignal[]): InvestigationUnknown[] {
  return sourceQuality.flatMap((signal) => {
    const unknowns: InvestigationUnknown[] = [];

    if (signal.reachabilityStatus === "unreachable") {
      unknowns.push({
        id: `${signal.sourceId}-source-unreachable`,
        text: signal.label,
        reason: "Source is unreachable.",
        severity: "high",
        suggestedNextAction: "Re-check source URL.",
      });
    } else if (signal.reachabilityStatus === "invalid") {
      unknowns.push({
        id: `${signal.sourceId}-source-invalid`,
        text: signal.label,
        reason: "Source URL appears invalid.",
        severity: "high",
        suggestedNextAction: "Re-check source URL.",
      });
    }

    if (signal.freshnessStatus === "stale") {
      unknowns.push({
        id: `${signal.sourceId}-source-stale`,
        text: signal.label,
        reason: "Source may be stale.",
        severity: "medium",
        suggestedNextAction: "Verify publication date and recency.",
      });
    } else if (signal.freshnessStatus === "unknown") {
      unknowns.push({
        id: `${signal.sourceId}-source-freshness-unknown`,
        text: signal.label,
        reason: "Source freshness is unknown.",
        severity: "medium",
        suggestedNextAction: "Verify publication date and recency.",
      });
    }

    if (!signal.hasSupportingQuote && signal.linkedClaimCount > 0) {
      unknowns.push({
        id: `${signal.sourceId}-source-missing-quote`,
        text: signal.label,
        reason: "Source supports claims but has no supporting quote.",
        severity: "low",
        suggestedNextAction: "Locate supporting quote or cited passage.",
      });
    }

    return unknowns.slice(0, 3);
  });
}
