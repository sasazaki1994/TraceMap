import type { SourceDiscoveryProvider } from "@/server/analysis/source-discovery/source-discovery-provider";

const disabledProvider: SourceDiscoveryProvider = {
  id: "disabled",
  async discoverSources() {
    return { kind: "success", candidates: [] };
  },
};

export async function resolveSourceDiscoveryProvider(): Promise<SourceDiscoveryProvider> {
  const configured = process.env.TRACEMAP_SOURCE_DISCOVERY_PROVIDER?.trim().toLowerCase() ?? "disabled";
  if (configured !== "mock") {
    return disabledProvider;
  }

  const mod = await import("@/server/analysis/source-discovery/mock-source-discovery-provider");
  return mod.mockSourceDiscoveryProvider;
}
