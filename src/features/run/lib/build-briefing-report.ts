import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { InvestigationUnknown, SourceLineageLite } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";
import {
  sourceFreshnessLabel,
  sourceQualityGradeLabel,
  sourceReachabilityLabel,
} from "@/features/run/lib/source-quality-labels";

type BuildBriefingReportInput = { researchTopic: string; answerContent: string; evidenceClaims: RunEvidenceClaim[]; sources: RunSourceView[]; unknowns: InvestigationUnknown[]; sourceLineage: SourceLineageLite[]; sourceQuality: SourceQualitySignal[]; generatedAt?: string; };
const nonEmpty = (v: string, f: string) => v.trim() || f;
const safeUrl=(v:string|null|undefined)=>{if(!v) return ""; try{const u=new URL(v); return ["http:","https:"].includes(u.protocol)?u.toString():"";}catch{return ""}};

export function buildBriefingReport(input: BuildBriefingReportInput): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const qCounts = { strong:0, usable:0, limited:0, weak:0, unknown:0 };
  input.sourceQuality.forEach((s)=>qCounts[s.quality]++);
  return [
    "# Briefing Report","","## Executive Summary", input.answerContent.trim() || "No executive summary is available yet.","",
    "## Key Claims", ...(input.evidenceClaims.length?input.evidenceClaims.map(c=>`- ${nonEmpty(c.summary,'Untitled claim')}`):["- No key claims are available yet."]),"",
    "## Supporting Sources", ...(input.sources.length?input.sources.map(s=>`- ${nonEmpty(s.label,'Untitled source')}${safeUrl(s.url)?` (${safeUrl(s.url)})`:''}`):["- No supporting sources are available yet."]),"",
    "## Unknowns / Open Questions", ...(input.unknowns.length?input.unknowns.map(u=>`- [${u.severity.toUpperCase()}] ${nonEmpty(u.text,'Unspecified investigation gap')} — ${nonEmpty(u.suggestedNextAction,'Review this gap before reusing the finding.')}`):["- No critical unknowns detected in this beta run."]),"",
    "## Source Quality Summary", `- Strong sources: ${qCounts.strong}`,`- Usable sources: ${qCounts.usable}`,`- Limited sources: ${qCounts.limited}`,`- Weak sources: ${qCounts.weak}`,`- Unknown sources: ${qCounts.unknown}`,"",
    "### Notes", ...(input.sourceQuality.length?input.sourceQuality.map(q=>`- ${q.label}: ${sourceQualityGradeLabel(q.quality)} / ${sourceFreshnessLabel(q.freshness)} / ${sourceReachabilityLabel(q.reachability)}. ${q.reasons.join(' ')}`):["- No source quality notes are available yet."]),"",
    "## Source Lineage Summary", ...(input.sourceLineage.length?input.sourceLineage.map(l=>`- ${nonEmpty(l.label,'Untitled source')}: ${nonEmpty(l.lineageLabel,'Lineage not available')}`):["- No source lineage summary is available yet."]),"",
    "## Generated From", `- Topic: ${nonEmpty(input.researchTopic,'Unknown')}`, `- Generated at: ${generatedAt}`, `- Source count: ${input.sources.length}`, `- Claim count: ${input.evidenceClaims.length}`, `- Unknown count: ${input.unknowns.length}`,
  ].join('\n');
}
