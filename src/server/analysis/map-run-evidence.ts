import type {
  RunClaimConfidence,
  RunEvidenceAlert,
  RunEvidenceClaim,
  RunSourceSupportingClaim,
} from "@/types/run-evidence";

type AnswerWithEvidence = {
  claims: Array<{
    id: string;
    summary: string;
    graphNodeId: string | null;
    confidence: RunClaimConfidence | null;
    counterpoints: Array<{ id: string; summary: string }>;
    claimSourceSnapshots: Array<{
      sourceSnapshotId: string;
      supportKind: RunEvidenceClaim["supports"][number]["supportKind"];
      isPrimarySource: boolean;
      supportingQuote: string | null;
      contradictionNote: string | null;
      sourceSnapshot: {
        label: string;
      };
    }>;
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
  sourceSupportingClaims: Map<string, RunSourceSupportingClaim[]>;
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

  const sourceSupportingClaims = new Map<string, RunSourceSupportingClaim[]>();

  const evidenceClaims = answer.claims.map((c) => {
    const supports = c.claimSourceSnapshots.map((relation) => {
      const support = {
        sourceId: relation.sourceSnapshotId,
        sourceLabel: relation.sourceSnapshot.label,
        supportKind: relation.supportKind,
        isPrimarySource: relation.isPrimarySource,
        supportingQuote: relation.supportingQuote,
        contradictionNote: relation.contradictionNote,
      };

      const list = sourceSupportingClaims.get(relation.sourceSnapshotId) ?? [];
      list.push({
        claimId: c.id,
        claimSummary: c.summary,
        supportKind: relation.supportKind,
        isPrimarySource: relation.isPrimarySource,
        supportingQuote: relation.supportingQuote,
        contradictionNote: relation.contradictionNote,
      });
      sourceSupportingClaims.set(relation.sourceSnapshotId, list);

      return support;
    });

    return {
      id: c.id,
      summary: c.summary,
      graphNodeId: c.graphNodeId,
      supportingSourceIds: supports.map((x) => x.sourceId),
      supports,
      confidence: c.confidence ?? {
        score: 0,
        level: "insufficient",
        summary: "Confidence breakdown unavailable for this snapshot.",
        hasPrimarySource: false,
        independentSourceCount: 0,
        hasSupportingQuote: false,
        recencyStatus: "unknown",
        hasContradiction: false,
      },
      counterpoints: c.counterpoints.map((cp) => ({
        id: cp.id,
        summary: cp.summary,
      })),
      alerts: claimAlertsByClaimId.get(c.id) ?? [],
    } satisfies RunEvidenceClaim;
  });

  return {
    evidenceClaims,
    evidenceAlerts: answer.alerts
      .filter((a) => a.claimId === null)
      .map((a) => ({
        id: a.id,
        level: a.level,
        message: a.message,
      })),
    sourceSupportingClaims,
  };
}
