import type { AnswerGraphProvider } from "@/server/analysis/answer-graph-provider";
import { answerGraphJsonSchema, type AnswerGraphJson } from "@/types/answer-graph";
import type { GenerateAnswerGraphInput } from "@/types/answer-graph-generation";

const STUB_GRAPH: AnswerGraphJson = {
  version: 1,
  nodes: [
    {
      id: "node_question",
      kind: "question",
      label: "Question (stub)",
    },
    {
      id: "node_answer",
      kind: "answer",
      label: "Answer (stub — no model)",
    },
  ],
  edges: [{ id: "edge_q_a", from: "node_question", to: "node_answer" }],
};

answerGraphJsonSchema.parse(STUB_GRAPH);

/**
 * プレースホルダープロバイダー。API key不要・外部通信なしで最小構成のcompleted runを生成し、
 * 後で実プロバイダーへ差し替えても永続化経路を変えないようにする。
 */
export const stubAnswerGraphProvider: AnswerGraphProvider = {
  id: "stub",
  modelLabel: "stub",
  async generateAnswerGraph(input: GenerateAnswerGraphInput) {
    return {
      kind: "success",
      payload: {
        answer: {
          title: "Stub synthesis",
          model: "stub",
          content: `Stub trace — no LLM is configured for this environment.\n\nQuestion:\n${input.question}\n\nReplace TRACEMAP_ANSWER_GRAPH_PROVIDER or add a real provider implementation when ready.`,
          graphJson: STUB_GRAPH,
        },
        sources: [],
      },
    };
  },
};
