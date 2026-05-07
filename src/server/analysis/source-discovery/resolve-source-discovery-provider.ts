import { mockSourceDiscoveryProvider } from "@/server/analysis/source-discovery/mock-source-discovery-provider";
import type { SourceDiscoveryProvider } from "@/server/analysis/source-discovery/source-discovery-provider";

const disabledProvider: SourceDiscoveryProvider = {
  id: "disabled",
  async discoverSources() {
    return { kind: "success", candidates: [] };
  },
};

export function resolveSourceDiscoveryProvider(): SourceDiscoveryProvider {
  const configured = process.env.TRACEMAP_SOURCE_DISCOVERY_PROVIDER?.trim().toLowerCase() ?? "disabled";
  if (configured === "mock") return mockSourceDiscoveryProvider;
  return disabledProvider;
}
