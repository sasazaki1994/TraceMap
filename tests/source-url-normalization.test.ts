import { describe, expect, it } from "vitest";

import { normalizeSourceUrl } from "@/server/analysis/source-url-normalization";

describe("normalizeSourceUrl", () => {
  it("normalizes http URLs", () => {
    const result = normalizeSourceUrl("HTTP://Example.COM:80/path?b=2&a=1#section");

    expect(result).toEqual({
      kind: "ok",
      originalUrl: "HTTP://Example.COM:80/path?b=2&a=1#section",
      normalizedUrl: "http://example.com/path?a=1&b=2",
      hostname: "example.com",
    });
  });

  it("normalizes https URLs and removes default ports", () => {
    const result = normalizeSourceUrl("HTTPS://Example.COM:443/a");

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.normalizedUrl).toBe("https://example.com/a");
    }
  });

  it("removes tracking params and keeps path semantics", () => {
    const result = normalizeSourceUrl(
      "https://Example.com/Case/Sensitive?utm_source=x&keep=z&fbclid=1&gclid=2",
    );

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.normalizedUrl).toBe("https://example.com/Case/Sensitive?keep=z");
    }
  });

  it("removes hash fragments", () => {
    const result = normalizeSourceUrl("https://example.com/a#details");

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.normalizedUrl).toBe("https://example.com/a");
    }
  });

  it("returns failure for unsupported protocol", () => {
    const result = normalizeSourceUrl("ftp://example.com/file");

    expect(result).toEqual(
      expect.objectContaining({
        kind: "failure",
        reason: "unsupported_protocol",
      }),
    );
  });

  it("returns failure for invalid URL", () => {
    const result = normalizeSourceUrl("not a url");

    expect(result).toEqual(
      expect.objectContaining({
        kind: "failure",
        reason: "invalid_url",
      }),
    );
  });
});
