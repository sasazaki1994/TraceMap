export type AlertLevel = "info" | "warning" | "error";

export type RunClaimSupportKind = "direct" | "supplemental" | "indirect";
export type RunClaimConfidenceLevel = "high" | "medium" | "low" | "insufficient";
export type RunClaimRecencyStatus = "current" | "stale" | "unknown";
export type RunCounterpointRelationKind =
  | "contradiction"
  | "alternative_interpretation"
  | "different_premise"
  | "different_definition"
  | "temporal_mismatch";
export type RunPropagationStepKind =
  | "source"
  | "evidence_snippet"
  | "source_interpretation"
  | "claim"
  | "answer_segment";
export type RunLens = "rigor" | "timeliness" | "practical";

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

export type RunEvidenceCounterpoint = {
  id: string;
  summary: string;
  relationKind: RunCounterpointRelationKind;
  graphNodeId: string | null;
};

export type RunEvidencePropagationStep = {
  id: string;
  orderIndex: number;
  stepKind: RunPropagationStepKind;
  boundary: "primary" | "interpretation";
  label: string;
  content: string | null;
  sourceId: string | null;
};

/** run/shareページ向けの直列化可能なclaim行（nested counterpoints含む）。 */
export type RunEvidenceClaim = {
  id: string;
  summary: string;
  /** 指定時はこのclaimを`graph_json.nodes[].id`へ紐付け、可視グラフ連動やhighlightに利用する。 */
  graphNodeId: string | null;
  /** `source_snapshots.id` values linked via `claim_source_snapshots`. */
  supportingSourceIds: string[];
  supports: RunClaimSupport[];
  confidence: RunClaimConfidence | null;
  counterpoints: RunEvidenceCounterpoint[];
  propagationSteps: RunEvidencePropagationStep[];
  lensScore: number;
  /** このclaimにスコープされたalert（`alerts.claim_id`あり）。 */
  alerts: { id: string; level: AlertLevel; message: string }[];
};

/** 回答全体にかかるalert（`alerts.claim_id` null）。 */
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
