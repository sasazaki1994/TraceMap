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
          suggestedNextAction: "Add independent supporting source.",
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
          suggestedNextAction: "Check official or primary source.",
        }),
        expect.objectContaining({
          id: "alert-warning",
          severity: "medium",
          suggestedNextAction: "Add independent supporting source.",
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
        suggestedNextAction: "Strengthen evidence before reusing this finding.",
      }),
    ]);
  });

  it("returns an empty array for empty inputs", () => {
    expect(buildUnknowns({ evidenceAlerts: [], evidenceClaims: [] })).toEqual([]);
  });
});
