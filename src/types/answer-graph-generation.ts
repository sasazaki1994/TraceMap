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

/** Optional structured evidence rows (mock slice); omit for minimal stub runs. */
export type GeneratedEvidenceBundle = {
  claim: {
    summary: string;
    graphNodeId: string | null;
  };
  counterpoint: {
    summary: string;
  };
  alert: {
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
