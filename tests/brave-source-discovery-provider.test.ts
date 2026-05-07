import { afterEach, describe, expect, it, vi } from "vitest";

import { braveSourceDiscoveryProvider } from "@/server/analysis/source-discovery/brave-source-discovery-provider";

describe("braveSourceDiscoveryProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEMAP_BRAVE_SEARCH_API_KEY;
    delete process.env.TRACEMAP_SOURCE_DISCOVERY_TIMEOUT_MS;
    delete process.env.TRACEMAP_BRAVE_SEARCH_ENDPOINT;
  });

  it("returns failure when API key is missing", async () => {
    const result = await braveSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme", maxResults: 3 });
    expect(result.kind).toBe("failure");
  });

  it("returns failure on empty research topic", async () => {
    process.env.TRACEMAP_BRAVE_SEARCH_API_KEY = "env-key";
    const result = await braveSourceDiscoveryProvider.discoverSources({ researchTopic: "   ", maxResults: 3 });
    expect(result.kind).toBe("failure");
  });

  it("maps successful response to candidates, filters non-http(s), dedupes, and limits maxResults", async () => {
    process.env.TRACEMAP_BRAVE_SEARCH_API_KEY = "env-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        web: {
          results: [
            { title: "Official News", url: "https://agency.gov/news/a", description: "n1" },
            { title: "Official News dup", url: "https://agency.gov/news/a", description: "n1b" },
            { title: "Docs", url: "https://developer.example.com/docs/guide", description: "n2" },
            { title: "invalid protocol", url: "ftp://example.com/file", description: "n3" },
          ],
        },
      }))
    );

    const result = await braveSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme", maxResults: 2 });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.every((c) => c.url.startsWith("http://") || c.url.startsWith("https://"))).toBe(true);
    expect(new Set(result.candidates.map((c) => c.url)).size).toBe(result.candidates.length);
    expect(result.candidates[0]?.discoveredBy).toBe("search_provider");
  });

  it("returns failure on HTTP error", async () => {
    process.env.TRACEMAP_BRAVE_SEARCH_API_KEY = "env-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("oops", { status: 500 }));
    const result = await braveSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme", maxResults: 3 });
    expect(result.kind).toBe("failure");
  });

  it("returns failure on timeout abort", async () => {
    process.env.TRACEMAP_BRAVE_SEARCH_API_KEY = "env-key";
    process.env.TRACEMAP_SOURCE_DISCOVERY_TIMEOUT_MS = "1";
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })
    );

    const result = await braveSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme", maxResults: 3 });
    expect(result.kind).toBe("failure");
  });

  it("infers sourceKind by lightweight rules", async () => {
    process.env.TRACEMAP_BRAVE_SEARCH_API_KEY = "env-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        web: {
          results: [
            { title: "Government release", url: "https://example.gov/press/release" },
            { title: "Developer docs", url: "https://example.com/developer/api" },
            { title: "arXiv paper", url: "https://arxiv.org/abs/1234" },
            { title: "Q2 report", url: "https://example.com/investor/report" },
            { title: "misc", url: "https://example.com/misc" },
          ],
        },
      }))
    );

    const result = await braveSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme", maxResults: 10 });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.candidates.map((c) => c.sourceKind)).toEqual(["official", "documentation", "paper", "report", "unknown"]);
  });
});
