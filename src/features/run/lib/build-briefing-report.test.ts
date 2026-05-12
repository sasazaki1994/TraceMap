import { describe, expect, it } from "vitest";
import { buildBriefingReport } from "@/features/run/lib/build-briefing-report";

describe("buildBriefingReport", () => {
  it("includes source quality summary without verified claim", () => {
    const markdown = buildBriefingReport({
      researchTopic: "topic",
      answerContent: "answer",
      evidenceClaims: [],
      sources: [],
      unknowns: [],
      sourceLineage: [],
      sourceQuality: [{
        sourceId: "s1",
        label: "A",
        quality: "unknown",
        freshness: "unknown",
        reachability: "unchecked",
        reasons: ["x"],
        warnings: [],
        linkedClaimCount: 0,
        hasSupportingQuote: false,
      }],
    });
    expect(markdown).toContain("## Source Quality Summary");
    expect(markdown).toContain("Unknown sources: 1");
    expect(markdown.toLowerCase()).not.toContain("this information is verified");
  });
});
