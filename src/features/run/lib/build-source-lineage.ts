import type { SourceLineageLite } from "@/types/investigation";
import type { RunEvidenceClaim } from "@/types/run-evidence";

type SourceForLineage = {
  id: string;
  label: string;
  url?: string | null;
  sourceType: string;
  publishedAt?: string | null;
  verificationStatus?: string | null;
  checkedAt?: string | null;
  httpStatus?: number | null;
  finalUrl?: string | null;
  contentType?: string | null;
};

function sanitizeLineageUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function sourceTypeLabel(sourceType: string): string {
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

function lineageCategory(params: { sourceType: string; isPrimarySource: boolean }): string {
  if (params.isPrimarySource) {
    return "Primary / Official Source";
  }
  switch (params.sourceType) {
    case "web":
      return "News / Secondary Source";
    case "document":
      return "Commentary / Analysis Source";
    case "note":
      return "Social / Unverified Source";
    default:
      return "Unknown source type";
  }
}

function buildLineageLabel(params: {
  sourceType: string;
  isPrimarySource: boolean;
  claimCount: number;
  publishedAt?: string | null;
}): string {
  const parts = [
    lineageCategory({
      sourceType: params.sourceType,
      isPrimarySource: params.isPrimarySource,
    }),
    sourceTypeLabel(params.sourceType),
    params.claimCount === 1 ? "linked to 1 claim" : `linked to ${params.claimCount} claims`,
    params.publishedAt ? `published ${params.publishedAt}` : "publication date unknown",
  ];

  return parts.join(" / ");
}

function normalizeVerificationStatus(value: string | null | undefined): string | null {
  return value === "verified" ? "verified" : value ?? null;
}

export function buildSourceLineage(params: {
  sources: SourceForLineage[];
  evidenceClaims: RunEvidenceClaim[];
}): SourceLineageLite[] {
  return params.sources.map((source) => {
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
      url: sanitizeLineageUrl(source.url),
      sourceType: source.sourceType || "unknown",
      lineageLabel: buildLineageLabel({
        sourceType: source.sourceType || "unknown",
        isPrimarySource,
        claimCount: claimIds.size,
        publishedAt: source.publishedAt,
      }),
      publishedAt: source.publishedAt ?? null,
      isPrimarySource,
      linkedClaimCount: claimIds.size,
      verificationStatus: normalizeVerificationStatus(source.verificationStatus),
      checkedAt: source.checkedAt ?? null,
      httpStatus: source.httpStatus ?? null,
      finalUrl: source.finalUrl ?? null,
      contentType: source.contentType ?? null,
    };
  });
}
