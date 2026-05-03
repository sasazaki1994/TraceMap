import { describe, expect, it } from "vitest";

import { INVESTIGATION_LIMITS } from "@/server/analysis/investigation-limits";

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
