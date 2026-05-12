import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { SourceQualityInspection } from "@/types/source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const FRESH_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;
const STRONG_TYPES = ["primary", "official", "government", "company", "company_ir", "academic"];

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

function classifyReachability(source: RunSourceView): SourceQualityInspection["reachability"] {
  if (!source.url) return "unknown";
  if (!isValidHttpUrl(source.url)) return "invalid";
  if (source.verificationStatus === "invalid") return "invalid";
  if (source.verificationStatus === "unreachable") return "unreachable";
  if (typeof source.httpStatus === "number") return source.httpStatus >= 400 ? "unreachable" : "reachable";
  if (source.verificationStatus === "verified") return "reachable";
  if (source.checkedAt || source.verificationStatus === "unverified") return "unchecked";
  return "unknown";
}

function classifyFreshness(source: RunSourceView, now: Date): SourceQualityInspection["freshness"] {
  const published = parseDate(source.publishedAt);
  if (!published) return "unknown";
  const ageDays = (now.getTime() - published.getTime()) / DAY_MS;
  return ageDays <= FRESH_DAYS ? "fresh" : "stale";
}

export function buildSourceQualityInspections(params: { sources: RunSourceView[]; claimSupports?: RunEvidenceClaim[]; now?: Date; }): SourceQualityInspection[] {
  const claims = params.claimSupports ?? [];
  const now = params.now ?? new Date();
  return params.sources.map((source) => {
    const supports = claims.flatMap((claim) => claim.supports.filter((support) => support.sourceId === source.id));
    const isPrimarySource = supports.some((support) => support.isPrimarySource);
    const hasSupportingQuote = supports.some((support) => Boolean(support.supportingQuote?.trim()));
    const linkedClaimCount = new Set(claims.filter((claim) => claim.supports.some((support) => support.sourceId === source.id)).map((claim) => claim.id)).size;

    const reachability = classifyReachability(source);
    const freshness = classifyFreshness(source, now);
    const normalizedType = (source.sourceType ?? "").toLowerCase();
    const knownType = normalizedType.length > 0 && normalizedType !== "note";
    const officialLike = STRONG_TYPES.some((value) => normalizedType.includes(value));

    const reasons: string[] = [];
    const warnings: string[] = [];

    if (reachability === "invalid") reasons.push("Source URL is invalid.");
    if (reachability === "unreachable") reasons.push("Source URL is unreachable.");
    if (freshness === "unknown") reasons.push("Publication or update date is unavailable.");
    if (freshness === "stale") warnings.push("Source may be stale for time-sensitive investigations.");
    if (!hasSupportingQuote && linkedClaimCount > 0) warnings.push("No supporting quote is attached.");

    let quality: SourceQualityInspection["quality"] = "unknown";
    if (reachability === "invalid" || reachability === "unreachable" || (freshness === "stale" && !knownType)) {
      quality = "weak";
    } else if (officialLike && (source.publishedAt || source.checkedAt) && reachability !== "unchecked") {
      quality = "strong";
    } else if (knownType && (source.publishedAt || source.checkedAt) && warnings.length === 0) {
      quality = "usable";
    } else if (source.url) {
      quality = "limited";
    }

    const suggestedNextAction =
      reachability === "unchecked"
        ? "Open the source and confirm it is accessible."
        : freshness === "unknown"
          ? "Verify publication date and recency."
          : quality === "weak"
            ? "Add an official or independent supporting source."
            : !hasSupportingQuote && linkedClaimCount > 0
              ? "Attach a supporting quote or cited passage."
              : undefined;

    return { sourceId: source.id, label: source.label, quality, freshness, reachability, reasons: reasons.length ? reasons : ["Derived from available metadata signals."], warnings, suggestedNextAction, isPrimarySource, sourceType: source.sourceType ?? null, publishedAt: source.publishedAt ?? null, checkedAt: source.checkedAt ?? null, httpStatus: source.httpStatus ?? null, linkedClaimCount, hasSupportingQuote, verificationStatus: source.verificationStatus ?? null, contentType: source.contentType ?? null, finalUrl: source.finalUrl ?? null, sourceCacheEntryId: source.sourceCacheEntryId ?? null, sourceFetchSnapshotId: source.sourceFetchSnapshotId ?? null };
  });
}

export const buildSourceQuality = buildSourceQualityInspections;
