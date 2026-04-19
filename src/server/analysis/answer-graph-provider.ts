import type {
  GenerateAnswerGraphInput,
  GenerateAnswerGraphResult,
} from "@/types/answer-graph-generation";

/**
 * Boundary for future real LLM / retrieval pipelines. Mock and stub implementations
 * live under `src/server/analysis/providers/`.
 */
export type AnswerGraphProvider = {
  readonly id: "mock" | "stub";
  generateAnswerGraph(
    input: GenerateAnswerGraphInput,
  ): Promise<GenerateAnswerGraphResult>;
};
