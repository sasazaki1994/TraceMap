import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/analysis/source-cache-service", () => ({ resolveSourceCacheForUrl: vi.fn() }));
vi.mock("@/server/analysis/source-discovery/resolve-source-discovery-provider", () => ({ resolveSourceDiscoveryProvider: vi.fn() }));

describe("buildSourceIntakeFromQuestion", () => {
  beforeEach(() => vi.resetAllMocks());

  it("keeps manual url behavior", async () => {
    const { resolveSourceCacheForUrl } = await import("@/server/analysis/source-cache-service");
    const { resolveSourceDiscoveryProvider } = await import("@/server/analysis/source-discovery/resolve-source-discovery-provider");
    vi.mocked(resolveSourceDiscoveryProvider).mockReturnValue({ id: "disabled", discoverSources: vi.fn() });
    vi.mocked(resolveSourceCacheForUrl).mockResolvedValue({ kind: "resolved", normalizedUrl: "https://example.com/a", originalUrl: "https://example.com/a", finalUrl: "https://example.com/a", excerpt: null, contentType: "text/html", httpStatus: 200, checkedAt: new Date(), sourceCacheEntryId: "cache-1", sourceFetchSnapshotId: "snap-1", verificationStatus: "verified", contentHash: null, reusedCache: false });
    const { buildSourceIntakeFromQuestion } = await import("@/server/analysis/source-intake/source-intake-service");
    const result = await buildSourceIntakeFromQuestion("check https://example.com/a");
    expect(result.candidates[0]?.origin).toBe("topic_url");
  });

  it("does not throw when brave discovery fails and records ignored discovery source", async () => {
    const { resolveSourceCacheForUrl } = await import("@/server/analysis/source-cache-service");
    const { resolveSourceDiscoveryProvider } = await import("@/server/analysis/source-discovery/resolve-source-discovery-provider");
    vi.mocked(resolveSourceDiscoveryProvider).mockReturnValue({
      id: "brave",
      discoverSources: vi.fn().mockResolvedValue({ kind: "failure", errorMessage: "missing key" }),
    });
    vi.mocked(resolveSourceCacheForUrl).mockResolvedValue({
      kind: "resolved",
      normalizedUrl: "https://example.com/a",
      originalUrl: "https://example.com/a",
      finalUrl: "https://example.com/a",
      excerpt: null,
      contentType: "text/html",
      httpStatus: 200,
      checkedAt: new Date(),
      sourceCacheEntryId: "cache-1",
      sourceFetchSnapshotId: "snap-1",
      verificationStatus: "verified",
      contentHash: null,
      reusedCache: false,
    });
    const { buildSourceIntakeFromQuestion } = await import("@/server/analysis/source-intake/source-intake-service");
    const result = await buildSourceIntakeFromQuestion("check https://example.com/a");
    expect(result.candidates).toHaveLength(1);
    expect(result.ignoredUrls).toContainEqual({ url: "[source_discovery]", reason: "missing key" });
  });
  it("prioritizes manual urls over topic and discovered duplicates", async () => {
    const { resolveSourceCacheForUrl } = await import("@/server/analysis/source-cache-service");
    const { resolveSourceDiscoveryProvider } = await import("@/server/analysis/source-discovery/resolve-source-discovery-provider");
    vi.mocked(resolveSourceDiscoveryProvider).mockReturnValue({
      id: "mock",
      discoverSources: vi.fn().mockResolvedValue({
        kind: "success",
        candidates: [
          { url: "https://example.com/a", label: "A" },
          { url: "https://example.com/c", label: "C" },
        ],
      }),
    });

    vi.mocked(resolveSourceCacheForUrl).mockImplementation(async (url: string) => ({
      kind: "resolved",
      normalizedUrl: url,
      originalUrl: url,
      finalUrl: url,
      excerpt: null,
      contentType: "text/html",
      httpStatus: 200,
      checkedAt: new Date(),
      sourceCacheEntryId: `cache-${url}`,
      sourceFetchSnapshotId: `snap-${url}`,
      verificationStatus: "verified",
      contentHash: null,
      reusedCache: false,
    }));

    const { buildSourceIntakeFromQuestion } = await import("@/server/analysis/source-intake/source-intake-service");
    const result = await buildSourceIntakeFromQuestion("topic has https://example.com/a", {
      manualSourceUrls: ["https://example.com/a", "https://example.com/b"],
    });

    expect(result.candidates.map((candidate) => [candidate.normalizedUrl, candidate.origin])).toEqual([
      ["https://example.com/a", "manual_url"],
      ["https://example.com/b", "manual_url"],
      ["https://example.com/c", "discovered"],
    ]);
  });

});
