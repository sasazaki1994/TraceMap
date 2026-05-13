import { describe, expect, it } from "vitest";
import { buildSourceDrilldown } from "@/features/run/lib/build-source-drilldown";

describe("buildSourceDrilldown", () => {
  it("builds supported claims and normalizes support kinds", () => {
    const result = buildSourceDrilldown({
      sources: [{ id: "s1", label: "S1", url: "https://a", excerpt: null, sourceType: "web" }],
      claims: [{ id: "c1", summary: "Claim", graphNodeId: null, supportingSourceIds: ["s1"], supports: [{ sourceId: "s1", sourceLabel: "S1", supportKind: "direct", isPrimarySource: true, supportingQuote: null, contradictionNote: null }], confidence: null, counterpoints: [], propagationSteps: [], lensScore: 0, alerts: [] }],
      sourceQuality: [{ sourceId: "s1", label: "S1", quality: "usable", freshness: "unknown", reachability: "unchecked", reasons: ["r"], warnings: [], linkedClaimCount: 1, hasSupportingQuote: false }],
      sourceLineage: [{ sourceId: "s1", label: "S1", sourceType: "web", lineageLabel: "lineage" }],
      unknowns: [{ id: "u1", text: "unknown", reason: "reason", severity: "medium", category: "source", suggestedNextAction: "act", relatedClaimIds: ["c1"], relatedSourceIds: [] }],
    });

    expect(result[0]?.supportedClaims[0]?.supportKind).toBe("direct");
    expect(result[0]?.supportedClaims[0]?.warnings[0]).toContain("Quote missing");
    expect(result[0]?.isPrimaryLike).toBe(true);
    expect(result[0]?.relatedUnknowns).toHaveLength(1);
  });

  it("marks contradiction note as contradiction", () => {
    const result = buildSourceDrilldown({
      sources: [{ id: "s1", label: "S1", url: null, excerpt: null, sourceType: "note" }],
      claims: [{ id: "c1", summary: "Claim", graphNodeId: null, supportingSourceIds: ["s1"], supports: [{ sourceId: "s1", sourceLabel: "S1", supportKind: "indirect", isPrimarySource: false, supportingQuote: null, contradictionNote: "conflict" }], confidence: null, counterpoints: [], propagationSteps: [], lensScore: 0, alerts: [] }],
    });
    expect(result[0]?.supportedClaims[0]?.supportKind).toBe("contradiction");
  });

  it("supports empty inputs", () => {
    expect(buildSourceDrilldown({ sources: [], claims: [] })).toEqual([]);
  });
});
