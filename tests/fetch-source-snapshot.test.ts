import { describe, expect, it, vi } from "vitest";

import { fetchSourceSnapshot } from "@/server/analysis/fetch-source-snapshot";

function responseWithBody(
  body: string,
  init: ResponseInit & { url?: string } = {},
): Response {
  const response = new Response(body, init);
  Object.defineProperty(response, "url", {
    value: init.url ?? "https://example.com/final",
  });
  return response;
}

describe("fetchSourceSnapshot", () => {
  it("creates excerpt and content hash from text/html", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      responseWithBody("<html><body><h1>Hello</h1><p>World</p></body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const result = await fetchSourceSnapshot("https://example.com/page", {
      fetchImpl,
    });

    expect(result.kind).toBe("fetched");
    if (result.kind !== "fetched") {
      return;
    }
    expect(result.excerpt).toContain("Hello World");
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.contentType).toBe("text/html; charset=utf-8");
  });

  it("creates excerpt and content hash from text/plain", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      responseWithBody("Plain source text", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    const result = await fetchSourceSnapshot("https://example.com/plain", {
      fetchImpl,
    });

    expect(result.kind).toBe("fetched");
    if (result.kind !== "fetched") {
      return;
    }
    expect(result.excerpt).toBe("Plain source text");
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not create excerpt for non-text content types", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      responseWithBody("binary-ish", {
        status: 200,
        headers: { "content-type": "application/octet-stream" },
      }),
    );

    const result = await fetchSourceSnapshot("https://example.com/file", {
      fetchImpl,
    });

    expect(result.kind).toBe("fetched");
    if (result.kind !== "fetched") {
      return;
    }
    expect(result.excerpt).toBeNull();
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns failed result on fetch error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await fetchSourceSnapshot("https://example.com/error", {
      fetchImpl,
    });

    expect(result.kind).toBe("failed");
    if (result.kind !== "failed") {
      return;
    }
    expect(result.errorMessage).toContain("network down");
  });

  it("returns failed result on timeout", async () => {
    const timeoutError = new DOMException("The operation was aborted.", "TimeoutError");
    const fetchImpl = vi.fn().mockRejectedValue(timeoutError);

    const result = await fetchSourceSnapshot("https://example.com/timeout", {
      fetchImpl,
      timeoutMs: 1,
    });

    expect(result.kind).toBe("failed");
    if (result.kind !== "failed") {
      return;
    }
    expect(result.errorMessage).toContain("aborted");
  });

  it("returns blocked result for unsafe URL", async () => {
    const fetchImpl = vi.fn();

    const result = await fetchSourceSnapshot("http://127.0.0.1/private", {
      fetchImpl,
    });

    expect(result.kind).toBe("blocked");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("truncates body at max bytes before excerpt/hash", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      responseWithBody("abcdefghijklmnopqrstuvwxyz", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    const result = await fetchSourceSnapshot("https://example.com/long", {
      fetchImpl,
      maxBytes: 5,
    });

    expect(result.kind).toBe("fetched");
    if (result.kind !== "fetched") {
      return;
    }
    expect(result.excerpt).toBe("abcde");
  });
});
