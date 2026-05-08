import { describe, expect, it } from "vitest";

import { buildRunCacheKey, normalizeRunCacheTopic } from "@/server/analysis/run-cache-key";

const baseInput = {
  researchTopic: "  Why   is Interpretability important?  ",
  providerId: "mock",
  providerModel: "mock",
};

describe("run cache key", () => {
  it("returns the same cacheKey for the same input", () => {
    const first = buildRunCacheKey(baseInput);
    const second = buildRunCacheKey(baseInput);

    expect(second.cacheKey).toBe(first.cacheKey);
  });

  it("normalizes extra topic whitespace", () => {
    expect(normalizeRunCacheTopic("  A   topic\nwith\tspace  ")).toBe(
      "a topic with space",
    );
    expect(buildRunCacheKey(baseInput).normalizedTopic).toBe(
      "why is interpretability important?",
    );
  });

  it("changes when provider id changes", () => {
    expect(buildRunCacheKey({ ...baseInput, providerId: "mock" }).cacheKey).not.toBe(
      buildRunCacheKey({ ...baseInput, providerId: "openai" }).cacheKey,
    );
  });

  it("changes when provider model changes", () => {
    expect(
      buildRunCacheKey({ ...baseInput, providerModel: "gpt-4o-mini" }).cacheKey,
    ).not.toBe(
      buildRunCacheKey({ ...baseInput, providerModel: "gpt-4.1-mini" }).cacheKey,
    );
  });

  it("changes when prompt version changes", () => {
    expect(
      buildRunCacheKey({ ...baseInput, promptVersion: "investigation-v1" }).cacheKey,
    ).not.toBe(
      buildRunCacheKey({ ...baseInput, promptVersion: "investigation-v2" }).cacheKey,
    );
  });

  it("changes when schema version changes", () => {
    expect(
      buildRunCacheKey({ ...baseInput, schemaVersion: "answer-graph-v3" }).cacheKey,
    ).not.toBe(
      buildRunCacheKey({ ...baseInput, schemaVersion: "answer-graph-v4" }).cacheKey,
    );
  });

  it("changes when limits profile changes", () => {
    expect(
      buildRunCacheKey({ ...baseInput, limitsProfile: "mvp-v1" }).cacheKey,
    ).not.toBe(
      buildRunCacheKey({ ...baseInput, limitsProfile: "deep-v1" }).cacheKey,
    );
  });

  it("keeps Japanese topic content intact while normalizing whitespace", () => {
    expect(normalizeRunCacheTopic("  日本語  テーマ　調査  ")).toBe(
      "日本語 テーマ 調査",
    );
  });

  it("changes when investigation mode changes", () => {
    const fast = buildRunCacheKey({ ...baseInput, mode: "fast" }).cacheKey;
    const standard = buildRunCacheKey({ ...baseInput, mode: "standard" }).cacheKey;
    const deep = buildRunCacheKey({ ...baseInput, mode: "deep" }).cacheKey;
    expect(fast).not.toBe(standard);
    expect(standard).not.toBe(deep);
  });
});
