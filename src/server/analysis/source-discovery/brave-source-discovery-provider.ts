import type { SourceDiscoveryCandidate, SourceDiscoveryProvider } from "@/server/analysis/source-discovery/source-discovery-provider";

type BraveWebResult = {
  title?: string;
  url?: string;
  description?: string;
};

type BraveResponse = {
  web?: {
    results?: BraveWebResult[];
  };
};

const DEFAULT_BRAVE_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const DEFAULT_TIMEOUT_MS = 8000;

function getTimeoutMs(): number {
  const configured = Number(process.env.TRACEMAP_SOURCE_DISCOVERY_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

function inferSourceKind(title: string, url: URL): SourceDiscoveryCandidate["sourceKind"] {
  const host = url.hostname.toLowerCase();
  const normalized = `${title} ${url.href}`.toLowerCase();

  if (/(\.|^)(gov|edu)(\.|$)/.test(host) || host.includes("go.jp") || host.includes("ac.jp")) return "official";
  if (/(docs|documentation|developer)/.test(normalized)) return "documentation";
  if (/(paper|arxiv|doi)/.test(normalized)) return "paper";
  if (/(news|press|release)/.test(normalized)) return "news";
  if (/(report|whitepaper)/.test(normalized)) return "report";
  return "unknown";
}

function toHttpUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export const braveSourceDiscoveryProvider: SourceDiscoveryProvider = {
  id: "brave",
  async discoverSources(input) {
    const apiKey = process.env.TRACEMAP_BRAVE_SEARCH_API_KEY?.trim();
    if (!apiKey) {
      return { kind: "failure", errorMessage: "Brave source discovery requires TRACEMAP_BRAVE_SEARCH_API_KEY." };
    }

    const researchTopic = input.researchTopic.trim();
    if (!researchTopic) {
      return { kind: "failure", errorMessage: "Source discovery research topic must not be empty." };
    }

    const endpoint = process.env.TRACEMAP_BRAVE_SEARCH_ENDPOINT?.trim() || DEFAULT_BRAVE_SEARCH_ENDPOINT;
    const timeoutMs = getTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      const params = new URLSearchParams({ q: researchTopic, count: String(Math.max(1, input.maxResults)) });
      response = await fetch(`${endpoint}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
        signal: controller.signal,
      });
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError"
        ? `Brave source discovery timed out after ${timeoutMs}ms.`
        : `Brave source discovery request failed: ${error instanceof Error ? error.message : String(error)}`;
      return { kind: "failure", errorMessage: message };
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      return { kind: "failure", errorMessage: `Brave source discovery HTTP error: ${response.status}.` };
    }

    let payload: BraveResponse;
    try {
      payload = (await response.json()) as BraveResponse;
    } catch {
      return { kind: "failure", errorMessage: "Brave source discovery response was not valid JSON." };
    }

    const rawResults = payload.web?.results ?? [];
    const candidates: SourceDiscoveryCandidate[] = [];
    const seen = new Set<string>();

    for (const item of rawResults) {
      if (!item.url || !item.title) continue;
      const parsed = toHttpUrl(item.url);
      if (!parsed) continue;
      const dedupeKey = parsed.toString();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      candidates.push({
        title: item.title,
        url: dedupeKey,
        snippet: item.description ?? null,
        sourceKind: inferSourceKind(item.title, parsed),
        discoveredBy: "search_provider",
      });

      if (candidates.length >= Math.max(0, input.maxResults)) break;
    }

    return { kind: "success", candidates };
  },
};
