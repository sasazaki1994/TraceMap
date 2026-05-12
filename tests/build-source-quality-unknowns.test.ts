import { describe, expect, it } from "vitest";

import { buildSourceQualityUnknowns } from "@/features/run/lib/build-source-quality-unknowns";

describe("buildSourceQualityUnknowns", () => {
  it("creates caveats for stale or unreachable", () => {
    const unknowns = buildSourceQualityUnknowns([
      {
        sourceId: "s1",
        label: "S1",
        quality: "weak",
        freshness: "stale",
        reachability: "unreachable",
        isPrimarySource: false,
        linkedClaimCount: 1,
        publishedAt: null,
        hasSupportingQuote: false,
        reasons: [],
        warnings: [],
      },
    ]);

    expect(unknowns.map((u) => u.id)).toEqual(
      expect.arrayContaining([
        "s1-weak-quality",
      ]),
    );
    expect(unknowns.length).toBeGreaterThan(0);
  });

  it("adds no-linked-claims caveat", () => {
    const unknowns = buildSourceQualityUnknowns([
      {
        sourceId: "s2",
        label: "S2",
        quality: "weak",
        freshness: "fresh",
        reachability: "reachable",
        isPrimarySource: false,
        linkedClaimCount: 0,
        publishedAt: "2026-01-01",
        hasSupportingQuote: false,
        reasons: [],
        warnings: [],
      },
    ]);

    expect(unknowns.map((u) => u.id)).toContain("s2-weak-quality");
  });
});
