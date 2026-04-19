import type { AnswerGraphProvider } from "@/server/analysis/answer-graph-provider";
import { answerGraphJsonSchema, type AnswerGraphJson } from "@/types/answer-graph";
import type {
  GenerateAnswerGraphInput,
  GenerateAnswerGraphResult,
} from "@/types/answer-graph-generation";

/** Stable prefix so Playwright can assert the mock answer region. */
export const MOCK_ANSWER_LEAD = "Mock trace snapshot";

function buildMockGraph(params: {
  questionPreview: string;
  sourceIds: [string, string, string];
}): AnswerGraphJson {
  const graph: AnswerGraphJson = {
    version: 1,
    nodes: [
      { id: "node_question", kind: "question", label: params.questionPreview },
      { id: "node_answer", kind: "answer", label: "Synthesis (mock)" },
      {
        id: "node_source_a",
        kind: "source",
        label: "Interpretability survey (mock)",
        sourceSnapshotId: params.sourceIds[0],
      },
      {
        id: "node_source_b",
        kind: "source",
        label: "Retrieval quality notes (mock)",
        sourceSnapshotId: params.sourceIds[1],
      },
      {
        id: "node_source_c",
        kind: "source",
        label: "Product memo (mock)",
        sourceSnapshotId: params.sourceIds[2],
      },
    ],
    edges: [
      { id: "edge_q_a", from: "node_question", to: "node_answer" },
      {
        id: "edge_s0_a",
        from: "node_source_a",
        to: "node_answer",
        label: "supports",
      },
      {
        id: "edge_s1_a",
        from: "node_source_b",
        to: "node_answer",
        label: "supports",
      },
      {
        id: "edge_s2_a",
        from: "node_source_c",
        to: "node_answer",
        label: "supports",
      },
    ],
  };

  answerGraphJsonSchema.parse(graph);
  return graph;
}

/**
 * Mock pipeline: deterministic graph + evidence matching the current product slice.
 * Source IDs are placeholders; the DB writer replaces graph_json after inserts.
 */
export function buildMockAnswerGraphPayload(question: string): GenerateAnswerGraphResult {
  const preview =
    question.length > 120 ? `${question.slice(0, 117)}...` : question;

  const placeholderIds: [string, string, string] = [
    "__src_0__",
    "__src_1__",
    "__src_2__",
  ];
  const graph = buildMockGraph({
    questionPreview: preview,
    sourceIds: placeholderIds,
  });

  return {
    kind: "success",
    payload: {
      answer: {
        title: "Mock synthesis",
        model: "mock",
        content: `${MOCK_ANSWER_LEAD} — this run is generated locally without an LLM.\n\nQuestion:\n${question}\n\nSummary:\n- Evidence is mocked.\n- Source rows below mirror what a future pipeline would attach.\n- The graph_json field ties UI nodes to these snapshots.`,
        graphJson: graph,
      },
      sources: [
        {
          label: "Interpretability survey (mock)",
          sourceType: "web",
          url: "https://example.com/mock/interpretability",
          excerpt:
            "Mock excerpt: interpretability helps users trust outputs and debug failures.",
        },
        {
          label: "Retrieval quality notes (mock)",
          sourceType: "document",
          url: "https://example.com/mock/retrieval",
          excerpt:
            "Mock excerpt: retrieval quality changes which sources enter the graph.",
        },
        {
          label: "Product memo (mock)",
          sourceType: "note",
          url: null,
          excerpt: "Mock excerpt: internal note without a public URL.",
        },
      ],
      evidence: {
        claim: {
          summary:
            "The synthesis aggregates mocked sources into a single narrative (mock claim).",
          graphNodeId: "node_answer",
        },
        counterpoint: {
          summary:
            "Mock counterpoint: in production, conflicting sources would surface here (mock).",
        },
        alert: {
          level: "warning",
          message:
            "Mock alert: evidence is synthetic; do not rely on this output for decisions.",
        },
      },
    },
  };
}

export const mockAnswerGraphProvider: AnswerGraphProvider = {
  id: "mock",
  async generateAnswerGraph(input: GenerateAnswerGraphInput) {
    return buildMockAnswerGraphPayload(input.question);
  },
};
