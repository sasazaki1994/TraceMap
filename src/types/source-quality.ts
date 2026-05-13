export type SourceQualityLevel = "strong" | "usable" | "limited" | "weak" | "unknown";

export type SourceFreshness = "fresh" | "stale" | "unknown";

export type SourceReachability =
  | "reachable"
  | "unreachable"
  | "invalid"
  | "unchecked" | "unknown";

export type SourceQualityAssessment = {
  sourceId: string;
  label: string;
  quality: SourceQualityLevel;
  freshness: SourceFreshness;
  reachability: SourceReachability;
  reasons: string[];
  warnings: string[];
  publishedAt?: string | null;
  checkedAt?: string | null;
  httpStatus?: number | null;
  isPrimaryLike?: boolean;
  isPrimarySource?: boolean;
  suggestedNextAction?: string;
  verificationStatus?: string | null;
  contentType?: string | null;
  finalUrl?: string | null;
  sourceCacheEntryId?: string | null;
  sourceFetchSnapshotId?: string | null;
  sourceType?: string | null;
  linkedClaimCount: number;
  hasSupportingQuote: boolean;
};

export type SourceQualitySignal = SourceQualityAssessment;
