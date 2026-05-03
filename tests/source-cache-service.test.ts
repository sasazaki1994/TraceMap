import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveSourceCacheForUrl } from "@/server/analysis/source-cache-service";
import type { FetchSourceSnapshotResult } from "@/server/analysis/fetch-source-snapshot";

function createDbMock() {
  return {
    sourceCacheEntry: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    sourceFetchSnapshot: {
      create: vi.fn(),
    },
  };
}

const now = new Date("2026-05-03T10:00:00.000Z");
const fetchedResult: FetchSourceSnapshotResult = {
  kind: "fetched",
  requestedUrl: "https://example.com/a",
  finalUrl: "https://example.com/a",
  httpStatus: 200,
  contentType: "text/html",
  contentHash: "hash",
  excerpt: "Fetched excerpt",
};

describe("resolveSourceCacheForUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses a fresh cache entry without fetching", async () => {
    const db = createDbMock();
    db.sourceCacheEntry.findUnique.mockResolvedValue({
      id: "cache-1",
      normalizedUrl: "https://example.com/a",
      originalUrl: "https://example.com/a",
      latestFinalUrl: "https://example.com/final",
      latestHttpStatus: 200,
      latestContentType: "text/html",
      latestContentHash: "hash",
      latestFetchedAt: new Date("2026-05-03T09:30:00.000Z"),
      latestErrorMessage: null,
    });
    const fetchSnapshot = vi.fn();

    const result = await resolveSourceCacheForUrl("https://example.com/a", {
      db,
      now,
      ttlHours: 24,
      fetchSnapshot,
    });

    expect(result.kind).toBe("resolved");
    expect(result.kind === "resolved" ? result.reusedCache : false).toBe(true);
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it("fetches a missing cache entry and creates a snapshot", async () => {
    const db = createDbMock();
    db.sourceCacheEntry.findUnique.mockResolvedValue(null);
    db.sourceCacheEntry.create.mockResolvedValue({ id: "cache-1" });
    db.sourceFetchSnapshot.create.mockResolvedValue({ id: "fetch-1" });
    db.sourceCacheEntry.update.mockResolvedValue({});
    const fetchSnapshot = vi.fn().mockResolvedValue(fetchedResult);

    const result = await resolveSourceCacheForUrl("https://example.com/a", {
      db,
      now,
      fetchSnapshot,
    });

    expect(db.sourceCacheEntry.create).toHaveBeenCalledWith({
      data: {
        normalizedUrl: "https://example.com/a",
        originalUrl: "https://example.com/a",
      },
    });
    expect(db.sourceFetchSnapshot.create).toHaveBeenCalled();
    expect(result.kind).toBe("resolved");
    expect(result.kind === "resolved" ? result.sourceFetchSnapshotId : null).toBe("fetch-1");
    expect(result.kind === "resolved" ? result.reusedCache : true).toBe(false);
  });

  it("refetches a stale cache entry", async () => {
    const db = createDbMock();
    db.sourceCacheEntry.findUnique.mockResolvedValue({
      id: "cache-1",
      latestFetchedAt: new Date("2026-05-01T09:00:00.000Z"),
      latestErrorMessage: null,
      latestHttpStatus: 200,
      latestFinalUrl: "https://example.com/a",
      latestContentType: "text/plain",
      latestContentHash: "old",
    });
    db.sourceFetchSnapshot.create.mockResolvedValue({ id: "fetch-2" });
    db.sourceCacheEntry.update.mockResolvedValue({});
    const fetchSnapshot = vi.fn().mockResolvedValue(fetchedResult);

    const result = await resolveSourceCacheForUrl("https://example.com/a", {
      db,
      now,
      ttlHours: 1,
      fetchSnapshot,
    });

    expect(fetchSnapshot).toHaveBeenCalledWith("https://example.com/a", {
      fetchImpl: undefined,
      maxBytes: undefined,
      timeoutMs: undefined,
    });
    expect(result.kind === "resolved" ? result.sourceFetchSnapshotId : null).toBe("fetch-2");
  });

  it("does not reuse a fresh entry that has a latest error", async () => {
    const db = createDbMock();
    db.sourceCacheEntry.findUnique.mockResolvedValue({
      id: "cache-1",
      latestFetchedAt: new Date("2026-05-03T09:30:00.000Z"),
      latestErrorMessage: "previous fetch failed",
      latestHttpStatus: 200,
      latestFinalUrl: "https://example.com/a",
      latestContentType: "text/plain",
      latestContentHash: "old",
    });
    db.sourceFetchSnapshot.create.mockResolvedValue({ id: "fetch-3" });
    db.sourceCacheEntry.update.mockResolvedValue({});
    const fetchSnapshot = vi.fn().mockResolvedValue(fetchedResult);

    const result = await resolveSourceCacheForUrl("https://example.com/a", {
      db,
      now,
      ttlHours: 24,
      fetchSnapshot,
    });

    expect(fetchSnapshot).toHaveBeenCalled();
    expect(result.kind === "resolved" ? result.reusedCache : true).toBe(false);
    expect(result.kind === "resolved" ? result.sourceFetchSnapshotId : null).toBe("fetch-3");
  });

  it("returns unreachable metadata when fetch fails", async () => {
    const db = createDbMock();
    db.sourceCacheEntry.findUnique.mockResolvedValue(null);
    db.sourceCacheEntry.create.mockResolvedValue({ id: "cache-1" });
    db.sourceFetchSnapshot.create.mockResolvedValue({ id: "fetch-1" });
    db.sourceCacheEntry.update.mockResolvedValue({});
    const fetchSnapshot = vi.fn().mockResolvedValue({
      kind: "failed",
      requestedUrl: "https://example.com/a",
      errorMessage: "network",
      httpStatus: null,
      contentType: null,
      finalUrl: null,
    } satisfies FetchSourceSnapshotResult);

    const result = await resolveSourceCacheForUrl("https://example.com/a", {
      db,
      now,
      fetchSnapshot,
    });

    expect(result.kind).toBe("resolved");
    expect(result.kind === "resolved" ? result.verificationStatus : null).toBe("unreachable");
    expect(db.sourceCacheEntry.update).toHaveBeenCalled();
  });

  it("uses normalizedUrl as the unique lookup key", async () => {
    const db = createDbMock();
    db.sourceCacheEntry.findUnique.mockResolvedValue({
      id: "cache-1",
      latestFetchedAt: now,
      latestErrorMessage: null,
      latestHttpStatus: 200,
      latestFinalUrl: "https://example.com/a",
      latestContentType: "text/html",
      latestContentHash: "hash",
    });

    await resolveSourceCacheForUrl(
      "HTTPS://Example.com:443/a?utm_source=x&b=2&a=1#frag",
      { db, now },
    );

    expect(db.sourceCacheEntry.findUnique).toHaveBeenCalledWith({
      where: { normalizedUrl: "https://example.com/a?a=1&b=2" },
    });
  });

  it("reads ttl from environment when ttlHours is not passed", async () => {
    const previousTtl = process.env.TRACEMAP_SOURCE_CACHE_TTL_HOURS;
    process.env.TRACEMAP_SOURCE_CACHE_TTL_HOURS = "1";
    try {
      const db = createDbMock();
      db.sourceCacheEntry.findUnique.mockResolvedValue({
        id: "cache-1",
        latestFetchedAt: new Date("2026-05-03T08:30:00.000Z"),
        latestErrorMessage: null,
        latestHttpStatus: 200,
        latestFinalUrl: "https://example.com/a",
        latestContentType: "text/html",
        latestContentHash: "old",
      });
      db.sourceFetchSnapshot.create.mockResolvedValue({ id: "fetch-env" });
      db.sourceCacheEntry.update.mockResolvedValue({});
      const fetchSnapshot = vi.fn().mockResolvedValue(fetchedResult);

      const result = await resolveSourceCacheForUrl("https://example.com/a", {
        db,
        now,
        fetchSnapshot,
      });

      expect(fetchSnapshot).toHaveBeenCalled();
      expect(result.kind === "resolved" ? result.sourceFetchSnapshotId : null).toBe("fetch-env");
    } finally {
      if (previousTtl === undefined) {
        delete process.env.TRACEMAP_SOURCE_CACHE_TTL_HOURS;
      } else {
        process.env.TRACEMAP_SOURCE_CACHE_TTL_HOURS = previousTtl;
      }
    }
  });
});
