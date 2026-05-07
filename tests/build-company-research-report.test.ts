import { describe, expect, it } from "vitest";

import { buildCompanyResearchReport } from "@/features/run/lib/build-company-research-report";

describe("buildCompanyResearchReport", () => {
  it("builds required sections and disclaimer", () => {
    const result = buildCompanyResearchReport({
      topic: "Analyze Nova Mobility EV strategy",
      answerContent: "Public filings and news suggest expansion and supply-chain risks.",
      claims: [
        { id: "c1", text: "EV demand growth supports expansion." },
        { id: "c2", text: "Battery supply constraints are a major risk." },
        { id: "c3", text: "Competition in the EV market is increasing." },
      ],
      sources: [{ id: "s1", title: "Investor update", url: "https://example.com/ir" }],
      unknowns: [{ id: "u1", text: "Regional margin trend", reason: "Insufficient public disclosure", severity: "medium", suggestedNextAction: "" }],
      sourceLineage: [{ sourceId: "s1", label: "Investor update", sourceType: "web", lineageLabel: "Primary evidence", publishedAt: null, isPrimarySource: true, linkedClaimCount: 1 }],
    });

    expect(result.markdown).toContain("# Company Research Report");
    expect(result.markdown).toContain("## Executive Summary");
    expect(result.markdown).toContain("## Growth Drivers");
    expect(result.markdown).toContain("## Risk Factors");
    expect(result.markdown).toContain("## Evidence Summary");
    expect(result.markdown).toContain("## Unknowns / Open Questions");
    expect(result.markdown).toContain("## Research Disclaimer");
    expect(result.markdown.toLowerCase()).not.toContain("buy recommendation");
  });

  it("does not crash for empty data", () => {
    const result = buildCompanyResearchReport({
      topic: "",
      answerContent: "",
      claims: [],
      sources: [],
      unknowns: [],
      sourceLineage: [],
    });
    expect(result.markdown).toContain("No company/topic provided.");
    expect(result.markdown).toContain("No supporting sources are available yet.");
  });
});
