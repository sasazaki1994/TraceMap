import type {
  InvestigationUnknown,
  InvestigationUnknownSeverity,
} from "@/types/investigation";
import type { AlertLevel, RunEvidenceAlert, RunEvidenceClaim } from "@/types/run-evidence";

export function severityFromAlertLevel(level: AlertLevel): InvestigationUnknownSeverity {
  switch (level) {
    case "error":
      return "high";
    case "warning":
      return "medium";
    case "info":
      return "low";
  }
}

function severityFromConfidence(
  level: NonNullable<RunEvidenceClaim["confidence"]>["level"],
): InvestigationUnknownSeverity {
  switch (level) {
    case "insufficient":
    case "low":
      return "high";
    case "medium":
      return "medium";
    case "high":
      return "low";
  }
}

export function suggestedNextActionForGap(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("primary source")) {
    return "Check official or primary source.";
  }
  if (normalized.includes("only one source") || normalized.includes("independent")) {
    return "Add independent supporting source.";
  }
  if (
    normalized.includes("quote") ||
    normalized.includes("cited passage") ||
    normalized.includes("excerpt")
  ) {
    return "Locate cited passage or supporting quote.";
  }
  if (
    normalized.includes("stale") ||
    normalized.includes("publication") ||
    normalized.includes("time") ||
    normalized.includes("date") ||
    normalized.includes("recency")
  ) {
    return "Verify publication date and recency.";
  }
  if (normalized.includes("synthetic") || normalized.includes("mock")) {
    return "Replace synthetic evidence with real source checks.";
  }
  return "Review supporting evidence and add stronger sources.";
}

function reasonForGap(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("primary source")) {
    return "Primary or official evidence is missing.";
  }
  if (normalized.includes("only one source")) {
    return "The claim currently has a single supporting source.";
  }
  if (normalized.includes("quote") || normalized.includes("cited passage")) {
    return "The support does not include a directly cited passage.";
  }
  if (normalized.includes("stale")) {
    return "The supporting evidence may be outdated.";
  }
  if (
    normalized.includes("publication") ||
    normalized.includes("time") ||
    normalized.includes("date")
  ) {
    return "Publication timing is unclear.";
  }
  if (normalized.includes("contradiction") || normalized.includes("counter")) {
    return "Contradictory or counter-evidence is present.";
  }
  return "Existing evidence raised an investigation caveat.";
}

function confidenceReason(summary: string): string {
  return summary.trim() || "Claim confidence is limited by incomplete supporting evidence.";
}

function fromAlert(params: {
  id: string;
  message: string;
  level: AlertLevel;
  claimSummary?: string;
}): InvestigationUnknown {
  const text = params.claimSummary
    ? `${params.claimSummary}: ${params.message}`
    : params.message;
  return {
    id: params.id,
    text,
    reason: reasonForGap(params.message),
    severity: severityFromAlertLevel(params.level),
    suggestedNextAction: suggestedNextActionForGap(params.message),
  };
}

export function buildUnknowns(params: {
  evidenceAlerts: RunEvidenceAlert[];
  evidenceClaims: RunEvidenceClaim[];
}): InvestigationUnknown[] {
  const unknowns: InvestigationUnknown[] = [];

  for (const alert of params.evidenceAlerts) {
    unknowns.push(fromAlert(alert));
  }

  for (const claim of params.evidenceClaims) {
    for (const alert of claim.alerts) {
      unknowns.push(
        fromAlert({
          id: alert.id,
          message: alert.message,
          level: alert.level,
          claimSummary: claim.summary,
        }),
      );
    }

    const confidence = claim.confidence;
    if (!confidence) {
      continue;
    }

    if (confidence.level !== "high") {
      unknowns.push({
        id: `${claim.id}-confidence`,
        text: claim.summary,
        reason: confidenceReason(confidence.summary),
        severity: severityFromConfidence(confidence.level),
        suggestedNextAction: "Strengthen evidence before reusing this finding.",
      });
    }
    if (!confidence.hasPrimarySource) {
      unknowns.push({
        id: `${claim.id}-primary-source`,
        text: claim.summary,
        reason: "Primary or official evidence is missing.",
        severity: "medium",
        suggestedNextAction: "Check official or primary source.",
      });
    }
    if (confidence.independentSourceCount <= 1) {
      unknowns.push({
        id: `${claim.id}-independent-source`,
        text: claim.summary,
        reason: "Independent source coverage is limited.",
        severity: "medium",
        suggestedNextAction: "Add independent supporting source.",
      });
    }
    if (!confidence.hasSupportingQuote) {
      unknowns.push({
        id: `${claim.id}-supporting-quote`,
        text: claim.summary,
        reason: "No supporting quote or cited passage is attached.",
        severity: "medium",
        suggestedNextAction: "Locate cited passage or supporting quote.",
      });
    }
    if (confidence.recencyStatus !== "current") {
      unknowns.push({
        id: `${claim.id}-recency`,
        text: claim.summary,
        reason:
          confidence.recencyStatus === "stale"
            ? "Supporting sources may be stale."
            : "Publication date or recency is unknown.",
        severity: "medium",
        suggestedNextAction: "Verify publication date and recency.",
      });
    }
  }

  return unknowns;
}
