import type { RunEvidenceAlert, RunEvidenceClaim } from "@/types/run-evidence";

type AnswerWithEvidence = {
  claims: Array<{
    id: string;
    summary: string;
    graphNodeId: string | null;
    counterpoints: Array<{ id: string; summary: string }>;
    claimSourceSnapshots: Array<{ sourceSnapshotId: string }>;
  }>;
  alerts: Array<{
    id: string;
    claimId: string | null;
    level: RunEvidenceAlert["level"];
    message: string;
  }>;
};

/** Maps Prisma-loaded claims/alerts into client-serializable run view props. */
export function mapAnswerEvidenceForView(answer: AnswerWithEvidence): {
  evidenceClaims: RunEvidenceClaim[];
  evidenceAlerts: RunEvidenceAlert[];
} {
  const claimAlertsByClaimId = new Map<
    string,
    Array<{ id: string; level: RunEvidenceAlert["level"]; message: string }>
  >();
  for (const a of answer.alerts) {
    if (a.claimId === null) {
      continue;
    }
    const list = claimAlertsByClaimId.get(a.claimId) ?? [];
    list.push({ id: a.id, level: a.level, message: a.message });
    claimAlertsByClaimId.set(a.claimId, list);
  }

  return {
    evidenceClaims: answer.claims.map((c) => ({
      id: c.id,
      summary: c.summary,
      graphNodeId: c.graphNodeId,
      supportingSourceIds: c.claimSourceSnapshots.map((x) => x.sourceSnapshotId),
      counterpoints: c.counterpoints.map((cp) => ({
        id: cp.id,
        summary: cp.summary,
      })),
      alerts: claimAlertsByClaimId.get(c.id) ?? [],
    })),
    evidenceAlerts: answer.alerts
      .filter((a) => a.claimId === null)
      .map((a) => ({
        id: a.id,
        level: a.level,
        message: a.message,
      })),
  };
}
