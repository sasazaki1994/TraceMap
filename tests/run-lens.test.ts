import { describe, expect, it } from "vitest";

import { orderClaimsForLens } from "@/server/analysis/run-lens";
import { lensLabel } from "@/features/run/lib/run-lens";
import type { RunEvidenceClaim } from "@/types/run-evidence";

function claim(overrides: Partial<RunEvidenceClaim>): RunEvidenceClaim {
  return {
    id: overrides.id ?? "claim",
    summary: overrides.summary ?? "Claim",
    graphNodeId: overrides.graphNodeId ?? "node_claim",
    supportingSourceIds: overrides.supportingSourceIds ?? [],
    supports: overrides.supports ?? [],
    confidence:
      overrides.confidence ?? {
        score: 60,
        level: "medium",
        summary: "Confidence",
        hasPrimarySource: false,
        independentSourceCount: 1,
        hasSupportingQuote: false,
        recencyStatus: "unknown",
        hasContradiction: false,
      },
    counterpoints: overrides.counterpoints ?? [],
    propagationSteps: overrides.propagationSteps ?? [],
    alerts: overrides.alerts ?? [],
    lensScore: overrides.lensScore ?? 0,
  };
}

describe("lensLabel", () => {
  it("maps lens ids to UI labels", () => {
    expect(lensLabel("rigor")).toBe("Rigor first");
    expect(lensLabel("timeliness")).toBe("Timeliness first");
    expect(lensLabel("practical")).toBe("Practical decision first");
  });
});

describe("orderClaimsForLens", () => {
  it("prioritizes primary and quoted claims in rigor lens", () => {
    const ordered = orderClaimsForLens([
      claim({
        id: "weak",
        confidence: {
          score: 45,
          level: "low",
          summary: "Weak",
          hasPrimarySource: false,
          independentSourceCount: 1,
          hasSupportingQuote: false,
          recencyStatus: "current",
          hasContradiction: false,
        },
      }),
      claim({
        id: "strong",
        confidence: {
          score: 70,
          level: "medium",
          summary: "Strong",
          hasPrimarySource: true,
          independentSourceCount: 2,
          hasSupportingQuote: true,
          recencyStatus: "current",
          hasContradiction: false,
        },
      }),
    ], "rigor");

    expect(ordered[0]?.id).toBe("strong");
  });

  it("prioritizes current claims in timeliness lens", () => {
    const ordered = orderClaimsForLens([
      claim({
        id: "stale",
        confidence: {
          score: 80,
          level: "high",
          summary: "Old but strong",
          hasPrimarySource: true,
          independentSourceCount: 2,
          hasSupportingQuote: true,
          recencyStatus: "stale",
          hasContradiction: false,
        },
      }),
      claim({
        id: "current",
        confidence: {
          score: 60,
          level: "medium",
          summary: "Current",
          hasPrimarySource: false,
          independentSourceCount: 1,
          hasSupportingQuote: false,
          recencyStatus: "current",
          hasContradiction: false,
        },
      }),
    ], "timeliness");

    expect(ordered[0]?.id).toBe("current");
  });

  it("prioritizes actionable claims in practical lens", () => {
    const ordered = orderClaimsForLens([
      claim({
        id: "blocked",
        alerts: [{ id: "a1", level: "error", message: "Blocking issue" }],
        supports: [
          {
            sourceId: "src-1",
            sourceLabel: "Source 1",
            supportKind: "direct",
            isPrimarySource: false,
            supportingQuote: null,
            contradictionNote: null,
          },
        ],
      }),
      claim({
        id: "actionable",
        supports: [
          {
            sourceId: "src-2",
            sourceLabel: "Source 2",
            supportKind: "direct",
            isPrimarySource: true,
            supportingQuote: "Do this",
            contradictionNote: null,
          },
        ],
        propagationSteps: [
          {
            id: "step-1",
            orderIndex: 0,
            stepKind: "answer_segment",
            label: "Action segment",
            content: null,
            sourceId: null,
            boundary: "interpretation",
          },
        ],
      }),
    ], "practical");

    expect(ordered[0]?.id).toBe("actionable");
  });
});
