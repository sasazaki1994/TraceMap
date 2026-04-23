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
    analysisRun: {
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(
      async (fn: (t: typeof tx) => Promise<void>) => fn(tx),
    ),
  },
}));

vi.mock("@/server/analysis/resolve-answer-graph-provider", () => ({
  resolveAnswerGraphProvider: vi.fn(),
}));

describe("createAnalysisRunFromProvider", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("@/server/db/prisma");
    const p = prisma as unknown as {
      analysisRun: {
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
      };
    };
    p.analysisRun.create.mockResolvedValue({ id: "run_mock" });
    p.analysisRun.update.mockResolvedValue({});

    tx.answerSnapshot.create.mockResolvedValue({ id: "answer_mock" });
    tx.sourceSnapshot.create
      .mockResolvedValueOnce({ id: "src_a" })
      .mockResolvedValueOnce({ id: "src_b" })
      .mockResolvedValueOnce({ id: "src_c" });
    tx.answerSnapshot.update.mockResolvedValue({});
    tx.claim.create
      .mockResolvedValueOnce({ id: "claim_mock_1" })
      .mockResolvedValueOnce({ id: "claim_mock_2" });
    tx.claimSourceSnapshot.createMany.mockResolvedValue({ count: 2 });
    tx.claimConfidence.create.mockResolvedValue({});
    tx.claimPropagationChain.create.mockResolvedValue({ id: "chain_mock_1" });
    tx.claimPropagationStep.create.mockResolvedValue({});
  });

  it("persists claims, claim-support metadata, confidence, counterpoint, and alert when using the mock provider", async () => {
    const { resolveAnswerGraphProvider } = await import(
      "@/server/analysis/resolve-answer-graph-provider"
    );
    const { mockAnswerGraphProvider } = await import(
      "@/server/analysis/providers/mock-answer-graph-provider"
    );
    vi.mocked(resolveAnswerGraphProvider).mockReturnValue(mockAnswerGraphProvider);

    const { createAnalysisRunFromProvider } = await import(
      "@/server/analysis/create-analysis-run-from-provider"
    );

    const id = await createAnalysisRunFromProvider("Why test?");

    expect(id).toBe("run_mock");

    const { prisma } = await import("@/server/db/prisma");
    const p = prisma as unknown as {
      analysisRun: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    };
    expect(p.analysisRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        question: "Why test?",
        status: "queued",
      }),
    });
    expect(p.analysisRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run_mock" },
        data: { status: "processing" },
      }),
    );

    expect(tx.claim.create).toHaveBeenCalledTimes(2);
    expect(tx.claim.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
        summary: expect.stringContaining("mock claim"),
        graphNodeId: "node_claim_0",
      }),
    });
    expect(tx.claim.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
        graphNodeId: "node_claim_1",
      }),
    });

    expect(tx.claimSourceSnapshot.createMany).toHaveBeenCalled();
    expect(tx.claimSourceSnapshot.createMany).toHaveBeenNthCalledWith(1, {
      data: expect.arrayContaining([
        expect.objectContaining({
          claimId: "claim_mock_1",
          sourceSnapshotId: "src_a",
          supportKind: "direct",
          isPrimarySource: true,
          supportingQuote: expect.stringContaining("Interpretability"),
          contradictionNote: null,
        }),
        expect.objectContaining({
          claimId: "claim_mock_1",
          sourceSnapshotId: "src_b",
          supportKind: "supplemental",
          isPrimarySource: false,
          supportingQuote: expect.stringContaining("Retrieval quality"),
          contradictionNote: null,
        }),
      ]),
      skipDuplicates: true,
    });
    expect(tx.claimConfidence.create).toHaveBeenCalledTimes(2);
    expect(tx.claimConfidence.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        claimId: "claim_mock_1",
        level: "high",
        hasPrimarySource: true,
        independentSourceCount: 1,
        hasSupportingQuote: true,
        recencyStatus: "current",
        hasContradiction: false,
      }),
    });

    expect(tx.counterpoint.create).toHaveBeenCalledTimes(2);
    expect(tx.counterpoint.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        claimId: "claim_mock_1",
        summary: expect.stringContaining("Mock counterpoint"),
        relationKind: "contradiction",
      }),
    });
    expect(tx.counterpoint.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        claimId: "claim_mock_2",
        summary: expect.stringContaining("Mock counterpoint"),
        relationKind: "different_premise",
      }),
    });
    expect(tx.claimPropagationChain.create).toHaveBeenCalledTimes(2);
    expect(tx.claimPropagationChain.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        claimId: "claim_mock_1",
        lensHint: null,
        summary: null,
      }),
    });
    expect(tx.claimPropagationStep.create).toHaveBeenCalled();
    expect(tx.claimPropagationStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimPropagationChainId: "chain_mock_1",
        ordinal: 0,
        stepKind: "source",
      }),
    });
    expect(tx.claimPropagationStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimPropagationChainId: "chain_mock_1",
        ordinal: 4,
        stepKind: "answer_segment",
      }),
    });

    expect(tx.alert.create).toHaveBeenCalledTimes(8);
    expect(tx.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
        claimId: "claim_mock_1",
        level: "info",
        message: expect.stringContaining("Mock claim alert"),
      }),
    });
    expect(tx.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
        claimId: "claim_mock_2",
        level: "warning",
        message: expect.stringContaining("Mock claim alert"),
      }),
    });
    const alertCalls = tx.alert.create.mock.calls.map(([arg]) => arg);
    expect(alertCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            answerSnapshotId: "answer_mock",
            claimId: "claim_mock_2",
            level: "warning",
            message: expect.stringContaining("primary source"),
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            answerSnapshotId: "answer_mock",
            claimId: null,
            level: "warning",
            message: expect.stringContaining("Mock alert"),
          }),
        }),
      ]),
    );
    expect(tx.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
        claimId: "claim_mock_2",
        level: "warning",
        message: expect.stringContaining("only one source"),
      }),
    });
    expect(tx.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
        claimId: null,
        level: "warning",
        message: expect.stringContaining("Mock alert"),
      }),
    });

    expect(p.analysisRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run_mock" },
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
  });
});
