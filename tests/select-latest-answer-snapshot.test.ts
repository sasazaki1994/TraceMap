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
        },
        {
          id: "src-new-b",
          label: "New source B",
          url: null,
          excerpt: null,
          sourceType: "note" as const,
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
      },
      {
        id: "src-new-b",
        label: "New source B",
        url: null,
        excerpt: null,
        sourceType: "note",
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
