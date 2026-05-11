import type { InvestigationUnknown } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";

export function buildSourceQualityUnknowns(sourceQuality: SourceQualitySignal[]): InvestigationUnknown[] {
  return sourceQuality.flatMap((signal) => {
    const unknowns: InvestigationUnknown[] = [];

    if (signal.reachability === "unreachable") {
      unknowns.push({
        id: `${signal.sourceId}-source-unreachable`,
        text: signal.label,
        reason: "Source is unreachable.",
        severity: "high",
        suggestedNextAction: "Replace or re-check the source URL.",
      });
    } else if (signal.reachability === "invalid") {
      unknowns.push({
        id: `${signal.sourceId}-source-invalid`,
        text: signal.label,
        reason: "Source URL appears invalid.",
        severity: "high",
        suggestedNextAction: "Replace or re-check the source URL.",
      });
    }

    if (signal.freshness === "stale") {
      unknowns.push({
        id: `${signal.sourceId}-source-stale`,
        text: signal.label,
        reason: "A supporting source may be stale.",
        severity: "medium",
        suggestedNextAction: "Verify whether newer primary or official sources exist.",
      });
    } else if (signal.freshness === "unknown") {
      unknowns.push({
        id: `${signal.sourceId}-source-freshness-unknown`,
        text: signal.label,
        reason: "Source freshness is unknown.",
        severity: "medium",
        suggestedNextAction: "Verify whether newer primary or official sources exist.",
      });
    }

    if (!Boolean(signal.publishedAt)) {
      unknowns.push({
        id: `${signal.sourceId}-source-no-publication-date`,
        text: signal.label,
        reason: "Source publication date is not available.",
        severity: "low",
        suggestedNextAction: "Verify whether newer primary or official sources exist.",
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

    if (signal.linkedClaimCount === 0) {
      unknowns.push({
        id: `${signal.sourceId}-source-no-linked-claims`,
        text: signal.label,
        reason: "Source is not linked to any claim.",
        severity: "low",
        suggestedNextAction:
          "Remove unused source from report if it does not support any claim.",
      });
    }

    return unknowns.slice(0, 3);
  });
}
