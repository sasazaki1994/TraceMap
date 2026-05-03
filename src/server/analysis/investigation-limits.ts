export const INVESTIGATION_LIMITS = {
  maxSources: 5,
  maxClaims: 8,
  maxCounterpointsPerClaim: 2,
  maxAlertsPerClaim: 2,
  maxPropagationStepsPerClaim: 5,
  maxAnswerContentChars: 4000,
  maxSourceExcerptChars: 1200,
  maxClaimSummaryChars: 500,
} as const;

export type InvestigationLimits = typeof INVESTIGATION_LIMITS;
