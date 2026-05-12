import { describe, expect, it } from "vitest";
import { buildEvidenceEdgeQuality } from "@/features/run/lib/build-evidence-edge-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

describe("buildEvidenceEdgeQuality", () => {
  it("classifies direct/weak/contradiction", () => {
    const claims: RunEvidenceClaim[] = [{
      id: "c1", summary: "a", supportingSourceIds: ["s1"], graphNodeId: "g1", lensScore: 0,
      confidence: null, alerts: [], counterpoints: [], propagationSteps: [],
      supports: [
        { sourceId: "s1", sourceLabel: "S1", supportKind: "direct", supportingQuote: "quote", isPrimarySource: true, contradictionNote: null },
        { sourceId: "s2", sourceLabel: "S2", supportKind: "direct", supportingQuote: null, isPrimarySource: false, contradictionNote: null },
        { sourceId: "s3", sourceLabel: "S3", supportKind: "indirect", supportingQuote: null, isPrimarySource: false, contradictionNote: "conflict" },
      ],
    }];
    const result = buildEvidenceEdgeQuality(claims);
    expect(result.find((r) => r.sourceId === "s1")?.supportQuality).toBe("direct");
    expect(result.find((r) => r.sourceId === "s2")?.supportQuality).toBe("weak");
    expect(result.find((r) => r.sourceId === "s3")?.supportQuality).toBe("contradiction");
  });
});
