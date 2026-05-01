import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { InvestigationUnknown, SourceLineageLite } from "@/types/investigation";
import type { RunEvidenceClaim } from "@/types/run-evidence";

type BuildBriefingReportInput = {
  researchTopic: string;
  answerContent: string;
  evidenceClaims: RunEvidenceClaim[];
  sources: RunSourceView[];
  unknowns: InvestigationUnknown[];
  sourceLineage: SourceLineageLite[];
};

function linesOrFallback<T>(
  items: T[],
  format: (item: T, index: number) => string,
  fallback: string,
): string[] {
  if (items.length === 0) {
    return [`- ${fallback}`];
  }
  return items.map(format);
}

export function buildBriefingReport({
  researchTopic,
  answerContent,
  evidenceClaims,
  sources,
  unknowns,
  sourceLineage,
}: BuildBriefingReportInput): string {
  const executiveSummary = answerContent.trim() || "No executive summary is available yet.";
  const claimLines = linesOrFallback(
    evidenceClaims,
    (claim) => `- ${claim.summary}`,
    "No key claims are available yet.",
  );
  const sourceLines = linesOrFallback(
    sources,
    (source) => `- ${source.label}${source.url ? ` (${source.url})` : ""}`,
    "No supporting sources are available yet.",
  );
  const unknownLines = linesOrFallback(
    unknowns,
    (unknown) =>
      `- [${unknown.severity.toUpperCase()}] ${unknown.text} — ${unknown.suggestedNextAction}`,
    "No unresolved unknowns are currently highlighted.",
  );
  const lineageLines = linesOrFallback(
    sourceLineage,
    (lineage) =>
      `- ${lineage.label}: ${lineage.lineageLabel}; type=${lineage.sourceType}; published=${lineage.publishedAt ?? "Unknown"}`,
    "No source lineage summary is available yet.",
  );

  return [
    "# Briefing Report",
    "",
    "## Executive Summary",
    `Research topic: ${researchTopic}`,
    "",
    executiveSummary,
    "",
    "## Key Claims",
    ...claimLines,
    "",
    "## Supporting Sources",
    ...sourceLines,
    "",
    "## Unknowns / Open Questions",
    ...unknownLines,
    "",
    "## Source Lineage Summary",
    ...lineageLines,
  ].join("\n");
}
