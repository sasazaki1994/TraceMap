export type AlertLevel = "info" | "warning" | "error";

export type RunClaimSupportKind = "direct" | "supplemental" | "indirect";
export type RunClaimConfidenceLevel = "high" | "medium" | "low" | "insufficient";
export type RunClaimRecencyStatus = "current" | "stale" | "unknown";

export type RunClaimSupport = {
  sourceId: string;
  sourceLabel: string;
  sourceType?: "web" | "document" | "note";
  sourceUrl?: string | null;
  supportKind: RunClaimSupportKind;
  isPrimarySource: boolean;
  supportingQuote: string | null;
  contradictionNote: string | null;
};

export type RunClaimConfidence = {
  score: number;
  level: RunClaimConfidenceLevel;
  summary: string;
  hasPrimarySource: boolean;
  independentSourceCount: number;
  hasSupportingQuote: boolean;
  recencyStatus: RunClaimRecencyStatus;
  hasContradiction: boolean;
};

/** Serializable claim row + nested counterpoints for run / share pages. */
export type RunEvidenceClaim = {
  id: string;
  summary: string;
  /** When set, ties this claim to `graph_json.nodes[].id` (visual graph + optional highlight). */
  graphNodeId: string | null;
  /** `source_snapshots.id` values linked via `claim_source_snapshots`. */
  supportingSourceIds: string[];
  supports: RunClaimSupport[];
  confidence: RunClaimConfidence | null;
  counterpoints: { id: string; summary: string }[];
  /** Alerts scoped to this claim (`alerts.claim_id` set). */
  alerts: { id: string; level: AlertLevel; message: string }[];
};

/** Answer-wide alert (`alerts.claim_id` null). */
export type RunEvidenceAlert = {
  id: string;
  level: AlertLevel;
  message: string;
};

export type RunEvidenceSourceSupport = RunClaimSupport;

export type RunSourceSupportingClaim = {
  claimId: string;
  claimSummary: string;
  supportKind: RunClaimSupportKind;
  isPrimarySource: boolean;
  supportingQuote: string | null;
  contradictionNote: string | null;
};
