export type InvestigationUnknownSeverity = "high" | "medium" | "low";

export type InvestigationUnknownCategory =
  | "evidence"
  | "source"
  | "freshness"
  | "contradiction"
  | "report";

export type InvestigationUnknown = {
  id: string;
  text: string;
  reason: string;
  severity: InvestigationUnknownSeverity;
  category: InvestigationUnknownCategory;
  suggestedNextAction: string;
};

export type SourceLineageLite = {
  sourceId: string;
  label: string;
  url?: string | null;
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
