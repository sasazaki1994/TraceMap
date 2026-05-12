import { describe, expect, it } from "vitest";

import { buildSourceQualityInspections } from "@/features/run/lib/build-source-quality";
import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const source = (overrides: Partial<RunSourceView>): RunSourceView => ({
  id: "s1",
  label: "Source 1",
  url: "https://example.com",
  excerpt: null,
  sourceType: "web",
  ...overrides,
});

const claim: RunEvidenceClaim = {
  id: "c1", summary: "Claim", graphNodeId: null, supportingSourceIds: ["s1"],
  supports: [{ sourceId: "s1", sourceLabel: "Source 1", supportKind: "direct", isPrimarySource: true, supportingQuote: "quote", contradictionNote: null }],
  confidence: null, counterpoints: [], propagationSteps: [], lensScore: 0, alerts: [],
};

describe("buildSourceQualityInspections", () => {
  it("classifies primary with published date as strong or usable", () => {
    const result = buildSourceQualityInspections({ sources: [source({ publishedAt: "2026-01-01" })], claimSupports: [claim], now: new Date("2026-05-11") });
    expect(["strong", "usable"]).toContain(result[0].quality);
  });

  it("classifies unknown freshness, unreachable and invalid correctly", () => {
    const result = buildSourceQualityInspections({
      sources: [
        source({ id: "u1", publishedAt: undefined, httpStatus: null }),
        source({ id: "u2", httpStatus: 404, publishedAt: "2024-01-01" }),
        source({ id: "u3", url: "mailto:test@example.com", publishedAt: "2024-01-01" }),
      ],
      claimSupports: [],
      now: new Date("2026-05-11"),
    });

    expect(result.find((r) => r.sourceId === "u1")?.freshness).toBe("unknown");
    expect(result.find((r) => r.sourceId === "u2")?.reachability).toBe("unreachable");
    expect(result.find((r) => r.sourceId === "u3")?.reachability).toBe("invalid");
    expect(result.find((r) => r.sourceId === "u2")?.quality).toBe("weak");
    expect(result.find((r) => r.sourceId === "u1")?.quality).toBe("limited");
  });

  it("classifies verified published with no quote as limited", () => {
    const result = buildSourceQualityInspections({
      sources: [source({ id: "l1", publishedAt: "2025-01-01", verificationStatus: "verified" })],
      claimSupports: [
        { ...claim, supports: [{ ...claim.supports[0]!, supportingQuote: null }] },
      ],
      now: new Date("2026-05-11"),
    });
    expect(result[0]?.quality).toBe("limited");
  });
});
