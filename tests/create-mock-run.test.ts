import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  answerSnapshot: { create: vi.fn(), update: vi.fn() },
  sourceSnapshot: { create: vi.fn() },
  claim: { create: vi.fn() },
  counterpoint: { create: vi.fn() },
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
    tx.claim.create.mockResolvedValue({ id: "claim_mock" });
  });

  it("persists claim, counterpoint, and alert when using the mock provider", async () => {
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

    expect(tx.claim.create).toHaveBeenCalledTimes(1);
    expect(tx.claim.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
        summary: expect.stringContaining("mock claim"),
        graphNodeId: "node_answer",
      }),
    });

    expect(tx.counterpoint.create).toHaveBeenCalledTimes(1);
    expect(tx.counterpoint.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimId: "claim_mock",
        summary: expect.stringContaining("Mock counterpoint"),
      }),
    });

    expect(tx.alert.create).toHaveBeenCalledTimes(1);
    expect(tx.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answerSnapshotId: "answer_mock",
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
