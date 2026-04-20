import type { AlertLevel, SourceSnapshotType } from "@prisma/client";

import type { AnswerGraphJson } from "@/types/answer-graph";

/** Input for generating graph + evidence payload for a single analysis run. */
export type GenerateAnswerGraphInput = {
  question: string;
};

/** One source row to persist as `source_snapshots` (order preserved). */
export type GeneratedSourceSnapshot = {
  label: string;
  sourceType: SourceSnapshotType;
  url: string | null;
  excerpt: string | null;
};

/** One claim row + graph node id + source placeholders (`__src_0__`, …) before persist. */
export type GeneratedEvidenceClaimInput = {
  summary: string;
  graphNodeId: string | null;
  supportedSourcePlaceholderIds: string[];
  /** When set, persisted as `counterpoints` rows for this claim. */
  counterpoints?: { summary: string }[];
  /** When set, persisted as `alerts` rows with this claim's id. */
  alerts?: { level: AlertLevel; message: string }[];
};

/** Optional structured evidence rows; omit for minimal stub runs. */
export type GeneratedEvidenceBundle = {
  claims: GeneratedEvidenceClaimInput[];
  /**
   * Legacy: one counterargument applied to the first claim when that claim has no `counterpoints`.
   * Prefer per-claim `counterpoints` on each `claims[]` entry.
   */
  counterpoint?: {
    summary: string;
  };
  /**
   * Legacy: answer-scoped alert (`alerts.claim_id` null). Prefer per-claim `alerts` on `claims[]`.
   */
  alert?: {
    level: AlertLevel;
    message: string;
  };
};

/** Persistable result of a successful generation step (DB writer consumes this). */
export type GeneratedAnswerGraphPayload = {
  answer: {
    title: string | null;
    model: string | null;
    content: string;
    graphJson: AnswerGraphJson;
  };
  sources: GeneratedSourceSnapshot[];
  evidence?: GeneratedEvidenceBundle;
};

export type GenerateAnswerGraphSuccess = {
  kind: "success";
  payload: GeneratedAnswerGraphPayload;
};

export type GenerateAnswerGraphFailure = {
  kind: "failure";
  /** Safe-for-UI message; also persisted on `analysis_runs.last_error_message` when the run fails. */
  errorMessage: string;
  /** Optional detail for server logs only (not stored by default). */
  cause?: unknown;
};

export type GenerateAnswerGraphResult =
  | GenerateAnswerGraphSuccess
  | GenerateAnswerGraphFailure;
