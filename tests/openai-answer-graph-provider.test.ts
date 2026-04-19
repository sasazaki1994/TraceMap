import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createCompletion = vi.fn();

vi.mock("openai", () => ({
  __esModule: true,
  default: class OpenAIMock {
    chat = {
      completions: {
        create: createCompletion,
      },
    };
  },
}));

const baseStructured = {
  sufficient_grounding: true as const,
  answer_title: "Test title",
  answer_content: "Test body.",
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
      label: "Example source one",
      source_type: "web" as const,
      url: "https://example.com/a",
      excerpt: "Excerpt one supports the answer.",
    },
    {
      id: "s2",
      label: "Example source two",
      source_type: "web" as const,
      url: "https://example.com/b",
      excerpt: "Excerpt two adds context.",
    },
  ],
  counterpoint_summary: "Alternative view.",
  alert: { level: "info" as const, message: "Heuristic note." },
};

describe("isValidPublicHttpUrl", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts http and https with host", async () => {
    const { isValidPublicHttpUrl } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    expect(isValidPublicHttpUrl("https://example.com/path")).toBe(true);
    expect(isValidPublicHttpUrl("http://example.org/")).toBe(true);
  });

  it("rejects non-http(s), empty, or invalid", async () => {
    const { isValidPublicHttpUrl } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    expect(isValidPublicHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidPublicHttpUrl("")).toBe(false);
    expect(isValidPublicHttpUrl("ftp://x.com/")).toBe(false);
    expect(isValidPublicHttpUrl("not a url")).toBe(false);
  });
});

describe("validateStructuredAnswerPayload", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns failure when sufficient_grounding is false", async () => {
    const { validateStructuredAnswerPayload, OPENAI_INSUFFICIENT_GROUNDING_MESSAGE } =
      await import("@/server/analysis/providers/openai-answer-graph-provider");
    const result = validateStructuredAnswerPayload({
      ...baseStructured,
      sufficient_grounding: false,
    });
    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.errorMessage).toBe(OPENAI_INSUFFICIENT_GROUNDING_MESSAGE);
    }
  });

  it("returns failure when fewer than two sources", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    const result = validateStructuredAnswerPayload({
      ...baseStructured,
      sources: [baseStructured.sources[0]],
    });
    expect(result.kind).toBe("failure");
  });

  it("returns failure on invalid URL", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    const result = validateStructuredAnswerPayload({
      ...baseStructured,
      sources: [
        { ...baseStructured.sources[0], url: "javascript:void(0)" },
        baseStructured.sources[1],
      ],
    });
    expect(result.kind).toBe("failure");
  });

  it("returns failure when claim references unknown source id", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    const result = validateStructuredAnswerPayload({
      ...baseStructured,
      claims: [
        {
          id: "c1",
          summary: "X",
          supported_by_source_ids: ["missing"],
        },
      ],
    });
    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.errorMessage).toContain("unknown source id");
    }
  });

  it("returns ok with normalized URLs when valid", async () => {
    const { validateStructuredAnswerPayload } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    const result = validateStructuredAnswerPayload(baseStructured);
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.normalizedSources).toHaveLength(2);
      expect(result.normalizedSources[0].url).toBe("https://example.com/a");
    }
  });
});

describe("realOpenAiAnswerGraphProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TRACEMAP_OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.TRACEMAP_OPENAI_MODEL;
    delete process.env.TRACEMAP_OPENAI_TIMEOUT_MS;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns failure without calling OpenAI when no API key is set", async () => {
    const { realOpenAiAnswerGraphProvider } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = await realOpenAiAnswerGraphProvider.generateAnswerGraph({
      question: "Why test?",
    });

    expect(result.kind).toBe("failure");
    expect(createCompletion).not.toHaveBeenCalled();
  });

  it("returns success with payload compatible with persistGeneratedAnswerGraph", async () => {
    process.env.TRACEMAP_OPENAI_API_KEY = "sk-test";
    createCompletion.mockResolvedValue({
      choices: [
        {
          message: { content: JSON.stringify(baseStructured) },
        },
      ],
    });

    const { realOpenAiAnswerGraphProvider } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );

    const result = await realOpenAiAnswerGraphProvider.generateAnswerGraph({
      question: "What is 2+2?",
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") {
      return;
    }
    expect(result.payload.answer.graphJson.version).toBe(1);
    expect(result.payload.answer.graphJson.nodes.some((n) => n.kind === "answer")).toBe(
      true,
    );
    expect(result.payload.sources).toHaveLength(2);
    expect(result.payload.sources[0].label).toBe("Example source one");
    expect(result.payload.sources[0].url).toBe("https://example.com/a");
    expect(result.payload.evidence?.claim.graphNodeId).toBe("node_source_0");
    expect(result.payload.evidence?.claim.summary).toContain("Claim one");
    expect(result.payload.evidence?.claim.summary).toContain("Example source one");
  });

  it("returns failure when sufficient_grounding is false", async () => {
    process.env.TRACEMAP_OPENAI_API_KEY = "sk-test";
    createCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...baseStructured,
              sufficient_grounding: false,
            }),
          },
        },
      ],
    });

    const { realOpenAiAnswerGraphProvider, OPENAI_INSUFFICIENT_GROUNDING_MESSAGE } =
      await import("@/server/analysis/providers/openai-answer-graph-provider");
    const result = await realOpenAiAnswerGraphProvider.generateAnswerGraph({
      question: "Q",
    });
    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.errorMessage).toBe(OPENAI_INSUFFICIENT_GROUNDING_MESSAGE);
    }
  });

  it("returns failure on empty completion", async () => {
    process.env.TRACEMAP_OPENAI_API_KEY = "sk-test";
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const { realOpenAiAnswerGraphProvider } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    const result = await realOpenAiAnswerGraphProvider.generateAnswerGraph({
      question: "Q",
    });
    expect(result.kind).toBe("failure");
  });

  it("returns failure when the API throws", async () => {
    process.env.TRACEMAP_OPENAI_API_KEY = "sk-test";
    createCompletion.mockRejectedValue(new Error("rate limited"));

    const { realOpenAiAnswerGraphProvider } = await import(
      "@/server/analysis/providers/openai-answer-graph-provider"
    );
    const result = await realOpenAiAnswerGraphProvider.generateAnswerGraph({
      question: "Q",
    });
    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.errorMessage).toContain("rate limited");
    }
  });
});
