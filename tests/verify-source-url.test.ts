import { describe, expect, it, vi } from "vitest";

import { verifyPublicHttpUrl } from "@/server/analysis/verify-source-url";

describe("verifyPublicHttpUrl", () => {
  it("returns unverified for empty URL", async () => {
    const r = await verifyPublicHttpUrl("   ", { fetchImpl: vi.fn() });
    expect(r.verificationStatus).toBe("unverified");
    expect(r.httpStatus).toBeNull();
  });

  it("returns invalid for non-http URL string", async () => {
    const r = await verifyPublicHttpUrl("not a url", { fetchImpl: vi.fn() });
    expect(r.verificationStatus).toBe("invalid");
  });

  it("returns verified with metadata on successful GET", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );
    const r = await verifyPublicHttpUrl("https://example.com/x", {
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.com/x",
      expect.objectContaining({ method: "GET" }),
    );
    expect(r.verificationStatus).toBe("verified");
    expect(r.httpStatus).toBe(200);
    expect(r.contentType).toContain("text/html");
  });

  it("stores non-2xx responses as verified with http_status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 405,
        headers: { "content-type": "application/pdf" },
      }),
    );
    const r = await verifyPublicHttpUrl("https://example.org/doc", {
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ method: "GET" });
    expect(r.verificationStatus).toBe("verified");
    expect(r.httpStatus).toBe(405);
  });

  it("returns unreachable when fetch fails", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network"));
    const r = await verifyPublicHttpUrl("https://example.net/", {
      fetchImpl,
    });
    expect(r.verificationStatus).toBe("unreachable");
    expect(r.httpStatus).toBeNull();
  });

  it("stores 404 as verified with http_status (no failure promotion)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    const r = await verifyPublicHttpUrl("https://example.com/missing", {
      fetchImpl,
    });
    expect(r.verificationStatus).toBe("verified");
    expect(r.httpStatus).toBe(404);
  });
});
