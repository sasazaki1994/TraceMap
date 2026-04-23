import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  answerSnapshot: { create: vi.fn(), update: vi.fn() },
  sourceSnapshot: { create: vi.fn() },
  claim: { create: vi.fn() },
  claimSourceSnapshot: { createMany: vi.fn() },
  claimConfidence: { create: vi.fn() },
  counterpoint: { create: vi.fn() },
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
    tx.alert.create.mockResolvedValue({ id: "alert-1" });
  });

  it("persists claim support metadata, confidence, and graph/source alignment", async () => {
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
            version: 2,
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

    expect(tx.answerSnapshot.update).toHaveBeenCalledWith({
      where: { id: "answer-1" },
      data: {
        graphJson: expect.objectContaining({
          version: 2,
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
