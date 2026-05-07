import { describe, expect, it } from "vitest";

import { mockAnswerGraphProvider } from "@/server/analysis/providers/mock-answer-graph-provider";

describe("mockAnswerGraphProvider source candidates", () => {
  it("uses sourceCandidates when provided", async () => {
    const result = await mockAnswerGraphProvider.generateAnswerGraph({
      question: "q",
      sourceCandidates: [
        {
          normalizedUrl: "https://example.com/a",
          originalUrl: "https://example.com/a",
          label: "Example A",
          excerpt: "A excerpt",
        },
      ],
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.payload.sources[0]?.label).toBe("Example A");
    expect(result.payload.sources[0]?.url).toBe("https://example.com/a");
  });
});
