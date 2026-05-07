import type { SourceDiscoveryProvider } from "@/server/analysis/source-discovery/source-discovery-provider";

function toTopicSlug(topic: string): string {
  const normalized = topic.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return normalized.slice(0, 48) || "general-investigation";
}

export const mockSourceDiscoveryProvider: SourceDiscoveryProvider = {
  id: "mock",
  async discoverSources(input) {
    const slug = toTopicSlug(input.researchTopic);
    const base = [
      {
        title: `Mission dossier: ${slug}`,
        url: `https://example.com/tracemap/mock-source-1?topic=${slug}`,
        snippet: `Initial mission dossier for ${slug} with baseline facts and terminology.`,
        sourceKind: "report" as const,
      },
      {
        title: `Primary evidence registry: ${slug}`,
        url: `https://example.com/tracemap/mock-source-2?topic=${slug}`,
        snippet: `Cross-checkable references and claims matrix for ${slug}.`,
        sourceKind: "documentation" as const,
      },
      {
        title: `Risk and unknown map briefing: ${slug}`,
        url: `https://example.com/tracemap/mock-source-3?topic=${slug}`,
        snippet: `Potential uncertainties and unresolved questions related to ${slug}.`,
        sourceKind: "news" as const,
      },
    ].slice(0, Math.max(0, input.maxResults));

    return { kind: "success", candidates: base.map((c) => ({ ...c, discoveredBy: "mock" as const })) };
  },
};
