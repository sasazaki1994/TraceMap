import { describe, expect, it } from "vitest";

import { buildSourceQualityUnknowns } from "@/features/run/lib/build-source-quality-unknowns";

describe("buildSourceQualityUnknowns", () => {
  it("creates caveats for stale or unreachable", () => {
    const unknowns = buildSourceQualityUnknowns([
      {
        sourceId: "s1",
        label: "S1",
        qualityLevel: "weak",
        freshnessStatus: "stale",
        reachabilityStatus: "unreachable",
        isPrimarySource: false,
        linkedClaimCount: 1,
        hasPublishedAt: false,
        hasSupportingQuote: false,
        reasons: [],
        suggestedNextActions: [],
      },
    ]);

    expect(unknowns.map((u) => u.id)).toEqual(
      expect.arrayContaining([
        "s1-source-unreachable",
        "s1-source-stale",
        "s1-source-no-publication-date",
      ]),
    );
    expect(unknowns).toHaveLength(3);
  });

  it("adds no-linked-claims caveat", () => {
    const unknowns = buildSourceQualityUnknowns([
      {
        sourceId: "s2",
        label: "S2",
        qualityLevel: "weak",
        freshnessStatus: "fresh",
        reachabilityStatus: "reachable",
        isPrimarySource: false,
        linkedClaimCount: 0,
        hasPublishedAt: true,
        hasSupportingQuote: false,
        reasons: [],
        suggestedNextActions: [],
      },
    ]);

    expect(unknowns.map((u) => u.id)).toContain("s2-source-no-linked-claims");
  });
});
