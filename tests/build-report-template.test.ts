import { describe, expect, it } from "vitest";
import { buildReportTemplate } from "@/features/run/lib/build-report-template";

describe("buildReportTemplate", () => {
  it("includes disclaimer section for company research", () => {
    expect(buildReportTemplate("company_research").join("\n")).toContain("## Disclaimer");
  });

  it("includes evidence strength for competitive intelligence", () => {
    expect(buildReportTemplate("competitive_intelligence").join("\n")).toContain("## Evidence Strength");
  });

  it("includes key claims section for briefing", () => {
    expect(buildReportTemplate("briefing").join("\n")).toContain("## Key Claims");
  });
});
