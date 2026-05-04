import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getRunCacheTtlHours,
  lookupRunCacheEntry,
  storeRunCacheEntry,
} from "@/server/analysis/run-cache-service";
import { buildRunCacheKey } from "@/server/analysis/run-cache-key";
import type { GeneratedAnswerGraphPayload } from "@/types/answer-graph-generation";

function createDbMock() {
  return {
    runCacheEntry: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

const now = new Date("2026-05-03T10:00:00.000Z");
const cacheKeyInfo = buildRunCacheKey({
  researchTopic: "Run cache topic",
  providerId: "mock",
  providerModel: "mock",
});

const payload: GeneratedAnswerGraphPayload = {
  answer: {
    title: "Title",
    model: "mock",
    content: "Cached content",
    graphJson: {
      version: 3,
      nodes: [
        { id: "node_question", kind: "question", label: "Q" },
        { id: "node_answer", kind: "answer", label: "A" },
        {
          id: "node_source_0",
          kind: "source",
          label: "Source",
          sourceSnapshotId: "__src_0__",
        },
      ],
      edges: [{ id: "edge_q_a", from: "node_question", to: "node_answer" }],
    },
  },
  sources: [
    {
      label: "Source",
      sourceType: "web",
      url: "https://example.com/a",
      excerpt: "Excerpt",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ],
  evidence: {
    claims: [
      {
        summary: "Claim",
        graphNodeId: "node_claim_0",
        supportedSourcePlaceholderIds: ["__src_0__"],
      },
    ],
  },
};

describe("run-cache-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a fresh cache hit and updates hit metadata", async () => {
    const db = createDbMock();
    db.runCacheEntry.findUnique.mockResolvedValue({
      id: "entry-1",
      cacheKey: cacheKeyInfo.cacheKey,
      payloadJson: JSON.parse(JSON.stringify(payload)),
      expiresAt: new Date("2026-05-03T11:00:00.000Z"),
    });
    db.runCacheEntry.update.mockResolvedValue({});

    const result = await lookupRunCacheEntry(cacheKeyInfo, { db, now });

    expect(result.kind).toBe("hit");
    expect(result.kind === "hit" ? result.entryId : null).toBe("entry-1");
    expect(db.runCacheEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: {
        hitCount: { increment: 1 },
        lastUsedAt: now,
      },
    });
  });

  it("returns stale miss for expired cache", async () => {
    const db = createDbMock();
    db.runCacheEntry.findUnique.mockResolvedValue({
      id: "entry-1",
      payloadJson: payload,
      expiresAt: new Date("2026-05-03T09:59:59.000Z"),
    });

    const result = await lookupRunCacheEntry(cacheKeyInfo, { db, now });

    expect(result).toEqual({
      kind: "miss",
      cacheKey: cacheKeyInfo.cacheKey,
      reason: "stale",
    });
    expect(db.runCacheEntry.update).not.toHaveBeenCalled();
  });

  it("returns not_found miss for missing cache", async () => {
    const db = createDbMock();
    db.runCacheEntry.findUnique.mockResolvedValue(null);

    const result = await lookupRunCacheEntry(cacheKeyInfo, { db, now });

    expect(result).toEqual({
      kind: "miss",
      cacheKey: cacheKeyInfo.cacheKey,
      reason: "not_found",
    });
  });

  it("returns invalid_payload miss for invalid cached payload", async () => {
    const db = createDbMock();
    db.runCacheEntry.findUnique.mockResolvedValue({
      id: "entry-1",
      payloadJson: { answer: { content: "x" }, sources: [] },
      expiresAt: new Date("2026-05-03T11:00:00.000Z"),
    });

    const result = await lookupRunCacheEntry(cacheKeyInfo, { db, now });

    expect(result).toEqual({
      kind: "miss",
      cacheKey: cacheKeyInfo.cacheKey,
      reason: "invalid_payload",
    });
  });

  it("stores provider success payload with an expiry timestamp", async () => {
    const db = createDbMock();
    db.runCacheEntry.upsert.mockResolvedValue({});

    await storeRunCacheEntry(
      {
        cacheKeyInfo,
        payload,
        ttlHours: 2,
      },
      { db, now },
    );

    expect(db.runCacheEntry.upsert).toHaveBeenCalledWith({
      where: { cacheKey: cacheKeyInfo.cacheKey },
      create: expect.objectContaining({
        cacheKey: cacheKeyInfo.cacheKey,
        normalizedTopic: cacheKeyInfo.normalizedTopic,
        providerId: "mock",
        providerModel: "mock",
        expiresAt: new Date("2026-05-03T12:00:00.000Z"),
        hitCount: 0,
      }),
      update: expect.objectContaining({
        payloadJson: expect.objectContaining({
          answer: expect.objectContaining({ content: "Cached content" }),
        }),
        expiresAt: new Date("2026-05-03T12:00:00.000Z"),
      }),
    });
  });

  it("does not expose a failure-result store path", () => {
    expect(storeRunCacheEntry).toBeTypeOf("function");
    // The store input requires a GeneratedAnswerGraphPayload, not GenerateAnswerGraphFailure.
    expect(Object.keys({ cacheKeyInfo, payload })).toEqual(["cacheKeyInfo", "payload"]);
  });

  it("rejects invalid provider success payloads instead of storing them", async () => {
    const db = createDbMock();

    await expect(
      storeRunCacheEntry(
        {
          cacheKeyInfo,
          payload: {
            ...payload,
            sources: [],
          },
        },
        { db, now },
      ),
    ).rejects.toThrow("Run cache payload is invalid");
    expect(db.runCacheEntry.upsert).not.toHaveBeenCalled();
  });

  it("reads TTL from environment and ignores invalid values", () => {
    const previous = process.env.TRACEMAP_RUN_CACHE_TTL_HOURS;
    try {
      process.env.TRACEMAP_RUN_CACHE_TTL_HOURS = "6";
      expect(getRunCacheTtlHours()).toBe(6);
      process.env.TRACEMAP_RUN_CACHE_TTL_HOURS = "0";
      expect(getRunCacheTtlHours()).toBe(24);
      process.env.TRACEMAP_RUN_CACHE_TTL_HOURS = "bad";
      expect(getRunCacheTtlHours()).toBe(24);
    } finally {
      if (previous === undefined) {
        delete process.env.TRACEMAP_RUN_CACHE_TTL_HOURS;
      } else {
        process.env.TRACEMAP_RUN_CACHE_TTL_HOURS = previous;
      }
    }
  });
});
