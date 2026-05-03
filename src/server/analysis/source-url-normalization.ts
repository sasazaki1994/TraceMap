const TRACKING_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
]);

export type NormalizeSourceUrlResult =
  | {
      kind: "ok";
      originalUrl: string;
      normalizedUrl: string;
      hostname: string;
    }
  | {
      kind: "failure";
      reason: "invalid_url" | "unsupported_protocol";
      message: string;
    };

export function normalizeSourceUrl(rawUrl: string): NormalizeSourceUrlResult {
  const originalUrl = rawUrl.trim();
  if (!originalUrl) {
    return {
      kind: "failure",
      reason: "invalid_url",
      message: "Source URL is empty.",
    };
  }

  let url: URL;
  try {
    url = new URL(originalUrl);
  } catch {
    return {
      kind: "failure",
      reason: "invalid_url",
      message: "Source URL is not a valid absolute URL.",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      kind: "failure",
      reason: "unsupported_protocol",
      message: "Only http and https source URLs are supported.",
    };
  }

  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  if (
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443")
  ) {
    url.port = "";
  }

  const retainedParams = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_QUERY_PARAMS.has(key.toLowerCase()))
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyCompare = leftKey.localeCompare(rightKey);
      return keyCompare !== 0 ? keyCompare : leftValue.localeCompare(rightValue);
    });

  url.search = "";
  for (const [key, value] of retainedParams) {
    url.searchParams.append(key, value);
  }

  return {
    kind: "ok",
    originalUrl,
    normalizedUrl: url.toString(),
    hostname: url.hostname,
  };
}
