import type {
  RunEvidenceClaim,
  RunEvidenceCounterpoint,
  RunEvidencePropagationStep,
  RunLens,
  RunSourceSupportingClaim,
} from "@/types/run-evidence";

export type RunKnowledgeLens = RunLens;
export type { RunLens };

export function lensLabel(lens: RunKnowledgeLens): string {
  switch (lens) {
    case "rigor":
      return "Rigor first";
    case "timeliness":
      return "Timeliness first";
    case "practical":
      return "Practical decision first";
  }
}

function lensScore(claim: RunEvidenceClaim, lens: RunKnowledgeLens): number {
  const confidence = claim.confidence;
  const base = confidence?.score ?? 0;
  const alertPenalty = claim.alerts.reduce((acc, alert) => {
    if (alert.level === "error") {
      return acc + 18;
    }
    if (alert.level === "warning") {
      return acc + 6;
    }
    return acc;
  }, 0);

  if (lens === "rigor") {
    return (
      base +
      (confidence?.hasPrimarySource ? 18 : 0) +
      (confidence?.hasSupportingQuote ? 14 : 0) +
      (confidence?.independentSourceCount ?? 0) * 7 +
      claim.counterpoints.filter((cp) => cp.relationKind === "contradiction").length * 4 -
      alertPenalty
    );
  }

  if (lens === "timeliness") {
    const recencyBonus =
      confidence?.recencyStatus === "current"
        ? 26
        : confidence?.recencyStatus === "stale"
          ? -16
          : -6;
    return base + recencyBonus - alertPenalty;
  }

  return (
    base +
    claim.propagationSteps.filter((step) => step.stepKind === "answer_segment").length * 12 +
    claim.supports.filter((support) => support.supportKind === "direct").length * 8 +
    claim.counterpoints.filter((cp) => cp.relationKind === "different_premise").length * 5 -
    alertPenalty
  );
}

export function applyLensToClaims(
  claims: RunEvidenceClaim[],
  lens: RunKnowledgeLens,
): RunEvidenceClaim[] {
  return [...claims]
    .map((claim) => ({
      ...claim,
      lensScore: lensScore(claim, lens),
    }))
    .sort((a, b) => b.lensScore - a.lensScore || a.summary.localeCompare(b.summary));
}

export function orderClaimsForLens(
  claims: RunEvidenceClaim[],
  lens: RunKnowledgeLens,
): RunEvidenceClaim[] {
  return applyLensToClaims(claims, lens);
}

export function sortClaimsForLens(
  lens: RunKnowledgeLens,
  claims: RunEvidenceClaim[],
): RunEvidenceClaim[] {
  return orderClaimsForLens(claims, lens);
}

export function rankClaimForLens(
  claim: RunEvidenceClaim,
  lens: RunKnowledgeLens,
): number {
  return lensScore(claim, lens);
}

export function orderSourceSupportingClaimsForLens(
  claims: RunSourceSupportingClaim[],
  lens: RunKnowledgeLens,
): RunSourceSupportingClaim[] {
  const priority = (claim: RunSourceSupportingClaim): number => {
    if (lens === "rigor") {
      return (
        (claim.isPrimarySource ? 12 : 0) +
        (claim.supportingQuote ? 10 : 0) +
        (claim.supportKind === "direct" ? 8 : claim.supportKind === "supplemental" ? 5 : 2)
      );
    }
    if (lens === "timeliness") {
      return claim.supportKind === "direct" ? 6 : claim.supportKind === "supplemental" ? 4 : 2;
    }
    return claim.supportKind === "direct" ? 10 : claim.supportKind === "supplemental" ? 6 : 3;
  };

  return [...claims].sort(
    (a, b) => priority(b) - priority(a) || a.claimSummary.localeCompare(b.claimSummary),
  );
}

export function rankSourceSupportingClaimsForLens(
  claims: RunSourceSupportingClaim[],
  lens: RunKnowledgeLens,
): RunSourceSupportingClaim[] {
  return orderSourceSupportingClaimsForLens(claims, lens);
}

export function orderCounterpointsForLens(
  counterpoints: RunEvidenceCounterpoint[],
  lens: RunKnowledgeLens,
): RunEvidenceCounterpoint[] {
  const weight = (counterpoint: RunEvidenceCounterpoint): number => {
    if (lens === "rigor") {
      return counterpoint.relationKind === "contradiction"
        ? 5
        : counterpoint.relationKind === "different_premise"
          ? 4
          : counterpoint.relationKind === "different_definition"
            ? 3
            : counterpoint.relationKind === "alternative_interpretation"
              ? 2
              : 1;
    }
    if (lens === "timeliness") {
      return counterpoint.relationKind === "temporal_mismatch"
        ? 5
        : counterpoint.relationKind === "contradiction"
          ? 4
          : 2;
    }
    return counterpoint.relationKind === "different_premise"
      ? 5
      : counterpoint.relationKind === "alternative_interpretation"
        ? 4
        : counterpoint.relationKind === "contradiction"
          ? 3
          : 2;
  };

  return [...counterpoints].sort(
    (a, b) => weight(b) - weight(a) || a.summary.localeCompare(b.summary),
  );
}

export function orderPropagationStepsForLens(
  steps: RunEvidencePropagationStep[],
  lens: RunKnowledgeLens,
): RunEvidencePropagationStep[] {
  const rank = (step: RunEvidencePropagationStep): number => {
    if (lens === "rigor") {
      return step.stepKind === "source" || step.stepKind === "evidence_snippet"
        ? 4
        : step.stepKind === "source_interpretation"
          ? 2
          : 3;
    }
    if (lens === "timeliness") {
      return step.stepKind === "source" ? 4 : step.stepKind === "answer_segment" ? 3 : 2;
    }
    return step.stepKind === "answer_segment" ? 5 : step.stepKind === "claim" ? 4 : 2;
  };

  return [...steps].sort(
    (a, b) => rank(b) - rank(a) || a.orderIndex - b.orderIndex || a.label.localeCompare(b.label),
  );
}
