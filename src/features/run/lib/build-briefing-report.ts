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

function nonEmpty(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function buildBriefingReport({
  researchTopic,
  answerContent,
  evidenceClaims,
  sources,
  unknowns,
  sourceLineage,
}: BuildBriefingReportInput): string {
  const topic = nonEmpty(researchTopic, "No research topic is available.");
  const executiveSummary = answerContent.trim() || "No executive summary is available yet.";
  const claimLines = linesOrFallback(
    evidenceClaims,
    (claim) => `- ${nonEmpty(claim.summary, "Untitled claim")}`,
    "No key claims are available yet.",
  );
  const sourceLines = linesOrFallback(
    sources,
    (source) =>
      `- ${nonEmpty(source.label, "Untitled source")}${
        source.url ? ` (${source.url})` : ""
      }`,
    "No supporting sources are available yet.",
  );
  const unknownLines = linesOrFallback(
    unknowns,
    (unknown) =>
      `- [${unknown.severity.toUpperCase()}] ${nonEmpty(
        unknown.text,
        "Unspecified investigation gap",
      )} — ${nonEmpty(
        unknown.suggestedNextAction,
        "Review this gap before reusing the finding.",
      )}`,
    "No unresolved unknowns are currently highlighted.",
  );
  const lineageLines = linesOrFallback(
    sourceLineage,
    (lineage) =>
      `- ${nonEmpty(lineage.label, "Untitled source")}: ${nonEmpty(
        lineage.lineageLabel,
        "Lineage not available",
      )}; type=${lineage.sourceType}; published=${lineage.publishedAt ?? "Unknown"}`,
    "No source lineage summary is available yet.",
  );

  return [
    "# Briefing Report",
    "",
    "## Executive Summary",
    `Research topic: ${topic}`,
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
