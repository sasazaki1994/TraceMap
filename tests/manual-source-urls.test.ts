import { describe, expect, it } from "vitest";

import {
  MANUAL_SOURCE_URLS_ERROR_MESSAGE,
  parseManualSourceUrls,
} from "@/app/actions/manual-source-urls";

describe("parseManualSourceUrls", () => {
  it("returns empty list for blank input", () => {
    expect(parseManualSourceUrls(null)).toEqual({ kind: "ok", manualSourceUrls: [] });
    expect(parseManualSourceUrls("   ")).toEqual({ kind: "ok", manualSourceUrls: [] });
  });

  it("normalizes and deduplicates urls by normalized form", () => {
    const result = parseManualSourceUrls(
      "https://Example.com/a?utm_source=x&k=1\nhttps://example.com/a?k=1#frag\nhttps://example.com/b",
    );
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.manualSourceUrls).toEqual([
        "https://example.com/a?k=1",
        "https://example.com/b",
      ]);
    }
  });

  it("rejects invalid or non-http urls", () => {
    const invalid = parseManualSourceUrls("not-a-url");
    expect(invalid).toEqual({ kind: "error", message: MANUAL_SOURCE_URLS_ERROR_MESSAGE });

    const ftp = parseManualSourceUrls("ftp://example.com/a");
    expect(ftp).toEqual({ kind: "error", message: MANUAL_SOURCE_URLS_ERROR_MESSAGE });
  });
});
