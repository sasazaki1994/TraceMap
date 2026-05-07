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
    expect(result.candidates[0]?.origin).toBe("manual_url");
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
});
