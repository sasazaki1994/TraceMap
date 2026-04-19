import type { RunEvidenceAlert, RunEvidenceClaim } from "@/types/run-evidence";

type AnswerWithEvidence = {
  claims: Array<{
    id: string;
    summary: string;
    graphNodeId: string | null;
    counterpoints: Array<{ id: string; summary: string }>;
  }>;
  alerts: Array<{ id: string; level: RunEvidenceAlert["level"]; message: string }>;
};

/** Maps Prisma-loaded claims/alerts into client-serializable run view props. */
export function mapAnswerEvidenceForView(answer: AnswerWithEvidence): {
  evidenceClaims: RunEvidenceClaim[];
  evidenceAlerts: RunEvidenceAlert[];
} {
  return {
    evidenceClaims: answer.claims.map((c) => ({
      id: c.id,
      summary: c.summary,
      graphNodeId: c.graphNodeId,
      counterpoints: c.counterpoints.map((cp) => ({
        id: cp.id,
        summary: cp.summary,
      })),
    })),
    evidenceAlerts: answer.alerts.map((a) => ({
      id: a.id,
      level: a.level,
      message: a.message,
    })),
  };
}
