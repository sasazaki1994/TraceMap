import type { SourceVerificationStatus } from "@prisma/client";

export type SourceUrlVerificationResult = {
  verificationStatus: SourceVerificationStatus;
  checkedAt: Date;
  httpStatus: number | null;
  finalUrl: string | null;
  contentType: string | null;
};

const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Best-effort HTTP reachability check for a public http(s) URL.
 * Does not throw; unreachable/invalid outcomes are reflected in status fields only.
 */
export async function verifyPublicHttpUrl(
  rawUrl: string,
  options?: { timeoutMs?: number; fetchImpl?: typeof fetch },
): Promise<SourceUrlVerificationResult> {
  const checkedAt = new Date();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;

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

  const signal = AbortSignal.timeout(timeoutMs);

  async function probe(method: "HEAD" | "GET"): Promise<Response | null> {
    try {
      return await fetchFn(url.toString(), {
        method,
        redirect: "follow",
        signal,
        ...(method === "GET"
          ? {
              headers: {
                Range: "bytes=0-0",
                Accept: "*/*",
              },
            }
          : {}),
      });
    } catch {
      return null;
    }
  }

  let response = await probe("HEAD");

  if (
    response === null ||
    response.status === 405 ||
    response.status === 501 ||
    response.status === 403
  ) {
    response = await probe("GET");
  }

  if (response === null) {
    return {
      verificationStatus: "unreachable",
      checkedAt,
      httpStatus: null,
      finalUrl: null,
      contentType: null,
    };
  }

  const httpStatus = response.status;
  const finalUrl = response.url || url.toString();
  const contentType = response.headers.get("content-type");

  return {
    verificationStatus: "verified",
    checkedAt,
    httpStatus,
    finalUrl,
    contentType: contentType?.trim() ? contentType.trim() : null,
  };
}
