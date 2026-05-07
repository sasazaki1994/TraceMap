export type InvestigationUnknownSeverity = "high" | "medium" | "low";

export type InvestigationUnknown = {
  id: string;
  text: string;
  reason: string;
  severity: InvestigationUnknownSeverity;
  suggestedNextAction: string;
};

export type SourceLineageLite = {
  sourceId: string;
  label: string;
  sourceType: string;
  lineageLabel: string;
  publishedAt?: string | null;
  verificationStatus?: string | null;
  isPrimarySource?: boolean;
  linkedClaimCount?: number;
  checkedAt?: string | null;
  httpStatus?: number | null;
  finalUrl?: string | null;
  contentType?: string | null;
};
