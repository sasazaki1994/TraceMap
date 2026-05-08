import { describe, expect, it } from "vitest";

import {
  INVESTIGATION_LIMITS,
  getInvestigationLimitsForMode,
  resolveInvestigationMode,
} from "@/server/analysis/investigation-limits";

describe("INVESTIGATION_LIMITS", () => {
  it("defines bounded MVP output limits", () => {
    expect(INVESTIGATION_LIMITS).toEqual({
      maxSources: 5,
      maxClaims: 8,
      maxCounterpointsPerClaim: 2,
      maxAlertsPerClaim: 2,
      maxPropagationStepsPerClaim: 5,
      maxAnswerContentChars: 4000,
      maxSourceExcerptChars: 1200,
      maxClaimSummaryChars: 500,
    });
  });
});

describe("resolveInvestigationMode", () => {
  it("falls back to standard for undefined and invalid values", () => {
    expect(resolveInvestigationMode(undefined)).toBe("standard");
    expect(resolveInvestigationMode("invalid")).toBe("standard");
  });

  it("accepts fast/standard/deep", () => {
    expect(resolveInvestigationMode("fast")).toBe("fast");
    expect(resolveInvestigationMode("standard")).toBe("standard");
    expect(resolveInvestigationMode("deep")).toBe("deep");
  });
});

describe("getInvestigationLimitsForMode", () => {
  it("returns different limits by mode", () => {
    const fast = getInvestigationLimitsForMode("fast");
    const standard = getInvestigationLimitsForMode("standard");
    const deep = getInvestigationLimitsForMode("deep");

    expect(fast.maxSources).toBeLessThan(standard.maxSources);
    expect(standard.maxSources).toBeLessThan(deep.maxSources);
    expect(fast.maxClaims).toBeLessThan(standard.maxClaims);
    expect(standard.maxClaims).toBeLessThan(deep.maxClaims);
  });
});
