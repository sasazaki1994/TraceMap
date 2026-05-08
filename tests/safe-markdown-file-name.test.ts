import { describe, expect, it } from "vitest";

import { safeMarkdownFileName } from "@/features/run/lib/safe-markdown-file-name";

describe("safeMarkdownFileName", () => {
  it("returns fallback for empty input", () => {
    expect(safeMarkdownFileName("   ")).toBe("tracemap-report.md");
  });

  it("sanitizes unsafe symbols", () => {
    expect(safeMarkdownFileName("Q1 Report !!! ../")).toBe("q1-report.md");
  });

  it("truncates long names", () => {
    const long = "a".repeat(120);
    const result = safeMarkdownFileName(long);
    expect(result.endsWith(".md")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(83);
  });

  it("always appends md extension", () => {
    expect(safeMarkdownFileName("briefing")).toBe("briefing.md");
  });

  it("keeps japanese title characters", () => {
    expect(safeMarkdownFileName("会社調査 レポート")).toBe("会社調査-レポート.md");
  });
});
