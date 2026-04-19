import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveAnswerGraphProvider", () => {
  const original = process.env.TRACEMAP_ANSWER_GRAPH_PROVIDER;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TRACEMAP_ANSWER_GRAPH_PROVIDER;
    } else {
      process.env.TRACEMAP_ANSWER_GRAPH_PROVIDER = original;
    }
    vi.resetModules();
  });

  it("defaults to mock provider", async () => {
    delete process.env.TRACEMAP_ANSWER_GRAPH_PROVIDER;
    const { resolveAnswerGraphProvider } = await import(
      "@/server/analysis/resolve-answer-graph-provider"
    );
    expect(resolveAnswerGraphProvider().id).toBe("mock");
  });

  it("selects stub when TRACEMAP_ANSWER_GRAPH_PROVIDER is stub", async () => {
    process.env.TRACEMAP_ANSWER_GRAPH_PROVIDER = "stub";
    const { resolveAnswerGraphProvider } = await import(
      "@/server/analysis/resolve-answer-graph-provider"
    );
    expect(resolveAnswerGraphProvider().id).toBe("stub");
  });

  it("selects openai when TRACEMAP_ANSWER_GRAPH_PROVIDER is openai", async () => {
    process.env.TRACEMAP_ANSWER_GRAPH_PROVIDER = "openai";
    const { resolveAnswerGraphProvider } = await import(
      "@/server/analysis/resolve-answer-graph-provider"
    );
    expect(resolveAnswerGraphProvider().id).toBe("openai");
  });
});
