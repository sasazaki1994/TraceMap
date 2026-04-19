import type { AnswerGraphProvider } from "@/server/analysis/answer-graph-provider";
import { mockAnswerGraphProvider } from "@/server/analysis/providers/mock-answer-graph-provider";
import { realOpenAiAnswerGraphProvider } from "@/server/analysis/providers/openai-answer-graph-provider";
import { stubAnswerGraphProvider } from "@/server/analysis/providers/stub-answer-graph-provider";

export type AnswerGraphProviderId = "mock" | "stub" | "openai";

/**
 * Selects the answer-graph provider without requiring production AI credentials.
 * `TRACEMAP_ANSWER_GRAPH_PROVIDER` — `mock` (default) | `stub` | `openai`.
 */
export function resolveAnswerGraphProvider(): AnswerGraphProvider {
  const raw = process.env.TRACEMAP_ANSWER_GRAPH_PROVIDER?.trim().toLowerCase();

  if (raw === "stub") {
    return stubAnswerGraphProvider;
  }

  if (raw === "openai") {
    return realOpenAiAnswerGraphProvider;
  }

  return mockAnswerGraphProvider;
}
