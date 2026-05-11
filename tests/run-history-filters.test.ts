import { describe, expect, it } from "vitest";

import { normalizeRunHistorySearchQuery, parseRunHistoryStatusFilter } from "@/features/run-history/lib/list-runs";

describe("run history filters", () => {
  it("parses supported status", () => {
    expect(parseRunHistoryStatusFilter("completed")).toBe("completed");
  });

  it("falls back invalid status to all", () => {
    expect(parseRunHistoryStatusFilter("bad")).toBe("all");
  });

  it("normalizes search query", () => {
    expect(normalizeRunHistorySearchQuery("  toyota  ")).toBe("toyota");
    expect(normalizeRunHistorySearchQuery(undefined)).toBe("");
    expect(normalizeRunHistorySearchQuery(" ")).toBe("");
  });
});
