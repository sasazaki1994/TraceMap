import { describe, expect, it } from "vitest";

import {
  buildUnknowns,
  severityFromAlertLevel,
} from "@/features/run/lib/build-unknowns";
import type { RunEvidenceClaim } from "@/types/run-evidence";

function baseClaim(overrides: Partial<RunEvidenceClaim> = {}): RunEvidenceClaim {
  return {
    id: "claim-1",
    summary: "Claim needs verification.",
    graphNodeId: "node_claim_1",
    supportingSourceIds: ["source-1"],
    supports: [],
    confidence: {
      score: 45,
      level: "medium",
      summary: "Confidence is limited by weak support.",
      hasPrimarySource: false,
      independentSourceCount: 1,
      hasSupportingQuote: false,
      recencyStatus: "unknown",
      hasContradiction: false,
    },
    counterpoints: [],
    propagationSteps: [],
    lensScore: 0,
    alerts: [],
    ...overrides,
  };
}

describe("buildUnknowns", () => {
  it("maps alert levels to investigation unknown severity", () => {
    expect(severityFromAlertLevel("error")).toBe("high");
    expect(severityFromAlertLevel("warning")).toBe("medium");
    expect(severityFromAlertLevel("info")).toBe("low");
  });

  it("creates unknowns from answer and claim alerts", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [
        {
          id: "alert-1",
          level: "warning",
          message: "This claim is supported by only one source.",
        },
      ],
      evidenceClaims: [
        baseClaim({
          confidence: null,
          alerts: [
            {
              id: "claim-alert-1",
              level: "error",
              message: "No supporting source is linked to this claim.",
            },
          ],
        }),
      ],
    });

    expect(unknowns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "alert-1",
          severity: "medium",
          category: "source",
          suggestedNextAction: expect.any(String),
        }),
        expect.objectContaining({
          id: "claim-alert-1",
          severity: "high",
          text: expect.stringContaining("Claim needs verification."),
        }),
      ]),
    );
  });

  it("maps each alert level to stable unknown severity", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [
        {
          id: "alert-error",
          level: "error",
          message: "Missing primary source.",
        },
        {
          id: "alert-warning",
          level: "warning",
          message: "This claim is supported by only one source.",
        },
        {
          id: "alert-info",
          level: "info",
          message: "Publication date is unclear.",
        },
      ],
      evidenceClaims: [],
    });

    expect(unknowns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "alert-error",
          severity: "high",
          suggestedNextAction: expect.any(String),
        }),
        expect.objectContaining({
          id: "alert-warning",
          severity: "medium",
          category: "source",
          suggestedNextAction: expect.any(String),
        }),
        expect.objectContaining({
          id: "alert-info",
          severity: "low",
          suggestedNextAction: "Verify publication date and recency.",
        }),
      ]),
    );
  });

  it("derives unknowns from weak confidence and support state", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [],
      evidenceClaims: [baseClaim()],
    });

    expect(unknowns.map((unknown) => unknown.id)).toEqual(
      expect.arrayContaining([
        "claim-1-confidence",
        "claim-1-primary-source",
        "claim-1-independent-source",
        "claim-1-supporting-quote",
        "claim-1-recency",
      ]),
    );
  });

  it("does not create synthetic gaps for high-confidence claims with complete support", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [],
      evidenceClaims: [
        baseClaim({
          confidence: {
            score: 92,
            level: "high",
            summary: "Confidence is strong.",
            hasPrimarySource: true,
            independentSourceCount: 3,
            hasSupportingQuote: true,
            recencyStatus: "current",
            hasContradiction: false,
          },
        }),
      ],
    });

    expect(unknowns).toEqual([]);
  });

  it("uses a non-empty fallback reason for weak confidence without a summary", () => {
    const unknowns = buildUnknowns({
      evidenceAlerts: [],
      evidenceClaims: [
        baseClaim({
          confidence: {
            score: 20,
            level: "low",
            summary: "   ",
            hasPrimarySource: true,
            independentSourceCount: 2,
            hasSupportingQuote: true,
            recencyStatus: "current",
            hasContradiction: false,
          },
        }),
      ],
    });

    expect(unknowns).toEqual([
      expect.objectContaining({
        id: "claim-1-confidence",
        severity: "high",
        reason: "Claim confidence is limited by incomplete supporting evidence.",
        category: "evidence",
        suggestedNextAction: "Strengthen evidence before reusing this finding.",
      }),
    ]);
  });

  it("returns an empty array for empty inputs", () => {
    expect(buildUnknowns({ evidenceAlerts: [], evidenceClaims: [] })).toEqual([]);
  });
});


it("adds stale source gap from source quality", () => {
  const unknowns = buildUnknowns({
    evidenceAlerts: [],
    evidenceClaims: [],
    sourceQuality: [{
      sourceId: "s1", label: "S1", quality: "weak", freshness: "stale", reachability: "reachable",
      reasons: ["stale"], warnings: [], linkedClaimCount: 1, hasSupportingQuote: true,
    }],
  });
  expect(unknowns.some((u) => u.reason.toLowerCase().includes("limited quality signals"))).toBe(true);
});


it("adds category and deduplicates unknowns", () => {
  const unknowns = buildUnknowns({ evidenceAlerts:[{id:"1",level:"warning",message:"Primary source missing"},{id:"2",level:"warning",message:"Primary source missing"}], evidenceClaims:[] });
  expect(unknowns.length).toBe(1);
  expect(unknowns[0]?.category).toBeDefined();
});

it("keeps higher severity item when duplicates collide", () => {
  const unknowns = buildUnknowns({
    evidenceAlerts: [
      { id: "low", level: "info", message: "Primary source missing" },
      { id: "high", level: "error", message: "Primary source missing" },
    ],
    evidenceClaims: [],
  });
  expect(unknowns).toHaveLength(1);
  expect(unknowns[0]?.severity).toBe("high");
});

it("limits unknown count and keeps supported categories", () => {
  const unknowns = buildUnknowns({
    evidenceAlerts: Array.from({ length: 30 }, (_, i) => ({
      id: `a-${i}`,
      level: i % 2 === 0 ? "warning" : "error",
      message:
        i % 4 === 0
          ? "counter argument exists"
          : i % 4 === 1
            ? "source unavailable"
            : i % 4 === 2
              ? "publication date unknown"
              : "evidence is weak",
    })),
    evidenceClaims: [],
  });
  expect(unknowns.length).toBeLessThanOrEqual(24);
  for (const unknown of unknowns) {
    expect(["evidence", "source", "freshness", "contradiction"]).toContain(unknown.category);
  }
});
