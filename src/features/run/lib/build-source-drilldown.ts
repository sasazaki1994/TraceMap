import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { SourceDetailDrilldown, SourceSupportDisplayKind } from "@/types/source-drilldown";
import type { InvestigationUnknown, SourceLineageLite } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

function normalizeSupportKind(kind: string, contradictionNote?: string | null): SourceSupportDisplayKind {
  if (contradictionNote?.trim()) return "contradiction";
  const normalized = kind.toLowerCase();
  if (normalized.includes("direct") || normalized.includes("primary") || normalized.includes("quote")) return "direct";
  if (normalized.includes("indirect") || normalized.includes("secondary")) return "indirect";
  if (normalized.includes("context") || normalized.includes("background") || normalized.includes("supplemental")) return "context";
  if (normalized.includes("weak") || normalized.includes("limited")) return "weak";
  return "unknown";
}

export function buildSourceDrilldown(params: {
  sources: RunSourceView[];
  claims: RunEvidenceClaim[];
  sourceQuality?: SourceQualitySignal[];
  sourceLineage?: SourceLineageLite[];
  unknowns?: InvestigationUnknown[];
}): SourceDetailDrilldown[] {
  const qualities = new Map((params.sourceQuality ?? []).map((q) => [q.sourceId, q]));
  const lineage = new Map((params.sourceLineage ?? []).map((l) => [l.sourceId, l]));

  return params.sources.map((source) => {
    const supportedClaims = params.claims.flatMap((claim) =>
      claim.supports
        .filter((support) => support.sourceId === source.id)
        .map((support) => {
          const kind = normalizeSupportKind(support.supportKind, support.contradictionNote);
          const warnings: string[] = [];
          if (kind === "direct" && !support.supportingQuote?.trim()) warnings.push("Quote missing for direct support.");
          return {
            claimId: claim.id,
            claimText: claim.summary,
            supportKind: kind,
            rawSupportKind: support.supportKind,
            supportingQuote: support.supportingQuote,
            contradictionNote: support.contradictionNote,
            isPrimarySource: support.isPrimarySource,
            warnings,
          };
        }),
    );

    const relatedUnknowns = (params.unknowns ?? []).filter(
      (unknown) =>
        unknown.relatedSourceIds?.includes(source.id) ||
        unknown.relatedClaimIds?.some((claimId) => supportedClaims.some((claim) => claim.claimId === claimId)),
    );

    const sourceQuality = qualities.get(source.id) ?? null;
    return {
      sourceId: source.id,
      title: source.label,
      url: source.url,
      sourceType: source.sourceType,
      publishedAt: source.publishedAt ?? null,
      sourceQuality,
      lineage: lineage.get(source.id) ?? null,
      isPrimaryLike: supportedClaims.some((claim) => claim.isPrimarySource) || Boolean(sourceQuality?.isPrimaryLike),
      supportedClaims,
      relatedUnknowns,
    };
  });
}
