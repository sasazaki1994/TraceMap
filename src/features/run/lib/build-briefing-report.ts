import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { InvestigationUnknown, SourceLineageLite } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

type BuildBriefingReportInput = {
  researchTopic: string;
  answerContent: string;
  evidenceClaims: RunEvidenceClaim[];
  sources: RunSourceView[];
  unknowns: InvestigationUnknown[];
  sourceLineage: SourceLineageLite[];
  sourceQuality: SourceQualitySignal[];
};

function linesOrFallback<T>(items: T[], format: (item: T) => string, fallback: string): string[] {
  return items.length === 0 ? [`- ${fallback}`] : items.map(format);
}
const nonEmpty = (value: string, fallback: string) => value.trim() || fallback;

export function buildBriefingReport(input: BuildBriefingReportInput): string {
  const { researchTopic, answerContent, evidenceClaims, sources, unknowns, sourceLineage, sourceQuality } = input;
  const generatedAt = new Date().toISOString();

  return [
    "# Briefing Report",
    "",
    "## Executive Summary",
    `Research topic: ${nonEmpty(researchTopic, "No research topic is available.")}`,
    "",
    answerContent.trim() || "No executive summary is available yet.",
    "",
    "## Key Claims",
    ...linesOrFallback(evidenceClaims, (claim) => `- ${nonEmpty(claim.summary, "Untitled claim")}`, "No key claims are available yet."),
    "",
    "## Supporting Sources",
    ...linesOrFallback(sources, (source) => `- ${nonEmpty(source.label, "Untitled source")}${source.url ? ` (${source.url})` : ""}`, "No supporting sources are available yet."),
    "",
    "## Unknowns / Open Questions",
    ...linesOrFallback(
      unknowns,
      (unknown) => `- [${unknown.severity.toUpperCase()}] ${nonEmpty(unknown.text, "Unspecified investigation gap")} — ${nonEmpty(unknown.suggestedNextAction, "Review this gap before reusing the finding.")}`,
      "No critical unknowns detected in this beta run.",
    ),
    "",
    "## Source Lineage Summary",
    ...linesOrFallback(
      sourceLineage,
      (lineage) => `- ${nonEmpty(lineage.label, "Untitled source")}: ${nonEmpty(lineage.lineageLabel, "Lineage not available")}; type=${lineage.sourceType}; published=${lineage.publishedAt ?? "Unknown"}`,
      "No source lineage summary is available yet.",
    ),
    "",
    "## Source Quality Notes",
    ...linesOrFallback(
      sourceQuality,
      (quality) => `- ${quality.label}: quality=${quality.quality}, freshness=${quality.freshness}, reachability=${quality.reachability}. ${quality.reasons[0] ?? ""}`,
      "No source quality notes are available yet.",
    ),
    "",
    "## Generated From",
    `- Topic: ${nonEmpty(researchTopic, "Unknown")}`,
    `- Generated at: ${generatedAt}`,
    `- Source count: ${sources.length}`,
    `- Claim count: ${evidenceClaims.length}`,
  ].join("\n");
}
