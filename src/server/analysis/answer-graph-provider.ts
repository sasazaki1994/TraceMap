import type {
  GenerateAnswerGraphInput,
  GenerateAnswerGraphResult,
} from "@/types/answer-graph-generation";

/**
 * 将来の実プロバイダー（LLM / retrieval）差し替え境界。mock / stub実装は
 * `src/server/analysis/providers/` 配下に置く。
 */
export type AnswerGraphProvider = {
  readonly id: "mock" | "stub" | "openai";
  readonly modelLabel?: string;
  generateAnswerGraph(
    input: GenerateAnswerGraphInput,
  ): Promise<GenerateAnswerGraphResult>;
};
