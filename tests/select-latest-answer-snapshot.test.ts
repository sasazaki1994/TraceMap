import { describe, expect, it } from "vitest";

import { selectLatestAnswerSnapshotForView } from "@/server/analysis/select-latest-answer-snapshot";

describe("selectLatestAnswerSnapshotForView", () => {
  it("returns the latest answer snapshot and only its own sources", () => {
    const latest = {
      id: "answer-new",
      sourceSnapshots: [
        {
          id: "src-new-a",
          label: "New source A",
          url: "https://example.com/new-a",
          excerpt: "latest excerpt",
          sourceType: "web" as const,
          publishedAt: new Date("2026-01-02T00:00:00.000Z"),
          verificationStatus: "verified" as const,
          checkedAt: new Date("2026-01-03T00:00:00.000Z"),
          httpStatus: 200,
          finalUrl: "https://example.com/final-new-a",
          contentType: "text/html",
          sourceCacheEntryId: "cache-1",
          sourceFetchSnapshotId: "fetch-1",
        },
        {
          id: "src-new-b",
          label: "New source B",
          url: null,
          excerpt: null,
          sourceType: "note" as const,
          publishedAt: null,
        },
      ],
    };
    const older = {
      id: "answer-old",
      sourceSnapshots: [
        {
          id: "src-old-a",
          label: "Old source A",
          url: "https://example.com/old-a",
          excerpt: "old excerpt",
          sourceType: "document" as const,
          publishedAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    };

    const result = selectLatestAnswerSnapshotForView([latest, older]);

    expect(result.answer).toBe(latest);
    expect(result.sources).toEqual([
      {
        id: "src-new-a",
        label: "New source A",
        url: "https://example.com/new-a",
        excerpt: "latest excerpt",
        sourceType: "web",
        publishedAt: "2026-01-02T00:00:00.000Z",
        verificationStatus: "verified",
        checkedAt: "2026-01-03T00:00:00.000Z",
        httpStatus: 200,
        finalUrl: "https://example.com/final-new-a",
        contentType: "text/html",
        sourceCacheEntryId: "cache-1",
        sourceFetchSnapshotId: "fetch-1",
      },
      {
        id: "src-new-b",
        label: "New source B",
        url: null,
        excerpt: null,
        sourceType: "note",
        publishedAt: null,
        verificationStatus: "unverified",
        checkedAt: null,
        httpStatus: null,
        finalUrl: null,
        contentType: null,
        sourceCacheEntryId: null,
        sourceFetchSnapshotId: null,
      },
    ]);
    expect(result.sources.some((source) => source.id === "src-old-a")).toBe(false);
  });

  it("returns null and an empty source list when there is no answer snapshot", () => {
    const result = selectLatestAnswerSnapshotForView([]);

    expect(result.answer).toBeNull();
    expect(result.sources).toEqual([]);
  });
});
