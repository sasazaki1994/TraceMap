import { describe, expect, it } from "vitest";
import { buildReportTemplate } from "@/features/run/lib/build-report-template";

describe("buildReportTemplate", () => {
  it("includes disclaimer section for company research", () => {
    expect(buildReportTemplate("company_research").join("\n")).toContain("## Disclaimer");
  });
  it("includes evidence strength for competitive intelligence", () => {
    expect(buildReportTemplate("competitive_intelligence").join("\n")).toContain("## Evidence Strength");
  });
});
