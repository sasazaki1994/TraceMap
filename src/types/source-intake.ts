export type SourceCandidate = {
  normalizedUrl: string;
  originalUrl: string;
  finalUrl?: string | null;
  label?: string | null;
  excerpt?: string | null;
  contentType?: string | null;
  httpStatus?: number | null;
  fetchedAt?: Date | null;
  sourceCacheEntryId?: string | null;
  sourceFetchSnapshotId?: string | null;
  fetchErrorMessage?: string | null;
};

export type SourceIntakeResult = {
  candidates: SourceCandidate[];
  ignoredUrls: Array<{ url: string; reason: string }>;
};
