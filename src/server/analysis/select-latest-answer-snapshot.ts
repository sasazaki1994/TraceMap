type SourceSnapshotForRunViewInput = {
  id: string;
  label: string;
  url: string | null;
  excerpt: string | null;
  sourceType: "web" | "document" | "note";
  publishedAt?: Date | string | null;
};

type AnswerSnapshotWithSources = {
  sourceSnapshots: SourceSnapshotForRunViewInput[];
};

type SourceSnapshotForRunView = Omit<SourceSnapshotForRunViewInput, "publishedAt"> & {
  publishedAt: string | null;
};

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
        publishedAt:
          source.publishedAt instanceof Date
            ? source.publishedAt.toISOString()
            : (source.publishedAt ?? null),
      })) ?? [],
  };
}
