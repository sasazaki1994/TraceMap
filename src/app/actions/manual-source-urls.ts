import { normalizeSourceUrl } from "@/server/analysis/source-url-normalization";

export const MANUAL_SOURCE_URLS_ERROR_MESSAGE =
  "Source URLs must be valid http(s) URLs, one per line.";

export type ParseManualSourceUrlsResult =
  | { kind: "ok"; manualSourceUrls: string[] }
  | { kind: "error"; message: string };

export function parseManualSourceUrls(raw: FormDataEntryValue | null): ParseManualSourceUrlsResult {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { kind: "ok", manualSourceUrls: [] };
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const unique = new Set<string>();
  for (const line of lines) {
    const normalized = normalizeSourceUrl(line);
    if (normalized.kind !== "ok") {
      return { kind: "error", message: MANUAL_SOURCE_URLS_ERROR_MESSAGE };
    }
    unique.add(normalized.normalizedUrl);
  }

  return { kind: "ok", manualSourceUrls: [...unique] };
}
