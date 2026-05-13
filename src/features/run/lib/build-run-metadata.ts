import type { AnalysisRunStatus } from "@prisma/client";

import type { RunEvidenceAlert, RunEvidenceClaim } from "@/types/run-evidence";

export type RunMetadata = {
  runId: string | null;
  status: AnalysisRunStatus | "unknown";
  createdAtIso: string | null;
  updatedAtIso: string | null;
  provider: string;
  model: string;
  sourceCount: number;
  claimCount: number;
  alertCount: number;
  counterpointCount: number;
  cacheStatus: "unknown" | "cached" | "uncached";
  generatedAtIso: string | null;
};

export function buildRunMetadata(input: {
  runId?: string;
  status?: AnalysisRunStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  model?: string | null;
  sources: Array<{ id: string }>;
  evidenceClaims: RunEvidenceClaim[];
  evidenceAlerts: RunEvidenceAlert[];
  generatedAt?: string | null;
  cacheStatus?: "unknown" | "cached" | "uncached";
}): RunMetadata {
  const model = input.model?.trim() || "unknown";
  const provider = model.startsWith("gpt") ? "openai" : "unknown";
  const counterpointCount = input.evidenceClaims.reduce(
    (sum, claim) => sum + claim.counterpoints.length,
    0,
  );

  return {
    runId: input.runId ?? null,
    status: input.status ?? "unknown",
    createdAtIso: input.createdAt ?? null,
    updatedAtIso: input.updatedAt ?? null,
    provider,
    model,
    sourceCount: input.sources.length,
    claimCount: input.evidenceClaims.length,
    alertCount: input.evidenceAlerts.length,
    counterpointCount,
    cacheStatus: input.cacheStatus ?? "unknown",
    generatedAtIso: input.generatedAt ?? null,
  };
}
