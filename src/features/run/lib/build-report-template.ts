export type ReportTemplate = "briefing" | "company_research" | "competitive_intelligence";

export function buildReportTemplate(template: ReportTemplate): string[] {
  if (template === "company_research") {
    return [
      "# Company Research Report",
      "## Executive Summary",
      "## Company Overview",
      "## Business Segments",
      "## Recent Developments",
      "## Growth Drivers",
      "## Risks",
      "## Competitive Position",
      "## Bull Factors",
      "## Bear Factors",
      "## Unknowns / Open Questions",
      "## Source Lineage",
      "## Evidence Table",
      "## Disclaimer",
    ];
  }
  if (template === "competitive_intelligence") {
    return [
      "# Competitive Intelligence Report",
      "## Comparison Summary",
      "## Competitor Matrix",
      "## Product / Service Comparison",
      "## Pricing / Business Model",
      "## Go-to-Market",
      "## Technology / Capability",
      "## Customer Segments",
      "## Recent Strategic Moves",
      "## Evidence Strength",
      "## Unknowns / Open Questions",
      "## Source Quality Notes",
    ];
  }
  return [
    "# Briefing Report",
    "## Executive Summary",
    "## Key Claims",
    "## Evidence Summary",
    "## Unknowns / Open Questions",
    "## Source Lineage Summary",
    "## Source Quality Notes",
  ];
}
