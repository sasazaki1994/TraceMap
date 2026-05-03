import type { SourceLineageLite } from "@/types/investigation";
import type { RunEvidenceClaim } from "@/types/run-evidence";

type SourceForLineage = {
  id: string;
  label: string;
  sourceType: SourceLineageLite["sourceType"] | string;
  publishedAt?: string | null;
};

function normalizeSourceType(sourceType: string): SourceLineageLite["sourceType"] {
  switch (sourceType) {
    case "web":
    case "document":
    case "note":
      return sourceType;
    default:
      return "web";
  }
}

function sourceTypeLabel(sourceType: SourceLineageLite["sourceType"] | string): string {
  switch (sourceType) {
    case "web":
      return "Web source";
    case "document":
      return "Document source";
    case "note":
      return "Research note";
    default:
      return "Unknown source type";
  }
}

function buildLineageLabel(params: {
  sourceType: SourceLineageLite["sourceType"] | string;
  isPrimarySource: boolean;
  claimCount: number;
  publishedAt?: string | null;
}): string {
  const parts = [
    params.isPrimarySource ? "Primary evidence or official source" : "Supporting context",
    sourceTypeLabel(params.sourceType),
    params.claimCount === 1
      ? "linked to 1 claim"
      : `linked to ${params.claimCount} claims`,
  ];

  if (params.publishedAt) {
    parts.push(`published ${params.publishedAt}`);
  } else {
    parts.push("publication date unknown");
  }

  return parts.join(" / ");
}

export function buildSourceLineage(params: {
  sources: SourceForLineage[];
  evidenceClaims: RunEvidenceClaim[];
}): SourceLineageLite[] {
  return params.sources.map((source) => {
    const sourceType = normalizeSourceType(source.sourceType);
    const supports = params.evidenceClaims.flatMap((claim) =>
      claim.supports
        .filter((support) => support.sourceId === source.id)
        .map((support) => ({ claimId: claim.id, isPrimarySource: support.isPrimarySource })),
    );
    const claimIds = new Set(supports.map((support) => support.claimId));
    const isPrimarySource = supports.some((support) => support.isPrimarySource);

    return {
      sourceId: source.id,
      label: source.label,
      sourceType,
      lineageLabel: buildLineageLabel({
        sourceType: source.sourceType,
        isPrimarySource,
        claimCount: claimIds.size,
        publishedAt: source.publishedAt,
      }),
      publishedAt: source.publishedAt ?? null,
      isPrimarySource,
      linkedClaimCount: claimIds.size,
    };
  });
}
