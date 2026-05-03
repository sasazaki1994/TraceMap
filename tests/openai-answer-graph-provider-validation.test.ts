import { describe, expect, it } from "vitest";

const validPayload = {
  sufficient_grounding: true,
  answer_title: "OpenAI validation title",
  answer_content: "Grounded answer.",
  claims: [
    {
      id: "c1",
      summary: "Claim one.",
      supported_by_source_ids: ["s1"],
    },
  ],
  sources: [
    {
      id: "s1",
      label: "Source one",
      source_type: "web" as const,
      url: "https://example.com/source-one",
      excerpt: "Source one excerpt.",
    },
    {
      id: "s2",
      label: "Source two",
      source_type: "web" as const,
      url: "https://example.com/source-two",
      excerpt: "Source two excerpt.",
    },
  ],
};

describe("OpenAI provider validation helpers", () => {
  it("fails when sufficient_grounding is false", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = validateStructuredAnswerPayload({
      ...validPayload,
      sufficient_grounding: false,
    });

    expect(result.kind).toBe("failure");
  });

  it("fails when fewer than two sources are provided", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = validateStructuredAnswerPayload({
      ...validPayload,
      sources: [validPayload.sources[0]],
    });

    expect(result.kind).toBe("failure");
  });

  it("fails when no claims are provided", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = validateStructuredAnswerPayload({
      ...validPayload,
      claims: [],
    });

    expect(result.kind).toBe("failure");
  });

  it("fails and mentions an unknown source id", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = validateStructuredAnswerPayload({
      ...validPayload,
      claims: [
        {
          id: "c1",
          summary: "Claim one.",
          supported_by_source_ids: ["missing-source"],
        },
      ],
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.errorMessage).toContain("missing-source");
    }
  });

  it("normalizes a valid payload and preserves claim-source references", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = validateStructuredAnswerPayload(validPayload);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }

    const sourceIds = new Set(result.normalizedPayload.sources.map((source) => source.id));
    expect(result.normalizedPayload.claims).toHaveLength(1);
    expect(
      result.normalizedPayload.claims.every((claim) =>
        claim.supported_by_source_ids.every((sourceId) => sourceIds.has(sourceId)),
      ),
    ).toBe(true);
  });

  it("does not require UI-only style fields from valid payloads", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = validateStructuredAnswerPayload(validPayload);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }

    expect(JSON.stringify(result.normalizedPayload)).not.toMatch(
      /coordinates|color|style|layout/i,
    );
  });
});
