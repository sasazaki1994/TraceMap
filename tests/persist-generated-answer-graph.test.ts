import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  answerSnapshot: { create: vi.fn(), update: vi.fn() },
  sourceSnapshot: { create: vi.fn() },
  claim: { create: vi.fn() },
  claimSourceSnapshot: { createMany: vi.fn() },
  claimConfidence: { create: vi.fn() },
  counterpoint: { create: vi.fn() },
  claimPropagationChain: { create: vi.fn() },
  claimPropagationStep: { create: vi.fn() },
  alert: { create: vi.fn() },
};

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)),
  },
}));

vi.mock("@/server/analysis/verify-source-url", () => ({
  verifyPublicHttpUrl: vi.fn(async () => ({
    verificationStatus: "verified",
    checkedAt: null,
    httpStatus: 200,
    finalUrl: "https://example.com/final",
    contentType: "text/html",
  })),
}));

describe("persistGeneratedAnswerGraph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.answerSnapshot.create.mockResolvedValue({ id: "answer-1" });
    tx.sourceSnapshot.create
      .mockResolvedValueOnce({ id: "src-db-1" })
      .mockResolvedValueOnce({ id: "src-db-2" });
    tx.answerSnapshot.update.mockResolvedValue({});
    tx.claim.create.mockResolvedValue({ id: "claim-db-1" });
    tx.claimSourceSnapshot.createMany.mockResolvedValue({ count: 2 });
    tx.claimConfidence.create.mockResolvedValue({ id: "confidence-1" });
    tx.counterpoint.create.mockResolvedValue({ id: "cp-1" });
    tx.claimPropagationChain.create.mockResolvedValue({ id: "chain-1" });
    tx.claimPropagationStep.create.mockResolvedValue({ id: "chain-step-1" });
    tx.alert.create.mockResolvedValue({ id: "alert-1" });
  });

  it("persists support metadata, counterpoint taxonomy, chain rows, and graph alignment", async () => {
    const { persistGeneratedAnswerGraph } = await import(
      "@/server/analysis/persist-generated-answer-graph"
    );

    await persistGeneratedAnswerGraph({
      runId: "run-1",
      payload: {
        answer: {
          title: "Title",
          model: "mock",
          content: "Body",
          graphJson: {
            version: 3,
            nodes: [
              { id: "node_question", kind: "question", label: "Q" },
              { id: "node_answer", kind: "answer", label: "A" },
              {
                id: "node_source_0",
                kind: "source",
                label: "Source A",
                sourceSnapshotId: "__src_0__",
              },
              {
                id: "node_source_1",
                kind: "source",
                label: "Source B",
                sourceSnapshotId: "__src_1__",
              },
              { id: "node_claim_0", kind: "claim", label: "Claim" },
              {
                id: "node_counterclaim_0",
                kind: "counterclaim",
                label: "Counterclaim",
              },
              {
                id: "node_interpretation_0",
                kind: "interpretation",
                label: "Interpretation",
              },
              {
                id: "node_answer_segment_0",
                kind: "answer_segment",
                label: "Answer segment",
              },
            ],
            edges: [
              { id: "edge_q_a", from: "node_question", to: "node_answer" },
              {
                id: "edge_s0_c0",
                from: "node_source_0",
                to: "node_claim_0",
                label: "supports",
                supportType: "direct",
              },
              {
                id: "edge_counter_0",
                from: "node_counterclaim_0",
                to: "node_claim_0",
                label: "counterpoint",
                relationType: "different_premise",
              },
            ],
          },
        },
        sources: [
          {
            label: "Source A",
            sourceType: "web",
            url: "https://example.com/a",
            excerpt: "Excerpt A",
            publishedAt: new Date("2025-01-10T00:00:00.000Z"),
          },
          {
            label: "Source B",
            sourceType: "web",
            url: "https://example.org/b",
            excerpt: "Excerpt B",
            publishedAt: null,
          },
        ],
        evidence: {
          claims: [
            {
              summary: "Claim summary",
              graphNodeId: "node_claim_0",
              supportedSourcePlaceholderIds: ["__src_0__", "__src_1__"],
              supports: [
                {
                  sourcePlaceholderId: "__src_0__",
                  supportKind: "direct",
                  isPrimarySource: true,
                  supportingQuote: "Quoted text",
                },
                {
                  sourcePlaceholderId: "__src_1__",
                  supportKind: "supplemental",
                  contradictionNote: "Conflicts on scope",
                },
              ],
              counterpoints: [
                {
                  summary: "Counter summary",
                  relationKind: "different_premise",
                  graphNodeId: "node_counterclaim_0",
                },
              ],
              propagationChain: [
                {
                  stepKind: "evidence_snippet",
                  order: 0,
                  label: "Quoted text",
                  detail: "Quoted text",
                  sourcePlaceholderId: "__src_0__",
                },
                {
                  stepKind: "source_interpretation",
                  order: 1,
                  label: "Interpretation",
                  detail: "Interpretation layer",
                },
                {
                  stepKind: "answer_segment",
                  order: 2,
                  label: "Decision-facing sentence",
                  detail: "Decision-facing sentence",
                },
              ],
            },
          ],
        },
      },
    });

    expect(tx.claimSourceSnapshot.createMany).toHaveBeenCalledWith({
      data: [
        {
          claimId: "claim-db-1",
          sourceSnapshotId: "src-db-1",
          supportKind: "direct",
          isPrimarySource: true,
          supportingQuote: "Quoted text",
          contradictionNote: null,
        },
        {
          claimId: "claim-db-1",
          sourceSnapshotId: "src-db-2",
          supportKind: "supplemental",
          isPrimarySource: false,
          supportingQuote: null,
          contradictionNote: "Conflicts on scope",
        },
      ],
      skipDuplicates: true,
    });

    expect(tx.claimConfidence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimId: "claim-db-1",
        hasPrimarySource: true,
        independentSourceCount: 2,
        hasSupportingQuote: true,
        hasContradiction: true,
      }),
    });

    expect(tx.counterpoint.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimId: "claim-db-1",
        summary: "Counter summary",
        relationKind: "different_premise",
        graphNodeId: "node_counterclaim_0",
      }),
    });

    expect(tx.claimPropagationChain.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimId: "claim-db-1",
      }),
    });
    expect(tx.claimPropagationStep.create).toHaveBeenCalledTimes(3);
    expect(tx.claimPropagationStep.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        claimPropagationChainId: "chain-1",
        ordinal: 0,
        stepKind: "evidence_snippet",
        detail: "Quoted text",
        sourceSnapshotId: "src-db-1",
      }),
    });
    expect(tx.claimPropagationStep.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        claimPropagationChainId: "chain-1",
        ordinal: 1,
        stepKind: "source_interpretation",
        detail: "Interpretation layer",
      }),
    });
    expect(tx.claimPropagationStep.create).toHaveBeenNthCalledWith(3, {
      data: expect.objectContaining({
        claimPropagationChainId: "chain-1",
        ordinal: 2,
        stepKind: "answer_segment",
        detail: "Decision-facing sentence",
      }),
    });

    expect(tx.answerSnapshot.update).toHaveBeenCalledWith({
      where: { id: "answer-1" },
      data: {
        graphJson: expect.objectContaining({
          version: 3,
          nodes: expect.arrayContaining([
            expect.objectContaining({
              id: "node_source_0",
              sourceSnapshotId: "src-db-1",
            }),
            expect.objectContaining({
              id: "node_source_1",
              sourceSnapshotId: "src-db-2",
            }),
          ]),
        }),
      },
    });
  });
});
