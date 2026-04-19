import type { Prisma } from "@prisma/client";

import { answerGraphJsonSchema, type AnswerGraphJson } from "@/types/answer-graph";

import { prisma } from "@/server/db/prisma";

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

export async function createMockAnalysisRun(question: string): Promise<string> {
  const preview =
    question.length > 120 ? `${question.slice(0, 117)}...` : question;

  return prisma.$transaction(async (tx) => {
    const run = await tx.analysisRun.create({
      data: {
        question,
        status: "completed",
      },
    });

    const answer = await tx.answerSnapshot.create({
      data: {
        analysisRunId: run.id,
        title: "Mock synthesis",
        model: "mock",
        content: `${MOCK_ANSWER_LEAD} — this run is generated locally without an LLM.\n\nQuestion:\n${question}\n\nSummary:\n- Evidence is mocked.\n- Source rows below mirror what a future pipeline would attach.\n- The graph_json field ties UI nodes to these snapshots.`,
      },
    });

    const s1 = await tx.sourceSnapshot.create({
      data: {
        analysisRunId: run.id,
        answerSnapshotId: answer.id,
        label: "Interpretability survey (mock)",
        sourceType: "web",
        url: "https://example.com/mock/interpretability",
        excerpt:
          "Mock excerpt: interpretability helps users trust outputs and debug failures.",
      },
    });

    const s2 = await tx.sourceSnapshot.create({
      data: {
        analysisRunId: run.id,
        answerSnapshotId: answer.id,
        label: "Retrieval quality notes (mock)",
        sourceType: "document",
        url: "https://example.com/mock/retrieval",
        excerpt:
          "Mock excerpt: retrieval quality changes which sources enter the graph.",
      },
    });

    const s3 = await tx.sourceSnapshot.create({
      data: {
        analysisRunId: run.id,
        answerSnapshotId: answer.id,
        label: "Product memo (mock)",
        sourceType: "note",
        url: null,
        excerpt: "Mock excerpt: internal note without a public URL.",
      },
    });

    const graph = buildMockGraph({
      questionPreview: preview,
      sourceIds: [s1.id, s2.id, s3.id],
    });

    await tx.answerSnapshot.update({
      where: { id: answer.id },
      data: { graphJson: graph as Prisma.InputJsonValue },
    });

    await tx.claim.create({
      data: {
        analysisRunId: run.id,
        body: "Mock claim: the synthesis above is supported by the listed sources and the graph links.",
      },
    });

    await tx.counterpoint.create({
      data: {
        analysisRunId: run.id,
        body: "Mock counterpoint: excerpts are shortened; verify originals before relying on citations.",
      },
    });

    await tx.alert.create({
      data: {
        analysisRunId: run.id,
        level: "medium",
        message:
          "Mock alert: this run uses placeholder evidence only (no LLM, no live retrieval).",
      },
    });

    return run.id;
  });
}
