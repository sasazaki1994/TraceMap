import type {
  AlertLevel,
  ClaimConfidenceLevel,
  CounterpointRelationKind,
  ClaimRecencyStatus,
  ClaimSupportKind,
  PropagationStepKind,
  SourceSnapshotType,
} from "@prisma/client";

import type { AnswerGraphJson } from "@/types/answer-graph";
import type { SourceCandidate } from "@/types/source-intake";
import type { InvestigationMode } from "@/server/analysis/investigation-limits";

/** 単一analysis run向けにgraph + evidence payloadを生成するための入力。 */
export type GenerateAnswerGraphInput = {
  question: string;
  sourceCandidates?: SourceCandidate[];
  mode?: InvestigationMode;
};

/** `source_snapshots`へ保存する1件分source（順序保持）。 */
export type GeneratedSourceSnapshot = {
  label: string;
  sourceType: SourceSnapshotType;
  url: string | null;
  excerpt: string | null;
  publishedAt?: Date | null;
};

export type GeneratedClaimSupportInput = {
  sourcePlaceholderId: string;
  supportKind: ClaimSupportKind;
  isPrimarySource?: boolean;
  supportingQuote?: string | null;
  contradictionNote?: string | null;
};

export type GeneratedClaimConfidenceInput = {
  score: number;
  level: ClaimConfidenceLevel;
  summary: string;
  hasPrimarySource: boolean;
  independentSourceCount: number;
  hasSupportingQuote: boolean;
  recencyStatus: ClaimRecencyStatus;
  hasContradiction: boolean;
};

export type GeneratedCounterpointInput = {
  summary: string;
  relationKind?: CounterpointRelationKind;
  graphNodeId?: string | null;
};

export type GeneratedPropagationChainStepInput = {
  stepKind: PropagationStepKind;
  order: number;
  label: string;
  detail?: string | null;
  sourcePlaceholderId?: string | null;
  claimGraphNodeId?: string | null;
  answerSegmentKey?: string | null;
};

/** 永続化前のclaim 1件分。graph node idとsource placeholder（`__src_0__`等）を含む。 */
export type GeneratedEvidenceClaimInput = {
  summary: string;
  graphNodeId: string | null;
  /** legacy経路。`supports` 未指定時はdirect supportsへ変換する。 */
  supportedSourcePlaceholderIds: string[];
  /** このclaimで推奨する正規化済みsupport relation。 */
  supports?: GeneratedClaimSupportInput[];
  /** このclaimの説明可能なconfidence情報。 */
  confidence?: GeneratedClaimConfidenceInput;
  /** 指定時はこのclaimに紐づく`counterpoints`行として永続化する。 */
  counterpoints?: GeneratedCounterpointInput[];
  /** このclaimの出どころ/解釈の順序付きチェーン。 */
  propagationChain?: GeneratedPropagationChainStepInput[];
  /** 指定時はこのclaim id付きの`alerts`行として永続化する。 */
  alerts?: { level: AlertLevel; message: string }[];
};

/** 任意の構造化evidence行。最小stub runでは省略可能。 */
export type GeneratedEvidenceBundle = {
  claims: GeneratedEvidenceClaimInput[];
  /**
   * legacy: 先頭claimに`counterpoints`が無い場合のみ、単一反論を先頭claimへ適用する。
   * 推奨は各`claims[]`要素ごとの`counterpoints`指定。
   */
  counterpoint?: {
    summary: string;
  };
  /**
   * legacy: answer全体alert（`alerts.claim_id` null）。推奨は`claims[]`側のclaim単位`alerts`。
   */
  alert?: {
    level: AlertLevel;
    message: string;
  };
};

/** 生成成功時にDB writerが受け取る永続化可能な結果。 */
/**
 * provider出力を永続化用へ正規化した中間payload。
 * graphJsonは描画スナップショットで、claim/source実体は別テーブルへ保存される。
 */
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
  /** UI表示して安全なメッセージ。run失敗時は`analysis_runs.last_error_message`にも保存する。 */
  errorMessage: string;
  /** 任意の詳細情報。サーバーログ用途のみ（既定では永続化しない）。 */
  cause?: unknown;
};

export type GenerateAnswerGraphResult =
  | GenerateAnswerGraphSuccess
  | GenerateAnswerGraphFailure;
