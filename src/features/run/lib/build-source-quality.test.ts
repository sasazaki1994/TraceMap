import { describe, expect, it } from "vitest";
import { buildSourceQuality } from "@/features/run/lib/build-source-quality";

const baseSource = {
  id: "s1",
  label: "Test Source",
  url: "https://example.com/source",
  excerpt: null,
  sourceType: "web" as const,
};

const baseClaim = {
  id: "c1",
  summary: "claim",
  graphNodeId: null,
  supportingSourceIds: ["s1"],
  supports: [],
  confidence: null,
  counterpoints: [],
  propagationSteps: [],
  lensScore: 0,
  alerts: [],
};

describe("buildSourceQuality", () => {
  it("classifies reachability invalid/reachable/unreachable/unchecked", () => {
    expect(buildSourceQuality({ sources: [{ ...baseSource, url: "mailto:test@example.com" }] })[0].reachability).toBe("invalid");
    expect(buildSourceQuality({ sources: [{ ...baseSource, checkedAt: "2026-01-01T00:00:00.000Z", httpStatus: 200 }] })[0].reachability).toBe("reachable");
    expect(buildSourceQuality({ sources: [{ ...baseSource, checkedAt: "2026-01-01T00:00:00.000Z", httpStatus: 404 }] })[0].reachability).toBe("unreachable");
    expect(buildSourceQuality({ sources: [baseSource] })[0].reachability).toBe("unchecked");
  });

  it("classifies freshness unknown/stale/fresh with injected now", () => {
    const now = new Date("2026-05-12T00:00:00.000Z");
    expect(buildSourceQuality({ sources: [{ ...baseSource, publishedAt: null }], now })[0].freshness).toBe("unknown");
    expect(buildSourceQuality({ sources: [{ ...baseSource, publishedAt: "2023-01-01T00:00:00.000Z" }], now })[0].freshness).toBe("stale");
    expect(buildSourceQuality({ sources: [{ ...baseSource, publishedAt: "2025-12-01T00:00:00.000Z" }], now })[0].freshness).toBe("fresh");
  });

  it("classifies strong when primary-like + quote + fresh + reachable", () => {
    const quality = buildSourceQuality({
      sources: [{ ...baseSource, sourceType: "document", publishedAt: "2026-01-01T00:00:00.000Z", checkedAt: "2026-01-02T00:00:00.000Z", httpStatus: 200 }],
      claimSupports: [{ ...baseClaim, supports: [{ sourceId: "s1", sourceLabel: "Test", supportKind: "direct", isPrimarySource: true, supportingQuote: "quoted", contradictionNote: null }] }],
      now: new Date("2026-05-12T00:00:00.000Z"),
    })[0];
    expect(quality.quality).toBe("strong");
  });

  it("keeps quote-supported sources at usable or higher", () => {
    const quality = buildSourceQuality({
      sources: [baseSource],
      claimSupports: [{ ...baseClaim, supports: [{ sourceId: "s1", sourceLabel: "Test", supportKind: "supplemental", isPrimarySource: false, supportingQuote: "quoted", contradictionNote: null }] }],
    })[0];
    expect(["usable", "strong"]).toContain(quality.quality);
  });

  it("downgrades contradiction to weak and adds warning", () => {
    const quality = buildSourceQuality({
      sources: [baseSource],
      claimSupports: [{ ...baseClaim, supports: [{ sourceId: "s1", sourceLabel: "Test", supportKind: "direct", isPrimarySource: false, supportingQuote: "q", contradictionNote: "conflicts" }] }],
    })[0];
    expect(quality.quality).toBe("weak");
    expect(quality.warnings.some((w) => w.toLowerCase().includes("contradiction"))).toBe(true);
  });
});
