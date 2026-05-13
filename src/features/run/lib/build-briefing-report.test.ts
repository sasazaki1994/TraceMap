import { describe, expect, it } from "vitest";
import { buildBriefingReport } from "@/features/run/lib/build-briefing-report";

describe("buildBriefingReport", () => {
  it("builds deterministic markdown sections with metadata and source quality", () => {
    const markdown = buildBriefingReport({
      runId: "run_123",
      researchTopic: "topic",
      answerContent: "summary",
      evidenceClaims: [
        {
          id: "c1",
          summary: "Claim A",
          graphNodeId: null,
          supportingSourceIds: ["s1"],
          supports: [
            {
              sourceId: "s1",
              sourceLabel: "Source 1",
              sourceType: "web",
              sourceUrl: "https://example.com",
              supportKind: "direct",
              isPrimarySource: true,
              supportingQuote: "quote",
              contradictionNote: null,
            },
          ],
          confidence: null,
          counterpoints: [],
          propagationSteps: [],
          lensScore: 0,
          alerts: [],
        },
      ],
      sources: [{ id: "s1", label: "Source 1", url: "https://example.com", excerpt: null, sourceType: "web" }],
      unknowns: [{ id: "u1", text: "Gap", reason: "Missing date", severity: "medium", category: "freshness", suggestedNextAction: "Check date", relatedClaimIds: [], relatedSourceIds: [] }],
      sourceLineage: [{ sourceId: "s1", label: "Source 1", url: "https://example.com", sourceType: "web", publishedAt: null, lineageLabel: "run-local", isPrimarySource: true, linkedClaimCount: 1, checkedAt: null, verificationStatus: "unverified", httpStatus: null, finalUrl: null, contentType: null }],
      sourceQuality: [{ sourceId: "s1", label: "Source 1", quality: "strong", freshness: "fresh", reachability: "unchecked", reasons: ["r1"], warnings: ["w1"], linkedClaimCount: 1, hasSupportingQuote: true }],
      generatedAt: "2026-05-12T00:00:00.000Z",
    });

    expect(markdown).toContain("# Briefing Report");
    expect(markdown).toContain("## Executive Summary");
    expect(markdown).toContain("## Key Claims");
    expect(markdown).toContain("## Supporting Sources");
    expect(markdown).toContain("## Unknowns / Open Questions");
    expect(markdown).toContain("## Source Lineage Summary");
    expect(markdown).toContain("## Source Quality Notes");
    expect(markdown).toContain("Strong / Fresh / Unchecked");
    expect(markdown).toContain("Run ID: run_123");
    expect(markdown).toContain("Generated At: 2026-05-12T00:00:00.000Z");
    expect(markdown.toLowerCase()).not.toContain("verified and confirmed");
  });

  it("uses fallback messages when claims or sources are missing", () => {
    const markdown = buildBriefingReport({
      researchTopic: "topic",
      answerContent: "",
      evidenceClaims: [],
      sources: [],
      unknowns: [],
      sourceLineage: [],
      sourceQuality: [],
    });
    expect(markdown).toContain("No structured data available in this run.");
    expect(markdown).toContain("No unresolved unknowns were detected in the current structured output.");
  });
});
