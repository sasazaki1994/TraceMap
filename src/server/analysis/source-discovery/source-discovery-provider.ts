export type SourceDiscoveryCandidate = {
  title: string;
  url: string;
  snippet?: string | null;
  sourceKind?: "official" | "news" | "documentation" | "report" | "paper" | "unknown";
  discoveredBy: "mock" | "manual_url" | "search_provider";
};

export type SourceDiscoveryInput = {
  researchTopic: string;
  maxResults: number;
};

export type SourceDiscoveryResult =
  | { kind: "success"; candidates: SourceDiscoveryCandidate[] }
  | { kind: "failure"; errorMessage: string };

export type SourceDiscoveryProvider = {
  id: "disabled" | "mock" | string;
  discoverSources(input: SourceDiscoveryInput): Promise<SourceDiscoveryResult>;
};
