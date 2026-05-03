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
  sourceType: "web" | "document" | "note";
  lineageLabel: string;
  publishedAt?: string | null;
  isPrimarySource: boolean;
  linkedClaimCount: number;
  verificationStatus?: "verified" | "unverified" | "unreachable" | "invalid";
  checkedAt?: string | null;
  httpStatus?: number | null;
  finalUrl?: string | null;
  contentType?: string | null;
};
