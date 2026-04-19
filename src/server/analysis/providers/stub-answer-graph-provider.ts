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
 * Placeholder provider: no API keys, no external calls. Produces a minimal completed run
 * so the real-provider slot can be wired later without changing the persistence path.
 */
export const stubAnswerGraphProvider: AnswerGraphProvider = {
  id: "stub",
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
