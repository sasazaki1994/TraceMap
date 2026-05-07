import { describe, expect, it } from "vitest";

import { mockSourceDiscoveryProvider } from "@/server/analysis/source-discovery/mock-source-discovery-provider";
import { resolveSourceDiscoveryProvider } from "@/server/analysis/source-discovery/resolve-source-discovery-provider";

describe("source discovery provider", () => {
  it("defaults to disabled and returns empty candidates", async () => {
    delete process.env.TRACEMAP_SOURCE_DISCOVERY_PROVIDER;
    const provider = await resolveSourceDiscoveryProvider();
    expect(provider.id).toBe("disabled");
    await expect(provider.discoverSources({ researchTopic: "x", maxResults: 5 })).resolves.toEqual({ kind: "success", candidates: [] });
  });

  it("mock provider is deterministic", async () => {
    const a = await mockSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme Revenue", maxResults: 3 });
    const b = await mockSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme Revenue", maxResults: 3 });
    expect(a).toEqual(b);
  });

  it("respects maxResults", async () => {
    const result = await mockSourceDiscoveryProvider.discoverSources({ researchTopic: "Acme", maxResults: 2 });
    expect(result.kind).toBe("success");
    const successResult = result as Extract<typeof result, { kind: "success" }>;
    expect(successResult.candidates).toHaveLength(2);
  });
});
