export type InvestigationMode = "fast" | "standard" | "deep";
export type InvestigationLimits = {
  maxSources: number;
  maxClaims: number;
  maxCounterpointsPerClaim: number;
  maxAlertsPerClaim: number;
  maxPropagationStepsPerClaim: number;
  maxAnswerContentChars: number;
  maxSourceExcerptChars: number;
  maxClaimSummaryChars: number;
};

const FAST_INVESTIGATION_LIMITS = {
  maxSources: 3,
  maxClaims: 3,
  maxCounterpointsPerClaim: 1,
  maxAlertsPerClaim: 1,
  maxPropagationStepsPerClaim: 3,
  maxAnswerContentChars: 2000,
  maxSourceExcerptChars: 800,
  maxClaimSummaryChars: 300,
} as const;

const STANDARD_INVESTIGATION_LIMITS = {
  maxSources: 5,
  maxClaims: 8,
  maxCounterpointsPerClaim: 2,
  maxAlertsPerClaim: 2,
  maxPropagationStepsPerClaim: 5,
  maxAnswerContentChars: 4000,
  maxSourceExcerptChars: 1200,
  maxClaimSummaryChars: 500,
} as const;

const DEEP_INVESTIGATION_LIMITS = {
  maxSources: 12,
  maxClaims: 16,
  maxCounterpointsPerClaim: 3,
  maxAlertsPerClaim: 3,
  maxPropagationStepsPerClaim: 7,
  maxAnswerContentChars: 7000,
  maxSourceExcerptChars: 1600,
  maxClaimSummaryChars: 700,
} as const;

export const INVESTIGATION_LIMITS: InvestigationLimits = STANDARD_INVESTIGATION_LIMITS;

export function resolveInvestigationMode(rawMode: string | undefined): InvestigationMode {
  if (rawMode === "fast" || rawMode === "deep" || rawMode === "standard") {
    return rawMode;
  }
  return "standard";
}

export function getInvestigationLimitsForMode(mode: InvestigationMode): InvestigationLimits {
  if (mode === "fast") {
    return FAST_INVESTIGATION_LIMITS;
  }
  if (mode === "deep") {
    return DEEP_INVESTIGATION_LIMITS;
  }
  return STANDARD_INVESTIGATION_LIMITS;
}
