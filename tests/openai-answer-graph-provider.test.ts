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

describe("realOpenAiAnswerGraphProvider", () => {
  const structuredPayload = {
    answer_title: "Test title",
    answer_content: "Test body.",
    claims: [{ id: "c1", summary: "Claim one." }],
    sources: [
      {
        id: "s1",
        label: "Example source",
        source_type: "web" as const,
        url: "https://example.com",
        excerpt: "This excerpt supports the answer.",
      },
    ],
    counterpoint_summary: "Alternative view.",
    alert: { level: "info" as const, message: "Heuristic note." },
  };

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
          message: { content: JSON.stringify(structuredPayload) },
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
    expect(result.payload.sources).toHaveLength(1);
    expect(result.payload.sources[0].label).toBe("Example source");
    expect(result.payload.evidence?.claim.graphNodeId).toBe("node_answer");
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
