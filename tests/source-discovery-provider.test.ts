import { describe, expect, it } from "vitest";

import { braveSourceDiscoveryProvider } from "@/server/analysis/source-discovery/brave-source-discovery-provider";
import { mockSourceDiscoveryProvider } from "@/server/analysis/source-discovery/mock-source-discovery-provider";
import { resolveSourceDiscoveryProvider } from "@/server/analysis/source-discovery/resolve-source-discovery-provider";

describe("source discovery provider", () => {
  it("defaults to disabled and returns empty candidates", async () => {
    delete process.env.TRACEMAP_SOURCE_DISCOVERY_PROVIDER;
    const provider = resolveSourceDiscoveryProvider();
    expect(provider.id).toBe("disabled");
    await expect(provider.discoverSources({ researchTopic: "x", maxResults: 5 })).resolves.toEqual({ kind: "success", candidates: [] });
  });

  it("falls back to disabled for unknown provider", () => {
    process.env.TRACEMAP_SOURCE_DISCOVERY_PROVIDER = "unknown";
    const provider = resolveSourceDiscoveryProvider();
    expect(provider.id).toBe("disabled");
  });

  it("resolves brave provider", () => {
    process.env.TRACEMAP_SOURCE_DISCOVERY_PROVIDER = "brave";
    const provider = resolveSourceDiscoveryProvider();
    expect(provider).toBe(braveSourceDiscoveryProvider);
  });

  it("mock provider is deterministic", async () => {
    const a = await mockSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme Revenue", maxResults: 3 });
    const b = await mockSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme Revenue", maxResults: 3 });
    expect(a).toEqual(b);
  });

  it("respects maxResults", async () => {
    const result = await mockSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme", maxResults: 2 });
    expect(result.kind).toBe("success");
    if (result.kind === "success") expect(result.candidates).toHaveLength(2);
  });
});
