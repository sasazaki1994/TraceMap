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

  it("applies mode-based limits for fast/deep", async () => {
    const fast = await mockAnswerGraphProvider.generateAnswerGraph({
      question: "q",
      mode: "fast",
    });
    const deep = await mockAnswerGraphProvider.generateAnswerGraph({
      question: "q",
      mode: "deep",
    });

    expect(fast.kind).toBe("success");
    expect(deep.kind).toBe("success");
    if (fast.kind !== "success" || deep.kind !== "success") return;

    expect(fast.payload.evidence?.claims.length).toBeLessThanOrEqual(1);
    expect(deep.payload.evidence?.claims.length).toBeGreaterThanOrEqual(2);
    expect(fast.payload.sources.length).toBeLessThanOrEqual(3);
  });
});
