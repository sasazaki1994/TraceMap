import type { SourceCandidate, SourceIntakeResult } from "@/types/source-intake";
import { resolveSourceCacheForUrl } from "@/server/analysis/source-cache-service";
import { extractUrls } from "@/server/analysis/source-intake/extract-urls";
import { resolveSourceDiscoveryProvider } from "@/server/analysis/source-discovery/resolve-source-discovery-provider";
import { DEFAULT_DISCOVERY_MAX_RESULTS, DEFAULT_SOURCE_CANDIDATE_MAX_RESULTS } from "@/server/analysis/source-discovery/source-discovery-service";

export async function buildSourceIntakeFromQuestion(question: string): Promise<SourceIntakeResult> {
  const manualUrls = extractUrls(question);
  const discoveryProvider = await resolveSourceDiscoveryProvider();
  const ignoredUrls: SourceIntakeResult["ignoredUrls"] = [];

  let discoveredUrls: string[] = [];
  if (discoveryProvider.id !== "disabled") {
    try {
      const discovery = await discoveryProvider.discoverSources({
        researchTopic: question,
        maxResults: DEFAULT_DISCOVERY_MAX_RESULTS,
      });
      if (discovery.kind === "failure") {
        ignoredUrls.push({ url: "[source_discovery]", reason: discovery.errorMessage });
      } else {
        discoveredUrls = discovery.candidates.map((candidate) => candidate.url);
      }
    } catch (error) {
      ignoredUrls.push({
        url: "[source_discovery]",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const merged = [
    ...manualUrls.map((url) => ({ url, origin: "manual_url" as const })),
    ...discoveredUrls.map((url) => ({ url, origin: "discovered" as const })),
  ];

  const candidates: SourceCandidate[] = [];
  const seen = new Set<string>();

  for (const item of merged) {
    let result;
    try {
      result = await resolveSourceCacheForUrl(item.url);
    } catch (error) {
      ignoredUrls.push({
        url: item.url,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    if (result.kind === "invalid") {
      ignoredUrls.push({ url: item.url, reason: result.errorMessage });
      continue;
    }
    if (seen.has(result.normalizedUrl)) continue;
    seen.add(result.normalizedUrl);

    candidates.push({
      normalizedUrl: result.normalizedUrl,
      originalUrl: result.originalUrl,
      finalUrl: result.finalUrl,
      label: result.finalUrl ? new URL(result.finalUrl).hostname : new URL(result.normalizedUrl).hostname,
      excerpt: result.excerpt,
      contentType: result.contentType,
      httpStatus: result.httpStatus,
      fetchedAt: result.checkedAt,
      sourceCacheEntryId: result.sourceCacheEntryId,
      sourceFetchSnapshotId: result.sourceFetchSnapshotId,
      fetchErrorMessage: result.verificationStatus !== "verified" ? `verification_status:${result.verificationStatus}` : null,
      origin: item.origin,
    });

    if (candidates.length >= DEFAULT_SOURCE_CANDIDATE_MAX_RESULTS) break;
  }

  return { candidates, ignoredUrls };
}
