import {
  orderClaimsForLens,
  orderSourceSupportingClaimsForLens,
  type RunLens,
} from "@/server/analysis/run-lens";
import type {
  RunClaimConfidence,
  RunCounterpointRelationKind,
  RunEvidenceAlert,
  RunEvidenceClaim,
  RunEvidencePropagationStep,
  RunSourceSupportingClaim,
} from "@/types/run-evidence";

type AnswerWithEvidence = {
  claims: Array<{
    id: string;
    summary: string;
    graphNodeId: string | null;
    confidence: RunClaimConfidence | null;
    counterpoints: Array<{
      id: string;
      summary: string;
      relationKind: RunCounterpointRelationKind;
      graphNodeId: string | null;
    }>;
    propagationChains?: Array<{
      id: string;
      summary: string | null;
      steps: Array<{
        id: string;
        ordinal: number;
        stepKind: RunEvidencePropagationStep["stepKind"];
        label: string;
        detail: string | null;
        sourceSnapshotId: string | null;
      }>;
    }>;
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

/** Prismaで取得したclaim/alertを、クライアントへ返せるrun view propsへ整形する。 */
export function mapAnswerEvidenceForView(
  answer: AnswerWithEvidence,
  lens: RunLens = "rigor",
): {
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
      sourceSupportingClaims.set(
        relation.sourceSnapshotId,
        orderSourceSupportingClaimsForLens(list, lens),
      );

      return support;
    });

    const claimChains = c.propagationChains ?? [];
    const propagationSteps: RunEvidencePropagationStep[] = claimChains.flatMap((chain) =>
      [...chain.steps]
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((step) => ({
          id: step.id,
          orderIndex: step.ordinal,
          stepKind: step.stepKind,
          boundary: step.stepKind === "source" ? "primary" : "interpretation",
          label: step.label,
          content: step.detail,
          sourceId: step.sourceSnapshotId,
        })),
    );

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
        relationKind: cp.relationKind,
        graphNodeId: cp.graphNodeId,
      })),
      propagationSteps,
      lensScore: 0,
      alerts: claimAlertsByClaimId.get(c.id) ?? [],
    } satisfies RunEvidenceClaim;
  });

  return {
    evidenceClaims: orderClaimsForLens(evidenceClaims, lens),
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
