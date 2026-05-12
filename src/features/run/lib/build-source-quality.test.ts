import { describe, expect, it } from "vitest";
import { buildSourceQuality } from "@/features/run/lib/build-source-quality";

const source = (overrides = {}) => ({ id: "s1", label: "Source", url: "https://example.com", excerpt: null, sourceType: "web" as const, ...overrides });

describe("buildSourceQuality", () => {
  it("classifies reachability from url/status", () => {
    expect(buildSourceQuality({ sources: [source({ url: "mailto:a@b.com" })] })[0].reachability).toBe("invalid");
    expect(buildSourceQuality({ sources: [source({ httpStatus: 200 })] })[0].reachability).toBe("reachable");
    expect(buildSourceQuality({ sources: [source({ httpStatus: 404 })] })[0].reachability).toBe("unreachable");
  });

  it("classifies freshness", () => {
    expect(buildSourceQuality({ sources: [source({ publishedAt: null })] })[0].freshness).toBe("unknown");
    expect(buildSourceQuality({ sources: [source({ publishedAt: "2020-01-01T00:00:00.000Z" })], now: new Date("2026-01-01T00:00:00.000Z") })[0].freshness).toBe("stale");
  });

  it("classifies quality with limited signals", () => {
    expect(buildSourceQuality({ sources: [source({ sourceType: "note" })] })[0].quality).toBe("limited");
    expect(buildSourceQuality({ sources: [source({ url: null })] })[0].quality).toBe("unknown");
  });
});
