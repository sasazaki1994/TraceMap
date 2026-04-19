import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  analysisRun: { create: vi.fn() },
  answerSnapshot: { create: vi.fn(), update: vi.fn() },
  sourceSnapshot: { create: vi.fn() },
  claim: { create: vi.fn() },
  counterpoint: { create: vi.fn() },
  alert: { create: vi.fn() },
};

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(
      async (fn: (t: typeof tx) => Promise<string>) => fn(tx),
    ),
  },
}));

describe("createMockAnalysisRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.analysisRun.create.mockResolvedValue({ id: "run_mock" });
    tx.answerSnapshot.create.mockResolvedValue({ id: "answer_mock" });
    tx.sourceSnapshot.create
      .mockResolvedValueOnce({ id: "src_a" })
      .mockResolvedValueOnce({ id: "src_b" })
      .mockResolvedValueOnce({ id: "src_c" });
    tx.answerSnapshot.update.mockResolvedValue({});
  });

  it("persists at least one claim, counterpoint, and alert for the run", async () => {
    const { createMockAnalysisRun } = await import(
      "@/server/analysis/create-mock-run"
    );

    const id = await createMockAnalysisRun("Why test?");

    expect(id).toBe("run_mock");

    expect(tx.claim.create).toHaveBeenCalledTimes(1);
    expect(tx.claim.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        analysisRunId: "run_mock",
        body: expect.stringContaining("Mock claim"),
      }),
    });

    expect(tx.counterpoint.create).toHaveBeenCalledTimes(1);
    expect(tx.counterpoint.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        analysisRunId: "run_mock",
        body: expect.stringContaining("Mock counterpoint"),
      }),
    });

    expect(tx.alert.create).toHaveBeenCalledTimes(1);
    expect(tx.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        analysisRunId: "run_mock",
        level: "medium",
        message: expect.stringContaining("Mock alert"),
      }),
    });
  });
});
