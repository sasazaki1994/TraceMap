import type { CompanyResearchReport, CompanyResearchReportInput } from "@/types/company-research";

const DISCLAIMER =
  "This report organizes publicly available information for research purposes. It does not provide investment advice, buy/sell recommendations, target prices, or performance guarantees.";

function bucketClaims(claims: CompanyResearchReportInput["claims"]) {
  const growth: string[] = [];
  const risk: string[] = [];
  const market: string[] = [];
  const evidence: string[] = [];

  for (const claim of claims) {
    const text = claim.text.trim();
    if (!text) continue;
    const lower = text.toLowerCase();
    if (/(growth|expand|adoption|demand|partnership|launch|revenue)/.test(lower)) growth.push(text);
    else if (/(risk|regulation|constraint|shortage|decline|volatility|litigation)/.test(lower)) risk.push(text);
    else if (/(compet|market|share|pricing|rival|industry)/.test(lower)) market.push(text);
    else evidence.push(text);
  }

  return { growth, risk, market, evidence };
}

const fallback = (items: string[], empty: string) => (items.length ? items.map((v) => `- ${v}`) : [`- ${empty}`]);

export function buildCompanyResearchReport(input: CompanyResearchReportInput): CompanyResearchReport {
  const topic = input.topic.trim() || "No company/topic provided.";
  const summary = input.answerContent.trim() || "No executive summary is available yet.";
  const { growth, risk, market, evidence } = bucketClaims(input.claims);
  const sourceLines = input.sources.length
    ? input.sources.map((s) => `- ${s.title}${s.url ? ` (${s.url})` : ""}`)
    : ["- No supporting sources are available yet."];
  const unknownLines = input.unknowns.length
    ? input.unknowns.map((u) => `- [${u.severity.toUpperCase()}] ${u.text} — ${u.reason}`)
    : ["- No unresolved unknowns are currently highlighted."];

  const sourceQualityLines = input.sourceQuality?.length
    ? input.sourceQuality
        .filter((signal) => signal.qualityLevel === "weak" || signal.qualityLevel === "limited")
        .map(
          (signal) =>
            `- ${signal.label}: quality=${signal.qualityLevel}, reachability=${signal.reachabilityStatus}, freshness=${signal.freshnessStatus}`,
        )
    : ["- No source quality caveats are currently highlighted."];

  const lineageLines = input.sourceLineage?.length
    ? input.sourceLineage.map((l) => `- ${l.label}: ${l.lineageLabel}`)
    : ["- No source lineage notes are available yet."];

  const markdown = [
    "# Company Research Report",
    "",
    "## Company / Topic",
    topic,
    "",
    "## Executive Summary",
    summary,
    "",
    "## Business Overview",
    "- Overview derived from the mission summary and evidence map.",
    "",
    "## Growth Drivers",
    ...fallback(growth, "No clear growth drivers identified from current claims."),
    "",
    "## Risk Factors",
    ...fallback(risk, "No clear risk factors identified from current claims."),
    "",
    "## Competitive / Market Context",
    ...fallback(market, "No explicit market context identified from current claims."),
    "",
    "## Recent Developments",
    "- Review dated primary sources and recent reporting in supporting sources.",
    "",
    "## Evidence Summary",
    ...fallback(evidence, "Additional evidence points were not explicitly categorized."),
    ...sourceLines,
    "",
    "## Unknowns / Open Questions",
    ...unknownLines,
    "",
    "## Evidence Quality / Limits",
    ...sourceQualityLines,
    "",
    "## Source Lineage Notes",
    ...lineageLines,
    "",
    "## Research Disclaimer",
    DISCLAIMER,
  ].join("\n");

  return { markdown, hasInvestmentDisclaimer: true };
}
