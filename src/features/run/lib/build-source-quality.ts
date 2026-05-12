import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { SourceQualityAssessment } from "@/types/source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_DAYS = 540;
const PRIMARY_LIKE_KEYWORDS = ["official", "government", "academic", "company", "document"];

function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function classifyReachability(source: RunSourceView): SourceQualityAssessment["reachability"] {
  if (!source.url) return "unchecked";
  if (!isValidHttpUrl(source.url)) return "invalid";
  if (typeof source.httpStatus !== "number") return "unchecked";
  if (source.httpStatus >= 200 && source.httpStatus <= 299) return "reachable";
  if (source.httpStatus >= 300 && source.httpStatus <= 599) return "unreachable";
  return "unchecked";
}

function classifyFreshness(source: RunSourceView, now: Date): SourceQualityAssessment["freshness"] {
  if (!source.publishedAt) return "unknown";
  const publishedAt = new Date(source.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) return "unknown";
  const ageDays = (now.getTime() - publishedAt.getTime()) / DAY_MS;
  return ageDays > STALE_DAYS ? "stale" : "fresh";
}

export function buildSourceQuality(params: {
  sources: RunSourceView[];
  claimSupports?: RunEvidenceClaim[];
  now?: Date;
}): SourceQualityAssessment[] {
  const now = params.now ?? new Date();
  const claims = params.claimSupports ?? [];

  return params.sources.map((source) => {
    const supports = claims.flatMap((claim) =>
      claim.supports.filter((support) => support.sourceId === source.id),
    );
    const supportingQuoteCount = supports.filter((s) => s.supportingQuote?.trim()).length;
    const hasSupportingQuote = supportingQuoteCount > 0;
    const hasContradiction = supports.some((s) => Boolean(s.contradictionNote?.trim()));
    const linkedClaimCount = claims.filter((claim) =>
      claim.supports.some((support) => support.sourceId === source.id),
    ).length;

    const lowerType = source.sourceType.toLowerCase();
    const isPrimaryLike =
      supports.some((s) => s.isPrimarySource) ||
      PRIMARY_LIKE_KEYWORDS.some((keyword) => lowerType.includes(keyword));

    const reachability = classifyReachability(source);
    const freshness = classifyFreshness(source, now);

    const reasons: string[] = [];
    const warnings: string[] = [];

    if (isPrimaryLike) reasons.push("Primary or official-looking source signal is present.");
    if (hasSupportingQuote) reasons.push(`Supporting quotes found in ${supportingQuoteCount} claim support(s).`);
    if (freshness === "fresh") reasons.push("Publication date is within freshness threshold.");
    if (freshness === "stale") {
      reasons.push("Publication date is older than freshness threshold.");
      warnings.push("This source may be stale for time-sensitive investigations.");
    }
    if (freshness === "unknown") reasons.push("Publication date is missing or invalid.");
    if (reachability === "reachable") reasons.push("Recent reachability check succeeded.");
    if (reachability === "unchecked") reasons.push("Reachability check metadata is incomplete.");
    if (reachability === "unreachable") {
      reasons.push("Reachability check failed.");
      warnings.push("Source could not be reached during URL check.");
    }
    if (reachability === "invalid") {
      reasons.push("Source URL is invalid.");
      warnings.push("Invalid URL cannot be verified.");
    }
    if (hasContradiction) warnings.push("Contradiction note exists in claim support.");

    let quality: SourceQualityAssessment["quality"] = "limited";
    if (reachability === "invalid" || reachability === "unreachable" || hasContradiction) {
      quality = "weak";
    } else if (
      isPrimaryLike &&
      reachability === "reachable" &&
      freshness === "fresh" &&
      hasSupportingQuote
    ) {
      quality = "strong";
    } else if (isPrimaryLike || hasSupportingQuote) {
      quality = "usable";
    } else if (freshness === "unknown" || reachability === "unchecked") {
      quality = "limited";
    }

    return {
      sourceId: source.id,
      label: source.label,
      quality,
      freshness,
      reachability,
      reasons: reasons.length > 0 ? reasons : ["Assessment derived from available source metadata."],
      warnings,
      publishedAt: source.publishedAt ?? null,
      checkedAt: source.checkedAt ?? null,
      httpStatus: source.httpStatus ?? null,
      isPrimaryLike,
      isPrimarySource: supports.some((s) => s.isPrimarySource),
      suggestedNextAction: reachability === "unchecked" ? "Check source reachability." : freshness === "unknown" ? "Verify publication date." : undefined,
      verificationStatus: source.verificationStatus ?? null,
      contentType: source.contentType ?? null,
      finalUrl: source.finalUrl ?? null,
      sourceCacheEntryId: source.sourceCacheEntryId ?? null,
      sourceFetchSnapshotId: source.sourceFetchSnapshotId ?? null,
      sourceType: source.sourceType,
      linkedClaimCount,
      hasSupportingQuote,
    };
  });
}


export const buildSourceQualityInspections = buildSourceQuality;
