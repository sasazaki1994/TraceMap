import { describe, expect, test } from "vitest";

import { buildRunMetadata } from "@/features/run/lib/build-run-metadata";

describe("buildRunMetadata", () => {
  test("builds aggregate metadata", () => {
    const result = buildRunMetadata({
      runId: "run_1",
      status: "completed",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:10:00.000Z",
      model: "gpt-4.1-mini",
      sources: [{ id: "s1" }, { id: "s2" }],
      evidenceClaims: [
        { id: "c1", counterpoints: [{ id: "cp1" }] },
      ] as never,
      evidenceAlerts: [{ id: "a1" }] as never,
      generatedAt: "2026-01-01T00:09:00.000Z",
    });

    expect(result.provider).toBe("openai");
    expect(result.sourceCount).toBe(2);
    expect(result.claimCount).toBe(1);
    expect(result.alertCount).toBe(1);
    expect(result.counterpointCount).toBe(1);
    expect(result.generatedAtIso).toBe("2026-01-01T00:09:00.000Z");
  });
});
