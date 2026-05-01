import { describe, expect, it } from "vitest";

import {
  buildClaimEvidenceAlerts,
  computeClaimConfidence,
} from "@/server/analysis/claim-confidence";

describe("computeClaimConfidence", () => {
  it("scores high-confidence claims with primary, quote, and multiple independent sources", () => {
    const result = computeClaimConfidence(
      [
        {
          url: "https://example.com/a",
          publishedAt: new Date("2026-03-01T00:00:00.000Z"),
          supportKind: "direct",
          isPrimarySource: true,
          supportingQuote: "Quoted passage",
          contradictionNote: null,
        },
        {
          url: "https://another.example.org/b",
          publishedAt: new Date("2025-12-15T00:00:00.000Z"),
          supportKind: "supplemental",
          isPrimarySource: false,
          supportingQuote: "Additional corroborating detail",
          contradictionNote: null,
        },
      ],
      new Date("2026-04-23T00:00:00.000Z"),
    );

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("high");
    expect(result.hasPrimarySource).toBe(true);
    expect(result.independentSourceCount).toBe(2);
    expect(result.hasSupportingQuote).toBe(true);
    expect(result.recencyStatus).toBe("current");
    expect(result.hasContradiction).toBe(false);
  });

  it("returns insufficient confidence when no support exists", () => {
    const result = computeClaimConfidence([], new Date("2026-04-23T00:00:00.000Z"));

    expect(result.score).toBe(0);
    expect(result.level).toBe("insufficient");
    expect(result.independentSourceCount).toBe(0);
    expect(result.summary).toContain("No supporting sources");
  });
});

describe("buildClaimEvidenceAlerts", () => {
  it("raises the required alert conditions", () => {
    const alerts = buildClaimEvidenceAlerts(
      computeClaimConfidence(
        [
          {
            url: null,
            publishedAt: null,
            supportKind: "indirect",
            isPrimarySource: false,
            supportingQuote: null,
            contradictionNote: "Conflicts with another source.",
          },
        ],
        new Date("2026-04-23T00:00:00.000Z"),
      ),
    );

    expect(alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: "warning", message: expect.stringContaining("primary") }),
        expect.objectContaining({ level: "warning", message: expect.stringContaining("only one") }),
        expect.objectContaining({ level: "warning", message: expect.stringContaining("quote") }),
        expect.objectContaining({ level: "warning", message: expect.stringContaining("known publication date") }),
        expect.objectContaining({
          level: "warning",
          message: expect.stringContaining("contradict"),
        }),
      ]),
    );
  });
});
