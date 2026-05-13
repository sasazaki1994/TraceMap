import { describe, expect, it } from "vitest";
import { buildUnknowns } from "@/features/run/lib/build-unknowns";

describe("buildUnknowns", () => {
  it("builds categorized unknowns from source quality and drilldown", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [{ id: "a1", level: "warning", message: "comparison coverage is weak" }],
      evidenceClaims: [
        {
          id: "c1",
          summary: "claim",
          graphNodeId: null,
          supportingSourceIds: [],
          supports: [],
          confidence: null,
          counterpoints: [],
          propagationSteps: [],
          lensScore: 0,
          alerts: [],
        },
      ],
      sourceQuality: [{ sourceId: "s1", label: "A", quality: "weak", freshness: "stale", reachability: "unchecked", reasons: [], warnings: [], linkedClaimCount: 0, hasSupportingQuote: false }],
      sourceDrilldown: [{ sourceId: "s1", title: "A", isPrimaryLike: false, supportedClaims: [{ claimId: "c1", claimText: "claim", supportKind: "direct", rawSupportKind: "direct", supportingQuote: null, contradictionNote: null, isPrimarySource: false, warnings: [] }], relatedUnknowns: [] }],
    });

    expect(unknowns.some((u) => u.category === "source")).toBe(true);
    expect(unknowns.some((u) => u.category === "freshness")).toBe(true);
    expect(unknowns.some((u) => u.category === "evidence" && u.reason.includes("quote"))).toBe(true);
    expect(unknowns.some((u) => u.category === "comparison")).toBe(true);
  });

  it("deduplicates and preserves highest severity", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [
        { id: "a1", level: "warning", message: "same issue" },
        { id: "a2", level: "error", message: "same issue" },
      ],
      evidenceClaims: [],
    });
    const same = unknowns.find((u) => u.text === "same issue");
    expect(same?.severity).toBe("high");
  });

  it("handles empty inputs", () => {
    expect(buildUnknowns({ evidenceAlerts: [], evidenceClaims: [] })).toEqual([]);
  });
});
