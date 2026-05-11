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
  const qualityCount = { strong: 0, usable: 0, limited: 0, weak: 0 } as Record<string, number>;
  for (const signal of sourceQuality) qualityCount[signal.quality] += 1;
  const qualityIssues = sourceQuality.filter(
    (signal) => signal.freshness === "stale" || signal.reachability === "unreachable" || signal.reachability === "invalid",
  );

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
      "No unresolved unknowns are currently highlighted.",
    ),
    "",
    "## Source Quality Summary",
    `- Strong: ${qualityCount.strong}`,
    `- Usable: ${qualityCount.usable}`,
    `- Limited: ${qualityCount.limited}`,
    `- Weak: ${qualityCount.weak}`,
    "",
    "## Source Quality Notes",
    ...(qualityIssues.length
      ? qualityIssues.map((item) => `- ${item.label}: ${item.reachability} / ${item.freshness}`)
      : ["- No major source quality caveats highlighted."]),
    "",
    "## Source Lineage Summary",
    ...linesOrFallback(
      sourceLineage,
      (lineage) => `- ${nonEmpty(lineage.label, "Untitled source")}: ${nonEmpty(lineage.lineageLabel, "Lineage not available")}; type=${lineage.sourceType}; published=${lineage.publishedAt ?? "Unknown"}`,
      "No source lineage summary is available yet.",
    ),
  ].join("\n");
}
