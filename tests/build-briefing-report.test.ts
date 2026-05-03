import { describe, expect, it } from "vitest";

import { buildBriefingReport } from "@/features/run/lib/build-briefing-report";
import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { InvestigationUnknown, SourceLineageLite } from "@/types/investigation";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const claims = [
  {
    id: "claim-1",
    summary: "The market contains several competing AI platform vendors.",
    graphNodeId: "node_claim_1",
    supportingSourceIds: ["src-1"],
    supports: [],
    confidence: null,
    counterpoints: [],
    propagationSteps: [],
    lensScore: 0,
    alerts: [],
  },
] satisfies RunEvidenceClaim[];

const sources = [
  {
    id: "src-1",
    label: "Industry report",
    url: "https://example.com/report",
    excerpt: "Report excerpt",
    sourceType: "web",
    publishedAt: "2025-01-01T00:00:00.000Z",
  },
] satisfies RunSourceView[];

const unknowns = [
  {
    id: "unknown-1",
    text: "Primary source is missing.",
    reason: "Primary or official evidence is missing.",
    severity: "medium",
    suggestedNextAction: "Check official or primary source.",
  },
] satisfies InvestigationUnknown[];

const lineage = [
  {
    sourceId: "src-1",
    label: "Industry report",
    sourceType: "web",
    lineageLabel: "Primary evidence / Web source / linked to 1 claim / published 2025-01-01",
    publishedAt: "2025-01-01T00:00:00.000Z",
    isPrimarySource: true,
    linkedClaimCount: 1,
  },
] satisfies SourceLineageLite[];

describe("buildBriefingReport", () => {
  it("builds markdown with summary, claims, sources, unknowns, and lineage", () => {
    const markdown = buildBriefingReport({
      researchTopic: "Compare domestic generative AI market players.",
      answerContent: "Executive summary body.",
      evidenceClaims: claims,
      sources,
      unknowns,
      sourceLineage: lineage,
    });

    expect(markdown).toContain("# Briefing Report");
    expect(markdown).toContain("## Executive Summary");
    expect(markdown).toContain("Research topic: Compare domestic generative AI market players.");
    expect(markdown).toContain("Executive summary body.");
    expect(markdown).toContain("## Key Claims");
    expect(markdown).toContain("The market contains several competing AI platform vendors.");
    expect(markdown).toContain("## Supporting Sources");
    expect(markdown).toContain("Industry report (https://example.com/report)");
    expect(markdown).toContain("## Unknowns / Open Questions");
    expect(markdown).toContain("[MEDIUM] Primary source is missing.");
    expect(markdown).toContain("## Source Lineage Summary");
    expect(markdown).toContain("Primary evidence");
    expect(markdown).not.toContain("undefined");
    expect(markdown).not.toContain("null");
  });

  it("uses deterministic fallback text for empty sections", () => {
    const markdown = buildBriefingReport({
      researchTopic: "Map unresolved supplier risk.",
      answerContent: "   ",
      evidenceClaims: [],
      sources: [],
      unknowns: [],
      sourceLineage: [],
    });

    expect(markdown).toContain("No executive summary is available yet.");
    expect(markdown).toContain("- No key claims are available yet.");
    expect(markdown).toContain("- No supporting sources are available yet.");
    expect(markdown).toContain("- No unresolved unknowns are currently highlighted.");
    expect(markdown).toContain("- No source lineage summary is available yet.");
    expect(markdown).not.toContain("undefined");
    expect(markdown).not.toContain("null");
  });

  it("uses readable fallback text for blank entries", () => {
    const markdown = buildBriefingReport({
      researchTopic: "   ",
      answerContent: "Summary.",
      evidenceClaims: [
        {
          ...claims[0]!,
          summary: "   ",
        },
      ],
      sources: [
        {
          ...sources[0]!,
          label: "",
          url: null,
        },
      ],
      unknowns: [
        {
          ...unknowns[0]!,
          text: " ",
          suggestedNextAction: "",
        },
      ],
      sourceLineage: [
        {
          ...lineage[0]!,
          label: "",
          lineageLabel: "",
          publishedAt: null,
        },
      ],
    });

    expect(markdown).toContain("Research topic: No research topic is available.");
    expect(markdown).toContain("- Untitled claim");
    expect(markdown).toContain("- Untitled source");
    expect(markdown).toContain(
      "- [MEDIUM] Unspecified investigation gap — Review this gap before reusing the finding.",
    );
    expect(markdown).toContain("- Untitled source: Lineage not available");
    expect(markdown).not.toContain("undefined");
    expect(markdown).not.toContain("null");
  });

  it("does not add investment advice or buy/sell recommendation language", () => {
    const markdown = buildBriefingReport({
      researchTopic: "Compare public company market positioning.",
      answerContent: "This briefing summarizes evidence and unresolved verification gaps.",
      evidenceClaims: claims,
      sources,
      unknowns,
      sourceLineage: lineage,
    });

    expect(markdown.toLowerCase()).not.toContain("investment advice");
    expect(markdown.toLowerCase()).not.toContain("buy recommendation");
    expect(markdown.toLowerCase()).not.toContain("sell recommendation");
  });
});
