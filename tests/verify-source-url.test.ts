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

  it("returns verified with metadata on successful HEAD", async () => {
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
      expect.objectContaining({ method: "HEAD" }),
    );
    expect(r.verificationStatus).toBe("verified");
    expect(r.httpStatus).toBe(200);
    expect(r.contentType).toContain("text/html");
  });

  it("falls back to GET when HEAD returns 405", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 206,
          headers: { "content-type": "application/pdf" },
        }),
      );
    const r = await verifyPublicHttpUrl("https://example.org/doc", {
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({ method: "GET" });
    expect(r.verificationStatus).toBe("verified");
    expect(r.httpStatus).toBe(206);
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
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    const r = await verifyPublicHttpUrl("https://example.com/missing", {
      fetchImpl,
    });
    expect(r.verificationStatus).toBe("verified");
    expect(r.httpStatus).toBe(404);
  });
});
