import { describe, expect, it } from "vitest";

import { extractUrls } from "@/server/analysis/source-intake/extract-urls";
import { normalizeSourceUrl } from "@/server/analysis/source-url-normalization";
import { isSourceFetchSafe } from "@/server/analysis/source-fetch-safety";

// Source intakeは「抽出→正規化→安全判定」の入口仕様を守るテスト。
describe("source intake basics", () => {
  it("extracts multiple http/https URLs and trims trailing punctuation", () => {
    const result = extractUrls("See https://Example.com/a, and http://example.org/b?x=1.");
    expect(result).toEqual(["https://Example.com/a", "http://example.org/b?x=1"]);
  });

  it("normalization removes hash/tracking and keeps normal query", () => {
    const result = normalizeSourceUrl("https://Example.com/x?utm_source=a&k=v#h");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") expect(result.normalizedUrl).toBe("https://example.com/x?k=v");
  });

  it("blocks localhost/private and allows public https", () => {
    expect(isSourceFetchSafe("http://localhost:3000").kind).toBe("blocked");
    expect(isSourceFetchSafe("http://192.168.0.2/a").kind).toBe("blocked");
    expect(isSourceFetchSafe("https://example.com").kind).toBe("ok");
  });
});
