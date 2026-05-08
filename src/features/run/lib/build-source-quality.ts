import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { SourceQualitySignal } from "@/types/source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const FRESHNESS_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toReachability(source: RunSourceView): SourceQualitySignal["reachabilityStatus"] {
  if (source.verificationStatus === "unreachable") return "unreachable";
  if (source.verificationStatus === "invalid") return "invalid";
  if (source.verificationStatus === "verified") return "reachable";
  if (typeof source.httpStatus === "number" && source.httpStatus >= 200 && source.httpStatus <= 399) {
    return "reachable";
  }
  return "unchecked";
}

export function buildSourceQuality(params: {
  sources: RunSourceView[];
  evidenceClaims: RunEvidenceClaim[];
  now?: Date;
}): SourceQualitySignal[] {
  const now = params.now ?? new Date();

  return params.sources.map((source) => {
    const supports = params.evidenceClaims.flatMap((claim) =>
      claim.supports.filter((support) => support.sourceId === source.id),
    );
    const linkedClaimCount = new Set(
      params.evidenceClaims
        .filter((claim) => claim.supports.some((support) => support.sourceId === source.id))
        .map((claim) => claim.id),
    ).size;
    const isPrimarySource = supports.some((support) => support.isPrimarySource);
    const hasSupportingQuote = supports.some((support) => Boolean(support.supportingQuote?.trim()));
    const reachabilityStatus = toReachability(source);

    const referenceDate = parseDate(source.publishedAt) ?? parseDate(source.checkedAt);
    const freshnessStatus = !referenceDate
      ? "unknown"
      : (now.getTime() - referenceDate.getTime()) / DAY_MS <= FRESHNESS_DAYS
        ? "fresh"
        : "stale";

    let qualityLevel: SourceQualitySignal["qualityLevel"] = "usable";
    if (reachabilityStatus === "unreachable" || reachabilityStatus === "invalid" || freshnessStatus === "stale" || linkedClaimCount === 0) {
      qualityLevel = "weak";
    } else if (reachabilityStatus === "unchecked" || freshnessStatus === "unknown") {
      qualityLevel = "limited";
    } else if (reachabilityStatus === "reachable" && freshnessStatus === "fresh" && isPrimarySource && hasSupportingQuote) {
      qualityLevel = "strong";
    }

    const reasons: string[] = [];
    const suggestedNextActions: string[] = [];

    if (reachabilityStatus === "unreachable") {
      reasons.push("Source URL was marked unreachable.");
      suggestedNextActions.push("Re-check source URL.");
    }
    if (reachabilityStatus === "invalid") {
      reasons.push("Source URL was marked invalid.");
      suggestedNextActions.push("Re-check source URL.");
    }
    if (freshnessStatus === "stale") {
      reasons.push("Source publication/check date appears stale.");
      suggestedNextActions.push("Verify publication date and recency.");
    }
    if (freshnessStatus === "unknown") {
      reasons.push("Publication/check date is unknown.");
      suggestedNextActions.push("Verify publication date and recency.");
    }
    if (!isPrimarySource) {
      reasons.push("Primary or official source confirmation is limited.");
      suggestedNextActions.push("Locate a primary or official source.");
    }
    if (!hasSupportingQuote && linkedClaimCount > 0) {
      reasons.push("Source supports claims without a direct quote.");
      suggestedNextActions.push("Locate supporting quote or cited passage.");
    }
    if (linkedClaimCount === 0) {
      reasons.push("Source is not linked to any claim.");
      suggestedNextActions.push("Remove unused source from report if it does not support any claim.");
    }

    return {
      sourceId: source.id,
      label: source.label,
      qualityLevel,
      freshnessStatus,
      reachabilityStatus,
      isPrimarySource,
      linkedClaimCount,
      hasPublishedAt: Boolean(source.publishedAt),
      hasSupportingQuote,
      verificationStatus: source.verificationStatus ?? null,
      httpStatus: source.httpStatus ?? null,
      checkedAt: source.checkedAt ?? null,
      publishedAt: source.publishedAt ?? null,
      contentType: source.contentType ?? null,
      finalUrl: source.finalUrl ?? null,
      sourceCacheEntryId: source.sourceCacheEntryId ?? null,
      sourceFetchSnapshotId: source.sourceFetchSnapshotId ?? null,
      reasons,
      suggestedNextActions: [...new Set(suggestedNextActions)],
    };
  });
}
