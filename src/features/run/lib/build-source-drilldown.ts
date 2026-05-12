import type { RunEvidenceClaim } from "@/types/run-evidence";
import type { SourceQualitySignal } from "@/types/source-quality";
import type { InvestigationUnknown } from "@/types/investigation";
import type { EvidenceEdgeQuality } from "@/features/run/lib/build-evidence-edge-quality";

export type SourceDrilldownItem = {
  claimId: string;
  claimSummary: string;
  supportKind: string;
  supportingQuote: string | null;
  contradictionNote: string | null;
  isPrimarySource: boolean;
  edgeQuality: EvidenceEdgeQuality["supportQuality"];
};

export function buildSourceDrilldown(params: {
  sourceId: string;
  claims: RunEvidenceClaim[];
  edgeQuality: EvidenceEdgeQuality[];
  sourceQuality?: SourceQualitySignal | null;
  unknowns?: InvestigationUnknown[];
}) {
  const supportedClaims: SourceDrilldownItem[] = params.claims.flatMap((claim) =>
    claim.supports
      .filter((s) => s.sourceId === params.sourceId)
      .map((support) => ({
        claimId: claim.id,
        claimSummary: claim.summary,
        supportKind: support.supportKind,
        supportingQuote: support.supportingQuote ?? null,
        contradictionNote: support.contradictionNote ?? null,
        isPrimarySource: support.isPrimarySource,
        edgeQuality:
          params.edgeQuality.find((e) => e.claimId === claim.id && e.sourceId === params.sourceId)
            ?.supportQuality ?? "unknown",
      })),
  );

  const relatedUnknowns = (params.unknowns ?? []).filter(
    (unknown) => unknown.relatedSourceIds?.includes(params.sourceId) || unknown.relatedClaimIds?.some((id) => supportedClaims.some((claim) => claim.claimId === id)),
  );

  return {
    supportedClaims,
    sourceQualityReasons: params.sourceQuality?.reasons ?? [],
    relatedUnknowns,
  };
}
