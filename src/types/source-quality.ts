export type SourceFreshnessStatus = "fresh" | "stale" | "unknown";

export type SourceReachabilityStatus =
  | "reachable"
  | "unreachable"
  | "invalid"
  | "unchecked";

export type SourceQualityLevel = "strong" | "usable" | "limited" | "weak";

export type SourceQualitySignal = {
  sourceId: string;
  label: string;
  qualityLevel: SourceQualityLevel;
  freshnessStatus: SourceFreshnessStatus;
  reachabilityStatus: SourceReachabilityStatus;
  isPrimarySource: boolean;
  linkedClaimCount: number;
  hasPublishedAt: boolean;
  hasSupportingQuote: boolean;
  verificationStatus?: string | null;
  httpStatus?: number | null;
  checkedAt?: string | null;
  publishedAt?: string | null;
  contentType?: string | null;
  finalUrl?: string | null;
  sourceCacheEntryId?: string | null;
  sourceFetchSnapshotId?: string | null;
  reasons: string[];
  suggestedNextActions: string[];
};
