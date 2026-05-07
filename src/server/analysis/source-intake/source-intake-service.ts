import type { SourceCandidate, SourceIntakeResult } from "@/types/source-intake";
import { resolveSourceCacheForUrl } from "@/server/analysis/source-cache-service";
import { extractUrls } from "@/server/analysis/source-intake/extract-urls";

export async function buildSourceIntakeFromQuestion(question: string): Promise<SourceIntakeResult> {
  const rawUrls = extractUrls(question);
  const candidates: SourceCandidate[] = [];
  const ignoredUrls: SourceIntakeResult["ignoredUrls"] = [];
  const seen = new Set<string>();

  for (const rawUrl of rawUrls) {
    const result = await resolveSourceCacheForUrl(rawUrl);
    if (result.kind === "invalid") {
      ignoredUrls.push({ url: rawUrl, reason: result.errorMessage });
      continue;
    }
    if (seen.has(result.normalizedUrl)) {
      continue;
    }
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
    });
  }

  return { candidates, ignoredUrls };
}
