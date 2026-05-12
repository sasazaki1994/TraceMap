export type SourceQualityLevel = "strong" | "usable" | "limited" | "weak" | "unknown";

export type SourceFreshnessLevel = "fresh" | "stale" | "unknown";

export type SourceReachabilityLevel =
  | "reachable"
  | "unreachable"
  | "invalid"
  | "unchecked"
  | "unknown";

export type SourceQualityInspection = {
  sourceId: string;
  label: string;
  quality: SourceQualityLevel;
  freshness: SourceFreshnessLevel;
  reachability: SourceReachabilityLevel;
  reasons: string[];
  warnings: string[];
  suggestedNextAction?: string;
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
