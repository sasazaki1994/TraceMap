import { describe, expect, it } from "vitest";

import { orderClaimsForLens } from "@/server/analysis/run-lens";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const baseClaim = {
  graphNodeId: null,
  supportingSourceIds: [],
  supports: [],
  counterpoints: [],
  alerts: [],
  propagationSteps: [],
  lensScore: 0,
} satisfies Omit<RunEvidenceClaim, "id" | "summary" | "confidence">;

describe("orderClaimsForLens", () => {
  it("prioritizes rigor scores in rigor lens", () => {
    const claims: RunEvidenceClaim[] = [
      {
        ...baseClaim,
        id: "c1",
        summary: "Rigor-heavy claim",
        confidence: {
          score: 90,
          level: "high",
          summary: "Rigor-heavy claim",
          hasPrimarySource: true,
          independentSourceCount: 3,
          hasSupportingQuote: true,
          recencyStatus: "current",
          hasContradiction: false,
        },
      },
      {
        ...baseClaim,
        id: "c2",
        summary: "Fresh claim",
        confidence: {
          score: 40,
          level: "low",
          summary: "Fresh claim",
          hasPrimarySource: false,
          independentSourceCount: 1,
          hasSupportingQuote: false,
          recencyStatus: "current",
          hasContradiction: false,
        },
      },
    ];

    expect(orderClaimsForLens(claims, "rigor").map((claim: RunEvidenceClaim) => claim.id)).toEqual([
      "c1",
      "c2",
    ]);
  });

  it("prioritizes timeliness scores in timeliness lens", () => {
    const claims: RunEvidenceClaim[] = [
      {
        ...baseClaim,
        id: "c1",
        summary: "Rigor-heavy claim",
        confidence: {
          score: 90,
          level: "high",
          summary: "Rigor-heavy claim",
          hasPrimarySource: true,
          independentSourceCount: 3,
          hasSupportingQuote: true,
          recencyStatus: "stale",
          hasContradiction: false,
        },
      },
      {
        ...baseClaim,
        id: "c2",
        summary: "Fresh claim",
        confidence: {
          score: 50,
          level: "medium",
          summary: "Fresh claim",
          hasPrimarySource: false,
          independentSourceCount: 1,
          hasSupportingQuote: false,
          recencyStatus: "current",
          hasContradiction: false,
        },
      },
    ];

    expect(
      orderClaimsForLens(claims, "timeliness").map((claim: RunEvidenceClaim) => claim.id),
    ).toEqual([
      "c2",
      "c1",
    ]);
  });

  it("prioritizes practical scores in practical lens", () => {
    const claims: RunEvidenceClaim[] = [
      {
        ...baseClaim,
        id: "c1",
        summary: "Rigor-heavy claim",
        confidence: {
          score: 90,
          level: "high",
          summary: "Rigor-heavy claim",
          hasPrimarySource: true,
          independentSourceCount: 3,
          hasSupportingQuote: true,
          recencyStatus: "stale",
          hasContradiction: false,
        },
        alerts: [{ id: "a1", level: "error", message: "Blocked" }],
      },
      {
        ...baseClaim,
        id: "c2",
        summary: "Actionable claim",
        confidence: {
          score: 50,
          level: "medium",
          summary: "Actionable claim",
          hasPrimarySource: false,
          independentSourceCount: 1,
          hasSupportingQuote: false,
          recencyStatus: "current",
          hasContradiction: false,
        },
        propagationSteps: [
          {
            id: "step-a",
            orderIndex: 0,
            stepKind: "answer_segment",
            label: "Action",
            content: "Do the thing",
            sourceId: null,
            boundary: "interpretation",
          },
        ],
      },
    ];

    expect(
      orderClaimsForLens(claims, "practical").map((claim: RunEvidenceClaim) => claim.id),
    ).toEqual([
      "c1",
      "c2",
    ]);
  });
});
