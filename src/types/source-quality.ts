export type SourceQualityLevel = "strong" | "usable" | "limited" | "weak";

export type SourceFreshnessLevel = "fresh" | "possibly_stale" | "stale" | "unknown";

export type SourceReachabilityLevel =
  | "reachable"
  | "unreachable"
  | "invalid"
  | "unchecked";

export type SourceQualityInspection = {
  sourceId: string;
  label: string;
  quality: SourceQualityLevel;
  freshness: SourceFreshnessLevel;
  reachability: SourceReachabilityLevel;
  reasons: string[];
  suggestedAction?: string;
  isPrimarySource?: boolean;
  sourceType?: string | null;
  publishedAt?: string | null;
  checkedAt?: string | null;
  httpStatus?: number | null;
  linkedClaimCount: number;
  hasSupportingQuote: boolean;
  verificationStatus?: string | null;
  contentType?: string | null;
  finalUrl?: string | null;
  sourceCacheEntryId?: string | null;
  sourceFetchSnapshotId?: string | null;
};

export type SourceQualitySignal = SourceQualityInspection;
