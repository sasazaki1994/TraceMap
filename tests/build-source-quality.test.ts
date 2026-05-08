import { describe, expect, it } from "vitest";

import { buildSourceQuality } from "@/features/run/lib/build-source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

describe("buildSourceQuality", () => {
  const claim: RunEvidenceClaim = {
    id: "c1", summary: "x", graphNodeId: null, supportingSourceIds: ["s1"], lensScore: 0,
    supports: [{ sourceId: "s1", sourceLabel: "S1", supportKind: "direct", isPrimarySource: true, supportingQuote: "quote", contradictionNote: null }],
    confidence: null, counterpoints: [], propagationSteps: [], alerts: [],
  };

  it("classifies reachable and strong", () => {
    const result = buildSourceQuality({ now: new Date("2026-05-08T00:00:00Z"), evidenceClaims: [claim], sources: [{ id: "s1", label: "S1", url: null, excerpt: null, sourceType: "web", verificationStatus: "verified", publishedAt: "2026-05-01T00:00:00Z" }] });
    expect(result[0]?.reachabilityStatus).toBe("reachable");
    expect(result[0]?.qualityLevel).toBe("strong");
  });
});
