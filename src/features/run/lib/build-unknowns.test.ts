import { describe, expect, it } from "vitest";
import { buildUnknowns } from "@/features/run/lib/build-unknowns";

describe("buildUnknowns", () => {
  it("adds source quality derived unknowns", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [],
      evidenceClaims: [],
      sourceQuality: [{
        sourceId: "s1",
        label: "A",
        quality: "weak",
        freshness: "unknown",
        reachability: "unchecked",
        reasons: [],
        warnings: [],
        linkedClaimCount: 0,
        hasSupportingQuote: false,
      }],
    });
    expect(unknowns.some((u) => u.reason.includes("does not expose"))).toBe(true);
    expect(unknowns.some((u) => u.reason.includes("not been verified"))).toBe(true);
  });
});
