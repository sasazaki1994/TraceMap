type SourceSnapshotForRunViewInput = {
  id: string;
  label: string;
  url: string | null;
  excerpt: string | null;
  sourceType: "web" | "document" | "note";
  publishedAt?: Date | string | null;
  verificationStatus?: "verified" | "unverified" | "unreachable" | "invalid";
  checkedAt?: Date | string | null;
  httpStatus?: number | null;
  finalUrl?: string | null;
  contentType?: string | null;
  sourceCacheEntryId?: string | null;
  sourceFetchSnapshotId?: string | null;
};

type AnswerSnapshotWithSources = {
  sourceSnapshots: SourceSnapshotForRunViewInput[];
};

type SourceSnapshotForRunView = Omit<SourceSnapshotForRunViewInput, "publishedAt"> & {
  publishedAt: string | null;
  checkedAt: string | null;
};

function toIsoString(value: Date | string | null | undefined): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value ?? null;
}

/**
 * Run/share pages render one answer snapshot at a time.
 * Keep the source list scoped to that same latest snapshot so graph/evidence/source data stay aligned.
 */
export function selectLatestAnswerSnapshotForView<
  TAnswer extends AnswerSnapshotWithSources,
>(answerSnapshots: TAnswer[]): {
  answer: TAnswer | null;
  sources: SourceSnapshotForRunView[];
} {
  const answer = answerSnapshots[0] ?? null;

  return {
    answer,
    sources:
      answer?.sourceSnapshots.map((source) => ({
        id: source.id,
        label: source.label,
        url: source.url,
        excerpt: source.excerpt,
        sourceType: source.sourceType,
        publishedAt: toIsoString(source.publishedAt),
        verificationStatus: source.verificationStatus ?? "unverified",
        checkedAt: toIsoString(source.checkedAt),
        httpStatus: source.httpStatus ?? null,
        finalUrl: source.finalUrl ?? null,
        contentType: source.contentType ?? null,
        sourceCacheEntryId: source.sourceCacheEntryId ?? null,
        sourceFetchSnapshotId: source.sourceFetchSnapshotId ?? null,
      })) ?? [],
  };
}
