import type { SourceVerificationStatus } from "@prisma/client";

import { fetchSourceSnapshot } from "@/server/analysis/fetch-source-snapshot";

export type SourceUrlVerificationResult = {
  verificationStatus: SourceVerificationStatus;
  checkedAt: Date;
  httpStatus: number | null;
  finalUrl: string | null;
  contentType: string | null;
};

/**
 * Compatibility wrapper around Source Fetch v0.1.
 * Prefer `resolveSourceCacheForUrl` for persistence so cache/fetch snapshots are recorded.
 */
export async function verifyPublicHttpUrl(
  rawUrl: string,
  options?: { timeoutMs?: number; fetchImpl?: typeof fetch },
): Promise<SourceUrlVerificationResult> {
  const checkedAt = new Date();
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      verificationStatus: "unverified",
      checkedAt,
      httpStatus: null,
      finalUrl: null,
      contentType: null,
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      verificationStatus: "invalid",
      checkedAt,
      httpStatus: null,
      finalUrl: null,
      contentType: null,
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      verificationStatus: "invalid",
      checkedAt,
      httpStatus: null,
      finalUrl: null,
      contentType: null,
    };
  }

  const result = await fetchSourceSnapshot(url.toString(), {
    fetchImpl: options?.fetchImpl,
    timeoutMs: options?.timeoutMs,
    maxBytes: 1,
  });

  switch (result.kind) {
    case "fetched":
      return {
        verificationStatus: "verified",
        checkedAt,
        httpStatus: result.httpStatus,
        finalUrl: result.finalUrl,
        contentType: result.contentType,
      };
    case "blocked":
      return {
        verificationStatus: "invalid",
        checkedAt,
        httpStatus: null,
        finalUrl: null,
        contentType: null,
      };
    case "failed":
      return {
        verificationStatus: "unreachable",
        checkedAt,
        httpStatus: result.httpStatus ?? null,
        finalUrl: result.finalUrl ?? null,
        contentType: result.contentType ?? null,
      };
  }
}
