import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { SourceQualityInspection } from "@/types/source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const POSSIBLY_STALE_DAYS = 365;
const STALE_DAYS = 730;
const DAY_MS = 24 * 60 * 60 * 1000;
const OFFICIAL_TYPES = ["official", "government", "company", "academic", "reference"];

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isOfficialLikeSourceType(sourceType: string | null | undefined): boolean {
  const normalized = (sourceType ?? "").toLowerCase();
  return OFFICIAL_TYPES.some((v) => normalized.includes(v));
}

function buildReachability(source: RunSourceView): SourceQualityInspection["reachability"] {
  if (source.verificationStatus === "invalid" || !isValidHttpUrl(source.url)) return "invalid";
  if (source.verificationStatus === "unreachable") return "unreachable";
  if (typeof source.httpStatus === "number") return source.httpStatus >= 400 ? "unreachable" : "reachable";
  if (source.verificationStatus === "verified") return "reachable";
  return "unchecked";
}

function buildFreshness(source: RunSourceView, now: Date): SourceQualityInspection["freshness"] {
  const publishedDate = parseDate(source.publishedAt);
  if (!publishedDate) return "unknown";
  const ageDays = (now.getTime() - publishedDate.getTime()) / DAY_MS;
  if (ageDays >= STALE_DAYS) return "stale";
  if (ageDays >= POSSIBLY_STALE_DAYS) return "possibly_stale";
  if (isOfficialLikeSourceType(source.sourceType)) return "fresh";
  return "fresh";
}

export function buildSourceQualityInspections(params: {
  sources: RunSourceView[];
  claimSupports?: RunEvidenceClaim[];
  now?: Date;
}): SourceQualityInspection[] {
  const now = params.now ?? new Date();
  const claims = params.claimSupports ?? [];

  return params.sources.map((source) => {
    const supports = claims.flatMap((claim) => claim.supports.filter((support) => support.sourceId === source.id));
    const isPrimarySource = supports.some((support) => support.isPrimarySource);
    const hasSupportingQuote = supports.some((support) => Boolean(support.supportingQuote?.trim()));
    const hasContradiction = supports.some((support) => Boolean(support.contradictionNote?.trim()));
    const linkedClaimCount = new Set(
      claims.filter((claim) => claim.supports.some((support) => support.sourceId === source.id)).map((claim) => claim.id),
    ).size;

    const reachability = buildReachability(source);
    const freshness = buildFreshness(source, now);

    const reasons: string[] = [];
    if (reachability === "invalid") reasons.push("Source URL is invalid.");
    if (reachability === "unreachable") reasons.push("Source URL is unreachable.");
    if (freshness === "stale") reasons.push("Source publication date appears stale.");
    if (freshness === "possibly_stale") reasons.push("Source may be stale.");
    if (freshness === "unknown") reasons.push("Source publication date is unknown.");
    if (!hasSupportingQuote && linkedClaimCount > 0) reasons.push("No supporting quote is attached.");
    if (hasContradiction) reasons.push("Contradiction note exists for this support.");

    const unknownType = source.sourceType === "note";

    let quality: SourceQualityInspection["quality"] = "usable";
    if (reachability === "invalid" || reachability === "unreachable" || hasContradiction) {
      quality = "weak";
    } else if (!source.publishedAt || unknownType || !hasSupportingQuote) {
      quality = "limited";
    } else if ((isPrimarySource || isOfficialLikeSourceType(source.sourceType)) && freshness === "fresh") {
      quality = "strong";
    }

    const suggestedAction =
      quality === "weak"
        ? "Replace or re-check the source URL and supporting evidence."
        : freshness === "stale" || freshness === "possibly_stale"
          ? "Verify whether newer primary or official sources exist."
          : freshness === "unknown"
            ? "Verify publication date or source recency."
            : !hasSupportingQuote && linkedClaimCount > 0
              ? "Locate a direct supporting quote."
              : undefined;

    return {
      sourceId: source.id,
      label: source.label,
      quality,
      freshness,
      reachability,
      reasons: reasons.length > 0 ? reasons : ["No major caveats detected from available metadata."],
      suggestedAction,
      isPrimarySource,
      sourceType: source.sourceType,
      publishedAt: source.publishedAt ?? null,
      checkedAt: source.checkedAt ?? null,
      httpStatus: source.httpStatus ?? null,
      linkedClaimCount,
      hasSupportingQuote,
      verificationStatus: source.verificationStatus ?? null,
      contentType: source.contentType ?? null,
      finalUrl: source.finalUrl ?? null,
      sourceCacheEntryId: source.sourceCacheEntryId ?? null,
      sourceFetchSnapshotId: source.sourceFetchSnapshotId ?? null,
    };
  });
}

export const buildSourceQuality = buildSourceQualityInspections;
